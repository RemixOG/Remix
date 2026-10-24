import React from "react";
import { motion } from "framer-motion";
import GlassContainer from "../Global/GlassContainer";
import { Heart } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

const genStar = () => ({
  x: Math.random() * 300,
  delay: Math.random() * 2,
  duration: 3 + Math.random() * 3,
  size: 10 + Math.random() * 10,
  rotate: Math.random() * 180,
  drift: (Math.random() - 0.5) * 50,
});

const Donate: React.FC = () => {
  const stars = Array.from(
    { length: 10 /* change if u want more stars */ },
    genStar
  );

  return (
    <GlassContainer className="bg-glass-noise relative max-w-[350px] w-full border border-white/20 p-5 rounded-lg text-white/90 flex flex-row items-center gap-6 overflow-hidden">
      {stars.map((p, i) => (
        <motion.img
          key={i}
          src="./StellarStar.png"
          className="absolute pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))",
          }}
          initial={{
            y: -90,
            x: p.x,
            opacity: 0,
            rotate: 0,
            scale: 0.8,
          }}
          animate={{
            y: 250,
            x: p.x + p.drift,
            opacity: [0, 0.9, 0],
            rotate: p.rotate,
            scale: [0.8, 1.2, 0.8], // twinkle twinkle little star
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center gap-3">
          <Heart size={20} className="text-white/80" />
          <h2 className="text-xl font-bold tracking-wide">SUPPORT STELLAR</h2>
        </div>

        <p className="text-white/80 text-sm max-w-[330px] leading-snug mb-4">
          Donate to unlock{" "}
          <span className="text-white font-semibold">exclusive perks </span>
          and help us keep the servers online.
        </p>

        <button
          onClick={() => open("https://stellarogfn.sell.app/")}
          className="bg-white/10 cursor-pointer hover:bg-white/20 border border-white/20 text-white rounded-md backdrop-blur-md transition-colors duration-200 px-4 py-2 font-medium"
        >
          Donate Now
        </button>
      </div>
    </GlassContainer>
  );
};

export default Donate;
