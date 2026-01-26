'use client'
import { useState, useEffect } from 'react'
import Link from "next/link";
import { ArrowRight, Menu, X, Shield } from "lucide-react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div
        className={`fixed z-50 left-0 right-0 flex justify-center transition-all duration-300 ${
          scrolled ? 'top-2 sm:top-4' : 'top-0'
        }`}
      >
        <div
          className={`bg-white transition-all duration-300 flex items-center justify-between ${
            scrolled
              ? 'max-w-5xl w-[95%] sm:w-[90%] py-2 sm:py-3 px-4 sm:px-6 md:px-8 shadow-lg rounded-lg sm:rounded-xl border border-gray-100'
              : 'max-w-7xl w-full py-3 sm:py-4 px-4 sm:px-6 md:px-10 rounded-none border-b border-gray-100'
          }`}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#0055ba]">Mono-Parser</span>
          </Link>

          <nav className="hidden items-center gap-4 lg:gap-6 xl:gap-8 text-xs sm:text-sm font-semibold text-gray-600 md:flex">
            <a href="#features" className="hover:text-[#0055ba] transition-colors whitespace-nowrap">
              Features
            </a>
            <a href="#reasons" className="hover:text-[#0055ba] transition-colors whitespace-nowrap">
              Why Us
            </a>
            <a href="#api" className="hover:text-[#0055ba] transition-colors whitespace-nowrap">
              API
            </a>
          </nav>

          <Link
            href="/login"
            className="hidden md:flex items-center gap-1.5 sm:gap-2 bg-[#0055ba] text-white rounded-lg px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-[#004494] transition whitespace-nowrap"
          >
            Get Started
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 text-gray-600 hover:text-[#0055ba] transition-colors rounded-lg hover:bg-gray-50"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>
        </div>
      </div>

      {/* Backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Slide-in menu */}
      <div className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-100">
          <span className="text-base sm:text-lg font-bold text-[#0055ba]">Parser</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col h-[calc(100%-80px)]">
          <div className="space-y-4 sm:space-y-6 flex-1">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 hover:text-[#0055ba] border-b border-gray-100 transition-colors font-medium"
            >
              Features
            </a>
            <a 
              href="#reasons" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 hover:text-[#0055ba] border-b border-gray-100 transition-colors font-medium"
            >
              Why Us
            </a>
            <a 
              href="#api" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-2.5 sm:py-3 text-sm sm:text-base text-gray-600 hover:text-[#0055ba] border-b border-gray-100 transition-colors font-medium"
            >
              API
            </a>
          </div>

          <div className="mt-auto pt-4 sm:pt-6 border-t border-gray-100 space-y-3 sm:space-y-4">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0055ba] px-4 py-2.5 sm:py-3 text-sm font-semibold text-white hover:bg-[#004494] transition active:scale-95"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-1.5 sm:gap-2">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#59a927]" />
                Built for Nigerian Fintechs
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;