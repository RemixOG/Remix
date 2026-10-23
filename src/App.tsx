import remixLogo from "./assets/image.png";

import { FaDiscord } from "react-icons/fa";

// ============================================================
// REMIX LETTER POSITIONS — CHANGE HERE
//
// x      = horizontal position
// y      = vertical position
// width  = letter width
// height = letter height
// delay  = animation delay
//
// These came from the alignment script and can be adjusted.
// ============================================================

// ============================================================
// LOGO CONTAINER SIZE — CHANGE HERE
// Must match the alignment script output.
// ============================================================

// ============================================================
// CHANGE HERE — LOGO SETTINGS
// ============================================================



function App() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a] font-bricolage text-white">
      {/* ============================================================
          BACKGROUND VIDEO
          CHANGE HERE:
          - opacity-50 = Video visibility
          - blur-[2px] = Video blur
          ============================================================ */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 blur-[2px]"
      >
        <source src="/videos/remix-trailer.mp4" type="video/mp4" />
      </video>

      {/* ============================================================
          VIDEO DARK OVERLAY + VIGNETTE
          ============================================================ */}
      <div className="pointer-events-none absolute inset-0 bg-black/35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {/* ============================================================
            ORIGINAL REMIX LOGO — STATIC
            CHANGE HERE: w-[240px] controls the logo width
            ============================================================ */}
        {/* ============================================================
    REMIX LOGO + METALLIC SHINE
    CHANGE HERE:
    - w-[300px] = Logo width
    - top-[20px] = Vertical position
    ============================================================ */}
<div className="relative w-[300px] top-[20px]">
  <img
    src={remixLogo}
    alt="Project Remix"
    className="block h-auto w-full object-contain"
  />

  {/* Shine is masked to the original PNG transparency */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{
      maskImage: `url("${remixLogo}")`,
      WebkitMaskImage: `url("${remixLogo}")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
    }}
  >
    <div className="remix-metallic-shine absolute inset-0" />
  </div>
</div>

        {/* ============================================================
            LOGIN CARD
            ============================================================ */}
        <div className="animate-card-enter w-[384px] rounded-xl border border-white/[0.09] bg-[#0a0a0a]/85 p-9 shadow-[0_20px_80px_rgba(0,0,0,0.75),0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <h2 className="mb-1 text-[19px] font-semibold tracking-[-0.8px] text-[#f5f5f5]">
            Welcome back.
          </h2>

          <p className="mb-6 text-[12.5px] leading-[1.6] text-[#8a8a8a]">
            Sign in to continue to Remix.
          </p>

          <button
            type="button"
            className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-[#eeeeee] px-4 py-3 text-[13px] font-semibold text-[#111111] transition-all duration-200 hover:bg-white active:scale-[0.98]"
          >
            <FaDiscord className="text-[18px] transition-transform duration-200 group-hover:scale-110" />
            Continue with Discord
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
