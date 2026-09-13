import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import IncidentCard from '../components/IncidentCard';
import AbilityRadar from '../components/Radar';
import ScoreSliders from '../components/ScoreSliders';
import { Avatar, Badge, Card, Empty, Modal, Tabs } from '../components/ui';
import { emptyScores, latestAssessment, useCurrentUser, useStore } from '../store/useStore';
import {
  DIMENSION_LABELS,
  MOVEMENT_LABELS,
  MovementItem,
  RATING_LABELS,
  Scores,
  SYMPTOM_LABELS,
  TIMELINE_KIND_LABELS,
} from '../types';
import { ageOf, avgScore, recommendClass, today, weekLoad } from '../utils/recommend';

export default function StudentDetail() {
  const { id } = useParams();
  const store = useStore();
  const user = useCurrentUser();
  const student = store.students.find((s) => s.id === id);
  const [tab, setTab] = useState('overview');

  const [showAssess, setShowAssess] = useState(false);
  const [scores, setScores] = useState<Scores>(emptyScores());
  const [assessNote, setAssessNote] = useState('');

  const [showLeave, setShowLeave] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');
  const [showMakeup, setShowMakeup] = useState(false);
  const [makeupNote, setMakeupNote] = useState('');
  const [showComm, setShowComm] = useState(false);
  const [commNote, setCommNote] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpReason, setLevelUpReason] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const assessments = useMemo(
    () => store.assessments.filter((a) => a.studentId === id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [store.assessments, id],
  );

  if (!student || !user) return <Empty text="学员不存在" icon="❓" />;

  const cls = store.classes.find((c) => c.id === student.classId);
  const parent = store.users.find((u) => u.id === student.parentId);
  const latest = latestAssessment(store.assessments, student.id);
  const previous = assessments[1];
  const rec = latest
    ? recommendClass(latest.scores, ageOf(student.birthDate), store.classes, {
        pastInjuries: student.pastInjuries,
        parentExpectation: student.parentExpectation,
      })
    : null;
  const load = weekLoad(student.id, store.sessions);
  const interceptions = store.interceptions.filter((i) => i.studentId === student.id);
  const assignHistory = store.timeline
    .filter((t) => t.studentId === student.id && t.kind === 'assign')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const timeline = store.timeline
    .filter((t) => t.studentId === student.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const incidents = store.incidents.filter((i) => i.studentId === student.id);
  const reports = store.sessions
    .filter((se) => se.status === 'done' && se.records.some((r) => r.studentId === student.id && r.checklist.signed && !r.leave && !r.intercepted))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const remain = student.pkg.total - student.pkg.used;
  const canEdit = user.role === 'coach' || user.role === 'manager';

  return (
    <div>
      {/* 头部 */}
      <div className="card">
        <div className="flex-between wrap">
          <div className="flex">
            <Avatar name={student.name} />
            <div>
              <div className="flex">
                <h1 className="page-title" style={{ margin: 0 }}>{student.name}</h1>
                <Badge color="gray">{student.gender} · {ageOf(student.birthDate)} 岁</Badge>
                {cls ? <Badge color="primary">{cls.name}</Badge> : <Badge color="warning">待分班</Badge>}
              </div>
              <div className="muted small mt8">
                家长：{parent?.name}（{parent?.title}） · 建档于 {student.createdAt}
              </div>
            </div>
          </div>
          <div className="flex wrap">
            {canEdit && (
              <button className="btn btn-sm btn-outline" onClick={() => setShowAssess(true)}>
                ＋ 录入体测
              </button>
            )}
            {(user.role === 'frontdesk' || user.role === 'manager') && (
              <>
                <button className="btn btn-sm btn-outline" onClick={() => setShowLeave(true)}>请假登记</button>
                <button className="btn btn-sm btn-outline" onClick={() => setShowMakeup(true)}>补课登记</button>
              </>
            )}
            <button className="btn btn-sm btn-outline" onClick={() => setShowComm(true)}>家长沟通</button>
            {user.role === 'manager' && (
              <button className="btn btn-sm btn-warning" onClick={() => setShowLevelUp(true)}>升阶评估</button>
            )}
          </div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: '档案总览' },
          { key: 'timeline', label: `成长时间线（${timeline.length}）` },
          { key: 'reports', label: `课后报告（${reports.length}）` },
          { key: 'incidents', label: `伤情与事件（${incidents.length + interceptions.length}）` },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid grid-2">
          <div>
            <Card title="基础信息">
              <div className="kv">
                <div><div className="k">身高 / 体重</div><div className="v">{student.height} cm / {student.weight} kg</div></div>
                <div><div className="k">运动史</div><div className="v">{student.sportsHistory}</div></div>
                <div><div className="k">过敏</div><div className="v">{student.allergies.length ? student.allergies.join('、') : '无'}</div></div>
                <div><div className="k">既往伤病</div><div className="v">{student.pastInjuries.length ? student.pastInjuries.join('；') : '无'}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><div className="k">家长期望</div><div className="v">{student.parentExpectation}</div></div>
              </div>
            </Card>

            <Card title="课包消耗">
              <div className="flex-between">
                <span className="strong">{student.pkg.name}</span>
                <span className={`strong ${remain <= 4 ? 'text-danger' : ''}`}>剩余 {remain} / {student.pkg.total} 课时</span>
              </div>
              <div className="progress mt8">
                <div style={{ width: `${(student.pkg.used / student.pkg.total) * 100}%` }} />
              </div>
              {remain <= 4 && (
                <div className="alert a-warning mt12" style={{ marginBottom: 0 }}>
                  课包即将用完，请前台与家长沟通续费；续费沟通前请向家长展示「训练风险与成长建议」。
                </div>
              )}
            </Card>

            <Card title="本周训练负荷">
              <div className="flex-between">
                <span className="strong">{load.attended} / {load.planned} 节</span>
                <span className={`strong ${load.intercepted > 0 ? 'text-danger' : 'text-success'}`}>{load.percent}%</span>
              </div>
              <div className="progress mt8">
                <div
                  style={{
                    width: `${load.percent}%`,
                    background: load.intercepted > 0 ? 'var(--danger)' : 'var(--primary)',
                  }}
                />
              </div>
              <div className="tag-list mt12">
                {load.intercepted > 0 && <Badge color="danger">课前拦截 {load.intercepted} 节</Badge>}
                {load.leave > 0 && <Badge color="gray">请假 {load.leave} 节</Badge>}
                {load.intercepted === 0 && load.leave === 0 && <Badge color="success">出勤正常</Badge>}
              </div>
              <div className={`alert mt12 ${load.intercepted > 0 ? 'a-warning' : 'a-info'}`} style={{ marginBottom: 0 }}>
                {load.hint}
              </div>
            </Card>

            <Card
              title="班级与推荐"
              extra={
                canEdit && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setAssignClassId(student.classId ?? rec?.classId ?? '');
                      setAssignReason('');
                      setShowAssign(true);
                    }}
                  >
                    调整班级
                  </button>
                )
              }
            >
              {cls && (
                <div className="mb12">
                  当前班级：<Badge color="primary">{cls.name}</Badge>
                  <span className="muted small">（{cls.ageRange} · {cls.schedule} · 教练 {store.users.find((u) => u.id === cls.coachId)?.name}）</span>
                </div>
              )}
              {rec && (
                <>
                  <div className="muted small mb8">
                    基于最新体测（{latest?.date}）、既往伤情与家长目标的系统推荐：
                  </div>
                  <div className="tag-list mb8">
                    <Badge color="info">体测均分 {rec.avg}</Badge>
                    <Badge color={student.pastInjuries.length ? 'warning' : 'gray'}>
                      既往伤情：{student.pastInjuries.length ? student.pastInjuries.join('；') : '无'}
                    </Badge>
                    <Badge color="gray">家长目标：{student.parentExpectation.slice(0, 16)}{student.parentExpectation.length > 16 ? '…' : ''}</Badge>
                  </div>
                  <div className="alert a-info" style={{ marginBottom: 0 }}>
                    <div className="strong mb8">推荐：{rec.className}（均分 {rec.avg}）</div>
                    {rec.reasons.map((r, i) => <div key={i}>· {r}</div>)}
                  </div>
                  {canEdit && rec.classId && rec.classId !== student.classId && (
                    <button
                      className="btn btn-sm mt12"
                      onClick={() =>
                        store.assignClass(student.id, rec.classId!, `按系统推荐调班：${rec.reasons.join('；')}`)
                      }
                    >
                      按推荐调整班级
                    </button>
                  )}
                </>
              )}
              {assignHistory.length > 0 && (
                <div className="mt12">
                  <div className="muted small strong mb8">分班/调班历史（含原因）</div>
                  {assignHistory.map((h) => (
                    <div key={h.id} className="mb8">
                      <div className="flex">
                        <span className="strong small">{h.title}</span>
                        <span className="muted small">{h.date}</span>
                      </div>
                      <div className="muted small">{h.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card title="六维能力雷达" extra={latest && <span className="muted small">测评日 {latest.date} · 录入 {latest.by}</span>}>
              {latest ? (
                <>
                  <AbilityRadar current={latest.scores} previous={previous?.scores} />
                  <div className="kv mt8">
                    {Object.entries(latest.scores).map(([k, v]) => (
                      <div key={k}>
                        <div className="k">{DIMENSION_LABELS[k as keyof typeof DIMENSION_LABELS]}</div>
                        <div className="v">
                          {v} 分
                          {previous && (
                            <span className={`small ${v > previous.scores[k as keyof Scores] ? 'text-success' : v < previous.scores[k as keyof Scores] ? 'text-danger' : 'muted'}`}>
                              {' '}
                              {v > previous.scores[k as keyof Scores] ? '↑' : v < previous.scores[k as keyof Scores] ? '↓' : '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="alert a-info mt12" style={{ marginBottom: 0 }}>{latest.note}</div>
                </>
              ) : (
                <Empty text="尚未录入体测" icon="📊" />
              )}
            </Card>

            <Card title={`体测历史（${assessments.length} 次）`}>
              {assessments.map((a) => (
                <div className="flex-between mb8" key={a.id}>
                  <span>{a.date} · 均分 {avgScore(a.scores)}</span>
                  <span className="muted small">{a.note.slice(0, 30)}{a.note.length > 30 ? '…' : ''}</span>
                </div>
              ))}
              {assessments.length === 0 && <Empty text="暂无体测记录" icon="📊" />}
            </Card>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <Card title="连续成长记录（能力 · 课次 · 伤情 · 沟通）">
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
      )}

      {tab === 'reports' && (
        <div>
          {reports.length === 0 && <Empty text="暂无课后报告" icon="📝" />}
          {reports.map((se) => {
            const r = se.records.find((x) => x.studentId === student.id)!;
            const seCls = store.classes.find((c) => c.id === se.classId);
            return (
              <Card key={se.id} title={`${se.date} ${se.time} · ${seCls?.name}`}
                extra={<Badge color={r.reportAcked ? 'success' : 'warning'}>{r.reportAcked ? '家长已确认' : '待家长确认'}</Badge>}>
                <div className="tag-list mb12">
                  {Object.entries(r.performance).map(([k, v]) => (
                    <Badge key={k} color={v === 'excellent' ? 'success' : v === 'good' ? 'info' : 'danger'}>
                      {MOVEMENT_LABELS[k as MovementItem]} · {RATING_LABELS[v!]}
                    </Badge>
                  ))}
                </div>
                {r.performanceNote && <div className="mb8"><span className="strong">课堂表现：</span>{r.performanceNote}</div>}
                {r.caution && <div className="mb8"><span className="strong">注意事项：</span>{r.caution}</div>}
                {r.homeExercise && <div className="mb8"><span className="strong">家庭练习：</span>{r.homeExercise}</div>}
                <div><span className="strong">升阶建议：</span><Badge color={r.levelUpAdvice === '适合升阶' ? 'success' : r.levelUpAdvice === '暂缓' ? 'danger' : 'gray'}>{r.levelUpAdvice}</Badge></div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'incidents' && (
        <div>
          {interceptions.length > 0 && (
            <Card title={`课前拦截记录（${interceptions.length}）`}>
              {interceptions.map((i) => {
                const se = store.sessions.find((s) => s.id === i.sessionId);
                return (
                  <div className="report-card" key={i.id}>
                    <div className="flex-between wrap">
                      <div className="flex wrap">
                        <Badge color="danger">课前拦截</Badge>
                        <span className="strong">{i.symptoms.map((x) => SYMPTOM_LABELS[x]).join('、')}</span>
                        <span className="muted small">{i.date} · {se?.time ?? ''} 课次 · {i.createdBy}</span>
                      </div>
                      <Badge color={i.decision === 'refund' ? 'success' : 'warning'}>
                        课时{i.decision === 'refund' ? '已返还' : '不返还'}
                      </Badge>
                    </div>
                    <div className="muted mt8">{i.note}</div>
                    <div className="muted small mt8">判定依据：{i.decisionReason}{i.hasDoctorNote ? '（有医生证明）' : ''}</div>
                  </div>
                );
              })}
            </Card>
          )}
          {incidents.length === 0 && interceptions.length === 0 && <Empty text="无伤情/事件记录" icon="✅" />}
          {incidents.map((i) => (
            <IncidentCard key={i.id} incident={i} showSession />
          ))}
        </div>
      )}

      {/* 录入体测 */}
      {showAssess && (
        <Modal
          title={`录入体测 · ${student.name}`}
          onClose={() => setShowAssess(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowAssess(false)}>取消</button>
              <button
                className="btn"
                onClick={() => {
                  store.addAssessment(student.id, scores, assessNote || '阶段复测');
                  setShowAssess(false);
                  setAssessNote('');
                }}
              >
                保存体测
              </button>
            </>
          }
        >
          <ScoreSliders value={scores} onChange={setScores} />
          <div className="field mt12">
            <label>测评备注</label>
            <textarea value={assessNote} onChange={(e) => setAssessNote(e.target.value)} />
          </div>
        </Modal>
      )}

      {/* 请假 */}
      {showLeave && (
        <Modal
          title={`请假登记 · ${student.name}`}
          onClose={() => setShowLeave(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowLeave(false)}>取消</button>
              <button
                className="btn"
                onClick={() => {
                  store.pushTimeline(student.id, 'leave', '请假 1 次', `${leaveNote || '家长请假'}（课时不扣减，可安排补课）`);
                  setShowLeave(false);
                  setLeaveNote('');
                }}
              >
                保存
              </button>
            </>
          }
        >
          <div className="field">
            <label>请假原因</label>
            <textarea value={leaveNote} onChange={(e) => setLeaveNote(e.target.value)} placeholder="如：感冒发烧，请假一次" />
          </div>
        </Modal>
      )}

      {/* 补课 */}
      {showMakeup && (
        <Modal
          title={`补课登记 · ${student.name}`}
          onClose={() => setShowMakeup(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowMakeup(false)}>取消</button>
              <button
                className="btn"
                onClick={() => {
                  store.addMakeup(student.id, today(), makeupNote || '随其他班级完成补课 1 课时');
                  setShowMakeup(false);
                  setMakeupNote('');
                }}
              >
                保存
              </button>
            </>
          }
        >
          <div className="field">
            <label>补课安排</label>
            <textarea value={makeupNote} onChange={(e) => setMakeupNote(e.target.value)} placeholder="如：随启蒙 A 班完成补课（低强度）" />
          </div>
        </Modal>
      )}

      {/* 家长沟通 */}
      {showComm && (
        <Modal
          title={`家长沟通记录 · ${student.name}`}
          onClose={() => setShowComm(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowComm(false)}>取消</button>
              <button
                className="btn"
                disabled={!commNote.trim()}
                onClick={() => {
                  store.addCommunication(student.id, commNote.trim());
                  setShowComm(false);
                  setCommNote('');
                }}
              >
                保存
              </button>
            </>
          }
        >
          <div className="field">
            <label>沟通内容</label>
            <textarea value={commNote} onChange={(e) => setCommNote(e.target.value)} placeholder="如：妈妈反馈孩子在家坐不住，建议…" />
          </div>
        </Modal>
      )}

      {/* 升阶评估 */}
      {showLevelUp && (
        <Modal
          title={`升阶评估 · ${student.name}`}
          onClose={() => setShowLevelUp(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowLevelUp(false)}>取消</button>
              <button
                className="btn btn-warning"
                onClick={() => {
                  store.addLevelUp(student.id, '暂缓', levelUpReason || '建议继续观察', '门店评估');
                  setShowLevelUp(false);
                }}
              >
                暂缓
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  store.addLevelUp(student.id, '通过', levelUpReason || '体测达标，课堂表现稳定', '门店评估');
                  setShowLevelUp(false);
                }}
              >
                通过升阶
              </button>
            </>
          }
        >
          <div className="field">
            <label>评估依据</label>
            <textarea value={levelUpReason} onChange={(e) => setLevelUpReason(e.target.value)} placeholder="体测数据、课堂表现、安全考量…" />
          </div>
        </Modal>
      )}

      {/* 调整班级（必须填写原因，留痕） */}
      {showAssign && (
        <Modal
          title={`调整班级 · ${student.name}`}
          onClose={() => setShowAssign(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowAssign(false)}>取消</button>
              <button
                className="btn"
                disabled={!assignClassId || !assignReason.trim() || assignClassId === student.classId}
                onClick={() => {
                  store.assignClass(student.id, assignClassId, `教练手动调班：${assignReason.trim()}`);
                  setShowAssign(false);
                }}
              >
                确认调整
              </button>
            </>
          }
        >
          <div className="field mb12">
            <label>目标班级</label>
            <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)}>
              {store.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（{c.level} · {c.ageRange}）
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>调整原因 *（将写入成长档案，供家长与门店回溯）</label>
            <textarea
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
              placeholder="如：最近复测平衡/协调达 4 分，家长目标为提升爆发力，且左踝伤情已痊愈…"
            />
          </div>
          {rec && (
            <div className="alert a-info mt12" style={{ marginBottom: 0 }}>
              系统推荐参考：{rec.className}（均分 {rec.avg}）。调班请综合体测、既往伤情与家长目标。
            </div>
          )}
        </Modal>
      )}

      <div className="mt16">
        <Link to="/students" className="muted small">← 返回学员列表</Link>
      </div>
    </div>
  );
}
