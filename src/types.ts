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
  intercepted?: boolean; // 课前拦截（按规则判定是否返还课时）
  performance: Partial<Record<MovementItem, Rating>>;
  performanceNote: string;
  // 课后报告（教练填写）
  caution: string; // 注意事项
  homeExercise: string; // 家庭练习
  levelUpAdvice: '适合升阶' | '继续保持' | '暂缓';
  reportAcked: boolean; // 家长已确认
}

// ===================== 课前身体状态拦截 =====================

/** 到店可见症状 */
export type Symptom = 'cough' | 'fatigue' | 'legPain';

export const SYMPTOMS: Symptom[] = ['cough', 'fatigue', 'legPain'];

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  cough: '咳嗽',
  fatigue: '疲劳',
  legPain: '腿部疼痛',
};

export interface Interception {
  id: string;
  sessionId: string;
  studentId: string;
  date: string;
  symptoms: Symptom[];
  note: string;
  hasDoctorNote: boolean; // 是否有医生证明
  decision: 'refund' | 'noRefund'; // 课时处理：返还 / 不返还
  decisionReason: string; // 判定依据（课包规则 + 医生证明 + 历史请假）
  createdBy: string;
  createdAt: string;
  parentAcked: boolean; // 家长已查看课时处理结果
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

// ===================== 伤情分级回访 =====================

export type InjuryGrade = 'minor' | 'major';

export const INJURY_GRADE_LABELS: Record<InjuryGrade, string> = {
  minor: '轻微伤',
  major: '较重伤',
};

export type InjuryStatus = 'waitingParent' | 'confirmed' | 'followup' | 'closed';

export const INJURY_STATUS_LABELS: Record<InjuryStatus, string> = {
  waitingParent: '待家长确认',
  confirmed: '已确认·进入训练计划',
  followup: '店长回访中',
  closed: '已闭环',
};

/** 伤情分级记录：摔倒后由教练填写，家长确认后进入后续训练计划 */
export interface InjuryRecord {
  id: string;
  incidentId?: string; // 关联课堂事件
  sessionId: string;
  studentId: string;
  date: string;
  grade: InjuryGrade; // 轻微伤 → 下节课提醒；较重伤 → 店长回访 + 暂停训练建议
  item?: MovementItem; // 关联动作项目
  movementDetail: string; // 具体动作描述
  venue: string; // 场地（如 平衡木区/跳跃垫区）
  protectiveGear: string[]; // 护具佩戴
  photos: string[]; // 伤情照片（演示环境存文件名）
  video: string; // 动作视频（演示环境存文件名）
  bodyPart: string; // 受伤部位
  treatment: string; // 现场处理
  returnAdvice: string; // 复课建议
  avoidItems: MovementItem[]; // 下节课需避开的动作
  suspension: boolean; // 是否建议暂停训练
  suspensionDays: number; // 建议暂停天数
  alternativeItems: MovementItem[]; // 暂停期间低风险替代动作
  status: InjuryStatus;
  parentConfirmedAt?: string; // 家长确认时间（确认后才进入训练计划）
  managerVisit?: { note: string; by: string; date: string }; // 店长回访
  createdBy: string;
  createdAt: string;
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
  | 'injuryCare' // 伤情回访
  | 'interception' // 课前拦截
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
  injuryCare: '伤情回访',
  interception: '课前拦截',
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
