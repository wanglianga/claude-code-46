import {
  ClassCourse,
  ClassLevel,
  DIMENSION_LABELS,
  DIMENSIONS,
  Dimension,
  Interception,
  MovementItem,
  Recommendation,
  Scores,
  Session,
  TimelineEvent,
} from '../types';

/** 计算年龄（岁，保留 1 位小数） */
export function ageOf(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  return Math.round((diff / (365.25 * 24 * 3600 * 1000)) * 10) / 10;
}

export function avgScore(scores: Scores): number {
  const sum = DIMENSIONS.reduce((acc, d) => acc + (scores[d] || 0), 0);
  return Math.round((sum / DIMENSIONS.length) * 10) / 10;
}

/**
 * 根据六项体测 + 年龄 + 既往伤情 + 家长目标推荐班级。
 * 规则：
 *  - 均分 < 2.5 → 启蒙班；2.5~3.6 → 基础班；> 3.6 → 进阶班
 *  - 年龄约束：≤4.5 岁最高启蒙班；≥8 岁至少基础班
 *  - 既往伤情：未注明痊愈的伤病 → 提示保护并纳入课堂保护名单
 *  - 家长目标：关键词匹配班级重点维度，纳入推荐理由
 *  - 薄弱项（≤2 分）列入推荐理由，用于课堂重点关注
 */
export function recommendClass(
  scores: Scores,
  age: number,
  classes: ClassCourse[],
  opts: { pastInjuries?: string[]; parentExpectation?: string } = {},
): Recommendation {
  const avg = avgScore(scores);
  let level: ClassLevel;
  if (avg < 2.5) level = '启蒙';
  else if (avg <= 3.6) level = '基础';
  else level = '进阶';

  const reasons: string[] = [];
  reasons.push(`六项体测均分 ${avg} 分，落在「${level}班」区间`);

  if (age <= 4.5 && level !== '启蒙') {
    reasons.push(`年龄 ${age} 岁偏小，为安全起见调整为启蒙班`);
    level = '启蒙';
  }
  if (age >= 8 && level === '启蒙') {
    reasons.push(`年龄 ${age} 岁，启蒙内容偏简单，调整为基础班`);
    level = '基础';
  }

  // 既往伤情：未注明痊愈的伤病需要课堂保护
  const unhealed = (opts.pastInjuries ?? []).filter((i) => !i.includes('愈'));
  if (unhealed.length > 0) {
    reasons.push(`既往伤情「${unhealed.join('；')}」未注明痊愈，相关部位训练已降强度并纳入课堂保护名单`);
  }

  // 家长目标 → 维度关键词匹配
  const expectation = opts.parentExpectation ?? '';
  const goalMap: [RegExp, Dimension][] = [
    [/专注|注意力|坐得住/, 'attention'],
    [/体能|体质|力量|爆发力|核心/, 'strength'],
    [/体态|柔韧|拉伸/, 'flexibility'],
    [/平衡/, 'balance'],
    [/协调|灵敏|敏捷/, 'coordination'],
    [/胆|自信|勇敢|社交|朋友/, 'attention'],
  ];
  const goalDims = goalMap.filter(([re]) => re.test(expectation)).map(([, d]) => d);
  if (expectation && goalDims.length > 0) {
    reasons.push(
      `家长目标「${expectation.slice(0, 20)}${expectation.length > 20 ? '…' : ''}」对应维度：${[...new Set(goalDims)].map((d) => DIMENSION_LABELS[d]).join('、')}，已纳入分班参考`,
    );
  }

  const sorted = [...DIMENSIONS].sort((a, b) => scores[a] - scores[b]);
  const weak = sorted.filter((d) => scores[d] <= 2).slice(0, 3);
  const strong = sorted.filter((d) => scores[d] >= 4).slice(-3);

  if (weak.length > 0) {
    reasons.push(
      `薄弱项：${weak.map((d) => DIMENSION_LABELS[d]).join('、')}，课堂将安排针对性练习并重点保护`,
    );
  }
  if (strong.length > 0) {
    reasons.push(
      `优势项：${strong.map((d) => DIMENSION_LABELS[d]).join('、')}，可在团队游戏中承担示范角色`,
    );
  }

  // 优先选择覆盖家长目标维度的同 level 班级
  const candidates = classes.filter((c) => c.level === level);
  const target =
    candidates.find((c) => goalDims.some((d) => c.focus.includes(d))) ??
    candidates[0] ??
    classes.find((c) => c.level === '基础') ??
    classes[0];
  if (expectation && goalDims.length > 0 && goalDims.some((d) => target?.focus.includes(d))) {
    reasons.push(`目标维度与「${target.name}」训练重点（${target.focus.map((d) => DIMENSION_LABELS[d]).join('、')}）匹配`);
  }

  return {
    level,
    classId: target ? target.id : null,
    className: target ? target.name : '暂无合适班级',
    avg,
    weak,
    strong,
    reasons,
  };
}

/** 各动作项目的家庭练习建议 */
export const HOME_EXERCISES: Record<MovementItem, string> = {
  warmup: '每天 5 分钟动态拉伸操（摆臂、弓步、转体）',
  jump: '亲子跳绳或原地纵跳 3 组 × 10 次，落地屈膝缓冲',
  crawl: '客厅熊爬往返 3 趟，可在地面放置枕头做障碍',
  throw: '软球对墙投掷 / 亲子抛接 20 次，练习肩上挥臂',
  balanceBeam: '地板直线行走 + 单脚站立挑战，每侧 20 秒',
  teamGame: '周末家庭接力小游戏，练习轮流与规则意识',
};

/** 根据既往伤情生成给家长的风险提示 */
export function riskHints(
  pastInjuries: string[],
  incidentSummaries: string[],
): string[] {
  const hints: string[] = [];
  if (pastInjuries.length > 0) {
    hints.push(`既往伤病：${pastInjuries.join('；')}，相关部位训练已降低强度`);
  }
  if (incidentSummaries.length > 0) {
    hints.push(...incidentSummaries);
  }
  if (hints.length === 0) {
    hints.push('暂无伤情记录，仍建议每次课前充分热身、课后拉伸');
  }
  return hints;
}

/** 生成 id */
let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function nowTime(): string {
  const d = new Date();
  return `${today()} ${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}

// ===================== 课前拦截 · 课时返还评估 =====================

/** 课包免费请假/拦截额度（次/月） */
export function packageQuota(pkgName: string): number {
  if (pkgName.includes('96')) return 3;
  if (pkgName.includes('48')) return 2;
  return 1;
}

/** 本月已使用的免费次数 = 本月请假 + 本月已返还的拦截 */
export function countMonthlyFreebies(
  studentId: string,
  timeline: TimelineEvent[],
  interceptions: Interception[],
): number {
  const month = today().slice(0, 7);
  const leaves = timeline.filter(
    (t) => t.studentId === studentId && t.kind === 'leave' && t.date.startsWith(month),
  ).length;
  const refunded = interceptions.filter(
    (i) => i.studentId === studentId && i.decision === 'refund' && i.date.startsWith(month),
  ).length;
  return leaves + refunded;
}

export interface RefundEval {
  decision: 'refund' | 'noRefund';
  reason: string;
  quota: number;
  usedThisMonth: number;
}

/**
 * 课时返还判定：
 *  1. 有医生证明 → 无条件返还（不占免费额度）
 *  2. 无医生证明 → 本月免费额度内返还（体验包 1 次/月，成长包 2 次/月，学年包 3 次/月）
 *  3. 超出额度且无医生证明 → 不返还，课时正常消耗
 */
export function evaluateRefund(
  pkgName: string,
  hasDoctorNote: boolean,
  usedThisMonth: number,
): RefundEval {
  const quota = packageQuota(pkgName);
  if (hasDoctorNote) {
    return {
      decision: 'refund',
      reason: '凭医生证明，按课包规则全额返还课时（不占本月免费额度）',
      quota,
      usedThisMonth,
    };
  }
  if (usedThisMonth < quota) {
    return {
      decision: 'refund',
      reason: `本月第 ${usedThisMonth + 1} 次请假/拦截，在课包免费额度（${quota} 次/月）内，返还课时`,
      quota,
      usedThisMonth,
    };
  }
  return {
    decision: 'noRefund',
    reason: `本月已使用 ${usedThisMonth} 次免费请假/拦截（课包额度 ${quota} 次/月），且无医生证明，课时不返还、正常消耗`,
    quota,
    usedThisMonth,
  };
}

// ===================== 本周训练负荷 =====================

/** 本周一 00:00 的日期字符串 */
export function weekStart(): string {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // 周一 = 0
  d.setDate(d.getDate() - dow);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface WeekLoad {
  planned: number; // 本周计划课次（本班本周课次数）
  attended: number; // 已完成出勤
  intercepted: number; // 被拦截次数
  leave: number; // 请假次数
  percent: number; // 出勤负荷 %
  hint: string;
}

/**
 * 计算某孩子本周训练负荷。
 * 按「课次名册中是否包含该孩子」过滤（与当前所在班级无关），
 * 因此调班后：旧班本周已上/被拦截的课次仍计入，新班后续课次继续累计。
 */
export function weekLoad(studentId: string, sessions: Session[]): WeekLoad {
  const start = weekStart();
  const weekSessions = sessions.filter(
    (s) => s.date >= start && s.records.some((r) => r.studentId === studentId),
  );
  let attended = 0;
  let intercepted = 0;
  let leave = 0;
  for (const se of weekSessions) {
    const r = se.records.find((x) => x.studentId === studentId);
    if (!r) continue;
    if (r.intercepted) intercepted += 1;
    else if (r.leave) leave += 1;
    else if (se.status === 'done' && r.checklist.signed) attended += 1;
  }
  const planned = weekSessions.length;
  const percent = planned === 0 ? 0 : Math.round((attended / planned) * 100);
  let hint: string;
  if (planned === 0) hint = '本周暂无排课';
  else if (intercepted > 0)
    hint = `本周因课前拦截缺勤 ${intercepted} 节，负荷降至 ${percent}%；恢复后建议循序渐进，避免突然加量`;
  else if (leave > 0) hint = `本周请假 ${leave} 节，注意保持训练连续性`;
  else if (percent >= 100) hint = '本周计划课次已全部完成，负荷饱满';
  else hint = `本周已完成 ${attended}/${planned} 节`;
  return { planned, attended, intercepted, leave, percent, hint };
}
