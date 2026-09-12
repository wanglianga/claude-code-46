import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import {
  DesignAction,
  INCIDENT_LABELS,
  INCIDENT_STATUS_LABELS,
  Incident,
  MOVEMENT_LABELS,
} from '../types';
import { Avatar, Badge, Modal } from './ui';

const TYPE_COLORS: Record<string, string> = {
  fear: 'warning',
  compensation: 'danger',
  injury: 'danger',
  conflict: 'info',
  levelupRequest: 'primary',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'danger',
  processing: 'warning',
  waitingParent: 'info',
  closed: 'success',
};

const ROLE_NAMES: Record<string, string> = {
  coach: '教练',
  frontdesk: '前台',
  manager: '店长',
  parent: '家长',
};

/** 事件卡片：展示事件 + 多角色处理时间线 + 角色化操作 */
export default function IncidentCard(props: { incident: Incident; showSession?: boolean }) {
  const inc = props.incident;
  const user = useCurrentUser();
  const store = useStore();
  const student = store.students.find((s) => s.id === inc.studentId);
  const session = store.sessions.find((s) => s.id === inc.sessionId);
  const cls = session ? store.classes.find((c) => c.id === session.classId) : undefined;

  const [note, setNote] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpReason, setLevelUpReason] = useState('');

  if (!user || !student) return null;

  const isMyChild = user.role === 'parent' && (user.childIds ?? []).includes(inc.studentId);

  const submitNote = (status?: typeof inc.status) => {
    if (!note.trim()) return;
    store.addHandling(inc.id, note.trim(), status);
    setNote('');
  };

  const quickAction = (action: string, status?: typeof inc.status) => {
    store.addHandling(inc.id, action, status);
  };

  return (
    <div className="report-card">
      <div className="flex-between wrap">
        <div className="flex">
          <Avatar name={student.name} />
          <div>
            <div className="strong">
              {student.name}
              <span className="muted small" style={{ marginLeft: 8 }}>
                {cls?.name} · {session?.date} {session?.time}
              </span>
            </div>
            <div className="tag-list mt8">
              <Badge color={TYPE_COLORS[inc.type]}>{INCIDENT_LABELS[inc.type]}</Badge>
              {inc.item && <Badge color="gray">{MOVEMENT_LABELS[inc.item]}</Badge>}
              <Badge color={inc.severity === '高' ? 'danger' : inc.severity === '中' ? 'warning' : 'gray'}>
                {inc.severity}风险
              </Badge>
              <Badge color={STATUS_COLORS[inc.status]}>{INCIDENT_STATUS_LABELS[inc.status]}</Badge>
              {inc.designAction && <Badge color="primary">设计处置：{inc.designAction}</Badge>}
            </div>
          </div>
        </div>
        {props.showSession && session && (
          <Link to={`/sessions/${session.id}`} className="btn btn-sm btn-outline">
            查看当节课
          </Link>
        )}
      </div>

      <div className="mt12">{inc.description}</div>
      {inc.injury && (
        <div className="alert a-danger mt8" style={{ marginBottom: 0 }}>
          部位：{inc.injury.bodyPart}　处置：{inc.injury.treatment}
        </div>
      )}

      {/* 处理时间线 */}
      <div className="handling-list">
        {inc.timeline.map((h) => (
          <div className="handling-item" key={h.id}>
            <span className="who">
              【{ROLE_NAMES[h.role]}】{h.userName}
            </span>
            <span className="time">{h.time}</span>
            <div>{h.action}</div>
          </div>
        ))}
      </div>

      {/* 角色化操作区 */}
      {inc.status !== 'closed' && user.role !== 'parent' && (
        <div className="mt12">
          <div className="flex wrap">
            <input
              style={{ flex: 1, minWidth: 220, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
              placeholder="补充处理记录…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn btn-sm" onClick={() => submitNote()} disabled={!note.trim()}>
              记录处理
            </button>
          </div>
          <div className="flex wrap mt8">
            {user.role === 'frontdesk' && inc.status !== 'waitingParent' && (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => quickAction('已电话/当面联系家长，告知事件经过与当前处置，等待家长确认。', 'waitingParent')}
              >
                📞 已联系家长
              </button>
            )}
            {user.role === 'manager' && (
              <>
                <span className="muted small">训练设计处置：</span>
                {(['保持', '降级', '换器械', '增加助教'] as DesignAction[]).map((a) => (
                  <button
                    key={a}
                    className={`btn btn-sm ${inc.designAction === a ? '' : 'btn-ghost'}`}
                    onClick={() => {
                      store.setDesignAction(inc.id, a);
                      store.addHandling(inc.id, `店长复盘：该环节训练设计调整为「${a}」。`);
                    }}
                  >
                    {a}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => quickAction('店长复核完毕，事件闭环。', 'closed')}
                >
                  ✔ 复核闭环
                </button>
              </>
            )}
            {inc.type === 'levelupRequest' && user.role === 'manager' && (
              <button className="btn btn-sm btn-warning" onClick={() => setShowLevelUp(true)}>
                📈 处理升阶评估
              </button>
            )}
          </div>
        </div>
      )}

      {/* 家长确认 */}
      {isMyChild && (inc.status === 'waitingParent' || inc.status === 'processing' || inc.status === 'open') && (
        <div className="mt12">
          <button
            className="btn btn-sm btn-success"
            onClick={() => quickAction('家长已知晓事件经过与门店处置，确认无异议。', 'closed')}
          >
            ✔ 我已知晓，确认闭环
          </button>
        </div>
      )}

      {/* 升阶评估弹窗 */}
      {showLevelUp && (
        <Modal
          title={`升阶评估 · ${student.name}`}
          onClose={() => setShowLevelUp(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowLevelUp(false)}>
                取消
              </button>
              <button
                className="btn btn-warning"
                onClick={() => {
                  store.addLevelUp(student.id, '暂缓', levelUpReason || '建议继续观察一个阶段', '家长要求');
                  store.addHandling(inc.id, '店长评估：暂缓升阶，已与家长沟通原因。', 'waitingParent');
                  setShowLevelUp(false);
                }}
              >
                暂缓
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  store.addLevelUp(student.id, '通过', levelUpReason || '体测达标，课堂表现稳定', '家长要求');
                  store.addHandling(inc.id, '店长评估：通过升阶，已调整班级并通知家长。', 'waitingParent');
                  setShowLevelUp(false);
                }}
              >
                通过升阶
              </button>
            </>
          }
        >
          <div className="field">
            <label>评估依据（体测、课堂表现、安全考量）</label>
            <textarea
              value={levelUpReason}
              onChange={(e) => setLevelUpReason(e.target.value)}
              placeholder="例如：最近复测均分 3.8，平衡与协调已达进阶班要求…"
            />
          </div>
          <div className="alert a-info" style={{ marginBottom: 0 }}>
            通过后系统自动调整班级，并在学员成长时间线中记录「升阶评估」。
          </div>
        </Modal>
      )}
    </div>
  );
}
