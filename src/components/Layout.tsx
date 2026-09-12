import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import { Role } from '../types';

const ROLE_NAMES: Record<Role, string> = {
  coach: '教练',
  frontdesk: '前台',
  manager: '店长',
  parent: '家长',
};

interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/', icon: '📊', label: '工作台', roles: ['coach', 'frontdesk', 'manager'] },
  { to: '/students', icon: '🧒', label: '学员档案', roles: ['coach', 'frontdesk', 'manager'] },
  { to: '/students/new', icon: '📝', label: '建档测评', roles: ['coach'] },
  { to: '/sessions', icon: '🏃', label: '课次管理', roles: ['coach', 'frontdesk', 'manager'] },
  { to: '/incidents', icon: '🩹', label: '事件中心', roles: ['coach', 'frontdesk', 'manager'] },
  { to: '/review', icon: '🔍', label: '伤情复盘', roles: ['manager'] },
  { to: '/parent', icon: '👨‍👩‍👧', label: '我的孩子', roles: ['parent'] },
];

export default function Layout(props: { children: ReactNode }) {
  const user = useCurrentUser();
  const logout = useStore((s) => s.logout);
  const resetDemo = useStore((s) => s.resetDemo);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">⚡</span>
          <div>
            跃动童年
            <small>少儿体适能 · 课程与安全</small>
          </div>
        </div>
        <nav className="nav">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/' || n.to === '/students'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-box">
          <div className="name">{user.title}</div>
          <div className="role">角色：{ROLE_NAMES[user.role]}</div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            退出登录
          </button>
          <button
            className="btn btn-sm btn-ghost"
            title="清空本地数据并恢复演示数据"
            onClick={() => {
              if (window.confirm('确定重置为初始演示数据？当前修改将丢失。')) {
                resetDemo();
                navigate('/login');
              }
            }}
          >
            重置演示
          </button>
        </div>
      </aside>
      <main className="main">{props.children}</main>
    </div>
  );
}
