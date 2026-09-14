import { Link } from 'react-router-dom';
import { Badge, Card, Empty, Stat } from '../components/ui';
import { useCurrentUser, useStore } from '../store/useStore';
import {
  INCIDENT_LABELS,
  MOVEMENT_LABELS,
  SESSION_STATUS_LABELS,
} from '../types';
import { today } from '../utils/recommend';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gray',
  checking: 'warning',
  ongoing: 'info',
  done: 'success',
};

export default function Dashboard() {
  const user = useCurrentUser();
  const store = useStore();
  if (!user) return null;

  const todayStr = today();
  const todaySessions = store.sessions
    .filter((s) => s.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));
  const openIncidents = store.incidents.filter((i) => i.status !== 'closed');
  const waitingParent = store.incidents.filter((i) => i.status === 'waitingParent');
  const injuries = store.incidents.filter((i) => i.type === 'injury' || i.type === 'compensation');
  const todayInterceptions = store.interceptions.filter((i) => i.date === todayStr);

  const mySessions =
    user.role === 'coach' ? todaySessions.filter((s) => s.coachId === user.id) : todaySessions;

  return (
    <div>
      <h1 className="page-title">工作台</h1>
      <div className="page-sub">
        {user.title}，今天是 {todayStr}。围绕每一节课完成「核验 → 记录 → 事件 → 报告」闭环。
      </div>

      <div className="grid mb16" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <Stat num={todaySessions.length} label="今日课次" color="primary" />
        <Stat
          num={todaySessions.reduce((acc, s) => acc + s.records.filter((r) => r.checklist.signed && !r.leave && !r.intercepted).length, 0)}
          label="今日已签到学员"
          color="success"
        />
        <Stat num={todayInterceptions.length} label="今日课前拦截" color="danger" />
        <Stat num={openIncidents.length} label="未闭环事件" color="warning" />
        <Stat num={injuries.length} label="伤情/代偿记录" color="danger" />
      </div>

      <div className="grid grid-2">
        <Card title="今日课次">
          {mySessions.length === 0 && <Empty text="今天没有课次" icon="🗓️" />}
          {mySessions.map((s) => {
            const cls = store.classes.find((c) => c.id === s.classId);
            const signed = s.records.filter((r) => r.checklist.signed && !r.leave && !r.intercepted).length;
            const intercepted = s.records.filter((r) => r.intercepted).length;
            const incCount = store.incidents.filter((i) => i.sessionId === s.id && i.status !== 'closed').length;
            return (
              <div className="report-card" key={s.id}>
                <div className="flex-between wrap">
                  <div>
                    <div className="strong">
                      {s.time} · {cls?.name}
                      <Badge color={STATUS_COLOR[s.status]}> {SESSION_STATUS_LABELS[s.status]}</Badge>
                    </div>
                    <div className="muted small mt8">
                      签到 {signed}/{s.records.length} 人 · 教练 {store.users.find((u) => u.id === s.coachId)?.name}
                      {intercepted > 0 && <span className="text-danger"> · 拦截 {intercepted} 人</span>}
                      {incCount > 0 && <span className="text-danger"> · {incCount} 个未闭环事件</span>}
                    </div>
                  </div>
                  <Link className="btn btn-sm btn-outline" to={`/sessions/${s.id}`}>
                    进入课次
                  </Link>
                </div>
              </div>
            );
          })}
        </Card>

        <Card title="待处理事件">
          {openIncidents.length === 0 && <Empty text="暂无待处理事件" icon="✅" />}
          {openIncidents.slice(0, 5).map((i) => {
            const st = store.students.find((x) => x.id === i.studentId);
            return (
              <div className="flex-between mb8" key={i.id}>
                <div>
                  <Badge color={i.type === 'injury' ? 'danger' : i.type === 'levelupRequest' ? 'primary' : 'warning'}>
                    {INCIDENT_LABELS[i.type]}
                  </Badge>{' '}
                  <span className="strong">{st?.name}</span>
                  {i.item && <span className="muted small">（{MOVEMENT_LABELS[i.item]}）</span>}
                  <div className="muted small">{i.createdAt}</div>
                </div>
                <Link to="/incidents" className="btn btn-sm btn-ghost">
                  处理
                </Link>
              </div>
            );
          })}
          {user.role === 'manager' && (
            <div className="mt12">
              <Link to="/review" className="btn btn-sm btn-outline">
                🔍 前往伤情复盘
              </Link>
            </div>
          )}
        </Card>
      </div>

      {user.role === 'manager' && (
        <Card title="待办：家长确认与伤情回访">
          {waitingParent.length === 0 && store.injuryRecords.filter((r) => r.status === 'waitingParent' || r.status === 'confirmed').length === 0 && (
            <Empty text="暂无待办" icon="📞" />
          )}
          {waitingParent.map((i) => {
            const st = store.students.find((x) => x.id === i.studentId);
            return (
              <div className="mb8" key={i.id}>
                <Badge color="info">事件</Badge> <span className="strong">{st?.name}</span> · {INCIDENT_LABELS[i.type]}
                <span className="muted small">（{i.createdAt}，待家长确认）</span>
              </div>
            );
          })}
          {store.injuryRecords
            .filter((r) => r.status === 'waitingParent' || r.status === 'confirmed')
            .map((r) => {
              const st = store.students.find((x) => x.id === r.studentId);
              return (
                <div className="mb8" key={r.id}>
                  <Badge color={r.grade === 'major' ? 'danger' : 'warning'}>{r.grade === 'major' ? '较重伤' : '轻微伤'}</Badge>{' '}
                  <span className="strong">{st?.name}</span> · {r.bodyPart}
                  <span className="muted small">
                    （{r.date}，{r.status === 'waitingParent' ? '伤情记录待家长确认' : '家长已确认，待店长回访'}）
                  </span>
                </div>
              );
            })}
          <div className="mt12">
            <Link to="/review" className="btn btn-sm btn-outline">
              🔍 前往伤情复盘与回访
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
