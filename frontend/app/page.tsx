"use client";
import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import Header from "../components/Header";
import Link from "next/link";
import Image from "next/image";
import {
  RiArrowRightLine,
  RiFlashlightLine,
  RiBarChart2Line,
  RiLockLine,
  RiCheckboxCircleLine,
  RiCodeSSlashLine,
  RiGlobalLine,
  RiStockLine,
  RiShieldCheckLine,
} from "react-icons/ri";

function ScoreCard() {
  const [score, setScore] = useState(350);
  const [showDecision, setShowDecision] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const target = 712;
      const duration = 1800;
      const start = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(350 + (target - 350) * eased);
        setScore(current);
        if (progress >= 1) {
          clearInterval(timer);
          setShowDecision(true);
        }
      }, 16);
      return () => clearInterval(timer);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const barProgress = ((score - 350) / (850 - 350)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="relative bg-[#0d1117] rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/50 w-full max-w-sm mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-gray-400 tracking-widest uppercase font-medium">
          Credit Analysis
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#59a927] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#59a927] animate-pulse" />
          Live
        </span>
      </div>

      <div className="text-center mb-5">
        <div className="text-7xl font-bold text-white tabular-nums leading-none">
          {score}
        </div>
        <div className="text-sm text-gray-400 mt-2">Credit Score</div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>350 — Very High Risk</span>
          <span>850</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0055ba] to-[#59a927] rounded-full transition-all duration-75"
            style={{ width: `${barProgress}%` }}
          />
        </div>
        <div className="text-right text-xs text-[#59a927] mt-1.5 font-medium">
          LOW_RISK
        </div>
      </div>

      <div
        className={`border rounded-lg p-3 text-center mb-5 transition-all duration-500 ${
          showDecision
            ? "border-[#59a927]/40 bg-[#59a927]/10 opacity-100"
            : "border-white/5 bg-white/5 opacity-40"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <RiCheckboxCircleLine className="w-4 h-4 text-[#59a927]" />
          <span className="font-bold tracking-wide text-[#59a927]">
            APPROVED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/5 pt-5">
        {[
          { label: "Loan Amount", value: "₦100,000" },
          { label: "Analysis Time", value: "287ms", accent: true },
          { label: "Monthly Income", value: "₦185,000" },
          { label: "DTI Ratio", value: "24.3%" },
        ].map((item) => (
          <div key={item.label}>
            <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
            <div
              className={`font-semibold text-sm ${item.accent ? "text-[#59a927]" : "text-white"}`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PIPELINE_STEPS = [
  {
    num: "01",
    title: "Knockout",
    desc: "Identity, fraud, and credit hard-stops before any scoring begins",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    num: "02",
    title: "Feature Extraction",
    desc: "30+ normalised signals pulled from income, cashflow, and credit history",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    num: "03",
    title: "Scoring",
    desc: "FICO-compatible 350–850 score across 5 dynamically weighted components",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    num: "04",
    title: "Decision",
    desc: "Approve, reject, or generate a counter-offer based on policy thresholds",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    num: "05",
    title: "Manual Review",
    desc: "Borderline scores and high-value loans escalated automatically",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop&auto=format&q=80",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] overflow-hidden pt-32 sm:pt-36 lg:pt-44 pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0055ba]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#59a927]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#0055ba]/40 bg-[#0055ba]/10 px-4 py-1.5 text-xs font-semibold text-[#0055ba] mb-6">
                  <RiShieldCheckLine className="h-3.5 w-3.5" /> Powered by Mono Open
                  Banking
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6"
              >
                Credit intelligence
                <br />
                <span className="text-[#0055ba]">built for Nigeria</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl"
              >
                Real-time cashflow analysis, FICO-compatible scoring, and
                configurable risk policy — so your team approves more of the
                right loans and fewer of the wrong ones.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-12"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0055ba] px-7 py-3 text-sm font-semibold text-white hover:bg-[#004494] transition shadow-lg shadow-[#0055ba]/20"
                >
                  Request Demo <RiArrowRightLine className="h-4 w-4" />
                </Link>
                <a
                  href="#api"
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
                >
                  View API Docs
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap gap-6 text-sm text-gray-400"
              >
                {[
                  { icon: <RiFlashlightLine className="h-4 w-4 text-[#59a927]" />, text: "Sub-30s decisions" },
                  { icon: <RiBarChart2Line className="h-4 w-4 text-[#59a927]" />, text: "30+ data signals" },
                  { icon: <RiCheckboxCircleLine className="h-4 w-4 text-[#59a927]" />, text: "99.9% uptime" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 font-medium">
                    {icon}
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="lg:flex lg:justify-end">
              <ScoreCard />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 lg:py-28 bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#0055ba] mb-3 block">
              The Engine
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Five-stage credit intelligence
            </h2>
          </FadeIn>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 scrollbar-hide">
              {PIPELINE_STEPS.map((step, i) => (
                <FadeIn
                  key={step.num}
                  delay={i * 0.08}
                  className="flex-shrink-0 w-[220px] sm:w-[240px] lg:w-auto"
                >
                  <div className="group">
                    <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 240px, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
                          {step.num}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pr-2">
                      <h3 className="font-bold text-white mb-1.5 text-lg">
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="bg-gray-50 py-20 lg:py-28 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#0055ba] mb-3 block">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Built for Nigerian fintechs
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-4">
              Everything you need to underwrite loans with confidence
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <RiFlashlightLine className="h-5 w-5" />,
                title: "Real-time Analysis",
                desc: "Credit decisions in under 30 seconds. Process applications while customers wait — no batch jobs, no delays.",
                color: "blue",
              },
              {
                icon: <RiStockLine className="h-5 w-5" />,
                title: "Cashflow-Based Scoring",
                desc: "Go beyond traditional credit scores. Analyze income patterns, spending discipline, and account health from live bank data.",
                color: "green",
              },
              {
                icon: <RiLockLine className="h-5 w-5" />,
                title: "Mono Integration",
                desc: "Securely access verified bank data from your customers' accounts with their consent via Mono Open Banking.",
                color: "blue",
              },
              {
                icon: <RiShieldCheckLine className="h-5 w-5" />,
                title: "Configurable Risk Policy",
                desc: "Set your own score thresholds, affordability caps, and knockout rules. The engine adapts to your lending standards.",
                color: "green",
              },
              {
                icon: <RiGlobalLine className="h-5 w-5" />,
                title: "Nigerian Context",
                desc: "Scoring weights, income patterns, and risk signals tuned specifically for the Nigerian lending market.",
                color: "blue",
              },
              {
                icon: <RiCheckboxCircleLine className="h-5 w-5" />,
                title: "Full Explainability",
                desc: "Every decision ships with key strengths, weaknesses, and a human-readable primary reason — ready for compliance review.",
                color: "green",
              },
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition h-full">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 ${
                      feature.color === "blue"
                        ? "bg-[#0055ba]/10 text-[#0055ba]"
                        : "bg-[#59a927]/10 text-[#59a927]"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* More Reasons */}
      <section
        id="reasons"
        className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
            <FadeIn className="lg:col-span-2 lg:sticky lg:top-28">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#0055ba] mb-3 block">
                Data Signals
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
                More reasons to say yes — or know when to say no
              </h2>
              <p className="text-base text-gray-500 leading-relaxed">
                Traditional credit scores tell part of the story. We analyze the
                full picture so your team makes confident lending decisions, not
                guesses.
              </p>
            </FadeIn>

            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "₦",
                  title: "Cashflow Patterns",
                  desc: "Track income stability, consistency, and month-on-month growth to predict repayment capacity.",
                },
                {
                  icon: <RiStockLine className="h-4 w-4" />,
                  title: "Spending Behavior",
                  desc: "Understand financial discipline through spending patterns, volatility, and money management habits.",
                },
                {
                  icon: <RiShieldCheckLine className="h-4 w-4" />,
                  title: "Debt Service Capacity",
                  desc: "Calculate real affordability with the 35% DTI rule and Nigerian lending best practices.",
                },
                {
                  icon: <RiCheckboxCircleLine className="h-4 w-4" />,
                  title: "Account Health",
                  desc: "Assess banking relationship strength, overdraft history, and account tenure.",
                },
                {
                  icon: <RiBarChart2Line className="h-4 w-4" />,
                  title: "Transaction Analysis",
                  desc: "Deep-dive into income sources, recency, regularity, and transaction-level categorisation.",
                },
                {
                  icon: <RiGlobalLine className="h-4 w-4" />,
                  title: "Nigerian Context",
                  desc: "Algorithms designed specifically for the Nigerian lending market, income profiles, and banking behavior.",
                },
              ].map((reason, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="p-5 bg-white border border-gray-100 rounded-xl hover:border-[#59a927]/40 hover:shadow-sm transition h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#59a927]/10 rounded-lg flex items-center justify-center text-[#59a927] font-bold text-lg">
                        {reason.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1.5">
                          {reason.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {reason.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section
        id="api"
        className="bg-[#0a0f1e] py-20 lg:py-28 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn className="order-2 lg:order-1">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#0055ba] mb-3 block">
                Developer First
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
                Simple, powerful API
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Integrate credit scoring into your lending platform in minutes.
                RESTful API with a structured, predictable response format.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Multi-tenant architecture — one API key per fintech",
                  "Per-request risk policy overrides",
                  "Full decision explainability in every response",
                  "Comprehensive validation and error handling",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <RiCheckboxCircleLine className="w-5 h-5 text-[#59a927] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0a0f1e] bg-white rounded-lg hover:bg-gray-100 transition"
              >
                View Documentation
                <RiCodeSSlashLine className="w-4 h-4" />
              </Link>
            </FadeIn>

            <FadeIn className="order-1 lg:order-2" delay={0.1}>
              <div className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    POST /applications
                  </span>
                </div>
                <pre className="p-5 text-xs text-gray-300 overflow-x-auto leading-relaxed">
                  <code>{`const response = await fetch(
  'https://api.mono-parser.com/applications',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      applicantId: 'usr_abc123',
      amount: 100000,
      tenor: 6,
      interestRate: 5.0
    })
  }
);

// Response
{
  "decision": "APPROVED",
  "score": 712,
  "score_band": "LOW_RISK",
  "approval_details": {
    "approved_amount": 100000,
    "approved_tenor": 6,
    "monthly_payment": 17857,
    "dti_ratio": 0.243
  },
  "explainability": {
    "primary_reason": "Strong income stability...",
    "key_strengths": ["Consistent salary income"],
    "key_weaknesses": []
  }
}`}</code>
                </pre>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-2xl bg-[#0055ba] overflow-hidden p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-xl" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  You have the capital.
                  <br />
                  We help you decide.
                </h2>
                <p className="text-white/75 text-lg mb-8 max-w-xl mx-auto">
                  Join Nigerian fintechs using Mono-Parser to reduce default
                  rates and approve more of the right loans.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 text-base font-semibold bg-white text-[#0055ba] rounded-lg hover:bg-gray-50 transition"
                  >
                    Get API Access <RiArrowRightLine className="h-4 w-4" />
                  </Link>
                  <a
                    href="mailto:support@firstsoftware-systems.com"
                    className="inline-flex items-center justify-center px-7 py-3 text-base font-semibold border-2 border-white/30 text-white rounded-lg hover:bg-white/10 transition"
                  >
                    Talk to Sales
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0f1e] border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-bold text-white">
                Mono-Parser
              </span>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                Credit scoring and loan underwriting for Nigerian fintechs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">
                Product
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="text-gray-500 hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#api" className="text-gray-500 hover:text-white transition">
                    API
                  </a>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-500 hover:text-white transition">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">
                Company
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/about" className="text-gray-500 hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-500 hover:text-white transition">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">
                Legal
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="text-gray-500 hover:text-white transition">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-500 hover:text-white transition">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Mono-Parser. Built by First Software Systems.
          </div>
        </div>
      </footer>
    </div>
  );
}
