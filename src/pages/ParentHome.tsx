import { useState } from 'react';
import IncidentCard from '../components/IncidentCard';
import AbilityRadar from '../components/Radar';
import { Avatar, Badge, Card, Empty, Stat } from '../components/ui';
import { latestAssessment, useCurrentUser, useStore } from '../store/useStore';
import {
  DIMENSION_LABELS,
  MOVEMENT_LABELS,
  MovementItem,
  RATING_LABELS,
  SYMPTOM_LABELS,
  TIMELINE_KIND_LABELS,
} from '../types';
import { ageOf, HOME_EXERCISES, recommendClass, riskHints, weekLoad } from '../utils/recommend';

export default function ParentHome() {
  const user = useCurrentUser();
  const store = useStore();
  const childIds = user?.childIds ?? [];
  const [activeChild, setActiveChild] = useState(childIds[0] ?? '');

  if (!user || childIds.length === 0) return <Empty text="当前账号未关联孩子" icon="👪" />;

  const student = store.students.find((s) => s.id === activeChild) ?? store.students.find((s) => s.id === childIds[0]);
  if (!student) return <Empty text="未找到孩子档案" icon="👪" />;

  const cls = store.classes.find((c) => c.id === student.classId);
  const assessments = store.assessments
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = latestAssessment(store.assessments, student.id);
  const previous = assessments[1];
  const rec = latest
    ? recommendClass(latest.scores, ageOf(student.birthDate), store.classes, {
        pastInjuries: student.pastInjuries,
        parentExpectation: student.parentExpectation,
      })
    : null;
  const load = weekLoad(student.id, store.sessions);
  const interceptions = store.interceptions
    .filter((i) => i.studentId === student.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const reports = store.sessions
    .filter((se) => se.status === 'done' && se.records.some((r) => r.studentId === student.id && r.checklist.signed && !r.leave && !r.intercepted))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const incidents = store.incidents.filter((i) => i.studentId === student.id);
  const openIncidents = incidents.filter((i) => i.status !== 'closed');
  const timeline = store.timeline
    .filter((t) => t.studentId === student.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 12);

  const remain = student.pkg.total - student.pkg.used;
  const injuryIncidents = incidents.filter((i) => i.type === 'injury' || i.type === 'compensation');
  const risks = riskHints(
    student.pastInjuries,
    injuryIncidents.map((i) => `${i.createdAt.slice(0, 10)} 课堂${i.type === 'injury' ? '擦伤' : '动作代偿'}（${i.item ? MOVEMENT_LABELS[i.item] : '综合'}），已按「${i.designAction ?? '保持'}」处置`),
  );
  const weakItems = reports
    .flatMap((se) => se.records.find((r) => r.studentId === student.id)?.performance ? Object.entries(se.records.find((r) => r.studentId === student.id)!.performance) : [])
    .filter(([, v]) => v === 'attention')
    .map(([k]) => k as MovementItem);
  const uniqueWeak = [...new Set(weakItems)].slice(0, 3);

  return (
    <div>
      <div className="flex-between wrap">
        <div>
          <h1 className="page-title">我的孩子</h1>
          <div className="page-sub">课后报告、伤情通报、成长曲线与续课建议，都在这里</div>
        </div>
        {childIds.length > 1 && (
          <div className="pill-tabs">
            {childIds.map((cid) => {
              const c = store.students.find((s) => s.id === cid);
              return (
                <button key={cid} className={student.id === cid ? 'active' : ''} onClick={() => setActiveChild(cid)}>
                  {c?.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 概要 */}
      <div className="card">
        <div className="flex-between wrap">
          <div className="flex">
            <Avatar name={student.name} />
            <div>
              <div className="flex">
                <span className="strong" style={{ fontSize: 17 }}>{student.name}</span>
                <Badge color="gray">{student.gender} · {ageOf(student.birthDate)} 岁</Badge>
                {cls && <Badge color="primary">{cls.name}</Badge>}
              </div>
              <div className="muted small mt8">
                {cls?.schedule} · 教练 {store.users.find((u) => u.id === cls?.coachId)?.name}
              </div>
            </div>
          </div>
          <div className="flex">
            <Stat num={remain} label="剩余课时" color={remain <= 4 ? 'danger' : 'primary'} />
            <Stat num={reports.length} label="课后报告" color="success" />
            <Stat num={incidents.length} label="事件记录" color="warning" />
          </div>
        </div>
        <div className="progress mt12">
          <div style={{ width: `${(student.pkg.used / student.pkg.total) * 100}%` }} />
        </div>
        <div className="flex-between wrap mt8">
          <span className="muted small">课包 {student.pkg.name}：已上 {student.pkg.used} / {student.pkg.total} 课时</span>
          <span className={`small ${load.intercepted > 0 ? 'text-danger' : 'muted'}`}>
            本周训练负荷 {load.attended}/{load.planned} 节（{load.percent}%）
            {load.intercepted > 0 && ` · 因课前拦截减少 ${load.intercepted} 节`}
          </span>
        </div>
      </div>

      {/* 课时处理结果（课前拦截） */}
      {interceptions.length > 0 && (
        <Card title={`课时处理结果（${interceptions.length}）`}>
          {interceptions.map((i) => (
            <div className={`report-card ${!i.parentAcked ? 'unacked' : ''}`} key={i.id}>
              <div className="flex-between wrap">
                <div className="flex wrap">
                  <Badge color="danger">课前拦截</Badge>
                  <span className="strong">{i.symptoms.map((x) => SYMPTOM_LABELS[x]).join('、')}</span>
                  <span className="muted small">{i.createdAt} · {i.createdBy} 登记</span>
                </div>
                {i.parentAcked ? (
                  <Badge color="success">已知晓</Badge>
                ) : (
                  <button className="btn btn-sm btn-success" onClick={() => store.ackInterception(i.id)}>
                    ✔ 确认知晓
                  </button>
                )}
              </div>
              <div className="muted mt8">{i.note}</div>
              <div className="mt8">
                课时处理：
                <Badge color={i.decision === 'refund' ? 'success' : 'warning'}>
                  {i.decision === 'refund' ? '已返还，不扣课时' : '不返还，正常消耗 1 课时'}
                </Badge>
                <span className="muted small">（{i.decisionReason}）</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* 待确认事件 */}
      {openIncidents.length > 0 && (
        <Card title={`⚠️ 待您确认的事件（${openIncidents.length}）`}>
          {openIncidents.map((i) => (
            <IncidentCard key={i.id} incident={i} />
          ))}
        </Card>
      )}

      <div className="grid grid-2">
        {/* 能力雷达 */}
        <Card title="六维能力成长" extra={latest && <span className="muted small">最近测评 {latest.date}</span>}>
          {latest ? (
            <>
              <AbilityRadar current={latest.scores} previous={previous?.scores} />
              <div className="kv">
                {Object.entries(latest.scores).map(([k, v]) => (
                  <div key={k}>
                    <div className="k">{DIMENSION_LABELS[k as keyof typeof DIMENSION_LABELS]}</div>
                    <div className="v">
                      {v} 分
                      {previous && v > previous.scores[k as keyof typeof previous.scores] && <span className="text-success small"> ↑</span>}
                      {previous && v < previous.scores[k as keyof typeof previous.scores] && <span className="text-danger small"> ↓</span>}
                    </div>
                  </div>
                ))}
              </div>
              {rec && (
                <div className="alert a-info mt12" style={{ marginBottom: 0 }}>
                  当前水平匹配「{rec.className}」。{rec.reasons[0]}
                </div>
              )}
            </>
          ) : (
            <Empty text="尚未测评" icon="📊" />
          )}
        </Card>

        {/* 续课参考：训练风险与成长建议 */}
        <Card title="训练风险与成长建议（续课参考）">
          <div className="alert a-warning">
            <div className="strong mb8">⚠️ 需要您知悉的训练风险</div>
            {risks.map((r, i) => (
              <div key={i}>· {r}</div>
            ))}
          </div>
          <div className="alert a-success" style={{ marginBottom: 0 }}>
            <div className="strong mb8">🌱 成长建议</div>
            {rec && rec.weak.length > 0 && (
              <div>· 薄弱维度：{rec.weak.map((d) => DIMENSION_LABELS[d]).join('、')}，后续课程将重点强化</div>
            )}
            {uniqueWeak.length > 0 && (
              <div>· 课堂需关注项目：{uniqueWeak.map((m) => MOVEMENT_LABELS[m]).join('、')}</div>
            )}
            {uniqueWeak.slice(0, 2).map((m) => (
              <div key={m}>· 家庭练习：{HOME_EXERCISES[m]}</div>
            ))}
            {rec && rec.weak.length === 0 && uniqueWeak.length === 0 && <div>· 各项发展均衡，保持每周 2 次训练频率即可</div>}
            <div>· 课包剩余 {remain} 课时{remain <= 4 ? '，建议及时续课保持训练连续性' : '，可按当前节奏继续'}</div>
          </div>
        </Card>
      </div>

      {/* 课后报告 */}
      <Card title={`课后报告（${reports.length}）`}>
        {reports.length === 0 && <Empty text="暂无课后报告" icon="📝" />}
        {reports.map((se) => {
          const r = se.records.find((x) => x.studentId === student.id)!;
          const seCls = store.classes.find((c) => c.id === se.classId);
          return (
            <div className={`report-card ${!r.reportAcked ? 'unacked' : ''}`} key={se.id}>
              <div className="flex-between wrap">
                <div className="strong">{se.date} {se.time} · {seCls?.name}</div>
                {r.reportAcked ? (
                  <Badge color="success">已确认</Badge>
                ) : (
                  <button className="btn btn-sm btn-success" onClick={() => store.ackReport(se.id, student.id)}>
                    ✔ 确认已读
                  </button>
                )}
              </div>
              <div className="tag-list mt8 mb8">
                {Object.entries(r.performance).map(([k, v]) => (
                  <Badge key={k} color={v === 'excellent' ? 'success' : v === 'good' ? 'info' : 'danger'}>
                    {MOVEMENT_LABELS[k as MovementItem]} · {RATING_LABELS[v!]}
                  </Badge>
                ))}
              </div>
              {r.performanceNote && <div className="mb8"><span className="strong">课堂表现：</span>{r.performanceNote}</div>}
              {r.caution && <div className="mb8"><span className="strong">注意事项：</span>{r.caution}</div>}
              {r.homeExercise && <div className="mb8"><span className="strong">家庭练习：</span>{r.homeExercise}</div>}
              <div>
                <span className="strong">升阶建议：</span>
                <Badge color={r.levelUpAdvice === '适合升阶' ? 'success' : r.levelUpAdvice === '暂缓' ? 'danger' : 'gray'}>
                  {r.levelUpAdvice}
                </Badge>
              </div>
            </div>
          );
        })}
      </Card>

      {/* 成长时间线 */}
      <Card title="连续成长记录">
        {timeline.length === 0 && <Empty text="暂无记录" icon="🕘" />}
        <div className="timeline">
          {timeline.map((t) => (
            <div className="tl-item" key={t.id}>
              <span className={`tl-dot k-${t.kind}`} />
              <div className="tl-head">
                <Badge color={t.kind === 'incident' ? 'danger' : t.kind === 'session' ? 'success' : t.kind === 'package' ? 'warning' : 'gray'}>
                  {TIMELINE_KIND_LABELS[t.kind]}
                </Badge>
                <span className="tl-title">{t.title}</span>
                <span className="tl-date">{t.date}</span>
              </div>
              <div className="tl-detail">{t.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
