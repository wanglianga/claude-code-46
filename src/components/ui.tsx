import { ReactNode } from 'react';

export function Card(props: { title?: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="card">
      {props.title && (
        <div className="flex-between mb12">
          <h3 className="card-title" style={{ margin: 0 }}>
            <span className="dot" />
            {props.title}
          </h3>
          {props.extra}
        </div>
      )}
      {props.children}
    </div>
  );
}

export function Badge(props: { color?: string; children: ReactNode }) {
  return <span className={`badge b-${props.color ?? 'gray'}`}>{props.children}</span>;
}

export function Stat(props: { num: ReactNode; label: string; color?: string }) {
  return (
    <div className="stat">
      <div className={`num ${props.color ? `c-${props.color}` : ''}`}>{props.num}</div>
      <div className="label">{props.label}</div>
    </div>
  );
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="modal-mask" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{props.title}</h3>
        {props.children}
        {props.footer && <div className="modal-actions">{props.footer}</div>}
      </div>
    </div>
  );
}

export function Empty(props: { text: string; icon?: string }) {
  return (
    <div className="empty">
      <div className="icon">{props.icon ?? '📭'}</div>
      {props.text}
    </div>
  );
}

export function Avatar(props: { name: string; color?: string }) {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  let hash = 0;
  for (const ch of props.name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const bg = props.color ?? colors[hash % colors.length];
  return (
    <span className="avatar" style={{ background: bg }}>
      {props.name.slice(0, 1)}
    </span>
  );
}

export function Tabs(props: { tabs: { key: string; label: ReactNode }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="tabs">
      {props.tabs.map((t) => (
        <button
          key={t.key}
          className={`tab ${props.active === t.key ? 'active' : ''}`}
          onClick={() => props.onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
