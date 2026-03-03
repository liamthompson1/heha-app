export interface Orb {
  color: string;
  size: number;
  position: string; // Tailwind classes like "left-[15%] top-[20%]"
  float: string;    // e.g. "float-1"
  floatDuration: number;
  glowDuration: number;
  reverse?: boolean;
}

export const LANDING_ORBS: Orb[] = [
  { color: "rgba(247,76,65,0.40)", size: 480, position: "left-[15%] top-[20%]", float: "float-1", floatDuration: 20, glowDuration: 8 },
  { color: "rgba(35,166,169,0.35)", size: 420, position: "right-[10%] top-[15%]", float: "float-2", floatDuration: 24, glowDuration: 10 },
  { color: "rgba(47,149,243,0.35)", size: 420, position: "bottom-[15%] right-[20%]", float: "float-3", floatDuration: 22, glowDuration: 9 },
  { color: "rgba(105,30,225,0.35)", size: 420, position: "bottom-[25%] left-[10%]", float: "float-4", floatDuration: 26, glowDuration: 11 },
  { color: "rgba(234,171,45,0.28)", size: 380, position: "left-[40%] top-[10%]", float: "float-2", floatDuration: 18, glowDuration: 7, reverse: true },
];

export const SUBTLE_ORBS: Orb[] = [
  { color: "rgba(47,149,243,0.28)", size: 380, position: "left-[10%] top-[20%]", float: "float-1", floatDuration: 22, glowDuration: 9 },
  { color: "rgba(105,30,225,0.22)", size: 340, position: "right-[15%] bottom-[20%]", float: "float-3", floatDuration: 26, glowDuration: 11 },
  { color: "rgba(35,166,169,0.18)", size: 300, position: "left-[50%] top-[60%]", float: "float-2", floatDuration: 20, glowDuration: 8 },
];

export default function OrbField({ orbs }: { orbs: Orb[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${orb.position}`}
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: 'blur(8px)',
            mixBlendMode: 'screen',
            animation: `${orb.float} ${orb.floatDuration}s ease-in-out infinite${orb.reverse ? " reverse" : ""}, pulse-glow ${orb.glowDuration}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
