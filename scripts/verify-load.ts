/**
 * 验收脚本：调班后本周训练负荷不丢失课前拦截
 * 场景：陈晨（启蒙 A）本周已出勤 1 节 → 今日 A 班课次被课前拦截 → 调班到基础 B
 * 期望：拦截仍计入负荷、出勤保留、新班后续课次继续累计
 * 运行：npx tsx scripts/verify-load.ts
 */
import { useStore } from '../src/store/useStore';
import { weekLoad } from '../src/utils/recommend';

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

// 1. 调班前负荷：1/2 节
let load = weekLoad(studentId, s().sessions);
console.log('① 调班前负荷:', JSON.stringify(load));
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
assert(load.hint.includes('拦截'), '拦截提示文案出现');

// 3. 教练调班：启蒙 A → 基础 B
s().login('coach', '123456');
s().assignClass(studentId, 'c-jichu', '复测达标，家长目标提升体能，验收测试调班');

// 4. 调班后负荷：拦截保留 + 出勤保留 + 新班后续课次累计
load = weekLoad(studentId, s().sessions);
console.log('③ 调班后负荷:', JSON.stringify(load));
assert(load.intercepted === 1, `调班后拦截仍计入（实际 intercepted=${load.intercepted}）`);
assert(load.attended === 1, `调班后本周出勤保留（实际 attended=${load.attended}）`);
assert(load.planned === 3, `调班后累计新班今日课次 → 3 节（实际 planned=${load.planned}）`);
assert(load.percent === 33, `调班后 1/3 ≈ 33%（实际 ${load.percent}%）`);
assert(load.hint.includes('拦截'), '调班后拦截提示文案仍在');

// 5. 拦截实体记录保留（家长端课时处理结果可见）
const ints = s().interceptions.filter((i) => i.studentId === studentId);
assert(ints.length === 1 && ints[0].decision === 'refund', `拦截记录保留且课时已返还（实际 ${ints.length} 条，decision=${ints[0]?.decision}）`);

// 6. 名册：A 班今日课次保留拦截名册（非空白不移除）；B 班今日课次已加入
const aToday = s().sessions.find((x) => x.id === 'se-today-qm')!;
const bToday = s().sessions.find((x) => x.id === 'se-today-jc')!;
assert(!!aToday.records.find((r) => r.studentId === studentId)?.intercepted, 'A 班今日课次保留拦截名册记录');
assert(bToday.records.some((r) => r.studentId === studentId), 'B 班今日课次名册已加入该生');

// 7. 时间线调班留痕（含新旧班级与原因）
const assign = s().timeline.find((t) => t.studentId === studentId && t.kind === 'assign' && t.title.includes('调班'));
assert(!!assign && assign.title.includes('启蒙 A 班') && assign.title.includes('基础 B 班'), `调班时间线留痕（${assign?.title ?? '缺失'}）`);

console.log(failed ? `\n共 ${failed} 项失败` : '\n全部验收项通过 ✔');
process.exit(failed ? 1 : 0);
