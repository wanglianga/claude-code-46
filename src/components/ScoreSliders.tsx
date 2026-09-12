import { DIMENSION_LABELS, DIMENSIONS, Scores } from '../types';

/** 六维体测滑杆（1-5 分） */
export default function ScoreSliders(props: { value: Scores; onChange: (s: Scores) => void }) {
  return (
    <div>
      {DIMENSIONS.map((d) => (
        <div className="score-slider" key={d}>
          <span className="s-label">{DIMENSION_LABELS[d]}</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={props.value[d]}
            onChange={(e) => props.onChange({ ...props.value, [d]: Number(e.target.value) })}
          />
          <span className="s-val">{props.value[d]}</span>
        </div>
      ))}
      <div className="muted small">1 分 = 明显落后 · 3 分 = 同龄中等 · 5 分 = 同龄优秀</div>
    </div>
  );
}
