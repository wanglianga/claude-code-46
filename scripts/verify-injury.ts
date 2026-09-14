/**
 * 验收脚本：伤情分级回访流程
 *  1) 教练记录摔倒（动作/场地/护具/照片/视频/现场处理/复课建议）→ 待家长确认
 *  2) 家长确认前不进入训练计划（无提醒）；确认后轻微伤下节课提醒、较重伤暂停+替代动作
 *  3) 较重伤生成店长回访；闭环后提醒失效
 *  4) 升阶评估引用伤情记录
 * 运行：npm run verify（在 verify-load 之后执行）
 */
import { useStore } from '../src/store/useStore';
import { activeInjuries, computeAlternatives, suspensionEnd } from '../src/utils/recommend';

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

const studentId = 's-zhouzimo'; // 进阶 C，今日有 se-today-jj 课次

// 1. 教练在今日课次登记摔倒事件 + 较重伤分级记录
s().login('coach2', '123456');
const incidentId = s().addIncident({
  sessionId: 'se-today-jj',
  studentId,
  type: 'injury',
  item: 'jump',
  severity: '中',
  description: '跳箱落地右膝磕碰，疼痛 2/10。',
  injury: { bodyPart: '右膝', treatment: '冰敷 10 分钟' },
});
const recordId = s().addInjuryRecord({
  incidentId,
  sessionId: 'se-today-jj',
  studentId,
  grade: 'major',
  item: 'jump',
  movementDetail: '跳箱单脚落地',
  venue: '跳跃垫区',
  protectiveGear: ['护膝'],
  photos: ['右膝_磕碰_1.jpg'],
  video: '跳箱落地_回放.mp4',
  bodyPart: '右膝',
  treatment: '冰敷 10 分钟，休息观察',
  returnAdvice: '3 天内避免跳跃冲击',
  avoidItems: ['jump', 'balanceBeam'],
  suspension: true,
  suspensionDays: 3,
});

const rec = () => s().injuryRecords.find((r) => r.id === recordId)!;

assert(!!rec(), '伤情记录已创建');
assert(rec().status === 'waitingParent', `初始状态为待家长确认（实际 ${rec().status}）`);
assert(rec().photos.length === 1 && rec().video.includes('回放'), '伤情照片与动作视频已记录');
assert(rec().protectiveGear.includes('护膝') && rec().venue === '跳跃垫区', '护具与场地已记录');
assert(rec().alternativeItems.length > 0 && !rec().alternativeItems.includes('jump'), `暂停期间已推荐低风险替代动作（${rec().alternativeItems.join('/')}）`);
assert(computeAlternatives(['jump']).every((i) => i !== 'jump'), '替代动作推导排除被避开项');
assert(suspensionEnd(rec()) !== null, `暂停训练截止日期已计算（${suspensionEnd(rec())}）`);

// 2. 家长确认前：不进入训练计划（无生效提醒）
assert(activeInjuries(s().injuryRecords, studentId).length === 0, '家长确认前无生效伤情提醒（未进入训练计划）');

// 3. 家长确认 → 进入训练计划，提醒生效
s().login('parent4', '123456'); // 周子墨爸爸
s().confirmInjury(recordId);
assert(rec().status === 'confirmed', `家长确认后状态为已确认（实际 ${rec().status}）`);
assert(!!rec().parentConfirmedAt, '记录家长确认时间');
const active = activeInjuries(s().injuryRecords, studentId);
assert(active.length === 1 && active[0].avoidItems.includes('jump'), '确认后下节课提醒生效（避开跳跃）');

// 4. 店长回访（较重伤）
s().login('manager', '123456');
s().addManagerVisit(recordId, '电话回访：孩子右膝已消肿，建议周四复查后复课。');
assert(rec().status === 'followup', `店长回访后状态为回访中（实际 ${rec().status}）`);
assert(rec().managerVisit?.by === '张敏', '回访人记录为店长');

// 5. 闭环 → 提醒失效
s().closeInjury(recordId, '复查无恙，恢复训练。');
assert(rec().status === 'closed', '伤情记录闭环');
assert(activeInjuries(s().injuryRecords, studentId).length === 0, '闭环后伤情提醒失效');

// 6. 升阶评估引用伤情记录
s().addLevelUp(studentId, '暂缓', '右膝伤情刚闭环，建议观察一个月', '门店评估');
const lu = s().timeline.find((t) => t.studentId === studentId && t.kind === 'levelup');
assert(!!lu && lu.detail.includes('伤情参考') && lu.detail.includes('较重伤'), `升阶评估引用伤情记录（${lu?.detail.slice(0, 60)}…）`);

// 7. 种子数据完整性：何沐阳较重伤待家长确认、吴天天轻微伤已闭环
const hmy = s().injuryRecords.find((r) => r.id === 'ir-2')!;
assert(hmy.status === 'waitingParent' && hmy.grade === 'major' && hmy.suspension, '种子：何沐阳较重伤待家长确认（含暂停建议）');
const wtt = s().injuryRecords.find((r) => r.id === 'ir-1')!;
assert(wtt.status === 'closed' && wtt.grade === 'minor', '种子：吴天天轻微伤已闭环');

console.log(failed ? `\n共 ${failed} 项失败` : '\n伤情分级回访全部验收项通过 ✔');
process.exit(failed ? 1 : 0);
