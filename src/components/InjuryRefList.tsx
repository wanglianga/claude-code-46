import { useStore } from '../store/useStore';
import { INJURY_GRADE_LABELS, INJURY_STATUS_LABELS, MOVEMENT_LABELS } from '../types';

/** 升阶评估时引用的伤情记录摘要 */
export default function InjuryRefList(props: { studentId: string }) {
  const records = useStore((s) => s.injuryRecords)
    .filter((r) => r.studentId === props.studentId)
    .slice(0, 3);

  return (
    <div className="alert a-warning" style={{ marginBottom: 0 }}>
      <div className="strong mb8">🩹 伤情参考（升阶评估必看）</div>
      {records.length === 0 && <div>· 无伤情记录</div>}
      {records.map((r) => (
        <div key={r.id}>
          · {r.date} {INJURY_GRADE_LABELS[r.grade]} · {r.item ? MOVEMENT_LABELS[r.item] : '综合'}（{r.bodyPart}）：
          {INJURY_STATUS_LABELS[r.status]}
          {r.suspension ? `，曾建议暂停训练 ${r.suspensionDays} 天` : ''}
          {r.avoidItems.length > 0 ? `，避开 ${r.avoidItems.map((i) => MOVEMENT_LABELS[i]).join('、')}` : ''}
        </div>
      ))}
    </div>
  );
}
