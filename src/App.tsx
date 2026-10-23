import remixLogo from "./assets/image.png";
import { FaDiscord } from "react-icons/fa";

function App() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a] font-bricolage text-white">
      {/* ============================================================
          BACKGROUND VIDEO
          CHANGE HERE:
          - opacity-50 = Video visibility
          - blur-[2px] = Background blur
          - object-cover = Fill window
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
          VIDEO DARK OVERLAY
          CHANGE HERE:
          - bg-black/35 = Darkness
          - Lower number = Brighter video
          ============================================================ */}
      <div className="pointer-events-none absolute inset-0 bg-black/35" />

      {/* ============================================================
          MAIN LOGIN CONTENT
          CHANGE HERE:
          - gap-6 = Space between logo and card
          ============================================================ */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {/* ============================================================
            REMIX LOGO
            CHANGE HERE:
            - w-[240px] = Logo size
            ============================================================ */}
        <div className="relative flex items-center justify-center">
          <img
            src={remixLogo}
            alt="Project Remix"
            className="h-auto w-[240px] object-contain"
          />

          {/* ============================================================
              LOGO SHINE MASK
              Clips the shine to the logo.
              ============================================================ */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              maskImage: `url(${remixLogo})`,
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat",
              WebkitMaskImage: `url(${remixLogo})`,
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
            }}
          >
            {/* ========================================================
                LOGO SHINE
                CHANGE HERE:
                - w-[40%] = Shine width
                - via-white = Brightness
                - blur-[1px] = Sharpness
                - Speed is controlled in index.css (5s)
                ======================================================== */}
            <div className="absolute inset-y-0 left-0 w-[40%] animate-logo-shine bg-linear-to-r from-transparent via-white to-transparent opacity-100 blur-[1px] motion-reduce:hidden" />
          </div>
        </div>

        {/* ============================================================
            LOGIN CARD — EDIT THIS DIV BELOW
            ============================================================

            CHANGE HERE:
            - w-[320px] = Card width
            - p-7 = Padding
            - rounded-xl = Corner roundness
            - bg-[#0a0a0a]/85 = Background/transparency
            - border-white/[0.09] = Border

            SHADOW SETTINGS:
            - 0_20px_80px = Large soft shadow
            - rgba(0,0,0,0.75) = Large shadow darkness
            - 0_4px_20px = Smaller shadow
            - rgba(0,0,0,0.5) = Smaller shadow darkness

            ============================================================ */}

        {/* ▼▼▼ LOGIN CARD OPENING DIV — CHANGE SHADOW HERE ▼▼▼ */}
        <div className="w-[320px] rounded-xl border border-white/[0.09] bg-[#0a0a0a]/85 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.75),0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* ▲▲▲ END OF LOGIN CARD OPENING DIV ▲▲▲ */}

          {/* ============================================================
              LOGIN HEADING
              CHANGE HERE:
              - text-[19px] = Font size
              - tracking-[-0.8px] = Letter spacing
              ============================================================ */}
          <h2 className="mb-1 text-[19px] font-semibold tracking-[-0.8px] text-[#f5f5f5]">
            Welcome back.
          </h2>

          {/* ============================================================
              LOGIN DESCRIPTION
              CHANGE HERE:
              - text-[12.5px] = Font size
              - text-[#8a8a8a] = Color
              - mb-6 = Bottom spacing
              ============================================================ */}
          <p className="mb-6 text-[12.5px] leading-[1.6] text-[#8a8a8a]">
            Sign in to continue to Remix.
          </p>

          {/* ============================================================
              DISCORD LOGIN BUTTON
              CHANGE HERE:
              - bg-[#eeeeee] = Background
              - hover:bg-white = Hover color
              - py-3 = Vertical padding
              - rounded-lg = Corners

              Discord authentication is not connected yet.
              ============================================================ */}
          <button
            type="button"
            className="group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-[#eeeeee] px-4 py-3 text-[13px] font-semibold text-[#111111] transition-all duration-200 hover:bg-white active:scale-[0.98]"
          >
            <FaDiscord className="text-[18px] transition-transform duration-200 group-hover:scale-110" />
            Continue with Discord
          </button>
        </div>
        {/* ▲▲▲ LOGIN CARD CLOSING DIV ▲▲▲ */}
      </div>
    </main>
  );
}

export default App;
