import Hero from "./components/landing/Hero";
import Navbar from "./components/landing/Navbar";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#2b2344]">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      />
      <Navbar />
      <Hero />
    </main>
  );
}