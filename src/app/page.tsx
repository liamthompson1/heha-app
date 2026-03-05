"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth/use-session";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import OrbField, { LANDING_ORBS, SUBTLE_ORBS } from "@/components/OrbField";
import AuthStatus from "@/components/AuthStatus";
import ScrollReveal from "@/components/ScrollReveal";
import NewTripPill from "@/components/NewTripPill";
import LogoHeader from "@/components/LogoHeader";
import BentoTripGrid from "@/components/BentoTripGrid";
import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
import type { TripRow } from "@/types/trip";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { data: trips, loading, error } = useCachedFetch<TripRow[]>(
    "/api/trips",
    { transform: (raw) => (raw as { trips?: TripRow[] }).trips ?? [] }
  );

  return (
    <div className="page-shell relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--background)] px-4 sm:px-6 pt-20 pb-28">
      <OrbField orbs={SUBTLE_ORBS} />
      <LogoHeader />
      <AuthStatus />

      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Greeting */}
        <h1 className="page-enter stagger-1 text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight" style={{ color: "var(--foreground)" }}>
          {getGreeting()}
        </h1>

        <div className="page-enter stagger-2 prismatic-line w-full mt-12 mb-12" />

        {/* Loading state */}
        {loading && (
          <div className="animate-pulse">
            {/* First section skeleton */}
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-5 px-1">
                <div className="glass-panel rounded-lg h-6 w-28" />
                <div className="glass-panel rounded-lg h-4 w-12" />
              </div>
              <div className="trip-scroll-row">
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
              </div>
            </section>
            {/* Second section skeleton */}
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-5 px-1">
                <div className="glass-panel rounded-lg h-6 w-36" />
                <div className="glass-panel rounded-lg h-4 w-14" />
              </div>
              <div className="trip-scroll-row">
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm text-center py-12">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && (!trips || trips.length === 0) && (
          <div className="max-w-lg mx-auto">
            <GlassCard className="page-enter stagger-4 text-center" elevated>
              <div className="text-5xl mb-4">&#9992;&#65039;</div>
              <p
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No trips yet
              </p>
              <p
                className="mb-8"
                style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}
              >
                Start planning your next adventure — it only takes a minute.
              </p>
              <GlassButton href="/trip/new" variant="teal" size="lg">
                Plan Your First Trip
              </GlassButton>
            </GlassCard>
          </div>
        )}

        {/* Bento grid */}
        {!loading && !error && trips && trips.length > 0 && (
          <BentoTripGrid trips={trips} />
        )}
      </main>

      <NewTripPill />
    </div>
  );
}

export default function Home() {
  const session = useSession();

  if (session.loading) {
    return (
      <div className="page-shell relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--background)] px-4 sm:px-6 pt-20">
        <OrbField orbs={SUBTLE_ORBS} />
        <LogoHeader />
        <div className="relative z-10 w-full max-w-7xl mx-auto animate-pulse">
          <div className="glass-panel rounded-2xl h-12 w-56 mb-12" />
          <div className="prismatic-line w-full mb-12" style={{ opacity: 0.3 }} />
          <div>
            {/* First section skeleton */}
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-5 px-1">
                <div className="glass-panel rounded-lg h-6 w-28" />
                <div className="glass-panel rounded-lg h-4 w-12" />
              </div>
              <div className="trip-scroll-row">
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
              </div>
            </section>
            {/* Second section skeleton */}
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-5 px-1">
                <div className="glass-panel rounded-lg h-6 w-36" />
                <div className="glass-panel rounded-lg h-4 w-14" />
              </div>
              <div className="trip-scroll-row">
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
                <div className="trip-scroll-card trip-card trip-card-standard">
                  <div className="trip-card-skeleton" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (session.authenticated) {
    return <Dashboard />;
  }

  return (
    <div className="landing-scroll-container page-shell relative bg-[var(--background)]">
      <OrbField orbs={LANDING_ORBS} />
      <LogoHeader />

      {/* ── Hero Section ── */}
      <section className="landing-snap-section relative z-10 flex flex-col items-center justify-center px-6 text-center">
        <div className="page-enter stagger-1 mb-8">
          <Image
            src="/heha-bird.png"
            alt="HEHA! bird mascot"
            width={400}
            height={400}
            priority
            className="w-[180px] sm:w-[280px] drop-shadow-[0_0_80px_rgba(137,68,229,0.15)]"
          />
        </div>

        <h1 className="page-enter stagger-2 text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
          Travel, reimagined.
        </h1>

        <p className="page-enter stagger-3 mt-6 sm:mt-8 text-lg sm:text-xl max-w-xl" style={{ color: "var(--text-secondary)" }}>
          AI-powered trip planning that understands you. Tell us where you want to go — we&rsquo;ll handle the rest.
        </p>

        <div className="page-enter stagger-4 mt-12 flex items-center gap-3">
          <a href="#get-started" className="hero-cta-primary">
            I&rsquo;m a human
          </a>
          <a href="#agents" className="hero-cta-outline">
            I&rsquo;m an agent
          </a>
        </div>

        <div className="page-enter stagger-5 mt-10 animate-bounce" style={{ color: "var(--text-tertiary)" }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── Get Started Section ── */}
      <section id="get-started" className="landing-snap-section relative z-10 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Get started in seconds.
            </h2>
            <p className="mt-4 text-base sm:text-lg max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
              Sign in to save your trips, access personalised recommendations, and plan with friends.
            </p>
          </ScrollReveal>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 max-w-3xl mx-auto items-stretch">
            <ScrollReveal delay={100} className="h-full">
              <Link
                href="/auth/entry"
                className="glass-card-purple glass-card-hoverable flex flex-col items-center text-center p-10 sm:p-12 h-full"
                style={{ textDecoration: "none", color: "var(--foreground)" }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(84, 46, 145, 0.3)" }}>
                  <svg width="28" height="28" fill="none" stroke="rgba(168, 130, 230, 1)" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h16" />
                    <path d="M5 16l2-12h2l1 6h4l1-6h2l2 12" />
                    <path d="M3 20c0 0 2-2 9-2s9 2 9 2" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center justify-center whitespace-nowrap gap-[0.3em]">
                  Log in with{" "}
                  <Image
                    src="/holiday-extras-logo.png"
                    alt="Holiday Extras"
                    width={240}
                    height={48}
                    className="inline-block h-[1.8em] w-auto"
                  />
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Already a Holiday Extras customer? Sign in to sync your bookings and preferences.
                </p>
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={200} className="h-full">
              <Link
                href="/auth/entry"
                className="glass-panel-elevated glass-card-hoverable flex flex-col items-center text-center p-10 sm:p-12 h-full"
                style={{ textDecoration: "none", color: "var(--foreground)" }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(46, 205, 193, 0.12)" }}>
                  <svg width="28" height="28" fill="none" stroke="var(--teal)" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Continue with Email</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  New here? Enter your email and we&rsquo;ll send you a magic link. No passwords needed.
                </p>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="landing-snap-section relative z-10 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-5xl mx-auto">
          <ScrollReveal className="mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-center mb-6" style={{ color: "var(--foreground)" }}>
              Trip planning,{" "}
              <span className="gradient-text">supercharged.</span>
            </h2>
            <p className="text-base sm:text-lg text-center max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              From a quick weekend away to a month-long adventure — tell our AI what you want and watch your perfect trip come together.
            </p>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-3">
            <ScrollReveal delay={0} variant="up">
              <div className="glass-panel p-8 sm:p-10 text-center h-full">
                <div className="text-4xl mb-5">&#128172;</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>Tell us your dream</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Speak or type — describe your ideal trip, budget, dates and who&rsquo;s coming. Our AI listens and understands.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120} variant="up">
              <div className="glass-panel p-8 sm:p-10 text-center h-full">
                <div className="text-4xl mb-5">&#9992;&#65039;</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>We build your trip</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Flights, hotels, activities, transfers — everything assembled into a complete itinerary, ready to review.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={240} variant="up">
              <div className="glass-panel p-8 sm:p-10 text-center h-full">
                <div className="text-4xl mb-5">&#127881;</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>Book and go</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Refine the details, share with fellow travellers, and book — all in one place. Your trip, your way.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Agents Section + Footer ── */}
      <section id="agents" className="landing-snap-section relative z-10 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid gap-10 sm:grid-cols-2 items-center">
            <ScrollReveal variant="left">
              <p className="text-sm font-medium uppercase tracking-widest mb-4" style={{ color: "var(--purple)" }}>
                AI-Powered
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
                Your AI agent, your trips.
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
                HEHA! works with your favourite AI agents. They can search flights, build itineraries, and manage bookings on your behalf — via MCP, A2A, or REST.
              </p>
              <Link
                href="/agents/skills"
                className="glass-button glass-button-purple"
              >
                Explore Agent Skills &rarr;
              </Link>
            </ScrollReveal>

            <ScrollReveal variant="right" delay={150}>
              <div className="glass-panel p-8">
                <pre className="text-sm overflow-x-auto" style={{ color: "var(--text-secondary)" }}>
                  <code>{`"Plan me a week in Tokyo
 focused on food and temples,
 under £2,500."

→ Your AI agent calls HEHA!
→ Finds flights & hotels
→ Builds a full itinerary
→ Books it all for you`}</code>
                </pre>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal variant="fade" className="mt-24 pt-8 text-center">
            <div className="prismatic-line w-full mb-8" />
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Built by Holiday Extras &middot; Powered by AI
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
