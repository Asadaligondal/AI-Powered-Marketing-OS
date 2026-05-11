"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Camera,
  Check,
  CreditCard,
  Globe,
  Mail,
  MessageSquare,
  Music2,
  Network,
  Play,
  Send,
  ShoppingBag,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

const platforms = [
  { name: "LinkedIn", icon: Network },
  { name: "YouTube", icon: Play },
  { name: "Twitter / X", icon: Send },
  { name: "Instagram", icon: Camera },
  { name: "TikTok", icon: Music2 },
  { name: "Email", icon: Mail },
  { name: "Shopify", icon: ShoppingBag },
  { name: "Stripe", icon: CreditCard },
  { name: "Analytics", icon: BarChart3 },
  { name: "Messages", icon: MessageSquare },
  { name: "CRM", icon: Users },
  { name: "Global", icon: Globe },
];

const features = [
  {
    icon: Brain,
    title: "Learns your brand voice",
    description:
      "Upload your docs, define your pillars. The AI writes like you — not like every other generic AI tool.",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(124,58,237,0.35)",
  },
  {
    icon: Wand2,
    title: "One topic → 5 platforms",
    description:
      "Instagram post, Reel script, TikTok hook, LinkedIn article, Story frames. Cross-platform repurposing that actually works.",
    gradient: "from-purple-500 to-fuchsia-600",
    glow: "rgba(168,85,247,0.35)",
  },
  {
    icon: Zap,
    title: "DM to CRM in 3 seconds",
    description:
      "AI parses Instagram DMs for keywords and emails, syncs to Klaviyo, triggers your flows. The loop closes automatically.",
    gradient: "from-fuchsia-500 to-pink-600",
    glow: "rgba(217,70,239,0.35)",
  },
];

const painPoints = [
  {
    icon: MessageSquare,
    title: "Content scattered everywhere",
    quote:
      "Canva for design, Buffer for scheduling, Notion for planning — and nothing talks to anything else.",
  },
  {
    icon: Users,
    title: "Voice gets lost in translation",
    quote:
      "Every platform needs different copy, but copying your style across 5 tools means your brand voice evaporates.",
  },
  {
    icon: Mail,
    title: "Leads die in spreadsheets",
    quote:
      "DMs come in, you copy emails manually, Klaviyo flows never trigger. The loop never closes.",
  },
];

const stats = [
  { value: "30x", label: "Faster content creation" },
  { value: "5", label: "Platforms from one brief" },
  { value: "89%", label: "Time saved on scheduling" },
  { value: "4.2x", label: "More leads captured" },
];

const testimonials = [
  {
    quote:
      "I went from spending 3 hours a week writing content to 20 minutes. The brand voice is actually better than what I was writing manually.",
    name: "Sarah Chen",
    role: "Founder, FitFlow",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    quote:
      "The DM automation alone is worth it. Keywords trigger Klaviyo flows automatically — my list grew 40% in the first month.",
    name: "Marcus Webb",
    role: "Coach, Elite Performance",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    quote:
      "Finally a tool that understands I'm one person wearing 10 hats. It doesn't just generate content — it learns how I sound.",
    name: "Priya Nair",
    role: "Creator, Studio Nair",
    gradient: "from-blue-500 to-violet-500",
  },
];

const avatarGradients = [
  "from-violet-400 to-purple-600",
  "from-purple-400 to-fuchsia-500",
  "from-fuchsia-400 to-pink-500",
  "from-blue-400 to-violet-500",
  "from-pink-400 to-fuchsia-500",
];

const steps = [
  {
    step: "01",
    title: "Connect your brand",
    desc: "Upload docs, set your pillars. AI learns your voice in minutes.",
  },
  {
    step: "02",
    title: "Generate 30 days",
    desc: "One click fills your calendar across all platforms, in your voice.",
  },
  {
    step: "03",
    title: "Publish & capture",
    desc: "Schedule posts, capture DM leads, sync to Klaviyo automatically.",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="bg-[#06060a] text-white min-h-screen overflow-x-hidden">
      {/* ── Nav ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#06060a]/90 backdrop-blur-md border-b border-white/10"
            : ""
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              AI Marketing OS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollTo("features")}
              className="text-[14px] text-white/50 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-[14px] text-white/50 hover:text-white transition-colors"
            >
              How it works
            </button>
            <Link
              href="/login"
              className="text-[14px] text-white/50 hover:text-white transition-colors"
            >
              Login
            </Link>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-[14px] font-medium text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200 hover:scale-[1.02]"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[70%] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[60%] rounded-full bg-fuchsia-600/15 blur-[120px]" />
          <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-[13px] font-medium text-violet-300 mb-8">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            AI-Powered Marketing OS
          </div>

          {/* Headline */}
          <h1 className="text-[60px] md:text-[80px] lg:text-[96px] font-bold leading-[1.0] tracking-[-0.04em] mb-6">
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
              One system
            </span>{" "}
            for content,
            <br className="hidden sm:block" /> scheduling, and leads.
          </h1>

          {/* Subheadline */}
          <p className="text-[18px] md:text-[22px] text-white/45 leading-relaxed max-w-2xl mx-auto mb-10">
            Replace your fragmented marketing stack. AI that understands your
            brand, writes on-voice, and closes the loop from DM to CRM.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 text-[16px] font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(124,58,237,0.4)]"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-[16px] font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              See how it works
            </button>
          </div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {avatarGradients.map((g, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 border-[#06060a]`}
                />
              ))}
            </div>
            <p className="text-[13px] text-white/35">
              Used by{" "}
              <span className="text-white/65 font-medium">500+ founders</span>{" "}
              and creators
            </p>
          </div>
        </div>
      </section>

      {/* ── Logo Carousel ── */}
      <section className="py-16 border-y border-white/5">
        <p className="text-center text-[12px] uppercase tracking-widest text-white/20 font-medium mb-10">
          Connects with your entire stack
        </p>
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            className="flex gap-10"
            style={{
              width: "max-content",
              animation: "marquee 35s linear infinite",
            }}
          >
            {[...platforms, ...platforms].map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 opacity-25 hover:opacity-60 transition-opacity duration-300 flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] text-white/40 whitespace-nowrap">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-[12px] uppercase tracking-widest text-fuchsia-400 font-medium mb-4">
              The problem
            </p>
            <h2 className="text-[38px] md:text-[52px] font-bold tracking-[-0.03em] leading-tight">
              Most founders run marketing across
              <br />
              <span className="text-white/35">7+ disconnected tools</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {painPoints.map((p, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-7"
              >
                <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                <div className="pl-3">
                  <div className="w-9 h-9 rounded-lg bg-white/8 border border-white/8 flex items-center justify-center mb-4">
                    <p.icon
                      className="w-4 h-4 text-white/50"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-[16px] font-semibold text-white mb-2">
                    {p.title}
                  </h3>
                  <p className="text-[14px] text-white/38 leading-relaxed">
                    {p.quote}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-[12px] uppercase tracking-widest text-violet-400 font-medium mb-4">
              The solution
            </p>
            <h2 className="text-[38px] md:text-[52px] font-bold tracking-[-0.03em] leading-tight">
              One AI brain. One calendar. One flow.
            </h2>
            <p className="mt-4 text-[18px] text-white/38 max-w-xl mx-auto">
              Everything your marketing needs, built around a single source of
              truth — your brand.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 hover:bg-white/[0.06]"
                style={{
                  ["--hover-glow" as string]: f.glow,
                }}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6`}
                  style={{ boxShadow: `0 8px 24px ${f.glow}` }}
                >
                  <f.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-3">
                  {f.title}
                </h3>
                <p className="text-[14px] text-white/42 leading-relaxed">
                  {f.description}
                </p>

                {/* Hover gradient border */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                  style={{
                    boxShadow: `0 0 0 1px rgba(168,85,247,0.25), 0 20px 60px ${f.glow}`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] uppercase tracking-widest text-purple-400 font-medium mb-4">
            How it works
          </p>
          <h2 className="text-[38px] md:text-[48px] font-bold tracking-[-0.03em] leading-tight mb-16">
            Three steps to full automation
          </h2>
          <div className="relative">
            {/* Connecting gradient line (desktop only) */}
            <div className="absolute top-9 left-[18%] right-[18%] h-px bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-pink-500/40 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="relative w-[72px] h-[72px] rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center mb-5 z-10">
                    <span className="text-[22px] font-bold bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[14px] text-white/38 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-[44px] md:text-[52px] font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent leading-none mb-2">
                    {s.value}
                  </p>
                  <p className="text-[13px] text-white/38">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-[38px] md:text-[48px] font-bold tracking-[-0.03em] leading-tight">
              Built for founders who move fast
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-7 flex flex-col"
              >
                <div className="text-[40px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent leading-none mb-4">
                  &ldquo;
                </div>
                <p className="text-[15px] text-white/55 leading-relaxed flex-1 mb-6">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} shrink-0`}
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      {t.name}
                    </p>
                    <p className="text-[12px] text-white/38">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 via-purple-600/15 to-fuchsia-600/25" />
            <div
              className="absolute inset-0 rounded-3xl"
              style={{ boxShadow: "inset 0 0 0 1px rgba(139,92,246,0.25)" }}
            />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-fuchsia-600/20 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-[38px] md:text-[52px] font-bold tracking-[-0.03em] leading-tight mb-4">
                Ready to consolidate
                <br />
                your stack?
              </h2>
              <p className="text-[18px] text-white/45 mb-8">
                Start free. No credit card. 2 minutes to your first post.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-[16px] font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200 hover:scale-[1.02] shadow-[0_0_60px_rgba(124,58,237,0.5)]"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="mt-6 flex items-center justify-center gap-5">
                {["No credit card", "Free forever plan", "Cancel anytime"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-1.5 text-[13px] text-white/35"
                    >
                      <Check className="w-3.5 h-3.5 text-violet-400" strokeWidth={2} />
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-[14px] font-semibold">AI Marketing OS</span>
            <span className="text-[13px] text-white/20 ml-1">© 2026</span>
          </div>

          <div className="flex items-center gap-6 flex-wrap justify-center">
            {["Product", "Pricing", "Docs"].map((link) => (
              <a
                key={link}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-[13px] text-white/28 hover:text-white/60 transition-colors"
              >
                {link}
              </a>
            ))}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-white/28 hover:text-white/60 transition-colors"
            >
              Twitter
            </a>
            <Link
              href="/login"
              className="text-[13px] text-white/28 hover:text-white/60 transition-colors"
            >
              Login
            </Link>
          </div>

          <p className="text-[12px] text-white/18">Built with Claude.</p>
        </div>
      </footer>
    </div>
  );
}
