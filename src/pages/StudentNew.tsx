import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoreSliders from '../components/ScoreSliders';
import { Badge, Card } from '../components/ui';
import { emptyScores, useStore } from '../store/useStore';
import { Scores } from '../types';
import { ageOf, recommendClass } from '../utils/recommend';

export default function StudentNew() {
  const store = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    gender: '男' as '男' | '女',
    birthDate: '2021-01-01',
    height: 110,
    weight: 18,
    sportsHistory: '',
    allergies: '',
    pastInjuries: '',
    parentExpectation: '',
    parentName: '',
    pkgName: '48 课时成长包',
    pkgTotal: 48,
  });
  const [scores, setScores] = useState<Scores>(emptyScores());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const age = useMemo(() => ageOf(form.birthDate), [form.birthDate]);
  const rec = useMemo(() => recommendClass(scores, age, store.classes), [scores, age, store.classes]);
  const [classId, setClassId] = useState<string>('');

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return setError('请填写孩子姓名');
    if (!form.parentName.trim()) return setError('请填写家长姓名');
    if (!form.parentExpectation.trim()) return setError('请填写家长期望');
    const id = store.addStudent(
      {
        name: form.name.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        height: Number(form.height),
        weight: Number(form.weight),
        sportsHistory: form.sportsHistory.trim(),
        allergies: form.allergies ? form.allergies.split(/[,，、]/).map((x) => x.trim()).filter(Boolean) : [],
        pastInjuries: form.pastInjuries ? form.pastInjuries.split(/[,，、;；]/).map((x) => x.trim()).filter(Boolean) : [],
        parentExpectation: form.parentExpectation.trim(),
        parentName: form.parentName.trim(),
        pkgName: form.pkgName,
        pkgTotal: Number(form.pkgTotal),
      },
      scores,
      note || `首次测评：均分 ${rec.avg} 分`,
    );
    const targetClass = classId || rec.classId;
    if (targetClass) {
      store.assignClass(id, targetClass, `系统推荐：${rec.reasons.join('；')}`);
    }
    navigate(`/students/${id}`);
  };

  return (
    <div>
      <h1 className="page-title">建档测评</h1>
      <div className="page-sub">录入基础档案与六项体测，系统即时推荐班级；保存后自动生成家长账号与成长档案</div>

      {error && <div className="alert a-danger">{error}</div>}

      <div className="grid grid-2">
        <div>
          <Card title="基础档案">
            <div className="form-row">
              <div className="field">
                <label>孩子姓名 *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="如：陈晨" />
              </div>
              <div className="field" style={{ maxWidth: 100 }}>
                <label>性别</label>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option>男</option>
                  <option>女</option>
                </select>
              </div>
              <div className="field">
                <label>出生日期（{age} 岁）</label>
                <input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>身高（cm）</label>
                <input type="number" value={form.height} onChange={(e) => set('height', e.target.value)} />
              </div>
              <div className="field">
                <label>体重（kg）</label>
                <input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>运动史</label>
                <input value={form.sportsHistory} onChange={(e) => set('sportsHistory', e.target.value)} placeholder="如：游泳 1 年 / 无" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>过敏（顿号/逗号分隔）</label>
                <input value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="如：花粉、海鲜" />
              </div>
              <div className="field">
                <label>既往伤病</label>
                <input value={form.pastInjuries} onChange={(e) => set('pastInjuries', e.target.value)} placeholder="如：右手腕扭伤（已痊愈）" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>家长期望 *</label>
                <textarea value={form.parentExpectation} onChange={(e) => set('parentExpectation', e.target.value)} placeholder="如：提升专注力，为上小学做准备" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>家长姓名 *</label>
                <input value={form.parentName} onChange={(e) => set('parentName', e.target.value)} placeholder="如：陈静（妈妈）" />
              </div>
              <div className="field">
                <label>课包</label>
                <select value={form.pkgName} onChange={(e) => set('pkgName', e.target.value)}>
                  <option>24 课时体验包</option>
                  <option>48 课时成长包</option>
                  <option>96 课时学年包</option>
                </select>
              </div>
              <div className="field" style={{ maxWidth: 110 }}>
                <label>总课时</label>
                <input type="number" value={form.pkgTotal} onChange={(e) => set('pkgTotal', e.target.value)} />
              </div>
            </div>
          </Card>

          <Card title="六项体测（1-5 分）">
            <ScoreSliders value={scores} onChange={setScores} />
            <div className="field mt12">
              <label>测评备注</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="如：注意力持续约 5 分钟，平衡木需牵手…" />
            </div>
          </Card>
        </div>

        <div>
          <Card title="系统推荐班级">
            <div style={{ textAlign: 'center', padding: '6px 0 12px' }}>
              <div className="muted small">六项均分</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)' }}>{rec.avg}</div>
              <Badge color="primary">{rec.level}班 · {rec.className}</Badge>
            </div>
            <div className="alert a-info">
              {rec.reasons.map((r, i) => (
                <div key={i}>· {r}</div>
              ))}
            </div>
            <div className="field mt12">
              <label>确认班级（可手动调整）</label>
              <select value={classId || rec.classId || ''} onChange={(e) => setClassId(e.target.value)}>
                {store.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}（{c.level} · {c.ageRange} · {c.schedule}）
                  </option>
                ))}
              </select>
            </div>
            <div className="muted small">
              推荐逻辑：均分 &lt; 2.5 → 启蒙班；2.5~3.6 → 基础班；&gt; 3.6 → 进阶班；并结合年龄上下限调整。
            </div>
          </Card>

          <Card title="班级容量">
            {store.classes.map((c) => {
              const count = store.students.filter((s) => s.classId === c.id).length;
              return (
                <div key={c.id} className="mb12">
                  <div className="flex-between">
                    <span className="strong">{c.name}</span>
                    <span className="muted small">
                      {count}/{c.capacity} 人
                    </span>
                  </div>
                  <div className="progress mt8">
                    <div style={{ width: `${Math.min(100, (count / c.capacity) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>

          <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={submit}>
            ✔ 保存档案并分班
          </button>
        </div>
      </div>
    </div>
  );
}
