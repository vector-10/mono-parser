"use client";
import Header from "../components/Header";
import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Lock,
  CheckCircle,
  Code,
  Globe,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function MonoParserLanding() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-reveal");
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 text-center">
        <div className="space-y-6 sm:space-y-8 scroll-reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0055ba]/20 bg-[#0055ba]/5 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-[#0055ba]">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" /> Powered by Mono Open
            Banking
          </span>

          <h1 className="text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-gray-900 px-4">
            Credit scoring for Nigerian fintechs in{" "}
            <span className="text-[#0055ba]">minutes</span>
          </h1>

          <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-gray-600 px-4">
            Make smarter lending decisions with real-time cashflow analysis.
            Built specifically for the Nigerian lending market.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4 px-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0055ba] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white hover:bg-[#004494] transition shadow-lg shadow-[#0055ba]/20"
            >
              Request Demo <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>

            <a
              href="#api"
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-gray-900 hover:border-gray-300 transition"
            >
              View API Docs
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 pt-6 sm:pt-8 text-gray-600 text-sm sm:text-base px-4">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#59a927]" /> 30s
              average
            </div>
            <div className="flex items-center justify-center gap-2 font-semibold">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#59a927]" /> 7
              data points
            </div>
            <div className="flex items-center justify-center gap-2 font-semibold">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#59a927]" />{" "}
              100% uptime
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-gray-50 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              Built for Nigerian fintechs
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need to underwrite loans with confidence
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6" />,
                title: "Real-time Analysis",
                desc: "Get credit decisions in seconds, not days. Process applications while customers wait.",
              },
              {
                icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
                title: "Cashflow-Based",
                desc: "Go beyond traditional credit scores. Analyze income patterns, spending, and account health.",
              },
              {
                icon: <Lock className="h-5 w-5 sm:h-6 sm:w-6" />,
                title: "Mono Integration",
                desc: "Securely access data from customer accounts with their consent",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition scroll-reveal"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0055ba]/10 rounded-lg flex items-center justify-center text-[#0055ba] mb-4 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Reasons Section */}
      <section
        id="reasons"
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12 items-start">
            {/* Left Side - Heading */}
            <div className="lg:col-span-2 lg:sticky lg:top-24 scroll-reveal">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                More reasons to say "Yes" or "No" to a loan application
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Traditional credit scores tell part of the story. We analyze the
                full picture to help you make confident lending decisions.
              </p>
            </div>

            {/* Right Side - Cards Grid */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  icon: "₦",
                  title: "Cashflow Patterns",
                  desc: "Track income stability, consistency, and growth over time to predict repayment capacity.",
                },
                {
                  icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "Spending Behavior",
                  desc: "Understand financial discipline through spending patterns and money management habits.",
                },
                {
                  icon: <Shield className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "Debt Service Capacity",
                  desc: "Calculate real affordability with the 35% rule and Nigerian lending best practices.",
                },
                {
                  icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "Account Health",
                  desc: "Assess banking relationship strength, overdraft history, and account age.",
                },
                {
                  icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "Transaction Analysis",
                  desc: "Deep dive into income sources, regularity, and transaction categorization.",
                },
                {
                  icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "Nigerian Context",
                  desc: "Algorithms designed specifically for the Nigerian lending market and economy.",
                },
              ].map((reason, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-[#59a927] transition scroll-reveal"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#59a927]/10 rounded-lg flex items-center justify-center text-[#59a927] font-bold text-lg sm:text-xl">
                      {reason.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                        {reason.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {reason.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* API Demo Section */}
      <section
        id="api"
        className="bg-[#010101] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="scroll-reveal order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                Simple, powerful API
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
                Integrate credit scoring into your lending platform in minutes.
                RESTful API with comprehensive documentation.
              </p>
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#59a927] flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-300">
                    Multi-tenant architecture for security
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#59a927] flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-300">
                    Real-time WebSocket updates
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#59a927] flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-300">
                    Comprehensive error handling
                  </span>
                </li>
              </ul>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-[#010101] bg-white rounded-lg hover:bg-gray-100 transition"
              >
                View Documentation
                <Code className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>

            {/* Code Example */}
            <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800 scroll-reveal order-1 lg:order-2 overflow-hidden">
              <pre className="text-xs sm:text-sm text-gray-300 overflow-x-auto">
                <code>{`const response = await fetch(
  'https://api.mono-parser.com/applications',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      applicantId: 'abc-123',
      amount: 100000,
      tenor: 6,
      interestRate: 5.0
    })
  }
);

const data = await response.json();

// Response
{
  "score": 668,
  "decision": "APPROVED",
  "amount": 100000,
  "tenor": 6
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#0055ba] to-[#003d85] rounded-2xl p-8 sm:p-10 lg:p-12 text-center text-white shadow-2xl scroll-reveal">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Ready to make better lending decisions?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join Nigerian fintechs using Mono-Parser to reduce default rates
              and approve more loans.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-[#0055ba] rounded-lg hover:bg-gray-100 transition"
              >
                Get API Access
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>

              <a
                href="mailto:support@firstsoftware-systems.com"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#010101] border-t border-gray-900 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg sm:text-xl font-bold text-white">
                Mono-Parser
              </span>
              <p className="mt-3 sm:mt-4 text-gray-400 text-xs sm:text-sm">
                Credit scoring infrastructure for Nigerian fintechs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
                Product
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#api"
                    className="text-gray-400 hover:text-white transition"
                  >
                    API
                  </a>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
                Company
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
                Legal
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-gray-900 text-center text-xs sm:text-sm text-gray-400">
            © {new Date().getFullYear()} Mono-Parser. Built by First Software
            Systems.
          </div>
        </div>
      </footer>

      <style jsx>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease-out;
        }

        .scroll-reveal.animate-reveal {
          opacity: 1;
          transform: translateY(0);
        }

        .scroll-reveal:nth-child(even) {
          transition-delay: 0.1s;
        }

        .scroll-reveal:nth-child(3n) {
          transition-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
