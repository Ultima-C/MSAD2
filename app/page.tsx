"use client";

import { useState, useEffect } from "react";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";

// Component imports
import Navbar from "../components/landing/navbar";
import Hero from "../components/landing/hero";
import Metrics from "../components/landing/metrics";
import Comparison from "../components/landing/comparison";
import Features from "../components/landing/features";
import FinalCTA from "../components/landing/final-cta";
import Footer from "../components/landing/footer";
import { SpaceBackground, FloatingOrb } from "../components/space-effects";

export default function LandingPage() {
  const [navHidden, setNavHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    const previous = scrollY.getPrevious();
    if (previous !== undefined && latest > previous && latest > 150) {
      setNavHidden(true);
    } else {
      setNavHidden(false);
    }
  });

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    setScrollProgress(latest);
  });

  // Smooth scroll behavior
  useEffect(() => {
    const handleSmoothScroll = (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLAnchorElement;
      const href = target.getAttribute("href");
      if (href && href.startsWith("#")) {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach((anchor) => {
      anchor.addEventListener("click", handleSmoothScroll);
    });

    return () => {
      anchors.forEach((anchor) => {
        anchor.removeEventListener("click", handleSmoothScroll);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* ── Space Background ── */}
      <SpaceBackground />

      {/* ── Floating Orbs ── */}
      <FloatingOrb delay={0} />
      <FloatingOrb delay={2} />
      <FloatingOrb delay={4} />

      {/* ── Fonts & Global Styles ── */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .font-sora { font-family: 'Sora', sans-serif; }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          display: flex;
          align-items: center;
          width: max-content;
        }
        .animate-marquee:hover { animation-play-state: paused; }
        html {
          scroll-behavior: smooth;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 80px rgba(99, 102, 241, 0.5); }
        }
        @keyframes shoot-star {
          0% { 
            transform: translateX(-100%) translateY(-100%);
            opacity: 1;
          }
          100% { 
            transform: translateX(500px) translateY(500px);
            opacity: 0;
          }
        }
        .glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* ── Scroll Progress Bar with Glow ── */}
      {mounted && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 z-50 origin-left shadow-lg"
          style={{
            scaleX: scrollProgress,
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.8)",
          }}
        />
      )}

      {/* ── Components ── */}
      <div className="relative z-10">
        <Navbar navHidden={navHidden} />
        <Hero />
        <Metrics />
        <Comparison />
        <Features />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}
