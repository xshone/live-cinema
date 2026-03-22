"use client"

import Link from "next/link"
import { useLang, LangToggle } from "@/contexts/LanguageContext"

/* ── Marquee strip component ─────────────────────────────────────── */
function MarqueeStrip({ bg, text, textColor }: { bg: string; text: string; textColor: string }) {
  const items = Array(12).fill(text)
  return (
    <div className="border-y-4 border-black overflow-hidden py-3" style={{ background: bg }}>
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((t, i) => (
          <span
            key={i}
            className="font-black text-sm uppercase tracking-[0.2em] mx-8"
            style={{ color: textColor }}
          >
            {t} ★
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((t, i) => (
          <span
            key={`dup-${i}`}
            className="font-black text-sm uppercase tracking-[0.2em] mx-8"
            style={{ color: textColor }}
          >
            {t} ★
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Feature card ────────────────────────────────────────────────── */
function FeatureCard({
  number,
  title,
  desc,
  bg,
  rotate,
}: {
  number: string
  title: string
  desc: string
  bg: string
  rotate: string
}) {
  return (
    <div
      className={`border-4 border-black shadow-neo-lg p-8 flex flex-col gap-4 ${rotate} transition-all duration-200 hover:-translate-y-2 hover:shadow-neo-xl`}
      style={{ background: bg }}
    >
      <span className="font-black text-5xl text-black/20 leading-none">{number}</span>
      <h3 className="font-black text-2xl uppercase tracking-tight border-t-4 border-black pt-4">
        {title}
      </h3>
      <p className="font-bold text-base leading-relaxed">{desc}</p>
    </div>
  )
}

/* ── Cinema screen mockup ────────────────────────────────────────── */
function CinemaScreenMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      {/* Main screen */}
      <div className="relative border-4 border-black shadow-neo-xl bg-black aspect-video overflow-hidden">
        {/* Scanlines effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
          }}
        />
        {/* Screen glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-3/4 h-3/4 rounded-none opacity-30"
            style={{
              background: "radial-gradient(ellipse, #C4B5FD 0%, transparent 70%)",
            }}
          />
        </div>
        {/* Screen text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-black text-white text-lg uppercase tracking-widest opacity-80">
            Press START
          </p>
        </div>
        {/* LIVE badge */}
        <div className="absolute top-3 right-3 bg-[#FF6B6B] border-2 border-black px-2 py-1 rotate-3 shadow-neo-sm">
          <span className="font-black text-xs uppercase tracking-widest text-black flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-black inline-block animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Cinema seats rows */}
      <div className="border-4 border-t-0 border-black bg-[#888] p-4 space-y-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex justify-center gap-1" style={{ marginTop: row * 4 }}>
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-5 border-2 border-black bg-[#555]"
                  style={{ borderRadius: "2px 2px 0 0" }}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Spinning star decoration */}
      <div className="absolute -top-8 -right-8 w-16 h-16 border-4 border-black rounded-full bg-[#FFD93D] flex items-center justify-center shadow-neo-md animate-spin-slow">
        <span className="font-black text-2xl">★</span>
      </div>

      {/* 3D badge */}
      <div className="absolute -bottom-4 -left-4 bg-[#C4B5FD] border-4 border-black px-3 py-2 -rotate-6 shadow-neo-md">
        <span className="font-black text-xl tracking-tighter">3D</span>
      </div>

      {/* HLS badge */}
      <div className="absolute top-1/2 -right-6 bg-[#FF6B6B] border-4 border-black px-3 py-1 rotate-12 shadow-neo-sm">
        <span className="font-black text-xs uppercase tracking-widest">HLS</span>
      </div>
    </div>
  )
}

/* ── Step card ───────────────────────────────────────────────────── */
function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6 items-start">
      <span className="font-black text-6xl leading-none text-black shrink-0 w-16 text-right">
        {num}
      </span>
      <div className="border-l-4 border-black pl-6 py-1">
        <h4 className="font-black text-xl uppercase tracking-tight mb-2">{title}</h4>
        <p className="font-bold text-base text-black/80 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function HomePage() {
  const { t } = useLang()
  return (
    <main className="font-space bg-neo-bg min-h-screen overflow-x-hidden">
      {/* ── Top marquee ─────────────────────────────────────────── */}
      <MarqueeStrip bg="#000" text={t.marqueeTop} textColor="#FFD93D" />

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="border-b-4 border-black bg-neo-bg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-[#FFD93D] border-4 border-black px-4 py-2 shadow-neo-sm -rotate-1">
              <span className="font-black text-lg uppercase tracking-tighter text-black">
                COM CINEMA
              </span>
            </div>
            <div className="hidden sm:block bg-[#FF6B6B] border-4 border-black px-2 py-1 shadow-neo-sm rotate-1">
              <span className="font-black text-xs uppercase tracking-widest text-black">BETA</span>
            </div>
          </div>
          {/* Nav links */}
          <div className="hidden md:flex items-center gap-2">
            {[t.navHome, t.navFeatures, t.navHowTo].map((item) => (
              <a
                key={item}
                href="#"
                className="font-black text-sm uppercase tracking-wide px-3 py-2 border-2 border-transparent hover:border-black hover:bg-[#FF6B6B] hover:shadow-neo-sm transition-all duration-100"
              >
                {item}
              </a>
            ))}
          </div>
          {/* Lang toggle + CTA nav button */}
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link href="/cinema">
              <button className="bg-black text-white border-4 border-black px-6 py-2.5 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_#FF6B6B] transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#111]">
                {t.navEnter}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b-4 border-black"
        style={{
          background: "#FFFDF5",
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-5 gap-12 items-center">
          {/* Left — text content (60%) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Top badge */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-block bg-[#FF6B6B] border-4 border-black px-4 py-2 font-black text-sm uppercase tracking-widest shadow-neo-sm rotate-1">
                ★ POWERED BY THREE.JS
              </span>
              <span className="inline-block bg-[#C4B5FD] border-4 border-black px-4 py-2 font-black text-sm uppercase tracking-widest shadow-neo-sm -rotate-1">
                {t.badgeHls}
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              {/* "COM" — outlined display text */}
              <div className="overflow-hidden">
                <h1
                  className="font-black leading-none tracking-tighter"
                  style={{
                    fontSize: "clamp(4rem, 10vw, 8rem)",
                    WebkitTextStroke: "3px #000",
                    color: "transparent",
                  }}
                >
                  COM
                </h1>
              </div>
              {/* "CINEMA" — solid, heavy */}
              <div className="flex items-baseline gap-4 flex-wrap">
                <h1
                  className="font-black leading-none tracking-tighter text-black"
                  style={{ fontSize: "clamp(4rem, 10vw, 8rem)" }}
                >
                  CINEMA
                </h1>
              </div>
              {/* Hero subtitle title */}
              <div className="inline-block mt-2">
                <div className="bg-[#FFD93D] border-4 border-black px-6 py-3 shadow-neo-lg rotate-1 inline-block">
                  <h2
                    className="font-black text-black tracking-tighter leading-none"
                    style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                  >
                    {t.heroTitle}
                  </h2>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="font-bold text-xl leading-relaxed text-black max-w-lg border-l-4 border-[#FF6B6B] pl-5">
              {t.heroSubtitle}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-5 items-center pt-2">
              <Link href="/cinema">
                <button
                  className="
                                    h-16 px-10
                                    bg-[#FF6B6B] text-black
                                    border-4 border-black
                                    font-black text-xl uppercase tracking-wide
                                    shadow-neo-lg
                                    transition-all duration-100
                                    active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                                    hover:bg-[#ff4f4f]
                                    flex items-center gap-3
                                "
                >
                  {t.heroEnter}
                  <span className="text-2xl">→</span>
                </button>
              </Link>
              <a href="#features">
                <button
                  className="
                                    h-16 px-8
                                    bg-transparent text-black
                                    border-4 border-black
                                    font-black text-lg uppercase tracking-wide
                                    shadow-neo-md
                                    transition-all duration-100
                                    active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                                    hover:bg-black hover:text-white
                                "
                >
                  {t.heroLearnMore}
                </button>
              </a>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 pt-4">
              {[
                { val: "5 ROWS", label: t.statRow },
                { val: "15 COLS", label: t.statCol },
                { val: "HLS", label: t.statProtocol },
                { val: "3D", label: t.statAudio },
              ].map(({ val, label }) => (
                <div key={val} className="border-4 border-black bg-white shadow-neo-sm px-4 py-2">
                  <p className="font-black text-xl leading-none">{val}</p>
                  <p className="font-bold text-xs uppercase tracking-widest text-black/60 mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual chaos zone (40%) */}
          <div className="lg:col-span-2 relative flex items-center justify-center py-12">
            {/* Large background number */}
            <span
              className="absolute font-black text-black/5 leading-none select-none pointer-events-none"
              style={{ fontSize: "clamp(8rem, 20vw, 18rem)" }}
            >
              3D
            </span>
            <CinemaScreenMockup />
          </div>
        </div>

        {/* Decorative floating shapes */}
        <div className="absolute top-12 left-6 w-10 h-10 bg-[#C4B5FD] border-4 border-black shadow-neo-sm rotate-12 pointer-events-none" />
        <div className="absolute bottom-16 left-20 w-6 h-6 bg-[#FF6B6B] border-4 border-black shadow-neo-sm -rotate-6 pointer-events-none" />
      </section>

      {/* ── Middle marquee ──────────────────────────────────────── */}
      <MarqueeStrip bg="#FFD93D" text={t.marqueeMid} textColor="#000" />

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="bg-black border-b-4 border-black py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-16">
            <div className="bg-[#FF6B6B] border-4 border-[#FF6B6B] px-5 py-2 shadow-neo-white-md -rotate-1 inline-block">
              <span className="font-black text-sm uppercase tracking-[0.2em] text-black">
                FEATURES
              </span>
            </div>
            <h2
              className="font-black text-white leading-none tracking-tighter"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              {t.featuresHeading}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              number="01"
              title={t.feature01Title}
              desc={t.feature01Desc}
              bg="#FF6B6B"
              rotate="-rotate-1"
            />
            <FeatureCard
              number="02"
              title={t.feature02Title}
              desc={t.feature02Desc}
              bg="#C4B5FD"
              rotate="rotate-1"
            />
            <FeatureCard
              number="03"
              title={t.feature03Title}
              desc={t.feature03Desc}
              bg="#FFD93D"
              rotate="-rotate-1"
            />
          </div>
        </div>
      </section>

      {/* ── How to use ──────────────────────────────────────────── */}
      <section
        id="how-to-use"
        className="py-20 lg:py-32 border-b-4 border-black"
        style={{
          background: "#FFFDF5",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-16">
            <div className="bg-[#C4B5FD] border-4 border-black px-5 py-2 shadow-neo-md rotate-1 inline-block">
              <span className="font-black text-sm uppercase tracking-[0.2em] text-black">
                HOW TO
              </span>
            </div>
            <h2
              className="font-black text-black leading-none tracking-tighter"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
            >
              {t.howToHeading}
            </h2>
          </div>

          <div className="bg-white border-4 border-black shadow-neo-xl p-8 lg:p-12 space-y-10">
            <StepCard num="01" title={t.step01Title} desc={t.step01Desc} />
            <div className="border-t-4 border-black" />
            <StepCard num="02" title={t.step02Title} desc={t.step02Desc} />
            <div className="border-t-4 border-black" />
            <StepCard num="03" title={t.step03Title} desc={t.step03Desc} />
          </div>
        </div>
      </section>

      {/* ── CTA section ─────────────────────────────────────────── */}
      <section className="bg-[#FF6B6B] border-b-4 border-black py-20 lg:py-28 relative overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#000 2px, transparent 2.5px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Large background text */}
        <span
          className="absolute font-black text-black/10 leading-none select-none pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
          style={{ fontSize: "clamp(6rem, 18vw, 16rem)" }}
        >
          CINEMA
        </span>

        <div className="relative max-w-5xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-4">
            <div className="inline-block bg-black px-6 py-2 shadow-[6px_6px_0px_0px_#FFD93D] mb-4">
              <span className="font-black text-[#FFD93D] text-sm uppercase tracking-[0.3em]">
                {t.ctaBadge}
              </span>
            </div>
            <h2
              className="font-black text-black leading-none tracking-tighter"
              style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
            >
              {t.ctaHeading}
            </h2>
            <p className="font-bold text-xl text-black/80 max-w-lg mx-auto leading-relaxed">
              {t.ctaDesc}
            </p>
          </div>

          <Link href="/cinema">
            <button
              className="
                            h-20 px-14
                            bg-black text-white
                            border-4 border-black
                            font-black text-2xl uppercase tracking-wide
                            shadow-[8px_8px_0px_0px_#FFD93D]
                            transition-all duration-100
                            active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                            hover:bg-[#111]
                            inline-flex items-center gap-4
                            mx-auto
                        "
            >
              {t.ctaButton}
              <span className="text-3xl">→</span>
            </button>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-black border-t-4 border-black py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <div className="bg-[#FFD93D] border-4 border-[#FFD93D] px-5 py-3 shadow-[4px_4px_0px_0px_#fff] inline-block">
                <span className="font-black text-xl uppercase tracking-tighter text-black">
                  COM CINEMA
                </span>
              </div>
              <p className="font-bold text-white/60 text-sm max-w-xs leading-relaxed">
                {t.footerDesc}
              </p>
            </div>

            {/* Tech stack badges */}
            <div className="flex flex-wrap gap-3">
              {["THREE.JS", "NEXT.JS 14", "HLS", "TYPESCRIPT", "TAILWIND"].map((tech) => (
                <span
                  key={tech}
                  className="bg-transparent border-2 border-white/40 text-white/70 font-black text-xs uppercase tracking-widest px-3 py-1.5 hover:border-[#FFD93D] hover:text-[#FFD93D] transition-colors duration-100"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-white/10 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-bold text-white/40 text-xs uppercase tracking-widest">
              © 2026 COM CINEMA — ALL RIGHTS RESERVED
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
              <span className="font-bold text-white/40 text-xs uppercase tracking-widest">
                LIVE NOW
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
