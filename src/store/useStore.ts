import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeed } from '../data/seed';
import {
  Assessment,
  Checklist,
  ClassCourse,
  DesignAction,
  DesignDecision,
  Dimension,
  HandlingEntry,
  Incident,
  IncidentStatus,
  IncidentType,
  Interception,
  LevelUpAssessment,
  MovementItem,
  Rating,
  Role,
  Scores,
  Session,
  SessionStatus,
  Student,
  StudentSessionRecord,
  Symptom,
  TimelineEvent,
  TimelineKind,
  User,
} from '../types';
import { countMonthlyFreebies, evaluateRefund, nowTime, today, uid } from '../utils/recommend';

export interface NewStudentInput {
  name: string;
  gender: '男' | '女';
  birthDate: string;
  height: number;
  weight: number;
  sportsHistory: string;
  allergies: string[];
  pastInjuries: string[];
  parentExpectation: string;
  parentName: string;
  pkgName: string;
  pkgTotal: number;
}

interface StoreState {
  users: User[];
  students: Student[];
  classes: ClassCourse[];
  sessions: Session[];
  incidents: Incident[];
  interceptions: Interception[];
  assessments: Assessment[];
  timeline: TimelineEvent[];
  designDecisions: DesignDecision[];
  levelUps: LevelUpAssessment[];
  currentUserId: string | null;

  // 认证
  login: (username: string, password: string) => boolean;
  logout: () => void;
  resetDemo: () => void;

  // 内部工具
  pushTimeline: (studentId: string, kind: TimelineKind, title: string, detail: string) => void;

  // 建档 / 体测 / 分班
  addStudent: (input: NewStudentInput, scores: Scores, note: string) => string;
  addAssessment: (studentId: string, scores: Scores, note: string) => void;
  assignClass: (studentId: string, classId: string, reason: string) => void;

  // 课次流程
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
  updateChecklist: (sessionId: string, studentId: string, patch: Partial<Checklist>) => void;
  markLeave: (sessionId: string, studentId: string, reason: string) => void;
  savePerformance: (sessionId: string, studentId: string, item: MovementItem, rating: Rating) => void;
  savePerformanceNote: (sessionId: string, studentId: string, note: string) => void;
  saveReport: (sessionId: string, studentId: string, fields: { caution: string; homeExercise: string; levelUpAdvice: StudentSessionRecord['levelUpAdvice'] }) => void;
  completeSession: (sessionId: string) => void;
  ackReport: (sessionId: string, studentId: string) => void;

  // 事件
  addIncident: (input: {
    sessionId: string;
    studentId: string;
    type: IncidentType;
    item?: MovementItem;
    severity: Incident['severity'];
    description: string;
    injury?: { bodyPart: string; treatment: string };
  }) => string;
  addHandling: (incidentId: string, action: string, newStatus?: IncidentStatus) => void;
  setDesignAction: (incidentId: string, action: DesignAction) => void;

  // 课前拦截
  addInterception: (input: {
    sessionId: string;
    studentId: string;
    symptoms: Symptom[];
    note: string;
    hasDoctorNote: boolean;
  }) => string;
  ackInterception: (interceptionId: string) => void;

  // 请假补课 / 沟通 / 升阶
  addMakeup: (studentId: string, date: string, note: string) => void;
  addCommunication: (studentId: string, content: string) => void;
  addLevelUp: (studentId: string, result: '通过' | '暂缓', reason: string, source: string) => void;
  addDesignDecision: (classId: string, item: MovementItem, action: DesignAction, reason: string) => void;
}

const seed = buildSeed();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...seed,
      levelUps: [
        {
          id: 'lu-1', studentId: 's-zhouzimo', date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
          fromClass: '基础 B 班', toClass: '进阶 C 班', result: '通过',
          reason: '六项均分 3.8，游泳与足球基础好', source: '教练建议',
        },
      ],
      currentUserId: null,

      login: (username, password) => {
        const user = get().users.find((u) => u.username === username && u.password === password);
        if (user) {
          set({ currentUserId: user.id });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUserId: null }),
      resetDemo: () => {
        const fresh = buildSeed();
        set({ ...fresh, levelUps: get().levelUps.slice(0, 1), currentUserId: null });
      },

      pushTimeline: (studentId, kind, title, detail) => {
        const ev: TimelineEvent = { id: uid('t'), studentId, date: today(), kind, title, detail };
        set((s) => ({ timeline: [ev, ...s.timeline] }));
      },

      addStudent: (input, scores, note) => {
        const id = uid('s');
        const parentId = uid('u');
        const parent: User = {
          id: parentId,
          username: `p_${id.slice(-6)}`,
          password: '123456',
          name: input.parentName,
          role: 'parent',
          title: `${input.name}家长`,
          childIds: [id],
        };
        const student: Student = {
          id,
          name: input.name,
          gender: input.gender,
          birthDate: input.birthDate,
          height: input.height,
          weight: input.weight,
          sportsHistory: input.sportsHistory || '无',
          allergies: input.allergies,
          pastInjuries: input.pastInjuries,
          parentExpectation: input.parentExpectation,
          parentId,
          classId: null,
          pkg: { name: input.pkgName, total: input.pkgTotal, used: 0, expires: '' },
          createdAt: today(),
        };
        const me = get().users.find((u) => u.id === get().currentUserId);
        const assessment: Assessment = {
          id: uid('a'), studentId: id, date: today(), scores,
          note: note || '建档首次测评', by: me?.name ?? '教练',
        };
        set((s) => ({
          users: [...s.users, parent],
          students: [...s.students, student],
          assessments: [assessment, ...s.assessments],
        }));
        get().pushTimeline(id, 'enroll', '建立学员档案', `家长期望：${input.parentExpectation}；过敏：${input.allergies.join('、') || '无'}；既往伤病：${input.pastInjuries.join('；') || '无'}。`);
        get().pushTimeline(id, 'assessment', '首次体测', note || '建档首次测评完成。');
        return id;
      },

      addAssessment: (studentId, scores, note) => {
        const me = get().users.find((u) => u.id === get().currentUserId);
        const assessment: Assessment = {
          id: uid('a'), studentId, date: today(), scores, note, by: me?.name ?? '教练',
        };
        set((s) => ({ assessments: [assessment, ...s.assessments] }));
        get().pushTimeline(studentId, 'assessment', '阶段复测', note);
      },

      assignClass: (studentId, classId, reason) => {
        const cls = get().classes.find((c) => c.id === classId);
        set((s) => ({
          students: s.students.map((st) => (st.id === studentId ? { ...st, classId } : st)),
        }));
        get().pushTimeline(studentId, 'assign', `分班：${cls?.name ?? classId}`, reason);
      },

      setSessionStatus: (sessionId, status) =>
        set((s) => ({ sessions: s.sessions.map((se) => (se.id === sessionId ? { ...se, status } : se)) })),

      updateChecklist: (sessionId, studentId, patch) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.id === sessionId
              ? {
                  ...se,
                  records: se.records.map((r) =>
                    r.studentId === studentId ? { ...r, checklist: { ...r.checklist, ...patch } } : r,
                  ),
                }
              : se,
          ),
        })),

      markLeave: (sessionId, studentId, reason) => {
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.id === sessionId
              ? { ...se, records: se.records.map((r) => (r.studentId === studentId ? { ...r, leave: true } : r)) }
              : se,
          ),
        }));
        get().pushTimeline(studentId, 'leave', '请假 1 次', `${reason}（课时不扣减，可安排补课）`);
      },

      savePerformance: (sessionId, studentId, item, rating) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.id === sessionId
              ? {
                  ...se,
                  records: se.records.map((r) =>
                    r.studentId === studentId
                      ? { ...r, performance: { ...r.performance, [item]: rating } }
                      : r,
                  ),
                }
              : se,
          ),
        })),

      savePerformanceNote: (sessionId, studentId, note) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.id === sessionId
              ? { ...se, records: se.records.map((r) => (r.studentId === studentId ? { ...r, performanceNote: note } : r)) }
              : se,
          ),
        })),

      saveReport: (sessionId, studentId, fields) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.id === sessionId
              ? { ...se, records: se.records.map((r) => (r.studentId === studentId ? { ...r, ...fields } : r)) }
              : se,
          ),
        })),

      completeSession: (sessionId) => {
        const s = get();
        const session = s.sessions.find((se) => se.id === sessionId);
        if (!session || session.status === 'done') return;
        const cls = s.classes.find((c) => c.id === session.classId);
        const attended = session.records.filter((r) => r.checklist.signed && !r.leave && !r.intercepted);
        // 消课 + 时间线
        const students = s.students.map((st) => {
          if (attended.some((r) => r.studentId === st.id)) {
            return { ...st, pkg: { ...st.pkg, used: Math.min(st.pkg.used + 1, st.pkg.total) } };
          }
          return st;
        });
        const newEvents: TimelineEvent[] = [];
        for (const r of attended) {
          const st = s.students.find((x) => x.id === r.studentId);
          const goodItems = Object.entries(r.performance)
            .filter(([, v]) => v === 'excellent')
            .map(([k]) => k);
          const attItems = Object.entries(r.performance).filter(([, v]) => v === 'attention').map(([k]) => k);
          newEvents.push({
            id: uid('t'), studentId: r.studentId, date: today(), kind: 'session',
            title: `课次表现 · ${cls?.name ?? ''}`,
            detail: r.performanceNote || `完成 ${Object.keys(r.performance).length} 个项目记录。`,
          });
          const remain = st ? st.pkg.total - st.pkg.used - 1 : 0;
          newEvents.push({
            id: uid('t'), studentId: r.studentId, date: today(), kind: 'package',
            title: '课包消耗 1 课时', detail: `剩余 ${remain} 课时。`,
          });
          void goodItems; void attItems;
        }
        set((st) => ({
          students,
          timeline: [...newEvents, ...st.timeline],
          sessions: st.sessions.map((se) => (se.id === sessionId ? { ...se, status: 'done' } : se)),
        }));
      },

      ackReport: (sessionId, studentId) =>
        set((s) => ({
          sessions: s.sessions.map((se) =>
            se.id === sessionId
              ? { ...se, records: se.records.map((r) => (r.studentId === studentId ? { ...r, reportAcked: true } : r)) }
              : se,
          ),
        })),

      addIncident: (input) => {
        const me = get().users.find((u) => u.id === get().currentUserId);
        const id = uid('i');
        const incident: Incident = {
          id,
          ...input,
          status: 'open',
          createdAt: nowTime(),
          createdBy: me?.name ?? '系统',
          timeline: [
            { id: uid('h'), time: nowTime(), role: (me?.role ?? 'coach') as Role, userName: me?.name ?? '系统', action: `登记事件：${input.description}` },
          ],
        };
        set((s) => ({ incidents: [incident, ...s.incidents] }));
        const labels: Record<IncidentType, string> = {
          fear: '恐惧器械', compensation: '动作代偿', injury: '摔倒擦伤', conflict: '同伴冲突', levelupRequest: '家长临时升阶要求',
        };
        get().pushTimeline(input.studentId, 'incident', `${labels[input.type]}`, input.description);
        return id;
      },

      addHandling: (incidentId, action, newStatus) => {
        const me = get().users.find((u) => u.id === get().currentUserId);
        const entry: HandlingEntry = {
          id: uid('h'), time: nowTime(), role: (me?.role ?? 'coach') as Role,
          userName: me?.name ?? '系统', action,
        };
        set((s) => ({
          incidents: s.incidents.map((inc) => {
            if (inc.id !== incidentId) return inc;
            const nextStatus: IncidentStatus =
              newStatus ?? (inc.status === 'open' ? 'processing' : inc.status);
            return { ...inc, status: nextStatus, timeline: [...inc.timeline, entry] };
          }),
        }));
      },

      setDesignAction: (incidentId, action) =>
        set((s) => ({
          incidents: s.incidents.map((inc) => (inc.id === incidentId ? { ...inc, designAction: action } : inc)),
        })),

      addInterception: (input) => {
        const s = get();
        const me = s.users.find((u) => u.id === s.currentUserId);
        const student = s.students.find((x) => x.id === input.studentId);
        if (!student) return '';
        // 课包规则 + 医生证明 + 历史请假 → 返还判定
        const used = countMonthlyFreebies(input.studentId, s.timeline, s.interceptions);
        const evalResult = evaluateRefund(student.pkg.name, input.hasDoctorNote, used);
        const id = uid('int');
        const interception: Interception = {
          id,
          sessionId: input.sessionId,
          studentId: input.studentId,
          date: today(),
          symptoms: input.symptoms,
          note: input.note,
          hasDoctorNote: input.hasDoctorNote,
          decision: evalResult.decision,
          decisionReason: evalResult.reason,
          createdBy: me?.name ?? '前台',
          createdAt: nowTime(),
          parentAcked: false,
        };
        // 标记课次记录为已拦截
        set((st) => ({
          interceptions: [interception, ...st.interceptions],
          sessions: st.sessions.map((se) =>
            se.id === input.sessionId
              ? {
                  ...se,
                  records: se.records.map((r) =>
                    r.studentId === input.studentId
                      ? { ...r, intercepted: true, checklist: { ...r.checklist, healthOk: false, note: input.note || r.checklist.note } }
                      : r,
                  ),
                }
              : se,
          ),
        }));
        const symptomText = input.symptoms.map((x) => ({ cough: '咳嗽', fatigue: '疲劳', legPain: '腿部疼痛' })[x]).join('、');
        get().pushTimeline(
          input.studentId,
          'interception',
          `课前拦截 · ${symptomText}`,
          `${input.note || '到店身体状态不佳，前台拦截。'}课时处理：${evalResult.decision === 'refund' ? '已返还' : '不返还，正常消耗'}（${evalResult.reason}）。`,
        );
        // 不返还 → 立即消耗 1 课时
        if (evalResult.decision === 'noRefund') {
          set((st) => ({
            students: st.students.map((x) =>
              x.id === input.studentId ? { ...x, pkg: { ...x.pkg, used: Math.min(x.pkg.used + 1, x.pkg.total) } } : x,
            ),
          }));
          get().pushTimeline(input.studentId, 'package', '课包消耗 1 课时', '课前拦截未返还（本月免费额度已用完且无医生证明）。');
        }
        return id;
      },

      ackInterception: (interceptionId) =>
        set((s) => ({
          interceptions: s.interceptions.map((i) => (i.id === interceptionId ? { ...i, parentAcked: true } : i)),
        })),

      addMakeup: (studentId, date, note) => {
        get().pushTimeline(studentId, 'makeup', '补课完成', `${date} ${note}`);
      },

      addCommunication: (studentId, content) => {
        get().pushTimeline(studentId, 'communication', '家长沟通', content);
      },

      addLevelUp: (studentId, result, reason, source) => {
        const s = get();
        const st = s.students.find((x) => x.id === studentId);
        if (!st) return;
        const fromCls = s.classes.find((c) => c.id === st.classId);
        const order = ['启蒙', '基础', '进阶'];
        const nextLevel = fromCls ? order[Math.min(order.indexOf(fromCls.level) + 1, 2)] : '基础';
        const toCls = s.classes.find((c) => c.level === nextLevel);
        const lu: LevelUpAssessment = {
          id: uid('lu'), studentId, date: today(),
          fromClass: fromCls?.name ?? '未分班', toClass: result === '通过' ? toCls?.name ?? fromCls?.name ?? '' : fromCls?.name ?? '',
          result, reason, source,
        };
        set((st2) => ({ levelUps: [lu, ...st2.levelUps] }));
        if (result === '通过' && toCls) {
          set((st2) => ({
            students: st2.students.map((x) => (x.id === studentId ? { ...x, classId: toCls.id } : x)),
          }));
        }
        get().pushTimeline(
          studentId, 'levelup', `升阶评估 · ${result}`,
          `${fromCls?.name ?? '未分班'} → ${result === '通过' ? toCls?.name : '维持原班'}。依据：${reason}（来源：${source}）`,
        );
      },

      addDesignDecision: (classId, item, action, reason) => {
        const me = get().users.find((u) => u.id === get().currentUserId);
        const d: DesignDecision = {
          id: uid('d'), date: today(), classId, item, action, reason, by: me?.name ?? '店长',
        };
        set((s) => ({ designDecisions: [d, ...s.designDecisions] }));
      },
    }),
    {
      name: 'kidfit-store-v2',
      version: 2,
    },
  ),
);

// ============ 选择器 / 派生工具 ============

export function useCurrentUser(): User | null {
  return useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
}

export function studentById(s: StoreState, id: string): Student | undefined {
  return s.students.find((x) => x.id === id);
}

export function latestAssessment(assessments: Assessment[], studentId: string): Assessment | undefined {
  return assessments
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function emptyScores(): Scores {
  const base: Record<Dimension, number> = {
    balance: 3, agility: 3, strength: 3, flexibility: 3, coordination: 3, attention: 3,
  };
  return base;
}
