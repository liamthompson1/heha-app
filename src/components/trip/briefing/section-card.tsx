interface SectionCardProps {
  title: string;
  accentColor: string;
  delay?: number;
  children: React.ReactNode;
}

export function SectionCard({ title, accentColor, delay = 0, children }: SectionCardProps) {
  return (
    <section
      className="briefing-card"
      style={{ animation: `fade-in-up 0.6s ease-out ${delay}s both` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
          {title}
        </h2>
      </div>
      <div className="prismatic-line mb-5 w-full" />
      {children}
    </section>
  );
}
