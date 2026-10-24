import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import original from "../../assets/s o to my stalkers.mp3";
import dna from "../../assets/Varg2™ — DNA PLAY (Feat. Bladee & Ecco2k).mp3";

type Props = {
  track: "original" | "dna";
};

export default function LoginMusic({ track }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);

  const fadeTo = (audio: HTMLAudioElement, target: number) => {
    cancelAnimationFrame(frameRef.current);

    let previous = 0;

    const step = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;

      const next = audio.volume + (target - audio.volume) * Math.min(1, dt * 2);

      audio.volume = Math.max(0, Math.min(1, next));

      if (Math.abs(audio.volume - target) > 0.002) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        audio.volume = target;
        if (target === 0) audio.pause();
      }
    };

    frameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, []);

  const toggle = async () => {
    let audio = audioRef.current;

    if (!audio) {
      audio = new Audio(track === "dna" ? dna : original);
      audio.preload = "none";
      audio.loop = true;
      audio.volume = 0;
      audioRef.current = audio;
    }

    if (playing) {
      fadeTo(audio, 0);
      setPlaying(false);
      return;
    }

    try {
      cancelAnimationFrame(frameRef.current);
      await audio.play();
      fadeTo(audio, 0.14);
      setPlaying(true);
    } catch (error) {
      console.error("Music playback failed:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      title={playing ? "Mute music" : "Play music"}
      aria-label={playing ? "Mute music" : "Play music"}
      className="fixed bottom-7 right-7 z-[900] flex h-9 w-9 items-center justify-center bg-transparent text-white/60 transition-colors hover:text-white"
    >
      {playing ? (
        <Volume2 size={20} strokeWidth={1.7} />
      ) : (
        <VolumeX size={20} strokeWidth={1.7} />
      )}
    </button>
  );
}
