import type { AstronomyScene } from './useAstronomy';

export function ObserverInset({ scene }: { scene: AstronomyScene | null }) {
  if (!scene) return <p className="obs-muted">Calculating observer position…</p>;
  const [x,y,z] = scene.observer.earth_fixed_km;
  const length = Math.hypot(x,y,z);
  const scale = 45 / Math.max(length, 6378.137);
  const px = 120 + y * scale;
  const py = 75 - z * scale;
  return <>
    <svg viewBox="0 0 240 150" role="img" aria-label="Earth-fixed observer position, looking along Earth's equatorial X axis">
      <circle cx="120" cy="75" r={6378.137*scale} fill="#143145" stroke="#5792ae"/>
      <ellipse cx="120" cy="75" rx={6378.137*scale} ry={12*scale/0.007} fill="none" stroke="#5792ae" strokeOpacity=".4"/>
      <path d="M120 15V135M55 75H185" stroke="#85929e" strokeDasharray="3 5" opacity=".3"/>
      <path d={`M120 75L${px} ${py}`} stroke="#a3e4d7" strokeDasharray="3 3"/>
      <circle cx={px} cy={py} r="4" fill="#a3e4d7"/>
      <text x="120" y="145" textAnchor="middle" fill="#a3e4d7" fontSize="11">{scene.observer.altitude_km.toLocaleString()} km above WGS84</text>
      <text x="120" y="11" textAnchor="middle" fill="#aab3c3" fontSize="10">N</text>
    </svg>
    <p className="obs-muted">Earth-fixed side view. Observer is on the {x >= 0 ? 'near' : 'far'} side; marker remains visible.</p>
  </>;
}
