import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center text-center">
      {/* Bird mascot */}
      <div className="page-enter stagger-1 mb-10">
        <Image
          src="/heha-bird.png"
          alt="HEHA! bird mascot"
          width={400}
          height={400}
          priority
          className="w-[200px] sm:w-[320px] drop-shadow-[0_0_80px_rgba(137,68,229,0.2)]"
        />
      </div>

      {/* Logo */}
      <div className="page-enter stagger-2">
        <Image
          src="/heha-logo.png"
          alt="HEHA!"
          width={200}
          height={64}
          priority
        />
      </div>

      {/* Headline */}
      <h1 className="page-enter stagger-3 apple-headline mt-12" style={{ color: "var(--foreground)" }}>
        Experience HEHA!
      </h1>

      {/* Subheadline */}
      <p className="page-enter stagger-4 apple-subheadline mt-6 max-w-md">
        AI-powered travel, your way.
      </p>
    </section>
  );
}
