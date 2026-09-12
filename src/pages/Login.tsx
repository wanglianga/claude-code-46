import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const QUICK = [
  { username: 'coach', label: '教练 · 王浩', desc: '建档测评 / 课中记录 / 课后报告' },
  { username: 'front', label: '前台 · 李婷', desc: '课前核验 / 请假补课 / 联系家长' },
  { username: 'manager', label: '店长 · 张敏', desc: '伤情复盘 / 训练设计调整 / 升阶审批' },
  { username: 'parent', label: '家长 · 陈晨妈妈', desc: '课后报告 / 成长记录 / 风险建议' },
];

export default function Login() {
  const [username, setUsername] = useState('coach');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (login(username.trim(), password)) {
      const role = useStore.getState().users.find((u) => u.username === username.trim())?.role;
      navigate(role === 'parent' ? '/parent' : '/');
    } else {
      setError('账号或密码不正确');
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>⚡ 跃动童年 · 少儿体适能</h1>
        <div className="sub">课程分组 · 课前核验 · 课中记录 · 伤情闭环 · 成长档案</div>
        <form onSubmit={submit}>
          <div className="field mb12">
            <label>账号</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入账号" />
          </div>
          <div className="field mb12">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
          </div>
          {error && <div className="alert a-danger">{error}</div>}
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} type="submit">
            登 录
          </button>
        </form>
        <div className="quick-roles">
          {QUICK.map((q) => (
            <button
              key={q.username}
              className="quick-role"
              onClick={() => {
                setUsername(q.username);
                setPassword('123456');
                setError('');
              }}
            >
              <b>{q.label}</b>
              <span>{q.desc}</span>
            </button>
          ))}
        </div>
        <div className="muted small mt12" style={{ textAlign: 'center' }}>
          演示账号密码均为 123456（家长：parent / parent2 … parent8）
        </div>
      </div>
    </div>
  );
}
