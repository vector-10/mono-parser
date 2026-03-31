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
      className="relative bg-[#0d1117]  border border-white/10 p-6 shadow-2xl shadow-black/50 w-full max-w-sm mx-auto"
    >
      <div className="flex items-center justify- mb-6">
        <span className="text-xs text-gray-500 tracking-widest uppercase font-medium">
          Credit Analysis
        </span>
      </div>

      <div className="text-center mb-5">
        <div className="text-7xl font-bold text-white tabular-nums leading-none">
          {score}
        </div>
        <div className="text-sm text-gray-500 mt-2">Credit Score</div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>350 — Very High Risk</span>
          <span>850</span>
        </div>
        <div className="h-2 bg-white/10  overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-[#1A66C1] to-[#0055ba]  transition-all duration-75"
            style={{ width: `${barProgress}%` }}
          />
        </div>
        <div className="text-right text-xs text-[#59a927] mt-1.5 font-medium">
          LOW_RISK
        </div>
      </div>

      <div
        className={`border  p-3 text-center mb-5 transition-all duration-500 ${
          showDecision
            ? "border-[#59a927]/40"
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
      <section className="relative bg-white overflow-hidden pt-32 sm:pt-36 lg:pt-44 pb-0 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto pb-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2  border border-[#0055ba]/20 bg-[#0055ba]/5 px-4 py-1.5 text-xs font-semibold text-[#0055ba] mb-6">
                  <RiShieldCheckLine className="h-3.5 w-3.5" /> Powered by Mono
                  Open Banking
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-6"
              >
                Credit intelligence
                <br />
                <span className="text-[#0055ba]">built for Nigeria</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl"
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
                  className="inline-flex items-center justify-center gap-2 bg-[#0055ba] px-7 py-3 text-sm font-semibold text-white hover:bg-[#004494] transition shadow-lg shadow-[#0055ba]/20"
                >
                  Request Demo <RiArrowRightLine className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center 
                   border border-gray-200 px-7 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
                >
                  View API Docs
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap gap-6 text-sm text-gray-500"
              >
                {[
                  {
                    icon: (
                      <RiFlashlightLine className="h-4 w-4 text-[#0055ba]" />
                    ),
                    text: "Sub-30s decisions",
                  },
                  {
                    icon: (
                      <RiBarChart2Line className="h-4 w-4 text-[#0055ba]" />
                    ),
                    text: "30+ data signals",
                  },
                  {
                    icon: (
                      <RiCheckboxCircleLine className="h-4 w-4 text-[#0055ba]" />
                    ),
                    text: "99.9% uptime",
                  },
                ].map(({ icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 font-medium"
                  >
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

        {/* Wave into dark pipeline section */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 180"
            preserveAspectRatio="none"
            className="block w-full h-28 sm:h-36 lg:h-44"
          >
            <path
              fill="#0a0f1e"
              d="M0,160L60,144C120,128,240,96,360,90.7C480,85,600,107,720,112C840,117,960,107,1080,96C1200,85,1320,75,1380,69.3L1440,64L1440,180L1380,180C1320,180,1200,180,1080,180C960,180,840,180,720,180C600,180,480,180,360,180C240,180,120,180,60,180L0,180Z"
            />
          </svg>
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
                  className="shrink-0 w-55 sm:w-60 lg:w-auto"
                >
                  <div className="group">
                    <div className="relative  overflow-hidden aspect-3/4">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 240px, 20vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 ">
                          {step.num}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pr-2">
                      <h3 className="font-bold text-white mb-1.5 text-lg">
                        {step.title}
                      </h3>
                      <p className=" text-gray-500 leading-relaxed text-sm">
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
                <div className="bg-white  border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition h-full">
                  <div
                    className={`w-10 h-10  flex items-center justify-center mb-5 ${
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

      {/* AI Chat Interface */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#0055ba] mb-3 block">
              Built for your team
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Your team, not just your API
            </h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto">
              Loan officers get an AI assistant that understands every
              application in full — and gives straight answers when it matters.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="bg-[#0d1117]  border border-white/10 overflow-hidden shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <div className="w-2.5 h-2.5  bg-red-500/60" />
                <div className="w-2.5 h-2.5  bg-yellow-500/60" />
                <div className="w-2.5 h-2.5  bg-green-500/60" />
                <span className="ml-3 text-xs text-gray-500 font-medium">
                  AI Assistant
                </span>
              </div>

              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 bg-white/2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    Emeka Adeyemi
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    ₦2,000,000 · 18 months · 24% p.a.
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white leading-none">
                      748
                    </div>
                    <div className="text-[10px] text-[#59a927] font-semibold tracking-wide">
                      LOW_RISK
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20  px-2.5 py-1 whitespace-nowrap">
                    MANUAL REVIEW
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5 max-h-130 overflow-y-auto custom-scrollbar">
                <div className="flex justify-end">
                  <div className="bg-[#0055ba]/25 border border-[#0055ba]/25  rounded-br-sm px-4 py-2.5 max-w-[80%] sm:max-w-[70%]">
                    <p className="text-sm text-blue-100">
                      Emeka has a 748 score and earns ₦450k a month. Why was
                      this flagged for manual review?
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/8  rounded-bl-sm px-4 py-3 max-w-[88%] sm:max-w-[80%]">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Emeka&apos;s credit profile is genuinely strong — 748 puts
                      him solidly in LOW_RISK. The flag here is{" "}
                      <span className="text-white font-medium">
                        not a credit risk issue, it&apos;s an affordability
                        issue
                      </span>
                      . His verified salary of ₦450,000 gives a gross monthly
                      cap of ₦157,500 at your 35% policy. But he carries ₦45,000
                      in existing loan obligations, leaving available capacity
                      of ₦112,500. The ₦2,000,000 over 18 months generates a
                      monthly payment of ₦133,400 — ₦20,900 above what he can
                      safely service. The system protected him from being
                      over-leveraged.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-[#0055ba]/25 border border-[#0055ba]/25  rounded-br-sm px-4 py-2.5 max-w-[80%] sm:max-w-[70%]">
                    <p className="text-sm text-blue-100">
                      Break down the affordability numbers exactly for me.
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/8  rounded-bl-sm px-4 py-3 max-w-[88%] sm:max-w-[80%]">
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                      Here&apos;s the exact maths:
                    </p>
                    <div className="space-y-1.5 text-sm">
                      {[
                        ["Verified salary (Mono webhook)", "₦450,000 / mo"],
                        ["Affordability cap (35%)", "₦157,500"],
                        ["Existing obligations", "− ₦45,000"],
                        ["Available capacity", "₦112,500"],
                        ["Payment on ₦2M / 18mo at 24% p.a.", "₦133,400"],
                        ["Shortfall", "₦20,900"],
                      ].map(([label, value], i) => (
                        <div
                          key={i}
                          className={`flex justify-between gap-4 ${i === 5 ? "pt-1.5 border-t border-white/10 text-amber-400 font-semibold" : "text-gray-500"}`}
                        >
                          <span>{label}</span>
                          <span
                            className={
                              i === 5 ? "text-amber-400" : "text-white"
                            }
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed mt-3">
                      He can service a loan — just not this one at this size and
                      tenor.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-[#0055ba]/25 border border-[#0055ba]/25  rounded-br-sm px-4 py-2.5 max-w-[80%] sm:max-w-[70%]">
                    <p className="text-sm text-blue-100">
                      What counter-offer options do we have?
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/8  rounded-bl-sm px-4 py-3 max-w-[88%] sm:max-w-[80%]">
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                      Two clean options within his capacity:
                    </p>
                    <div className="space-y-2.5">
                      <div className="bg-white/5  p-3 border border-white/8">
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          Option 1 — Reduce the amount
                        </div>
                        <div className="text-sm text-white font-medium">
                          ₦1,500,000 over 18 months
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Monthly payment: ₦100,100 · ₦12,400 headroom
                        </div>
                      </div>
                      <div className="bg-white/5  p-3 border border-white/8">
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          Option 2 — Extend the tenor
                        </div>
                        <div className="text-sm text-white font-medium">
                          ₦2,000,000 over 24 months
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Monthly payment: ₦105,800 · ₦6,700 headroom
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-[#0055ba]/25 border border-[#0055ba]/25  rounded-br-sm px-4 py-2.5 max-w-[80%] sm:max-w-[70%]">
                    <p className="text-sm text-blue-100">
                      Which would you recommend?
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/8  rounded-bl-sm px-4 py-3 max-w-[88%] sm:max-w-[80%]">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      <span className="text-white font-medium">
                        Option 2 — the 24-month full amount.
                      </span>{" "}
                      Emeka requested ₦2,000,000 which suggests a specific
                      purpose. Giving him ₦1.5M may not solve his actual problem
                      and risks losing the relationship. His credit profile
                      comfortably supports a 24-month commitment, and the tenor
                      is within policy for his tier. The headroom is tight but
                      workable given his income stability. Confirm his loan
                      purpose before presenting — if it&apos;s capital
                      expenditure or asset purchase, Option 2 is the right call.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-white/5">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10  px-4 py-3">
                  <span className="text-sm text-gray-500 flex-1">
                    Ask anything about this application...
                  </span>
                  <RiArrowRightLine className="w-4 h-4 text-gray-600 shrink-0" />
                </div>
              </div>
            </div>
          </FadeIn>
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
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
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
                    <RiCheckboxCircleLine className="w-5 h-5 text-[#59a927] shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0a0f1e] bg-white  hover:bg-gray-100 transition"
              >
                View Documentation
                <RiCodeSSlashLine className="w-4 h-4" />
              </Link>
            </FadeIn>

            <FadeIn className="order-1 lg:order-2" delay={0.1}>
              <div className="bg-[#0d1117]  border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    POST /applications
                  </span>
                </div>
                <pre className="p-5 text-xs text-gray-300 overflow-x-auto max-w-full leading-relaxed whitespace-pre-wrap sm:whitespace-pre">
                  <code>{`curl -X POST https://api.mono-parser.shop/api/applications/initiate \
  -d '{
    "firstName":    "Olusegun",
    "lastName":     "Adeyemi",
    "email":        "olusegun.adeyemi@example.com",
    "phone":        "08012345678",
    "bvn":          "22345678901",
    "amount":       500000,
    "tenor":        12,
    "interestRate": 2.0,
    "purpose":      "Business expansion"
  }'

`}</code>
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
            <div className="relative  bg-[#0055ba] overflow-hidden p-10 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
              <div className="absolute -top-16 -right-16 w-48 h-48  bg-white/5 blur-xl" />
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
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 text-base font-semibold bg-white text-[#0055ba]  hover:bg-gray-50 transition"
                  >
                    Get API Access <RiArrowRightLine className="h-4 w-4" />
                  </Link>
                  <a
                    href="mailto:support@firstsoftware-systems.com"
                    className="inline-flex items-center justify-center px-7 py-3 text-base font-semibold border-2 border-white/30 text-white  hover:bg-white/10 transition"
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
              <span className="text-lg font-bold text-white">Mono-Parser</span>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                Credit scoring and loan underwriting for Nigerian fintechs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-gray-500 hover:text-white transition"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#api"
                    className="text-gray-500 hover:text-white transition"
                  >
                    API
                  </a>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-500 hover:text-white transition"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-500 hover:text-white transition"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-500 hover:text-white transition"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-500 hover:text-white transition"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-500 hover:text-white transition"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Mono-Parser. Built by First Software
            Systems.
          </div>
        </div>
      </footer>
    </div>
  );
}
