import {
  ClassCourse,
  ClassLevel,
  DIMENSION_LABELS,
  DIMENSIONS,
  MovementItem,
  Recommendation,
  Scores,
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
 * 根据六项体测 + 年龄推荐班级。
 * 规则：
 *  - 均分 < 2.5 → 启蒙班；2.5~3.6 → 基础班；> 3.6 → 进阶班
 *  - 年龄约束：≤4.5 岁最高启蒙班；≥8 岁至少基础班
 *  - 薄弱项（≤2 分）列入推荐理由，用于课堂重点关注
 */
export function recommendClass(
  scores: Scores,
  age: number,
  classes: ClassCourse[],
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

  const target =
    classes.find((c) => c.level === level) ??
    classes.find((c) => c.level === '基础') ??
    classes[0];

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
