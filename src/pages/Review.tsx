import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import InjuryCard from '../components/InjuryCard';
import { Badge, Card, Empty, Stat } from '../components/ui';
import { useStore } from '../store/useStore';
import {
  DesignAction,
  INCIDENT_LABELS,
  INCIDENT_STATUS_LABELS,
  MOVEMENT_ITEMS,
  MOVEMENT_LABELS,
  MovementItem,
} from '../types';

const BAR_COLORS: Record<MovementItem, string> = {
  warmup: '#0ea5e9',
  jump: '#f59e0b',
  crawl: '#10b981',
  throw: '#8b5cf6',
  balanceBeam: '#ef4444',
  teamGame: '#64748b',
};

export default function Review() {
  const store = useStore();
  const [classFilter, setClassFilter] = useState('all');
  const [coachFilter, setCoachFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState<'all' | MovementItem>('all');

  // 决策表单
  const [decClass, setDecClass] = useState(store.classes[0]?.id ?? '');
  const [decItem, setDecItem] = useState<MovementItem>('balanceBeam');
  const [decAction, setDecAction] = useState<DesignAction>('降级');
  const [decReason, setDecReason] = useState('');

  // 仅统计与伤情/动作安全相关的事件
  const safetyIncidents = useMemo(
    () => store.incidents.filter((i) => i.type === 'injury' || i.type === 'compensation' || i.type === 'fear'),
    [store.incidents],
  );

  const filtered = useMemo(() => {
    return safetyIncidents.filter((i) => {
      const session = store.sessions.find((s) => s.id === i.sessionId);
      if (!session) return false;
      if (classFilter !== 'all' && session.classId !== classFilter) return false;
      if (coachFilter !== 'all' && session.coachId !== coachFilter) return false;
      if (itemFilter !== 'all' && i.item !== itemFilter) return false;
      return true;
    });
  }, [safetyIncidents, classFilter, coachFilter, itemFilter, store.sessions]);

  const byItem = useMemo(() => {
    return MOVEMENT_ITEMS.map((m) => ({
      item: MOVEMENT_LABELS[m],
      key: m,
      count: filtered.filter((i) => i.item === m).length,
    }));
  }, [filtered]);

  const coaches = store.users.filter((u) => u.role === 'coach');
  const openCount = filtered.filter((i) => i.status !== 'closed').length;
  const highCount = filtered.filter((i) => i.severity === '高' || i.severity === '中').length;

  // 伤情回访：较重伤待回访 / 待家长确认 / 回访中
  const majorInjuries = store.injuryRecords.filter((r) => r.grade === 'major');
  const pendingVisit = majorInjuries.filter((r) => r.status === 'confirmed');
  const waitingParentConfirm = store.injuryRecords.filter((r) => r.status === 'waitingParent');
  const inFollowup = majorInjuries.filter((r) => r.status === 'followup');

  return (
    <div>
      <h1 className="page-title">伤情复盘</h1>
      <div className="page-sub">按班级、教练、动作项目复盘伤情与代偿，决定训练设计是否降级、换器械或增加助教</div>

      {/* 筛选 */}
      <Card>
        <div className="flex wrap">
          <div className="field" style={{ minWidth: 160 }}>
            <label>班级</label>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">全部班级</option>
              {store.classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>教练</label>
            <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)}>
              <option value="all">全部教练</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>动作项目</label>
            <select value={itemFilter} onChange={(e) => setItemFilter(e.target.value as MovementItem | 'all')}>
              <option value="all">全部项目</option>
              {MOVEMENT_ITEMS.map((m) => (
                <option key={m} value={m}>{MOVEMENT_LABELS[m]}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid mb16" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <Stat num={filtered.length} label="伤情/代偿/恐惧事件" color="primary" />
        <Stat num={highCount} label="中高风险" color="danger" />
        <Stat num={openCount} label="未闭环" color="warning" />
        <Stat num={pendingVisit.length} label="较重伤待回访" color="danger" />
        <Stat num={store.designDecisions.length} label="训练设计调整" color="success" />
      </div>

      {/* 伤情回访（较重伤） */}
      {(pendingVisit.length > 0 || waitingParentConfirm.length > 0 || inFollowup.length > 0) && (
        <Card title="伤情回访（较重伤）">
          {waitingParentConfirm.length > 0 && (
            <div className="alert a-warning">
              {waitingParentConfirm.length} 条伤情记录待家长确认（确认后才进入训练计划）：
              {waitingParentConfirm.map((r) => store.students.find((x) => x.id === r.studentId)?.name).join('、')}
            </div>
          )}
          {pendingVisit.length > 0 && (
            <div className="alert a-danger">
              {pendingVisit.length} 条较重伤已由家长确认，请店长尽快回访并给出复课安排。
            </div>
          )}
          {[...pendingVisit, ...inFollowup, ...waitingParentConfirm.filter((r) => r.grade === 'major')].map((r) => (
            <InjuryCard key={r.id} record={r} />
          ))}
        </Card>
      )}

      <div className="grid grid-2">
        <Card title="各动作项目事件分布">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byItem} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="item" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="事件数" radius={[6, 6, 0, 0]}>
                {byItem.map((d) => (
                  <Cell key={d.key} fill={BAR_COLORS[d.key as MovementItem]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="新增训练设计调整">
          <div className="form-row">
            <div className="field">
              <label>班级</label>
              <select value={decClass} onChange={(e) => setDecClass(e.target.value)}>
                {store.classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>动作项目</label>
              <select value={decItem} onChange={(e) => setDecItem(e.target.value as MovementItem)}>
                {MOVEMENT_ITEMS.map((m) => (
                  <option key={m} value={m}>{MOVEMENT_LABELS[m]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>调整方式</label>
              <select value={decAction} onChange={(e) => setDecAction(e.target.value as DesignAction)}>
                <option>保持</option>
                <option>降级</option>
                <option>换器械</option>
                <option>增加助教</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>调整理由（依据上方复盘数据）</label>
            <textarea
              value={decReason}
              onChange={(e) => setDecReason(e.target.value)}
              placeholder="如：启蒙班近两周 2 起平衡木恐惧事件，统一改为 10cm 低木起步…"
            />
          </div>
          <button
            className="btn mt8"
            disabled={!decReason.trim()}
            onClick={() => {
              store.addDesignDecision(decClass, decItem, decAction, decReason.trim());
              setDecReason('');
            }}
          >
            ✔ 保存调整结论
          </button>
        </Card>
      </div>

      <Card title="伤情明细">
        {filtered.length === 0 && <Empty text="当前筛选下没有伤情记录" icon="✅" />}
        {filtered.length > 0 && (
          <table className="tbl">
            <thead>
              <tr>
                <th>时间</th>
                <th>学员</th>
                <th>班级</th>
                <th>教练</th>
                <th>类型</th>
                <th>动作项目</th>
                <th>严重度</th>
                <th>状态</th>
                <th>设计处置</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const session = store.sessions.find((s) => s.id === i.sessionId);
                const cls = session ? store.classes.find((c) => c.id === session.classId) : undefined;
                const coach = session ? store.users.find((u) => u.id === session.coachId) : undefined;
                const st = store.students.find((x) => x.id === i.studentId);
                return (
                  <tr key={i.id}>
                    <td className="muted small">{i.createdAt}</td>
                    <td className="strong">{st?.name}</td>
                    <td>{cls?.name}</td>
                    <td>{coach?.name}</td>
                    <td>
                      <Badge color={i.type === 'injury' ? 'danger' : i.type === 'compensation' ? 'warning' : 'info'}>
                        {INCIDENT_LABELS[i.type]}
                      </Badge>
                    </td>
                    <td>{i.item ? MOVEMENT_LABELS[i.item] : '-'}</td>
                    <td>
                      <Badge color={i.severity === '高' ? 'danger' : i.severity === '中' ? 'warning' : 'gray'}>{i.severity}</Badge>
                    </td>
                    <td>{INCIDENT_STATUS_LABELS[i.status]}</td>
                    <td>{i.designAction ? <Badge color="primary">{i.designAction}</Badge> : <span className="muted">-</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="训练设计调整记录">
        {store.designDecisions.length === 0 && <Empty text="暂无调整记录" icon="🛠️" />}
        {store.designDecisions.map((d) => {
          const cls = store.classes.find((c) => c.id === d.classId);
          return (
            <div className="report-card" key={d.id}>
              <div className="flex wrap">
                <Badge color="primary">{d.action}</Badge>
                <span className="strong">{cls?.name} · {MOVEMENT_LABELS[d.item]}</span>
                <span className="muted small">{d.date} · {d.by}</span>
              </div>
              <div className="muted mt8">{d.reason}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
