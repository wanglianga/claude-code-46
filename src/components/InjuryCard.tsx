import { useState } from 'react';
import { useCurrentUser, useStore } from '../store/useStore';
import {
  INJURY_GRADE_LABELS,
  INJURY_STATUS_LABELS,
  InjuryRecord,
  MOVEMENT_LABELS,
} from '../types';
import { suspensionEnd } from '../utils/recommend';
import { Avatar, Badge } from './ui';

const STATUS_COLORS: Record<string, string> = {
  waitingParent: 'warning',
  confirmed: 'info',
  followup: 'primary',
  closed: 'success',
};

/** 伤情分级记录卡：展示完整记录 + 家长确认 / 店长回访 / 闭环操作 */
export default function InjuryCard(props: { record: InjuryRecord }) {
  const rec = props.record;
  const user = useCurrentUser();
  const store = useStore();
  const student = store.students.find((s) => s.id === rec.studentId);
  const session = store.sessions.find((s) => s.id === rec.sessionId);
  const cls = session ? store.classes.find((c) => c.id === session.classId) : undefined;

  const [visitNote, setVisitNote] = useState('');
  const [showVisit, setShowVisit] = useState(false);

  if (!user || !student) return null;

  const isMyChild = user.role === 'parent' && (user.childIds ?? []).includes(rec.studentId);
  const end = suspensionEnd(rec);

  return (
    <div className={`report-card ${rec.status === 'waitingParent' && isMyChild ? 'unacked' : ''}`}>
      <div className="flex-between wrap">
        <div className="flex">
          <Avatar name={student.name} />
          <div>
            <div className="strong">
              {student.name}
              <span className="muted small" style={{ marginLeft: 8 }}>
                {rec.date} · {cls?.name} · {rec.createdBy} 记录
              </span>
            </div>
            <div className="tag-list mt8">
              <Badge color={rec.grade === 'major' ? 'danger' : 'warning'}>{INJURY_GRADE_LABELS[rec.grade]}</Badge>
              {rec.item && <Badge color="gray">{MOVEMENT_LABELS[rec.item]}</Badge>}
              <Badge color="gray">{rec.venue}</Badge>
              <Badge color={STATUS_COLORS[rec.status]}>{INJURY_STATUS_LABELS[rec.status]}</Badge>
              {rec.suspension && <Badge color="danger">暂停训练 {rec.suspensionDays} 天{end ? `（至 ${end}）` : ''}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="kv mt12">
        <div><div className="k">具体动作</div><div className="v">{rec.movementDetail}</div></div>
        <div><div className="k">受伤部位</div><div className="v">{rec.bodyPart}</div></div>
        <div><div className="k">护具佩戴</div><div className="v">{rec.protectiveGear.join('、') || '无'}</div></div>
        <div>
          <div className="k">伤情照片 / 动作视频</div>
          <div className="v tag-list">
            {rec.photos.map((p) => <Badge key={p} color="info">📷 {p}</Badge>)}
            {rec.video && <Badge color="info">🎬 {rec.video}</Badge>}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}><div className="k">现场处理</div><div className="v">{rec.treatment}</div></div>
        <div style={{ gridColumn: '1 / -1' }}><div className="k">复课建议</div><div className="v">{rec.returnAdvice}</div></div>
      </div>

      {rec.avoidItems.length > 0 && (
        <div className="alert a-warning mt12" style={{ marginBottom: 0 }}>
          ⚠️ 后续课程避开：{rec.avoidItems.map((i) => MOVEMENT_LABELS[i]).join('、')}
          {rec.grade === 'minor' ? '（轻微伤，下节课提醒教练）' : ''}
        </div>
      )}
      {rec.suspension && rec.alternativeItems.length > 0 && (
        <div className="alert a-success mt8" style={{ marginBottom: 0 }}>
          🔄 暂停训练期间低风险替代动作：{rec.alternativeItems.map((i) => MOVEMENT_LABELS[i]).join('、')}
        </div>
      )}

      {rec.managerVisit && (
        <div className="alert a-info mt8" style={{ marginBottom: 0 }}>
          店长回访（{rec.managerVisit.by} · {rec.managerVisit.date}）：{rec.managerVisit.note}
        </div>
      )}

      {/* 家长确认：确认后才进入后续训练计划 */}
      {isMyChild && rec.status === 'waitingParent' && (
        <div className="mt12">
          <button className="btn btn-sm btn-success" onClick={() => store.confirmInjury(rec.id)}>
            ✔ 确认伤情记录，同意进入后续训练计划
          </button>
        </div>
      )}

      {/* 店长回访（较重伤，家长已确认后） */}
      {user.role === 'manager' && rec.grade === 'major' && rec.status === 'confirmed' && (
        <div className="mt12">
          {!showVisit ? (
            <button className="btn btn-sm btn-primary" onClick={() => setShowVisit(true)}>
              📞 发起店长回访
            </button>
          ) : (
            <div className="flex wrap">
              <input
                style={{ flex: 1, minWidth: 220, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
                placeholder="回访记录：恢复情况、家长反馈、复课安排…"
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
              />
              <button
                className="btn btn-sm"
                disabled={!visitNote.trim()}
                onClick={() => {
                  store.addManagerVisit(rec.id, visitNote.trim());
                  setShowVisit(false);
                }}
              >
                保存回访
              </button>
            </div>
          )}
        </div>
      )}

      {/* 闭环（教练/店长，确认或回访后） */}
      {(user.role === 'coach' || user.role === 'manager') &&
        (rec.status === 'confirmed' || rec.status === 'followup') && (
          <div className="mt12">
            <button
              className="btn btn-sm btn-success"
              onClick={() => store.closeInjury(rec.id, '孩子恢复良好，伤情回访闭环。')}
            >
              ✔ 恢复良好，闭环
            </button>
          </div>
        )}
    </div>
  );
}
