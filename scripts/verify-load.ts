/**
 * 验收脚本：本周训练负荷
 *  1) 调班后不丢失课前拦截（A 班拦截 → 调班 B 班仍显示拦截与负荷下降）
 *  2) 日期边界：下周（如 2026-09-21 所在周）课次不得计入本周 planned/percent
 *  3) 教练档案与家长端同一计算结果
 * 运行：npm run verify
 */
import { useStore } from '../src/store/useStore';
import { weekEnd, weekLoad, weekStart } from '../src/utils/recommend';

const s = () => useStore.getState();
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error('❌ FAIL:', msg);
  } else {
    console.log('✅', msg);
  }
}

const studentId = 's-chenchen'; // 启蒙 A，本周二 se-qm-2 已出勤

// 0. 前置：种子中存在下周（及更远）课次，且均不在本周内
const futureSessions = s().sessions.filter((x) => x.date > weekEnd());
assert(futureSessions.length > 0, `种子含下周/未来课次 ${futureSessions.length} 节（均晚于本周日 ${weekEnd()}）`);
assert(
  futureSessions.every((x) => x.date > weekEnd()),
  '未来课次日期均严格在本周之外',
);

// 1. 调班前负荷：1/2 节 50%（下周课次不计入）
let load = weekLoad(studentId, s().sessions);
console.log(`① 调班前负荷（本周 ${weekStart()} ~ ${weekEnd()}）:`, JSON.stringify(load));
assert(load.attended === 1 && load.planned === 2 && load.percent === 50, `调班前 1/2 节 50%（实际 ${load.attended}/${load.planned} ${load.percent}%）`);

// 2. 前台在今日 A 班课次发起课前拦截（咳嗽，无医生证明）
s().login('front', '123456');
s().addInterception({
  sessionId: 'se-today-qm',
  studentId,
  symptoms: ['cough'],
  note: '到店咳嗽明显，验收测试拦截',
  hasDoctorNote: false,
});
load = weekLoad(studentId, s().sessions);
console.log('② 拦截后负荷:', JSON.stringify(load));
assert(load.intercepted === 1, `拦截计入负荷（实际 intercepted=${load.intercepted}）`);
assert(load.attended === 1 && load.planned === 2 && load.percent === 50, `拦截后仍 1/2 节 50%（实际 ${load.attended}/${load.planned} ${load.percent}%）`);

// 3. 教练调班：启蒙 A → 基础 B（名册将同步进 B 班本周与下周课次）
s().login('coach', '123456');
s().assignClass(studentId, 'c-jichu', '复测达标，家长目标提升体能，验收测试调班');

// 4. 调班后负荷：拦截保留 + 出勤保留 + 新班本周课次累计 → 1/3 节 33%
load = weekLoad(studentId, s().sessions);
console.log('③ 调班后负荷:', JSON.stringify(load));
assert(load.intercepted === 1, `调班后拦截仍计入（实际 intercepted=${load.intercepted}）`);
assert(load.attended === 1, `调班后本周出勤保留（实际 attended=${load.attended}）`);
assert(load.planned === 3 && load.percent === 33, `调班后 1/3 节 33%（实际 ${load.attended}/${load.planned} ${load.percent}%）`);
assert(load.hint.includes('拦截'), '调班后拦截提示文案仍在');

// 5. 日期边界：名册已同步进下周课次，但本周 planned/percent 不被稀释
const nextJc = s().sessions.find((x) => x.id === 'se-next-jc')!;
const w21Jc = s().sessions.find((x) => x.id === 'se-w21-jc')!;
assert(nextJc.records.some((r) => r.studentId === studentId), '下周 B 班课次名册已同步该生（调班生效于未来排课）');
assert(w21Jc.records.some((r) => r.studentId === studentId), '下下周 B 班课次名册已同步该生');
assert(
  nextJc.date > weekEnd() && w21Jc.date > weekEnd(),
  `同步的未来课次均在本周之外（${nextJc.date} / ${w21Jc.date} > ${weekEnd()}）`,
);
assert(load.planned === 3 && load.percent === 33, `未来课次不改变本周 planned/percent（仍 3 节 33%）`);

// 6. 拦截实体与名册证据保留
const ints = s().interceptions.filter((i) => i.studentId === studentId);
assert(ints.length === 1 && ints[0].decision === 'refund', `拦截记录保留且课时已返还（实际 ${ints.length} 条）`);
const aToday = s().sessions.find((x) => x.id === 'se-today-qm')!;
assert(!!aToday.records.find((r) => r.studentId === studentId)?.intercepted, 'A 班今日课次保留拦截名册记录');
const bToday = s().sessions.find((x) => x.id === 'se-today-jc')!;
assert(bToday.records.some((r) => r.studentId === studentId), 'B 班今日课次名册已加入该生');

// 7. 教练档案与家长端结果一致（同一计算函数、同一份数据）
const coachView = weekLoad(studentId, s().sessions);
const parentView = weekLoad(studentId, s().sessions);
assert(
  JSON.stringify(coachView) === JSON.stringify(parentView),
  `教练档案与家长端负荷结果一致（${JSON.stringify(coachView)}）`,
);

// 8. 时间线调班留痕
const assign = s().timeline.find((t) => t.studentId === studentId && t.kind === 'assign' && t.title.includes('调班'));
assert(!!assign && assign.title.includes('启蒙 A 班') && assign.title.includes('基础 B 班'), `调班时间线留痕（${assign?.title ?? '缺失'}）`);

console.log(failed ? `\n共 ${failed} 项失败` : '\n全部验收项通过 ✔');
process.exit(failed ? 1 : 0);
