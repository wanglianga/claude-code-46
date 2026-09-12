import { useState } from 'react';
import IncidentCard from '../components/IncidentCard';
import { Card, Empty } from '../components/ui';
import { useCurrentUser, useStore } from '../store/useStore';
import { INCIDENT_LABELS, INCIDENT_STATUS_LABELS, IncidentStatus, IncidentType } from '../types';

export default function Incidents() {
  const store = useStore();
  const user = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | IncidentType>('all');

  if (!user) return null;

  const list = store.incidents.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <h1 className="page-title">事件中心</h1>
      <div className="page-sub">教练、前台、店长、家长围绕同一节课的事件协同处理，全程留痕</div>

      <Card>
        <div className="flex wrap">
          <div className="pill-tabs">
            <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
              全部（{store.incidents.length}）
            </button>
            {(Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatus[]).map((s) => (
              <button key={s} className={statusFilter === s ? 'active' : ''} onClick={() => setStatusFilter(s)}>
                {INCIDENT_STATUS_LABELS[s]}（{store.incidents.filter((i) => i.status === s).length}）
              </button>
            ))}
          </div>
          <div className="pill-tabs">
            <button className={typeFilter === 'all' ? 'active' : ''} onClick={() => setTypeFilter('all')}>
              全部类型
            </button>
            {(Object.keys(INCIDENT_LABELS) as IncidentType[]).map((t) => (
              <button key={t} className={typeFilter === t ? 'active' : ''} onClick={() => setTypeFilter(t)}>
                {INCIDENT_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {list.length === 0 && <Empty text="没有匹配的事件" icon="✅" />}
      {list.map((i) => (
        <IncidentCard key={i.id} incident={i} showSession />
      ))}
    </div>
  );
}
