import {
  Assessment,
  ClassCourse,
  DesignDecision,
  Incident,
  Interception,
  InjuryRecord,
  Session,
  Student,
  TimelineEvent,
  User,
} from '../types';
import { daysAgo, today, uid } from '../utils/recommend';

export interface SeedData {
  users: User[];
  students: Student[];
  classes: ClassCourse[];
  sessions: Session[];
  incidents: Incident[];
  interceptions: Interception[];
  injuryRecords: InjuryRecord[];
  assessments: Assessment[];
  timeline: TimelineEvent[];
  designDecisions: DesignDecision[];
}

/** 本周内的日期（周一为一周起点；n 为期望的几天前，超出本周则收敛到本周一） */
function thisWeek(n: number): string {
  const dow = (new Date().getDay() + 6) % 7; // 周一 = 0
  return daysAgo(Math.min(n, dow));
}

/** 下周的日期（offset 0 = 下周一，7 = 下下周一，依此类推） */
function nextWeekDay(offset: number): string {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // 周一 = 0
  d.setDate(d.getDate() - dow + 7 + offset);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function buildSeed(): SeedData {
  // ---------- 用户 ----------
  const users: User[] = [
    { id: 'u-coach', username: 'coach', password: '123456', name: '王浩', role: 'coach', title: '主教 · 王浩' },
    { id: 'u-coach2', username: 'coach2', password: '123456', name: '刘洋', role: 'coach', title: '教练 · 刘洋' },
    { id: 'u-front', username: 'front', password: '123456', name: '李婷', role: 'frontdesk', title: '前台 · 李婷' },
    { id: 'u-manager', username: 'manager', password: '123456', name: '张敏', role: 'manager', title: '店长 · 张敏' },
    { id: 'u-p-chen', username: 'parent', password: '123456', name: '陈静', role: 'parent', title: '陈晨妈妈', childIds: ['s-chenchen'] },
    { id: 'u-p-zhao', username: 'parent2', password: '123456', name: '赵磊', role: 'parent', title: '赵小虎爸爸', childIds: ['s-zhaoxiaohu'] },
    { id: 'u-p-sun', username: 'parent3', password: '123456', name: '孙丽', role: 'parent', title: '孙甜甜妈妈', childIds: ['s-suntiantian'] },
    { id: 'u-p-zhou', username: 'parent4', password: '123456', name: '周强', role: 'parent', title: '周子墨爸爸', childIds: ['s-zhouzimo'] },
    { id: 'u-p-lin', username: 'parent5', password: '123456', name: '林芳', role: 'parent', title: '林一诺妈妈', childIds: ['s-linyinuo'] },
    { id: 'u-p-wu', username: 'parent6', password: '123456', name: '吴刚', role: 'parent', title: '吴天天爸爸', childIds: ['s-wutiantian'] },
    { id: 'u-p-zheng', username: 'parent7', password: '123456', name: '郑华', role: 'parent', title: '郑好妈妈', childIds: ['s-zhenghao'] },
    { id: 'u-p-he', username: 'parent8', password: '123456', name: '何军', role: 'parent', title: '何沐阳爸爸', childIds: ['s-hemuyang'] },
  ];

  // ---------- 班级 ----------
  const classes: ClassCourse[] = [
    {
      id: 'c-qimeng', name: '启蒙 A 班', level: '启蒙', ageRange: '4-5 岁',
      focus: ['coordination', 'attention', 'balance'], coachId: 'u-coach',
      capacity: 8, schedule: '周二/周四/周六 10:00-11:00',
    },
    {
      id: 'c-jichu', name: '基础 B 班', level: '基础', ageRange: '5-7 岁',
      focus: ['balance', 'agility', 'coordination'], coachId: 'u-coach',
      capacity: 10, schedule: '周二/周四 15:00-16:00，周六 14:00-15:00',
    },
    {
      id: 'c-jinjie', name: '进阶 C 班', level: '进阶', ageRange: '7-9 岁',
      focus: ['strength', 'agility', 'attention'], coachId: 'u-coach2',
      capacity: 10, schedule: '周三/周五 16:30-17:30，周日 10:00-11:00',
    },
  ];

  // ---------- 学员 ----------
  const students: Student[] = [
    {
      id: 's-chenchen', name: '陈晨', gender: '男', birthDate: daysAgo(365 * 4 + 120),
      height: 106, weight: 17.5, sportsHistory: '无系统训练经历，平时喜欢骑平衡车',
      allergies: ['花粉'], pastInjuries: [], parentExpectation: '提升专注力，为上小学做准备',
      parentId: 'u-p-chen', classId: 'c-qimeng',
      pkg: { name: '48 课时成长包', total: 48, used: 10, expires: daysAgo(-180) },
      createdAt: daysAgo(75),
    },
    {
      id: 's-zhaoxiaohu', name: '赵小虎', gender: '男', birthDate: daysAgo(365 * 6 + 60),
      height: 118, weight: 22, sportsHistory: '学过半年轮滑',
      allergies: [], pastInjuries: ['去年轮滑摔倒右手腕扭伤（已痊愈）'], parentExpectation: '增强体质、矫正含胸体态',
      parentId: 'u-p-zhao', classId: 'c-jichu',
      pkg: { name: '48 课时成长包', total: 48, used: 21, expires: daysAgo(-120) },
      createdAt: daysAgo(120),
    },
    {
      id: 's-suntiantian', name: '孙甜甜', gender: '女', birthDate: daysAgo(365 * 5 + 30),
      height: 110, weight: 18, sportsHistory: '舞蹈兴趣班 1 年',
      allergies: ['尘螨'], pastInjuries: [], parentExpectation: '胆子大一些，敢尝试新器械',
      parentId: 'u-p-sun', classId: 'c-qimeng',
      pkg: { name: '24 课时体验包', total: 24, used: 6, expires: daysAgo(-90) },
      createdAt: daysAgo(45),
    },
    {
      id: 's-zhouzimo', name: '周子墨', gender: '男', birthDate: daysAgo(365 * 8 + 10),
      height: 132, weight: 28, sportsHistory: '游泳 2 年，校足球队成员',
      allergies: [], pastInjuries: [], parentExpectation: '提升爆发力，为足球专项打基础',
      parentId: 'u-p-zhou', classId: 'c-jinjie',
      pkg: { name: '96 课时学年包', total: 96, used: 40, expires: daysAgo(-300) },
      createdAt: daysAgo(200),
    },
    {
      id: 's-linyinuo', name: '林一诺', gender: '女', birthDate: daysAgo(365 * 6 + 200),
      height: 116, weight: 20, sportsHistory: '无',
      allergies: ['海鲜'], pastInjuries: [], parentExpectation: '多交朋友，提升团队配合',
      parentId: 'u-p-lin', classId: 'c-jichu',
      pkg: { name: '48 课时成长包', total: 48, used: 12, expires: daysAgo(-150) },
      createdAt: daysAgo(90),
    },
    {
      id: 's-wutiantian', name: '吴天天', gender: '男', birthDate: daysAgo(365 * 5 + 100),
      height: 112, weight: 19.5, sportsHistory: '无',
      allergies: [], pastInjuries: ['3 岁时滑梯磕碰额头缝 2 针'], parentExpectation: '释放精力，晚上睡得好',
      parentId: 'u-p-wu', classId: 'c-qimeng',
      pkg: { name: '24 课时体验包', total: 24, used: 21, expires: daysAgo(-30) },
      createdAt: daysAgo(60),
    },
    {
      id: 's-zhenghao', name: '郑好', gender: '女', birthDate: daysAgo(365 * 7 + 40),
      height: 124, weight: 24, sportsHistory: '体操兴趣班 1 年',
      allergies: [], pastInjuries: [], parentExpectation: '动作更规范，希望尽快升到进阶班',
      parentId: 'u-p-zheng', classId: 'c-jichu',
      pkg: { name: '48 课时成长包', total: 48, used: 30, expires: daysAgo(-100) },
      createdAt: daysAgo(150),
    },
    {
      id: 's-hemuyang', name: '何沐阳', gender: '男', birthDate: daysAgo(365 * 8 + 200),
      height: 130, weight: 27, sportsHistory: '跆拳道黄带',
      allergies: ['青霉素'], pastInjuries: ['半年前跆拳道训练左踝轻微扭伤'], parentExpectation: '增强核心力量',
      parentId: 'u-p-he', classId: 'c-jinjie',
      pkg: { name: '96 课时学年包', total: 96, used: 55, expires: daysAgo(-240) },
      createdAt: daysAgo(260),
    },
  ];

  // ---------- 体测 ----------
  const assessments: Assessment[] = [
    {
      id: 'a-cc-1', studentId: 's-chenchen', date: daysAgo(70), by: '王浩',
      scores: { balance: 2, agility: 2, strength: 2, flexibility: 3, coordination: 2, attention: 1 },
      note: '首次测评：注意力持续时间短，约 5 分钟；建议启蒙班以游戏化指令为主。',
    },
    {
      id: 'a-cc-2', studentId: 's-chenchen', date: daysAgo(8), by: '王浩',
      scores: { balance: 3, agility: 3, strength: 2, flexibility: 3, coordination: 3, attention: 2 },
      note: '复测：注意力提升至 10 分钟左右，平衡进步明显。',
    },
    {
      id: 'a-zxh-1', studentId: 's-zhaoxiaohu', date: daysAgo(115), by: '王浩',
      scores: { balance: 3, agility: 3, strength: 3, flexibility: 2, coordination: 3, attention: 3 },
      note: '首次测评：柔韧偏弱（坐姿体前屈 -2cm），右腕旧伤已愈，投掷项目留意。',
    },
    {
      id: 'a-zxh-2', studentId: 's-zhaoxiaohu', date: daysAgo(10), by: '王浩',
      scores: { balance: 4, agility: 3, strength: 3, flexibility: 3, coordination: 4, attention: 3 },
      note: '复测：平衡木可独立完成 3 米，体态改善。',
    },
    {
      id: 'a-stt-1', studentId: 's-suntiantian', date: daysAgo(40), by: '王浩',
      scores: { balance: 2, agility: 2, strength: 2, flexibility: 4, coordination: 3, attention: 3 },
      note: '柔韧好（舞蹈基础），但对高度器械明显紧张，需渐进式引导。',
    },
    {
      id: 'a-zzm-1', studentId: 's-zhouzimo', date: daysAgo(190), by: '刘洋',
      scores: { balance: 4, agility: 4, strength: 4, flexibility: 3, coordination: 4, attention: 4 },
      note: '综合素质好，直接进入进阶班；注意跳跃落地姿势。',
    },
    {
      id: 'a-lyn-1', studentId: 's-linyinuo', date: daysAgo(85), by: '王浩',
      scores: { balance: 3, agility: 3, strength: 2, flexibility: 3, coordination: 3, attention: 3 },
      note: '性格内向，团队游戏中偏被动，建议多安排搭档任务。',
    },
    {
      id: 'a-wtt-1', studentId: 's-wutiantian', date: daysAgo(55), by: '王浩',
      scores: { balance: 2, agility: 3, strength: 3, flexibility: 3, coordination: 2, attention: 2 },
      note: '精力旺盛，规则意识弱，需强化听指令环节。',
    },
    {
      id: 'a-zh-1', studentId: 's-zhenghao', date: daysAgo(145), by: '王浩',
      scores: { balance: 4, agility: 3, strength: 3, flexibility: 4, coordination: 4, attention: 4 },
      note: '体操基础好，接近进阶班水平，观察 1 个月后评估升阶。',
    },
    {
      id: 'a-zh-2', studentId: 's-zhenghao', date: daysAgo(6), by: '王浩',
      scores: { balance: 4, agility: 4, strength: 3, flexibility: 4, coordination: 4, attention: 4 },
      note: '复测：敏捷提升，已具备进阶班条件。',
    },
    {
      id: 'a-hmy-1', studentId: 's-hemuyang', date: daysAgo(250), by: '刘洋',
      scores: { balance: 3, agility: 4, strength: 4, flexibility: 3, coordination: 3, attention: 4 },
      note: '力量好，左踝旧伤，跳跃落地需保护。',
    },
  ];

  // ---------- 课次 ----------
  const mkRecord = (studentId: string, over: Partial<import('../types').StudentSessionRecord> = {}) => ({
    studentId,
    checklist: { signed: true, equipment: true, healthOk: true, parentAuth: true },
    performance: {},
    performanceNote: '',
    caution: '',
    homeExercise: '',
    levelUpAdvice: '继续保持' as const,
    reportAcked: false,
    ...over,
  });

  /** 未来课次的空白名册（尚未核验，四项均为 false） */
  const mkBlank = (studentId: string) =>
    mkRecord(studentId, {
      checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false },
    });

  const sessions: Session[] = [
    // 已完成的课次（启蒙 A）
    {
      id: 'se-qm-1', classId: 'c-qimeng', date: daysAgo(7), time: '10:00', coachId: 'u-coach', status: 'done',
      records: [
        mkRecord('s-chenchen', {
          performance: { warmup: 'good', jump: 'good', crawl: 'excellent', throw: 'good', balanceBeam: 'attention', teamGame: 'good' },
          performanceNote: '平衡木需牵手通过，其他项目完成度好。',
          caution: '平衡木环节注意力易分散，需助教在旁保护。',
          homeExercise: '地板直线行走 + 单脚站立挑战，每侧 20 秒',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
        mkRecord('s-suntiantian', {
          performance: { warmup: 'good', jump: 'attention', crawl: 'good', throw: 'good', balanceBeam: 'attention', teamGame: 'good' },
          performanceNote: '跳跃落地声音大，平衡木上高度后情绪紧张。',
          caution: '对高度器械紧张，下次课先从 10cm 低木开始。',
          homeExercise: '亲子跳绳或原地纵跳 3 组 × 10 次，落地屈膝缓冲',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
        mkRecord('s-wutiantian', {
          performance: { warmup: 'excellent', jump: 'good', crawl: 'excellent', throw: 'good', balanceBeam: 'good', teamGame: 'attention' },
          performanceNote: '体能充沛，团队游戏中抢玩具，规则意识待加强。',
          caution: '团队环节需明确轮流规则。',
          homeExercise: '家庭接力小游戏，练习轮流与规则意识',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
      ],
    },
    // 本周已完成的课次（启蒙 A，周二）——孙甜甜课前被拦截
    {
      id: 'se-qm-2', classId: 'c-qimeng', date: thisWeek(4), time: '10:00', coachId: 'u-coach', status: 'done',
      records: [
        mkRecord('s-chenchen', {
          performance: { warmup: 'good', jump: 'good', crawl: 'excellent', throw: 'good', balanceBeam: 'good', teamGame: 'good' },
          performanceNote: '平衡木可独立走半程，注意力比上周集中。',
          caution: '平衡木末端仍需口头提醒看前方。',
          homeExercise: '地板直线行走 + 单脚站立挑战，每侧 20 秒',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
        mkRecord('s-suntiantian', {
          intercepted: true,
          checklist: { signed: true, equipment: true, healthOk: false, parentAuth: true, note: '到店时咳嗽明显，前台拦截' },
        }),
        mkRecord('s-wutiantian', {
          performance: { warmup: 'excellent', jump: 'good', crawl: 'excellent', throw: 'good', balanceBeam: 'good', teamGame: 'good' },
          performanceNote: '团队游戏能等待轮流，规则意识有进步。',
          caution: '无',
          homeExercise: '家庭接力小游戏，练习轮流与规则意识',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
      ],
    },
    // 已完成的课次（基础 B，本周一）
    {
      id: 'se-jc-1', classId: 'c-jichu', date: thisWeek(5), time: '15:00', coachId: 'u-coach', status: 'done',
      records: [
        mkRecord('s-zhaoxiaohu', {
          performance: { warmup: 'good', jump: 'good', crawl: 'good', throw: 'attention', balanceBeam: 'excellent', teamGame: 'good' },
          performanceNote: '投掷时右肩代偿明显，已提醒动作模式。',
          caution: '投掷注意右肩旧伤史，控制强度。',
          homeExercise: '软球对墙投掷 20 次，注意肩上挥臂轨迹',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
        mkRecord('s-linyinuo', {
          performance: { warmup: 'good', jump: 'good', crawl: 'good', throw: 'good', balanceBeam: 'good', teamGame: 'attention' },
          performanceNote: '团队游戏中与同伴争抢器械，情绪有波动。',
          caution: '关注团队配合情绪，已安排固定搭档。',
          homeExercise: '家庭接力小游戏，练习轮流与规则意识',
          levelUpAdvice: '继续保持', reportAcked: false,
        }),
        mkRecord('s-zhenghao', {
          performance: { warmup: 'excellent', jump: 'good', crawl: 'excellent', throw: 'good', balanceBeam: 'excellent', teamGame: 'good' },
          performanceNote: '各项完成质量高，可承担小组示范。',
          caution: '无',
          homeExercise: '亲子跳绳 3 组 × 15 次',
          levelUpAdvice: '适合升阶', reportAcked: true,
        }),
      ],
    },
    // 已完成的课次（进阶 C，本周三）
    {
      id: 'se-jj-1', classId: 'c-jinjie', date: thisWeek(3), time: '16:30', coachId: 'u-coach2', status: 'done',
      records: [
        mkRecord('s-zhouzimo', {
          performance: { warmup: 'excellent', jump: 'attention', crawl: 'excellent', throw: 'good', balanceBeam: 'good', teamGame: 'excellent' },
          performanceNote: '跳跃落地膝内扣，已现场纠正并录像给家长。',
          caution: '跳跃落地姿势需持续纠正，避免膝内扣。',
          homeExercise: '原地纵跳 3 组 × 10 次，对镜检查膝盖方向',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
        mkRecord('s-hemuyang', {
          performance: { warmup: 'good', jump: 'attention', crawl: 'good', throw: 'excellent', balanceBeam: 'good', teamGame: 'good' },
          performanceNote: '左踝旧伤，跳跃项目完成 2 组后主动报告不适，已减量。',
          caution: '左踝旧伤，跳跃项目控制在 2 组以内。',
          homeExercise: '单脚站立挑战（软垫），每侧 15 秒 × 3 组',
          levelUpAdvice: '继续保持', reportAcked: true,
        }),
      ],
    },
    // 今天进行中的课次（启蒙 A）
    {
      id: 'se-today-qm', classId: 'c-qimeng', date: today(), time: '10:00', coachId: 'u-coach', status: 'checking',
      records: [
        mkRecord('s-chenchen', { checklist: { signed: true, equipment: true, healthOk: true, parentAuth: true } }),
        mkRecord('s-suntiantian', { checklist: { signed: true, equipment: true, healthOk: false, parentAuth: true, note: '家长反馈昨晚咳嗽，观察中' } }),
        mkRecord('s-wutiantian', { checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false } }),
      ],
    },
    // 今天待开始（基础 B）
    {
      id: 'se-today-jc', classId: 'c-jichu', date: today(), time: '15:00', coachId: 'u-coach', status: 'pending',
      records: [
        mkRecord('s-zhaoxiaohu', { checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false } }),
        mkRecord('s-linyinuo', { checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false } }),
        mkRecord('s-zhenghao', { checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false } }),
      ],
    },
    // 今天待开始（进阶 C）
    {
      id: 'se-today-jj', classId: 'c-jinjie', date: today(), time: '16:30', coachId: 'u-coach2', status: 'pending',
      records: [
        mkRecord('s-zhouzimo', { checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false } }),
        mkRecord('s-hemuyang', { checklist: { signed: false, equipment: false, healthOk: false, parentAuth: false } }),
      ],
    },
    // 下周课次（不得计入本周训练负荷；调班后名册会同步进来）
    {
      id: 'se-next-qm', classId: 'c-qimeng', date: nextWeekDay(0), time: '10:00', coachId: 'u-coach', status: 'pending',
      records: [mkBlank('s-chenchen'), mkBlank('s-suntiantian'), mkBlank('s-wutiantian')],
    },
    {
      id: 'se-next-jc', classId: 'c-jichu', date: nextWeekDay(0), time: '15:00', coachId: 'u-coach', status: 'pending',
      records: [mkBlank('s-zhaoxiaohu'), mkBlank('s-linyinuo'), mkBlank('s-zhenghao')],
    },
    {
      id: 'se-next-jj', classId: 'c-jinjie', date: nextWeekDay(2), time: '16:30', coachId: 'u-coach2', status: 'pending',
      records: [mkBlank('s-zhouzimo'), mkBlank('s-hemuyang')],
    },
    // 下下周一课次（更远未来排课，同样不得计入本周）
    {
      id: 'se-w21-jc', classId: 'c-jichu', date: nextWeekDay(7), time: '15:00', coachId: 'u-coach', status: 'pending',
      records: [mkBlank('s-zhaoxiaohu'), mkBlank('s-linyinuo'), mkBlank('s-zhenghao')],
    },
  ];

  // ---------- 事件 ----------
  const incidents: Incident[] = [
    {
      id: 'i-1', sessionId: 'se-jc-1', studentId: 's-zhaoxiaohu', type: 'compensation',
      item: 'throw', severity: '中',
      description: '投掷练习时右肩明显耸肩代偿，动作变形，询问后表示右肩有轻微酸胀感（有右腕旧伤史）。',
      status: 'processing', createdAt: `${thisWeek(5)} 15:40`, createdBy: '王浩',
      timeline: [
        { id: uid('h'), time: `${thisWeek(5)} 15:42`, role: 'coach', userName: '王浩', action: '现场停止投掷项目，改为低强度肩上挥臂练习，冰敷观察 10 分钟无红肿。' },
        { id: uid('h'), time: `${thisWeek(5)} 16:10`, role: 'frontdesk', userName: '李婷', action: '课后电话告知家长情况，建议本周减少居家投掷练习，家长表示理解。' },
      ],
    },
    {
      id: 'i-2', sessionId: 'se-qm-1', studentId: 's-suntiantian', type: 'fear',
      item: 'balanceBeam', severity: '低',
      description: '上 30cm 平衡木时紧张哭泣，拒绝独立行走，需要教练牵手。',
      status: 'waitingParent', createdAt: `${daysAgo(7)} 10:35`, createdBy: '王浩',
      timeline: [
        { id: uid('h'), time: `${daysAgo(7)} 10:36`, role: 'coach', userName: '王浩', action: '降为 10cm 低木并牵手陪同，课后以鼓励为主，未强迫。' },
        { id: uid('h'), time: `${daysAgo(7)} 11:20`, role: 'frontdesk', userName: '李婷', action: '与家长沟通：建议家中先玩地板直线游戏，逐步建立信心，等待家长确认方案。' },
      ],
    },
    {
      id: 'i-3', sessionId: 'se-jj-1', studentId: 's-zhouzimo', type: 'compensation',
      item: 'jump', severity: '中',
      description: '连续跳跃落地时双膝内扣，存在膝关节损伤风险，已现场纠正。',
      status: 'closed', createdAt: `${thisWeek(3)} 17:00`, createdBy: '刘洋',
      timeline: [
        { id: uid('h'), time: `${thisWeek(3)} 17:05`, role: 'coach', userName: '刘洋', action: '分解教学落地姿势，录制正确/错误对比视频。' },
        { id: uid('h'), time: `${thisWeek(3)} 18:00`, role: 'frontdesk', userName: '李婷', action: '将对比视频与家庭练习发给家长。' },
        { id: uid('h'), time: `${thisWeek(2)} 09:30`, role: 'parent', userName: '周强', action: '确认已收到，会监督家庭练习。' },
        { id: uid('h'), time: `${thisWeek(2)} 10:00`, role: 'manager', userName: '张敏', action: '复核：进阶班跳跃项目增加落地姿势口令，事件闭环。' },
      ],
      designAction: '保持',
    },
    {
      id: 'i-4', sessionId: 'se-jc-1', studentId: 's-linyinuo', type: 'conflict',
      item: 'teamGame', severity: '低',
      description: '团队接力游戏中与同伴争抢标志碟，情绪激动，短暂哭泣。',
      status: 'closed', createdAt: `${thisWeek(5)} 15:50`, createdBy: '王浩',
      timeline: [
        { id: uid('h'), time: `${thisWeek(5)} 15:52`, role: 'coach', userName: '王浩', action: '暂停游戏，引导双方表达，重新明确轮流规则，课后两人合作完成收拾器械。' },
        { id: uid('h'), time: `${thisWeek(5)} 16:20`, role: 'frontdesk', userName: '李婷', action: '告知双方家长，均无异议。' },
        { id: uid('h'), time: `${thisWeek(4)} 10:00`, role: 'parent', userName: '林芳', action: '确认知晓，感谢老师引导。' },
      ],
    },
    {
      id: 'i-5', sessionId: 'se-today-jc', studentId: 's-zhenghao', type: 'levelupRequest',
      severity: '低',
      description: '郑好妈妈课前到前台提出：孩子体操基础好，希望本月就升到进阶 C 班，要求门店今天给答复。',
      status: 'open', createdAt: `${today()} 09:20`, createdBy: '李婷',
      timeline: [
        { id: uid('h'), time: `${today()} 09:25`, role: 'frontdesk', userName: '李婷', action: '记录家长诉求，已调取最近两次体测（均分 3.8/4.0）与教练评语，转交店长评估。' },
      ],
    },
    {
      id: 'i-6', sessionId: 'se-qm-1', studentId: 's-wutiantian', type: 'injury',
      item: 'crawl', severity: '低',
      description: '爬行接力时手掌按到接缝处，右手掌轻微擦红，无破皮。',
      status: 'closed', createdAt: `${daysAgo(7)} 10:50`, createdBy: '王浩',
      injury: { bodyPart: '右手掌', treatment: '清水清洁，冷敷 5 分钟，无破皮无需包扎' },
      timeline: [
        { id: uid('h'), time: `${daysAgo(7)} 10:52`, role: 'coach', userName: '王浩', action: '清洁冷敷，孩子情绪稳定后继续上课。' },
        { id: uid('h'), time: `${daysAgo(7)} 11:15`, role: 'frontdesk', userName: '李婷', action: '当面告知家长并出示伤情记录，家长确认无异议。' },
        { id: uid('h'), time: `${daysAgo(6)} 14:00`, role: 'manager', userName: '张敏', action: '复盘：爬行区地垫接缝已用胶带固定，事件闭环。' },
      ],
      designAction: '换器械',
    },
    {
      id: 'i-7', sessionId: 'se-jj-1', studentId: 's-hemuyang', type: 'injury',
      item: 'jump', severity: '中',
      description: '栏架连续跳跃后单脚落地时左踝扭伤，孩子自述疼痛 3/10，可行走但不敢发力（半年前同部位有扭伤史）。',
      status: 'waitingParent', createdAt: `${thisWeek(3)} 17:10`, createdBy: '刘洋',
      injury: { bodyPart: '左踝', treatment: '停止训练，冰敷 15 分钟，弹性绷带固定，坐姿观察 20 分钟' },
      timeline: [
        { id: uid('h'), time: `${thisWeek(3)} 17:12`, role: 'coach', userName: '刘洋', action: '现场冰敷固定，录制落地慢放视频，填写伤情分级记录（较重伤）。' },
        { id: uid('h'), time: `${thisWeek(3)} 17:40`, role: 'frontdesk', userName: '李婷', action: '已联系家长说明情况，伤情记录与暂停训练建议已推送家长端，等待确认。' },
      ],
    },
  ];

  // ---------- 课前拦截 ----------
  const interceptions: Interception[] = [
    {
      id: 'int-1', sessionId: 'se-qm-2', studentId: 's-suntiantian', date: thisWeek(4),
      symptoms: ['cough'],
      note: '到店时咳嗽明显，妈妈自述昨晚低烧，建议回家休息观察，明日复测体温。',
      hasDoctorNote: false, decision: 'refund',
      decisionReason: '本月第 1 次请假/拦截，在课包免费额度（1 次/月）内，返还课时',
      createdBy: '李婷', createdAt: `${thisWeek(4)} 09:50`, parentAcked: true,
    },
  ];

  // ---------- 伤情分级记录 ----------
  const injuryRecords: InjuryRecord[] = [
    {
      id: 'ir-1', incidentId: 'i-6', sessionId: 'se-qm-1', studentId: 's-wutiantian',
      date: daysAgo(7), grade: 'minor', item: 'crawl',
      movementDetail: '爬行接力转弯时手掌按到地垫接缝',
      venue: '爬行地垫区', protectiveGear: ['无'],
      photos: ['右手掌_擦红_1.jpg'], video: '爬行接力_课堂回放.mp4',
      bodyPart: '右手掌',
      treatment: '清水清洁，冷敷 5 分钟，无破皮无需包扎',
      returnAdvice: '不影响后续训练，地垫接缝已修复，下次课正常参加',
      avoidItems: [], suspension: false, suspensionDays: 0, alternativeItems: [],
      status: 'closed', parentConfirmedAt: `${daysAgo(7)} 12:05`,
      managerVisit: { note: '地垫已更换并电话回访，家长无异议。', by: '张敏', date: daysAgo(6) },
      createdBy: '王浩', createdAt: `${daysAgo(7)} 10:55`,
    },
    {
      id: 'ir-2', incidentId: 'i-7', sessionId: 'se-jj-1', studentId: 's-hemuyang',
      date: thisWeek(3), grade: 'major', item: 'jump',
      movementDetail: '栏架连续跳跃后单脚落地',
      venue: '跳跃垫区', protectiveGear: ['护踝'],
      photos: ['左踝外侧_红肿_1.jpg'], video: '跳跃落地_慢放回放.mp4',
      bodyPart: '左踝',
      treatment: '冰敷 15 分钟，弹性绷带固定，坐姿休息观察 20 分钟',
      returnAdvice: '建议 7 天内避免跑跳冲击，复查无恙后从低强度跳跃逐步恢复',
      avoidItems: ['jump', 'balanceBeam'],
      suspension: true, suspensionDays: 7,
      alternativeItems: ['throw', 'warmup'],
      status: 'waitingParent',
      createdBy: '刘洋', createdAt: `${thisWeek(3)} 17:15`,
    },
  ];

  // ---------- 训练设计调整 ----------
  const designDecisions: DesignDecision[] = [
    {
      id: 'd-1', date: daysAgo(6), classId: 'c-qimeng', item: 'crawl', action: '换器械',
      reason: '爬行区地垫接缝导致擦红事件，已更换整体式地垫并固定接缝。', by: '张敏',
    },
    {
      id: 'd-2', date: daysAgo(4), classId: 'c-qimeng', item: 'balanceBeam', action: '降级',
      reason: '启蒙班近两周 2 起平衡木恐惧事件，统一改为 10cm 低木起步，逐步升高。', by: '张敏',
    },
  ];

  // ---------- 成长时间线 ----------
  const timeline: TimelineEvent[] = [
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(75), kind: 'enroll', title: '建立学员档案', detail: '家长期望：提升专注力；花粉过敏；无既往伤病。' },
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(70), kind: 'assessment', title: '首次体测', detail: '六项均分 2.0，注意力为薄弱项，推荐启蒙 A 班。' },
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(70), kind: 'assign', title: '分班：启蒙 A 班', detail: '依据体测推荐入班，主教王浩。' },
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(8), kind: 'assessment', title: '阶段复测', detail: '均分提升至 2.7，注意力 1→2 分。' },
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(7), kind: 'session', title: '课次表现 · 启蒙 A', detail: '爬行优秀；平衡木需牵手，注意力易分散。' },
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(7), kind: 'package', title: '课包消耗 1 课时', detail: '48 课时成长包，剩余 39 课时。' },
    { id: uid('t'), studentId: 's-chenchen', date: thisWeek(4), kind: 'session', title: '课次表现 · 启蒙 A', detail: '平衡木可独立走半程，注意力比上周集中。' },
    { id: uid('t'), studentId: 's-chenchen', date: thisWeek(4), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 38 课时。' },
    { id: uid('t'), studentId: 's-chenchen', date: daysAgo(20), kind: 'communication', title: '家长沟通', detail: '妈妈反馈在家坐不住，建议增加课前 5 分钟静心游戏。' },

    { id: uid('t'), studentId: 's-zhaoxiaohu', date: daysAgo(120), kind: 'enroll', title: '建立学员档案', detail: '右腕扭伤史（已愈）；期望增强体质、矫正体态。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: daysAgo(115), kind: 'assessment', title: '首次体测', detail: '均分 2.8，柔韧偏弱，推荐基础 B 班。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: daysAgo(115), kind: 'assign', title: '分班：基础 B 班', detail: '依据体测推荐入班。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: daysAgo(30), kind: 'leave', title: '请假 1 次', detail: '感冒发烧请假，课时不扣减，安排后续补课。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: daysAgo(23), kind: 'makeup', title: '补课完成', detail: '随启蒙 A 班完成补课 1 课时（低强度）。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: daysAgo(10), kind: 'assessment', title: '阶段复测', detail: '均分 3.3，平衡 4 分，体态改善。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: thisWeek(5), kind: 'incident', title: '动作代偿 · 投掷', detail: '右肩耸肩代偿，现场降强度并冰敷观察，已通知家长。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: thisWeek(5), kind: 'session', title: '课次表现 · 基础 B', detail: '平衡木优秀；投掷需关注右肩。' },
    { id: uid('t'), studentId: 's-zhaoxiaohu', date: thisWeek(5), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 27 课时。' },

    { id: uid('t'), studentId: 's-suntiantian', date: daysAgo(45), kind: 'enroll', title: '建立学员档案', detail: '尘螨过敏；舞蹈 1 年；期望胆子大一些。' },
    { id: uid('t'), studentId: 's-suntiantian', date: daysAgo(40), kind: 'assessment', title: '首次体测', detail: '均分 2.7，柔韧好，对高度器械紧张。' },
    { id: uid('t'), studentId: 's-suntiantian', date: daysAgo(40), kind: 'assign', title: '分班：启蒙 A 班', detail: '渐进式器械适应方案。' },
    { id: uid('t'), studentId: 's-suntiantian', date: daysAgo(7), kind: 'incident', title: '恐惧器械 · 平衡木', detail: '30cm 平衡木紧张哭泣，降为 10cm 低木牵手完成。' },
    { id: uid('t'), studentId: 's-suntiantian', date: daysAgo(7), kind: 'session', title: '课次表现 · 启蒙 A', detail: '跳跃落地需练习；平衡木情绪紧张。' },
    { id: uid('t'), studentId: 's-suntiantian', date: daysAgo(7), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 18 课时。' },
    { id: uid('t'), studentId: 's-suntiantian', date: thisWeek(4), kind: 'interception', title: '课前拦截 · 咳嗽', detail: '到店时咳嗽明显，建议回家休息。课时处理：已返还（本月第 1 次，体验包免费额度 1 次/月内）。' },

    { id: uid('t'), studentId: 's-zhouzimo', date: daysAgo(200), kind: 'enroll', title: '建立学员档案', detail: '游泳 2 年、校足球队；期望提升爆发力。' },
    { id: uid('t'), studentId: 's-zhouzimo', date: daysAgo(190), kind: 'assessment', title: '首次体测', detail: '均分 3.8，直接推荐进阶 C 班。' },
    { id: uid('t'), studentId: 's-zhouzimo', date: daysAgo(190), kind: 'assign', title: '分班：进阶 C 班', detail: '依据体测推荐入班。' },
    { id: uid('t'), studentId: 's-zhouzimo', date: thisWeek(3), kind: 'incident', title: '动作代偿 · 跳跃', detail: '落地双膝内扣，已纠正并发对比视频给家长。' },
    { id: uid('t'), studentId: 's-zhouzimo', date: thisWeek(3), kind: 'session', title: '课次表现 · 进阶 C', detail: '热身/爬行/团队优秀；跳跃落地需持续纠正。' },
    { id: uid('t'), studentId: 's-zhouzimo', date: thisWeek(3), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 56 课时。' },
    { id: uid('t'), studentId: 's-zhouzimo', date: daysAgo(60), kind: 'levelup', title: '升阶评估 · 通过', detail: '基础 B → 进阶 C，依据：六项均分 3.8，教练建议。' },

    { id: uid('t'), studentId: 's-linyinuo', date: daysAgo(90), kind: 'enroll', title: '建立学员档案', detail: '海鲜过敏；期望多交朋友。' },
    { id: uid('t'), studentId: 's-linyinuo', date: daysAgo(85), kind: 'assessment', title: '首次体测', detail: '均分 2.8，性格内向，建议搭档任务。' },
    { id: uid('t'), studentId: 's-linyinuo', date: daysAgo(85), kind: 'assign', title: '分班：基础 B 班', detail: '依据体测推荐入班。' },
    { id: uid('t'), studentId: 's-linyinuo', date: thisWeek(5), kind: 'incident', title: '同伴冲突 · 团队游戏', detail: '争抢标志碟，已引导和解，双方家长已告知。' },
    { id: uid('t'), studentId: 's-linyinuo', date: thisWeek(5), kind: 'session', title: '课次表现 · 基础 B', detail: '各项目良好；团队游戏情绪波动。' },
    { id: uid('t'), studentId: 's-linyinuo', date: thisWeek(5), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 36 课时。' },

    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(60), kind: 'enroll', title: '建立学员档案', detail: '3 岁额头缝针史；期望释放精力。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(55), kind: 'assessment', title: '首次体测', detail: '均分 2.5，规则意识弱。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(55), kind: 'assign', title: '分班：启蒙 A 班', detail: '依据体测推荐入班。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(7), kind: 'incident', title: '摔倒擦伤 · 爬行', detail: '右手掌擦红（地垫接缝），清洁冷敷，家长已确认。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(7), kind: 'injuryCare', title: '伤情记录 · 家长已确认', detail: '轻微伤 · 爬行：右手掌擦红，不影响后续训练；店长已回访闭环。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(7), kind: 'session', title: '课次表现 · 启蒙 A', detail: '体能充沛；团队游戏规则意识待加强。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(7), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 4 课时，课包即将到期。' },
    { id: uid('t'), studentId: 's-wutiantian', date: thisWeek(4), kind: 'session', title: '课次表现 · 启蒙 A', detail: '团队游戏能等待轮流，规则意识有进步。' },
    { id: uid('t'), studentId: 's-wutiantian', date: thisWeek(4), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 3 课时，课包即将到期。' },
    { id: uid('t'), studentId: 's-wutiantian', date: daysAgo(2), kind: 'leave', title: '请假 1 次', detail: '咳嗽请假（课时不扣减，可安排补课）。' },

    { id: uid('t'), studentId: 's-zhenghao', date: daysAgo(150), kind: 'enroll', title: '建立学员档案', detail: '体操 1 年；家长期望尽快升阶。' },
    { id: uid('t'), studentId: 's-zhenghao', date: daysAgo(145), kind: 'assessment', title: '首次体测', detail: '均分 3.7，接近进阶班水平。' },
    { id: uid('t'), studentId: 's-zhenghao', date: daysAgo(145), kind: 'assign', title: '分班：基础 B 班', detail: '观察 1 个月后评估升阶。' },
    { id: uid('t'), studentId: 's-zhenghao', date: daysAgo(6), kind: 'assessment', title: '阶段复测', detail: '均分 3.8，已具备进阶班条件。' },
    { id: uid('t'), studentId: 's-zhenghao', date: thisWeek(5), kind: 'session', title: '课次表现 · 基础 B', detail: '多项优秀，可承担小组示范。教练建议：适合升阶。' },
    { id: uid('t'), studentId: 's-zhenghao', date: thisWeek(5), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 18 课时。' },
    { id: uid('t'), studentId: 's-zhenghao', date: today(), kind: 'communication', title: '家长临时升阶要求', detail: '妈妈到前台要求本月升进阶 C 班，门店评估中。' },

    { id: uid('t'), studentId: 's-hemuyang', date: daysAgo(260), kind: 'enroll', title: '建立学员档案', detail: '跆拳道黄带；左踝扭伤史；青霉素过敏。' },
    { id: uid('t'), studentId: 's-hemuyang', date: daysAgo(250), kind: 'assessment', title: '首次体测', detail: '均分 3.5，力量好，左踝需保护。' },
    { id: uid('t'), studentId: 's-hemuyang', date: daysAgo(250), kind: 'assign', title: '分班：进阶 C 班', detail: '依据体测推荐入班。' },
    { id: uid('t'), studentId: 's-hemuyang', date: thisWeek(3), kind: 'incident', title: '摔倒扭伤 · 跳跃', detail: '左踝扭伤，冰敷固定；较重伤，建议暂停训练 7 天。' },
    { id: uid('t'), studentId: 's-hemuyang', date: thisWeek(3), kind: 'injuryCare', title: '伤情记录待家长确认', detail: '较重伤 · 跳跃：暂停训练 7 天，期间替代动作：投掷、热身；下节课避开跳跃、平衡木。' },
    { id: uid('t'), studentId: 's-hemuyang', date: thisWeek(3), kind: 'session', title: '课次表现 · 进阶 C', detail: '投掷优秀；跳跃 2 组后左踝不适，已减量。' },
    { id: uid('t'), studentId: 's-hemuyang', date: thisWeek(3), kind: 'package', title: '课包消耗 1 课时', detail: '剩余 41 课时。' },
  ];

  return { users, students, classes, sessions, incidents, interceptions, injuryRecords, assessments, timeline, designDecisions };
}
