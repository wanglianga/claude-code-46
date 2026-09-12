import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import IncidentCard from '../components/IncidentCard';
import { Avatar, Badge, Card, Empty, Modal, Tabs } from '../components/ui';
import { useCurrentUser, useStore } from '../store/useStore';
import {
  Checklist,
  INCIDENT_LABELS,
  IncidentType,
  MOVEMENT_ITEMS,
  MOVEMENT_LABELS,
  MovementItem,
  RATING_LABELS,
  Rating,
  SESSION_STATUS_LABELS,
  Severity,
  StudentSessionRecord,
} from '../types';
import { HOME_EXERCISES } from '../utils/recommend';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gray',
  checking: 'warning',
  ongoing: 'info',
  done: 'success',
};

const CHECK_ITEMS: { key: keyof Omit<Checklist, 'note'>; label: string; icon: string }[] = [
  { key: 'signed', label: '签到', icon: '✍️' },
  { key: 'equipment', label: '装备', icon: '🎽' },
  { key: 'healthOk', label: '身体状态', icon: '💗' },
  { key: 'parentAuth', label: '家长授权', icon: '👪' },
];

const INCIDENT_TYPES: { type: IncidentType; icon: string }[] = [
  { type: 'fear', icon: '😨' },
  { type: 'compensation', icon: '⚠️' },
  { type: 'injury', icon: '🩹' },
  { type: 'conflict', icon: '🤝' },
  { type: 'levelupRequest', icon: '📈' },
];

export default function SessionDetail() {
  const { id } = useParams();
  const store = useStore();
  const user = useCurrentUser();
  const session = store.sessions.find((s) => s.id === id);
  const [tab, setTab] = useState('check');

  // 事件登记弹窗
  const [incidentFor, setIncidentFor] = useState<string | null>(null); // studentId
  const [incType, setIncType] = useState<IncidentType>('fear');
  const [incItem, setIncItem] = useState<MovementItem>('balanceBeam');
  const [incSeverity, setIncSeverity] = useState<Severity>('低');
  const [incDesc, setIncDesc] = useState('');
  const [incBodyPart, setIncBodyPart] = useState('');
  const [incTreatment, setIncTreatment] = useState('');

  if (!session || !user) return <Empty text="课次不存在" icon="❓" />;

  const cls = store.classes.find((c) => c.id === session.classId);
  const coach = store.users.find((u) => u.id === session.coachId);
  const incidents = store.incidents.filter((i) => i.sessionId === session.id);
  const canCheck = user.role === 'frontdesk' || user.role === 'manager';
  const canCoach = user.role === 'coach' || user.role === 'manager';
  const isStaff = user.role !== 'parent';

  const openIncidentModal = (studentId: string, type: IncidentType) => {
    setIncidentFor(studentId);
    setIncType(type);
    setIncDesc('');
    setIncBodyPart('');
    setIncTreatment('');
  };

  const submitIncident = () => {
    if (!incidentFor || !incDesc.trim()) return;
    store.addIncident({
      sessionId: session.id,
      studentId: incidentFor,
      type: incType,
      item: incType === 'levelupRequest' ? undefined : incItem,
      severity: incSeverity,
      description: incDesc.trim(),
      injury: incType === 'injury' && incBodyPart.trim() ? { bodyPart: incBodyPart.trim(), treatment: incTreatment.trim() || '已现场处理' } : undefined,
    });
    setIncidentFor(null);
  };

  const allChecked = session.records.every(
    (r) => r.leave || (r.checklist.signed && r.checklist.equipment && r.checklist.healthOk && r.checklist.parentAuth),
  );

  return (
    <div>
      {/* 课次横幅 */}
      <div className="session-banner">
        <div className="flex-between wrap">
          <div>
            <h2>
              {cls?.name} · {session.date} {session.time}
              <Badge color={STATUS_COLOR[session.status]}> {SESSION_STATUS_LABELS[session.status]}</Badge>
            </h2>
            <div className="meta">
              教练 {coach?.name} · {cls?.ageRange} · {cls?.schedule} · 在册 {session.records.length} 人
            </div>
          </div>
          <div className="flex">
            {session.status === 'pending' && canCheck && (
              <button className="btn btn-warning" onClick={() => store.setSessionStatus(session.id, 'checking')}>
                开始课前核验
              </button>
            )}
            {session.status === 'checking' && canCoach && (
              <button
                className="btn btn-success"
                disabled={!allChecked}
                title={allChecked ? '' : '仍有学员未完成四项核验或请假登记'}
                onClick={() => store.setSessionStatus(session.id, 'ongoing')}
              >
                开始上课
              </button>
            )}
            {session.status === 'ongoing' && canCoach && (
              <button
                className="btn btn-success"
                onClick={() => {
                  if (window.confirm('完成课次？将自动消课并生成课后报告与成长记录。')) {
                    store.completeSession(session.id);
                    setTab('report');
                  }
                }}
              >
                ✔ 完成课次（消课并生成报告）
              </button>
            )}
          </div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'check', label: '① 课前核验' },
          { key: 'record', label: '② 课中记录' },
          { key: 'incidents', label: `③ 课堂事件（${incidents.length}）` },
          { key: 'report', label: '④ 课后报告' },
        ]}
      />

      {/* ============ ① 课前核验 ============ */}
      {tab === 'check' && (
        <div>
          {!allChecked && session.status !== 'done' && (
            <div className="alert a-warning">四项核验（签到 / 装备 / 身体状态 / 家长授权）全部通过或登记请假后，教练才能开始上课。</div>
          )}
          {session.records.map((r) => {
            const st = store.students.find((x) => x.id === r.studentId)!;
            const done = CHECK_ITEMS.every((c) => r.checklist[c.key]);
            return (
              <Card key={r.studentId}>
                <div className="flex-between wrap mb12">
                  <div className="flex">
                    <Avatar name={st.name} />
                    <div>
                      <span className="strong">{st.name}</span>
                      {r.leave ? (
                        <Badge color="gray"> 已请假</Badge>
                      ) : done ? (
                        <Badge color="success"> 可入场</Badge>
                      ) : (
                        <Badge color="warning"> 待核验</Badge>
                      )}
                      {st.allergies.length > 0 && <Badge color="warning"> 过敏：{st.allergies.join('、')}</Badge>}
                      {st.pastInjuries.length > 0 && <Badge color="danger"> 既往伤病：{st.pastInjuries.join('；')}</Badge>}
                    </div>
                    {r.checklist.note && <span className="muted small">备注：{r.checklist.note}</span>}
                  </div>
                  {canCheck && !r.leave && session.status !== 'done' && (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        const reason = window.prompt('请假原因：', '家长临时请假');
                        if (reason !== null) store.markLeave(session.id, r.studentId, reason || '家长请假');
                      }}
                    >
                      标记请假
                    </button>
                  )}
                </div>
                <div className="check-grid">
                  {CHECK_ITEMS.map((c) => {
                    const checked = r.checklist[c.key];
                    return (
                      <div
                        key={c.key}
                        className={`check-item ${checked ? 'checked' : ''} ${!canCheck || r.leave || session.status === 'done' ? 'disabled' : ''}`}
                        onClick={() => {
                          if (!canCheck || r.leave || session.status === 'done') return;
                          store.updateChecklist(session.id, r.studentId, { [c.key]: !checked });
                        }}
                      >
                        <span className="box">{checked ? '✓' : ''}</span>
                        {c.icon} {c.label}
                      </div>
                    );
                  })}
                </div>
                {canCheck && !r.leave && session.status !== 'done' && (
                  <div className="mt8">
                    <input
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5 }}
                      placeholder="核验备注（如：家长反馈昨晚咳嗽，观察中）"
                      value={r.checklist.note ?? ''}
                      onChange={(e) => store.updateChecklist(session.id, r.studentId, { note: e.target.value })}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ============ ② 课中记录 ============ */}
      {tab === 'record' && (
        <div>
          {session.status !== 'ongoing' && session.status !== 'done' && (
            <div className="alert a-info">课次未开始。完成课前核验后，教练点击「开始上课」即可记录课堂表现。</div>
          )}
          {session.records.filter((r) => !r.leave).map((r) => {
            const st = store.students.find((x) => x.id === r.studentId)!;
            const locked = session.status === 'done' || !canCoach;
            return (
              <Card key={r.studentId}>
                <div className="flex-between wrap mb12">
                  <div className="flex">
                    <Avatar name={st.name} />
                    <span className="strong">{st.name}</span>
                    {!r.checklist.signed && <Badge color="gray">未签到</Badge>}
                  </div>
                  {isStaff && session.status !== 'done' && (
                    <div className="flex wrap">
                      {INCIDENT_TYPES.map((t) => (
                        <button
                          key={t.type}
                          className="btn btn-sm btn-ghost"
                          title={`登记「${INCIDENT_LABELS[t.type]}」事件`}
                          onClick={() => openIncidentModal(r.studentId, t.type)}
                        >
                          {t.icon} {INCIDENT_LABELS[t.type]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <table className="tbl">
                  <tbody>
                    {MOVEMENT_ITEMS.map((item) => (
                      <tr key={item}>
                        <td style={{ width: 110 }} className="strong">{MOVEMENT_LABELS[item]}</td>
                        <td>
                          <span className="rate-group">
                            {(['excellent', 'good', 'attention'] as Rating[]).map((rt) => (
                              <button
                                key={rt}
                                className={`rate-btn ${r.performance[item] === rt ? `on-${rt}` : ''}`}
                                disabled={locked}
                                onClick={() => store.savePerformance(session.id, r.studentId, item, rt)}
                              >
                                {RATING_LABELS[rt]}
                              </button>
                            ))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt8">
                  <input
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5 }}
                    placeholder="课堂表现备注（如：平衡木需牵手通过，落地屈膝有进步）"
                    value={r.performanceNote}
                    disabled={locked}
                    onChange={(e) => store.savePerformanceNote(session.id, r.studentId, e.target.value)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============ ③ 课堂事件 ============ */}
      {tab === 'incidents' && (
        <div>
          {incidents.length === 0 && (
            <Empty text="本节课暂无事件。可在「课中记录」页签一键登记恐惧器械 / 动作代偿 / 摔倒擦伤 / 同伴冲突 / 家长升阶要求。" icon="✅" />
          )}
          {incidents.map((i) => (
            <IncidentCard key={i.id} incident={i} />
          ))}
        </div>
      )}

      {/* ============ ④ 课后报告 ============ */}
      {tab === 'report' && (
        <div>
          {session.status !== 'done' && (
            <div className="alert a-info">
              教练在课次进行中可预填报告；点击顶部「完成课次」后自动消课，报告同步推送给家长确认。
            </div>
          )}
          {session.records.filter((r) => !r.leave && r.checklist.signed).map((r) => (
            <ReportEditor key={r.studentId} sessionId={session.id} record={r} locked={!canCoach || session.status === 'done'} />
          ))}
          {session.records.filter((r) => !r.leave && r.checklist.signed).length === 0 && (
            <Empty text="本节课没有签到学员" icon="📝" />
          )}
        </div>
      )}

      {/* 事件登记弹窗 */}
      {incidentFor && (
        <Modal
          title={`登记事件 · ${store.students.find((s) => s.id === incidentFor)?.name}`}
          onClose={() => setIncidentFor(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setIncidentFor(null)}>取消</button>
              <button className="btn btn-danger" disabled={!incDesc.trim()} onClick={submitIncident}>
                登记事件
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="field">
              <label>事件类型</label>
              <select value={incType} onChange={(e) => setIncType(e.target.value as IncidentType)}>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>{t.icon} {INCIDENT_LABELS[t.type]}</option>
                ))}
              </select>
            </div>
            {incType !== 'levelupRequest' && (
              <div className="field">
                <label>关联动作项目</label>
                <select value={incItem} onChange={(e) => setIncItem(e.target.value as MovementItem)}>
                  {MOVEMENT_ITEMS.map((m) => (
                    <option key={m} value={m}>{MOVEMENT_LABELS[m]}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="field" style={{ maxWidth: 110 }}>
              <label>严重度</label>
              <select value={incSeverity} onChange={(e) => setIncSeverity(e.target.value as Severity)}>
                <option>低</option>
                <option>中</option>
                <option>高</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>事件经过 *</label>
            <textarea
              value={incDesc}
              onChange={(e) => setIncDesc(e.target.value)}
              placeholder="客观描述：时间、环节、孩子表现、现场处置…"
            />
          </div>
          {incType === 'injury' && (
            <div className="form-row">
              <div className="field">
                <label>受伤部位</label>
                <input value={incBodyPart} onChange={(e) => setIncBodyPart(e.target.value)} placeholder="如：右手掌" />
              </div>
              <div className="field">
                <label>现场处置</label>
                <input value={incTreatment} onChange={(e) => setIncTreatment(e.target.value)} placeholder="如：清水清洁，冷敷 5 分钟" />
              </div>
            </div>
          )}
          <div className="alert a-info" style={{ marginBottom: 0 }}>
            登记后事件进入「待处理」，前台将联系家长，店长复盘后闭环；全程记录进入学员成长档案。
          </div>
        </Modal>
      )}

      <div className="mt16">
        <Link to="/sessions" className="muted small">← 返回课次列表</Link>
      </div>
    </div>
  );
}

/** 单个学生的课后报告编辑/展示 */
function ReportEditor(props: { sessionId: string; record: StudentSessionRecord; locked: boolean }) {
  const store = useStore();
  const r = props.record;
  const st = store.students.find((x) => x.id === r.studentId)!;
  const attentionItems = MOVEMENT_ITEMS.filter((m) => r.performance[m] === 'attention');

  return (
    <Card
      title={`${st.name} 的课后报告`}
      extra={<Badge color={r.reportAcked ? 'success' : 'warning'}>{r.reportAcked ? '家长已确认' : '待家长确认'}</Badge>}
    >
      <div className="tag-list mb12">
        {MOVEMENT_ITEMS.filter((m) => r.performance[m]).map((m) => (
          <Badge key={m} color={r.performance[m] === 'excellent' ? 'success' : r.performance[m] === 'good' ? 'info' : 'danger'}>
            {MOVEMENT_LABELS[m]} · {RATING_LABELS[r.performance[m]!]}
          </Badge>
        ))}
        {Object.keys(r.performance).length === 0 && <span className="muted small">课中未记录评分</span>}
      </div>
      {r.performanceNote && <div className="mb8 muted">{r.performanceNote}</div>}
      <div className="form-row">
        <div className="field">
          <label>注意事项</label>
          <textarea
            disabled={props.locked}
            value={r.caution}
            placeholder={attentionItems.length ? `建议关注：${attentionItems.map((m) => MOVEMENT_LABELS[m]).join('、')}` : '如：平衡木环节需助教保护'}
            onChange={(e) => store.saveReport(props.sessionId, r.studentId, { caution: e.target.value, homeExercise: r.homeExercise, levelUpAdvice: r.levelUpAdvice })}
          />
        </div>
        <div className="field">
          <label>家庭练习</label>
          <textarea
            disabled={props.locked}
            value={r.homeExercise}
            placeholder={attentionItems.length ? HOME_EXERCISES[attentionItems[0]] : '如：亲子跳绳 3 组 × 10 次'}
            onChange={(e) => store.saveReport(props.sessionId, r.studentId, { caution: r.caution, homeExercise: e.target.value, levelUpAdvice: r.levelUpAdvice })}
          />
        </div>
        <div className="field" style={{ maxWidth: 150 }}>
          <label>是否适合升阶</label>
          <select
            disabled={props.locked}
            value={r.levelUpAdvice}
            onChange={(e) =>
              store.saveReport(props.sessionId, r.studentId, {
                caution: r.caution,
                homeExercise: r.homeExercise,
                levelUpAdvice: e.target.value as StudentSessionRecord['levelUpAdvice'],
              })
            }
          >
            <option>继续保持</option>
            <option>适合升阶</option>
            <option>暂缓</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
