import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Badge, Card, Empty } from '../components/ui';
import { latestAssessment, useCurrentUser, useStore } from '../store/useStore';
import { DIMENSION_LABELS, DIMENSIONS } from '../types';
import { ageOf, avgScore } from '../utils/recommend';

export default function Students() {
  const store = useStore();
  const user = useCurrentUser();
  const [kw, setKw] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const list = useMemo(() => {
    return store.students.filter((s) => {
      if (classFilter !== 'all' && s.classId !== classFilter) return false;
      if (kw && !s.name.includes(kw)) return false;
      return true;
    });
  }, [store.students, kw, classFilter]);

  return (
    <div>
      <div className="flex-between">
        <div>
          <h1 className="page-title">学员档案</h1>
          <div className="page-sub">体测、课次表现、伤情、请假补课、课包消耗都汇入同一份成长档案</div>
        </div>
        {user?.role === 'coach' && (
          <Link to="/students/new" className="btn">
            ＋ 建档测评
          </Link>
        )}
      </div>

      <Card>
        <div className="flex wrap mb12">
          <input
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, width: 200 }}
            placeholder="搜索学员姓名…"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
          <div className="pill-tabs">
            <button className={classFilter === 'all' ? 'active' : ''} onClick={() => setClassFilter('all')}>
              全部
            </button>
            {store.classes.map((c) => (
              <button key={c.id} className={classFilter === c.id ? 'active' : ''} onClick={() => setClassFilter(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 && <Empty text="没有匹配的学员" icon="🧒" />}
        {list.length > 0 && (
          <table className="tbl">
            <thead>
              <tr>
                <th>学员</th>
                <th>年龄</th>
                <th>班级</th>
                <th>最新体测均分</th>
                <th>薄弱项</th>
                <th>课包剩余</th>
                <th>未闭环事件</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const cls = store.classes.find((c) => c.id === s.classId);
                const a = latestAssessment(store.assessments, s.id);
                const open = store.incidents.filter((i) => i.studentId === s.id && i.status !== 'closed').length;
                const remain = s.pkg.total - s.pkg.used;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex">
                        <Avatar name={s.name} />
                        <div>
                          <div className="strong">{s.name}</div>
                          <div className="muted small">{s.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">{ageOf(s.birthDate)} 岁</td>
                    <td>{cls ? <Badge color="primary">{cls.name}</Badge> : <Badge color="warning">待分班</Badge>}</td>
                    <td className="num">{a ? avgScore(a.scores) : '-'}</td>
                    <td className="muted small">
                      {a
                        ? DIMENSIONS.filter((d) => a.scores[d] <= 2)
                            .map((d) => DIMENSION_LABELS[d])
                            .join('、') || '无'
                        : '-'}
                    </td>
                    <td>
                      <span className={`num strong ${remain <= 4 ? 'text-danger' : ''}`}>{remain}</span>
                      <span className="muted small">/{s.pkg.total}</span>
                    </td>
                    <td>{open > 0 ? <Badge color="danger">{open} 件</Badge> : <span className="muted">无</span>}</td>
                    <td>
                      <Link to={`/students/${s.id}`} className="btn btn-sm btn-outline">
                        档案
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
