import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center text-center">
      {/* Bird mascot */}
      <div className="page-enter stagger-1 mb-8">
        <Image
          src="/heha-bird.png"
          alt="HEHA! bird mascot"
          width={400}
          height={400}
          priority
          className="w-[240px] sm:w-[360px] drop-shadow-[0_0_60px_rgba(105,30,225,0.4)]"
        />
      </div>

      {/* Logo */}
      <div className="page-enter stagger-2">
        <Image
          src="/heha-logo.png"
          alt="HEHA!"
          width={220}
          height={70}
          priority
        />
      </div>

      {/* Prismatic line */}
      <div className="page-enter stagger-3 prismatic-line mx-auto mt-8 w-16" />

      {/* Headline */}
      <h1 className="page-enter stagger-4 apple-headline gradient-text mt-10">
        Experience HEHA!
      </h1>

      {/* Subheadline */}
      <p className="page-enter stagger-5 apple-subheadline mt-5 max-w-lg">
        AI-powered travel, your way.
      </p>
    </section>
  );
}
