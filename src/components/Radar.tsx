import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { DIMENSION_LABELS, DIMENSIONS, Scores } from '../types';

/** 六维能力雷达图，可对比两次测评 */
export default function AbilityRadar(props: { current: Scores; previous?: Scores }) {
  const data = DIMENSIONS.map((d) => ({
    dim: DIMENSION_LABELS[d],
    current: props.current[d],
    previous: props.previous ? props.previous[d] : undefined,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: '#475569' }} />
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} axisLine={false} />
        {props.previous && (
          <Radar name="上次测评" dataKey="previous" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
        )}
        <Radar name="本次测评" dataKey="current" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
