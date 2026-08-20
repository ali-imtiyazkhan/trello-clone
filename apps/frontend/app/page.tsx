import Navbar from "./components/landing/Navbar";
import Hero from "./components/landing/Hero";
import Stats from "./components/landing/Stats";
import Features from "./components/landing/Features";
import HowItWorks from "./components/landing/HowItWorks";
import CtaSection from "./components/landing/CtaSection";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-[#7b39fc]/30 overflow-x-hidden">
      {/* Top Hero Section with Ambient Video */}
      <div className="relative overflow-hidden">
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-60 pointer-events-none"
          src="/hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* Soft bottom fade overlay */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-[5]" />

        <Navbar />
        <Hero />
      </div>

      {/* Live Engine Metrics */}
      <Stats />

      {/* Core Features */}
      <Features />

      {/* 3-Step Workflow */}
      <HowItWorks />

      {/* Call to Action */}
      <CtaSection />

      {/* Redesigned Footer */}
      <Footer />
    </main>
  );
}