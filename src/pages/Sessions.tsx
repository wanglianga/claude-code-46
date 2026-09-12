import { Link } from 'react-router-dom';
import { Badge, Card, Empty } from '../components/ui';
import { useCurrentUser, useStore } from '../store/useStore';
import { SESSION_STATUS_LABELS } from '../types';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gray',
  checking: 'warning',
  ongoing: 'info',
  done: 'success',
};

export default function Sessions() {
  const store = useStore();
  const user = useCurrentUser();
  if (!user) return null;

  const sessions = [...store.sessions]
    .filter((s) => (user.role === 'coach' ? s.coachId === user.id : true))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  return (
    <div>
      <h1 className="page-title">课次管理</h1>
      <div className="page-sub">每节课的完整动线：课前核验 → 课中记录 → 事件处理 → 课后报告</div>

      {sessions.length === 0 && <Empty text="暂无课次" icon="🗓️" />}
      {sessions.map((s) => {
        const cls = store.classes.find((c) => c.id === s.classId);
        const coach = store.users.find((u) => u.id === s.coachId);
        const signed = s.records.filter((r) => r.checklist.signed && !r.leave).length;
        const leaveCount = s.records.filter((r) => r.leave).length;
        const incs = store.incidents.filter((i) => i.sessionId === s.id);
        const openInc = incs.filter((i) => i.status !== 'closed').length;
        return (
          <Card key={s.id}>
            <div className="flex-between wrap">
              <div>
                <div className="flex wrap">
                  <span className="strong" style={{ fontSize: 15 }}>
                    {s.date} {s.time} · {cls?.name}
                  </span>
                  <Badge color={STATUS_COLOR[s.status]}>{SESSION_STATUS_LABELS[s.status]}</Badge>
                  {openInc > 0 && <Badge color="danger">{openInc} 个事件待处理</Badge>}
                </div>
                <div className="muted small mt8">
                  教练 {coach?.name} · 签到 {signed}/{s.records.length} 人
                  {leaveCount > 0 && ` · 请假 ${leaveCount} 人`} · 事件 {incs.length} 件
                </div>
              </div>
              <Link to={`/sessions/${s.id}`} className="btn btn-sm btn-outline">
                进入课次 →
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
