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
          scrolled ? 'top-4' : 'top-0'
        }`}
      >
        <div
          className={`bg-white transition-all duration-300 flex items-center justify-between gap-8 ${
            scrolled
              ? 'max-w-5xl w-[90%] py-3 px-8 shadow-lg rounded-xl border border-gray-100'
              : 'max-w-7xl w-full py-4 px-6 md:px-10 rounded-none border-b border-gray-100'
          }`}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#0055ba]">Mono-Parser</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-600 md:flex">
            <a href="#features" className="hover:text-[#0055ba] transition-colors">
              Features
            </a>
            <a href="#reasons" className="hover:text-[#0055ba] transition-colors">
              Why Us
            </a>
            <a href="#api" className="hover:text-[#0055ba] transition-colors">
              API
            </a>
          </nav>

          <Link
            href="/login"
            className="hidden md:flex items-center gap-2 bg-[#0055ba] text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-[#004494] transition"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-[#0055ba] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <span className="font-bold text-[#0055ba]">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex flex-col h-full">
          <div className="space-y-6 flex-1">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-3 text-gray-600 hover:text-[#0055ba] border-b border-gray-100 transition-colors font-medium"
            >
              Features
            </a>
            <a 
              href="#reasons" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-3 text-gray-600 hover:text-[#0055ba] border-b border-gray-100 transition-colors font-medium"
            >
              Why Us
            </a>
            <a 
              href="#api" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-3 text-gray-600 hover:text-[#0055ba] border-b border-gray-100 transition-colors font-medium"
            >
              API
            </a>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 space-y-4">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0055ba] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004494] transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-[#59a927]" />
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