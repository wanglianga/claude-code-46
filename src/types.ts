// ===================== 基础类型 =====================

export type Role = 'coach' | 'frontdesk' | 'manager' | 'parent';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  title: string; // 展示用头衔，如「主教 · 王浩」
  childIds?: string[]; // 家长关联的孩子
}

/** 六项体测维度 */
export type Dimension =
  | 'balance' // 平衡
  | 'agility' // 敏捷
  | 'strength' // 力量
  | 'flexibility' // 柔韧
  | 'coordination' // 协调
  | 'attention'; // 注意力

export const DIMENSIONS: Dimension[] = [
  'balance',
  'agility',
  'strength',
  'flexibility',
  'coordination',
  'attention',
];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  balance: '平衡',
  agility: '敏捷',
  strength: '力量',
  flexibility: '柔韧',
  coordination: '协调',
  attention: '注意力',
};

export type Scores = Record<Dimension, number>; // 1-5 分

export interface Assessment {
  id: string;
  studentId: string;
  date: string;
  scores: Scores;
  note: string;
  by: string; // 录入人
}

export interface CoursePackage {
  name: string;
  total: number; // 总课时
  used: number; // 已消耗
  expires: string; // 有效期
}

export interface Student {
  id: string;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  height: number; // cm
  weight: number; // kg
  sportsHistory: string; // 运动史
  allergies: string[]; // 过敏
  pastInjuries: string[]; // 既往伤病
  parentExpectation: string; // 家长期望
  parentId: string;
  classId: string | null;
  pkg: CoursePackage;
  createdAt: string;
}

export type ClassLevel = '启蒙' | '基础' | '进阶';

export interface ClassCourse {
  id: string;
  name: string;
  level: ClassLevel;
  ageRange: string;
  focus: Dimension[]; // 重点训练维度
  coachId: string;
  capacity: number;
  schedule: string; // 上课时间描述
}

/** 课堂动作项目 */
export type MovementItem =
  | 'warmup'
  | 'jump'
  | 'crawl'
  | 'throw'
  | 'balanceBeam'
  | 'teamGame';

export const MOVEMENT_ITEMS: MovementItem[] = [
  'warmup',
  'jump',
  'crawl',
  'throw',
  'balanceBeam',
  'teamGame',
];

export const MOVEMENT_LABELS: Record<MovementItem, string> = {
  warmup: '热身',
  jump: '跳跃',
  crawl: '爬行',
  throw: '投掷',
  balanceBeam: '平衡木',
  teamGame: '团队游戏',
};

/** 课前四项核验 */
export interface Checklist {
  signed: boolean; // 签到
  equipment: boolean; // 装备
  healthOk: boolean; // 身体状态
  parentAuth: boolean; // 家长授权
  note?: string;
}

export type Rating = 'excellent' | 'good' | 'attention';

export const RATING_LABELS: Record<Rating, string> = {
  excellent: '优秀',
  good: '良好',
  attention: '需关注',
};

export interface StudentSessionRecord {
  studentId: string;
  checklist: Checklist;
  leave?: boolean; // 请假（不消课）
  performance: Partial<Record<MovementItem, Rating>>;
  performanceNote: string;
  // 课后报告（教练填写）
  caution: string; // 注意事项
  homeExercise: string; // 家庭练习
  levelUpAdvice: '适合升阶' | '继续保持' | '暂缓';
  reportAcked: boolean; // 家长已确认
}

export type SessionStatus = 'pending' | 'checking' | 'ongoing' | 'done';

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  pending: '待开始',
  checking: '核验中',
  ongoing: '上课中',
  done: '已完成',
};

export interface Session {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  coachId: string;
  status: SessionStatus;
  records: StudentSessionRecord[];
}

// ===================== 事件（围绕一节课的异常/诉求） =====================

export type IncidentType =
  | 'fear' // 恐惧器械
  | 'compensation' // 动作代偿
  | 'injury' // 摔倒擦伤
  | 'conflict' // 同伴冲突
  | 'levelupRequest'; // 家长临时升阶要求

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  fear: '恐惧器械',
  compensation: '动作代偿',
  injury: '摔倒擦伤',
  conflict: '同伴冲突',
  levelupRequest: '家长升阶要求',
};

export type Severity = '低' | '中' | '高';

export type IncidentStatus = 'open' | 'processing' | 'waitingParent' | 'closed';

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: '待处理',
  processing: '处理中',
  waitingParent: '待家长确认',
  closed: '已闭环',
};

export interface HandlingEntry {
  id: string;
  time: string;
  role: Role;
  userName: string;
  action: string;
}

export type DesignAction = '保持' | '降级' | '换器械' | '增加助教';

export interface Incident {
  id: string;
  sessionId: string;
  studentId: string;
  type: IncidentType;
  item?: MovementItem; // 关联动作项目
  severity: Severity;
  description: string;
  status: IncidentStatus;
  createdAt: string;
  createdBy: string;
  injury?: { bodyPart: string; treatment: string };
  timeline: HandlingEntry[];
  designAction?: DesignAction; // 店长对训练设计的处置
}

// ===================== 成长时间线 =====================

export type TimelineKind =
  | 'enroll' // 建档
  | 'assessment' // 体测
  | 'assign' // 分班
  | 'session' // 课次表现
  | 'incident' // 伤情/事件
  | 'leave' // 请假
  | 'makeup' // 补课
  | 'levelup' // 升阶评估
  | 'package' // 课包消耗
  | 'communication'; // 家长沟通

export const TIMELINE_KIND_LABELS: Record<TimelineKind, string> = {
  enroll: '建档',
  assessment: '体测',
  assign: '分班',
  session: '课次表现',
  incident: '伤情/事件',
  leave: '请假',
  makeup: '补课',
  levelup: '升阶评估',
  package: '课包消耗',
  communication: '家长沟通',
};

export interface TimelineEvent {
  id: string;
  studentId: string;
  date: string;
  kind: TimelineKind;
  title: string;
  detail: string;
}

// ===================== 升阶评估 =====================

export interface LevelUpAssessment {
  id: string;
  studentId: string;
  date: string;
  fromClass: string;
  toClass: string;
  result: '通过' | '暂缓';
  reason: string;
  source: string; // 来源：教练建议 / 家长要求
}

// ===================== 训练设计调整（店长复盘结论） =====================

export interface DesignDecision {
  id: string;
  date: string;
  classId: string;
  item: MovementItem;
  action: DesignAction;
  reason: string;
  by: string;
}

// ===================== 班级推荐结果 =====================

export interface Recommendation {
  level: ClassLevel;
  classId: string | null;
  className: string;
  avg: number;
  weak: Dimension[]; // 薄弱维度
  strong: Dimension[]; // 优势维度
  reasons: string[];
}
