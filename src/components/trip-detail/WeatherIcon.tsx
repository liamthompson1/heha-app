"use client";

interface WeatherIconProps {
  code: number;
  size?: number;
  className?: string;
}

function getWeatherInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "sun", label: "Clear sky" };
  if (code <= 3) return { icon: "cloud", label: "Partly cloudy" };
  if (code <= 48) return { icon: "fog", label: "Foggy" };
  if (code <= 57) return { icon: "drizzle", label: "Drizzle" };
  if (code <= 67) return { icon: "rain", label: "Rain" };
  if (code <= 77) return { icon: "snow", label: "Snow" };
  if (code <= 82) return { icon: "showers", label: "Showers" };
  if (code <= 99) return { icon: "thunder", label: "Thunderstorm" };
  return { icon: "cloud", label: "Cloudy" };
}

export function getWeatherLabel(code: number): string {
  return getWeatherInfo(code).label;
}

export default function WeatherIcon({ code, size = 24, className }: WeatherIconProps) {
  const { icon } = getWeatherInfo(code);

  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (icon) {
    case "sun":
      return (
        <svg {...svgProps} style={{ color: "#F0B429" }}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );

    case "cloud":
      return (
        <svg {...svgProps} style={{ color: "rgba(255,255,255,0.6)" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      );

    case "fog":
      return (
        <svg {...svgProps} style={{ color: "rgba(255,255,255,0.4)" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="3" y1="22" x2="21" y2="22" />
        </svg>
      );

    case "drizzle":
      return (
        <svg {...svgProps} style={{ color: "#5AC8FA" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="8" y1="21" x2="8" y2="23" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="16" y1="21" x2="16" y2="23" />
        </svg>
      );

    case "rain":
      return (
        <svg {...svgProps} style={{ color: "#5AC8FA" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="8" y1="21" x2="7" y2="24" />
          <line x1="12" y1="21" x2="11" y2="24" />
          <line x1="16" y1="21" x2="15" y2="24" />
        </svg>
      );

    case "snow":
      return (
        <svg {...svgProps} style={{ color: "#E0E8FF" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <circle cx="8" cy="22" r="1" fill="currentColor" />
          <circle cx="12" cy="22" r="1" fill="currentColor" />
          <circle cx="16" cy="22" r="1" fill="currentColor" />
        </svg>
      );

    case "showers":
      return (
        <svg {...svgProps} style={{ color: "#5AC8FA" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="7" y1="21" x2="5" y2="25" />
          <line x1="11" y1="21" x2="9" y2="25" />
          <line x1="15" y1="21" x2="13" y2="25" />
          <line x1="19" y1="21" x2="17" y2="25" />
        </svg>
      );

    case "thunder":
      return (
        <svg {...svgProps} style={{ color: "#F0B429" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="rgba(255,255,255,0.6)" />
          <polyline points="13 16 10 22 14 22 11 28" stroke="#F0B429" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps} style={{ color: "rgba(255,255,255,0.6)" }}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      );
  }
}
