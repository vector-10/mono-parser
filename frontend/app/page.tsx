"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Lock,
  CheckCircle,
  Code,
  Globe,
  Menu,
  X,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function MonoParserLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="group inline-flex items-center">
            <span className="text-xl font-bold text-[#0055ba]">
              mono-parser
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Features
            </a>
            <a
              href="#reasons"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Why Us
            </a>
            <a
              href="#api"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              API
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-2 rounded-lg bg-[#0055ba] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#004494] transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <span className="font-bold text-[#0055ba]">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex flex-col h-full">
          <div className="space-y-6 flex-1">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-3 text-gray-600 hover:text-gray-900 border-b border-gray-100 transition"
            >
              Features
            </a>
            <a
              href="#reasons"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-3 text-gray-600 hover:text-gray-900 border-b border-gray-100 transition"
            >
              Why Us
            </a>
            <a
              href="#api"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-3 text-gray-600 hover:text-gray-900 border-b border-gray-100 transition"
            >
              API
            </a>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0055ba] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004494] transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="pt-4 text-center">
              <p className="text-sm text-gray-500">
                Built for Nigerian Fintechs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 text-center">
        <div className="space-y-8 scroll-reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0055ba]/20 bg-[#0055ba]/5 px-4 py-1.5 text-sm font-medium text-[#0055ba]">
            <Shield className="h-4 w-4" /> Powered by Mono Open Banking
          </span>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
            Credit scoring for Nigerian fintechs in{" "}
            <span className="text-[#0055ba]">minutes</span>
          </h1>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Make smarter lending decisions with real-time cashflow analysis.
            Built specifically for the Nigerian lending market.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0055ba] px-8 py-4 text-base font-semibold text-white hover:bg-[#004494] transition shadow-lg shadow-[#0055ba]/20"
            >
              Request Demo <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#api"
              className="rounded-lg border-2 border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 hover:border-gray-300 transition"
            >
              View API Docs
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 text-gray-600">
            <div className="flex items-center gap-2 font-semibold">
              <Zap className="h-5 w-5 text-[#59a927]" /> 30s average analysis
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <BarChart3 className="h-5 w-5 text-[#59a927]" /> 7 data points
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="h-5 w-5 text-[#59a927]" /> 100% API uptime
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Nigerian fintechs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to underwrite loans with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Real-time Analysis",
                desc: "Get credit decisions in seconds, not days. Process applications while customers wait.",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Cashflow-Based",
                desc: "Go beyond traditional credit scores. Analyze income patterns, spending, and account health.",
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Mono Integration",
                desc: "Seamlessly connect to any Nigerian bank account via Mono's Open Banking platform.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition scroll-reveal"
              >
                <div className="w-12 h-12 bg-[#0055ba]/10 rounded-lg flex items-center justify-center text-[#0055ba] mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Reasons Section */}
      <section id="reasons" className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Left Side - Sticky Heading */}
            <div className="lg:col-span-2 lg:sticky lg:top-24 scroll-reveal">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                More reasons to say yes or no to a loan application
              </h2>
              <p className="text-lg text-gray-600">
                Traditional credit scores tell part of the story. We analyze the
                full picture to help you make confident lending decisions.
              </p>
            </div>

            {/* Right Side - Cards Grid */}
            <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: "₦",
                  title: "Cashflow Patterns",
                  desc: "Track income stability, consistency, and growth over time to predict repayment capacity.",
                },
                {
                  icon: <TrendingUp className="h-5 w-5" />,
                  title: "Spending Behavior",
                  desc: "Understand financial discipline through spending patterns and money management habits.",
                },
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: "Debt Service Capacity",
                  desc: "Calculate real affordability with the 35% rule and Nigerian lending best practices.",
                },
                {
                  icon: <CheckCircle className="h-5 w-5" />,
                  title: "Account Health",
                  desc: "Assess banking relationship strength, overdraft history, and account age.",
                },
                {
                  icon: <BarChart3 className="h-5 w-5" />,
                  title: "Transaction Analysis",
                  desc: "Deep dive into income sources, regularity, and transaction categorization.",
                },
                {
                  icon: <Globe className="h-5 w-5" />,
                  title: "Nigerian Context",
                  desc: "Algorithms designed specifically for the Nigerian lending market and economy.",
                },
              ].map((reason, i) => (
                <div
                  key={i}
                  className="p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-[#59a927] transition scroll-reveal"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#59a927]/10 rounded-lg flex items-center justify-center text-[#59a927] font-bold text-xl">
                      {reason.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {reason.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{reason.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* API Demo Section */}
      <section id="api" className="bg-[#010101] py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="scroll-reveal">
              <h2 className="text-4xl font-bold text-white mb-6">
                Simple, powerful API
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Integrate credit scoring into your lending platform in minutes.
                RESTful API with comprehensive documentation.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#59a927] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    Multi-tenant architecture for security
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#59a927] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    Real-time WebSocket updates
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#59a927] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    Comprehensive error handling
                  </span>
                </li>
              </ul>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-[#010101] bg-white rounded-lg hover:bg-gray-100 transition"
              >
                View Documentation
                <Code className="w-5 h-5" />
              </Link>
            </div>

            {/* Code Example */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 scroll-reveal">
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`// Submit loan application
                        const response = await fetch(
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

                        const { score, decision } = await response.json();

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
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#0055ba] to-[#003d85] rounded-2xl p-12 text-center text-white shadow-2xl scroll-reveal">
            <h2 className="text-4xl font-bold mb-6">
              Ready to make better lending decisions?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join Nigerian fintechs using Mono-Parser to reduce default rates
              and approve more loans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold bg-white text-[#0055ba] rounded-lg hover:bg-gray-100 transition"
              >
                Get API Access
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="mailto:contact@mono-parser.com"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#010101] border-t border-gray-900 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="text-xl font-bold text-white">Mono-Parser</span>
              <p className="mt-4 text-gray-400 text-sm">
                Credit scoring infrastructure for Nigerian fintechs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
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
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
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
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
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
          <div className="pt-8 border-t border-gray-900 text-center text-sm text-gray-400">
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
