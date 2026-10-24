import { useState } from "react";
import { Minus, X, Volume2, VolumeX } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import songOne from "../../assets/s o to my stalkers.mp3";
import songTwo from "../../assets/Varg2™ — DNA PLAY (Feat. Bladee & Ecco2k).mp3";

const track = Math.random() < 0.5 ? songOne : songTwo;
let audio: HTMLAudioElement | null = null;


let musicContext: AudioContext | null = null;
let musicAnalyser: AnalyserNode | null = null;
let musicFrame = 0;
let smoothedLevel = 0;

function startMusicVisualization(element: HTMLAudioElement) {
  try {
    if (!musicAnalyser) {
      musicContext = new AudioContext();
      const source = musicContext.createMediaElementSource(element);
      musicAnalyser = musicContext.createAnalyser();
      musicAnalyser.fftSize = 512;
      musicAnalyser.smoothingTimeConstant = 0.78;

      source.connect(musicAnalyser);
      musicAnalyser.connect(musicContext.destination);
    }

    void musicContext?.resume();

    cancelAnimationFrame(musicFrame);

    const analyser = musicAnalyser;
    const levels = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (element.paused) {
        document.documentElement.style.setProperty("--remix-beat", "0");
        return;
      }

      analyser.getByteFrequencyData(levels);

      // Emphasize the low and mid frequencies for a soft
      // response to bass, kicks, and the body of the track.
      const count = Math.min(38, levels.length);
      let total = 0;

      for (let i = 2; i < count; i++) {
        total += levels[i];
      }

      const average = total / Math.max(1, count - 2) / 255;
      const target = Math.max(0, Math.min(1, average * 2.1));

      smoothedLevel += (target - smoothedLevel) * 0.16;

      document.documentElement.style.setProperty(
        "--remix-beat",
        smoothedLevel.toFixed(3)
      );

      musicFrame = requestAnimationFrame(tick);
    };

    musicFrame = requestAnimationFrame(tick);
  } catch (error) {
    console.warn("Music visualization unavailable:", error);
  }
}

function stopMusicVisualization() {
  cancelAnimationFrame(musicFrame);
  document.documentElement.style.setProperty("--remix-beat", "0");
}


let fadeFrame = 0;

export function fadeOutLoginMusic(duration = 1200) {
  if (!audio || audio.paused) return;

  cancelAnimationFrame(fadeFrame);

  const element = audio;
  const startVolume = element.volume;
  let startTime: number | null = null;

  const animate = (time: number) => {
    if (startTime === null) startTime = time;

    const progress = Math.min(
      (time - startTime) / duration,
      1
    );

    // Smooth ease-in-out rather than a linear fade.
    const eased = progress * progress * (3 - 2 * progress);

    element.volume = startVolume * (1 - eased);

    if (progress < 1) {
      fadeFrame = requestAnimationFrame(animate);
    } else {
      element.pause();
      element.currentTime = 0;
      element.volume = 0.14;
      stopMusicVisualization();
    }
  };

  fadeFrame = requestAnimationFrame(animate);
}

export default function LoginChrome() {
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    if (!audio) {
      audio = new Audio(track);
      audio.loop = true;
      audio.volume = 0.14;
    }

    if (playing) {
      audio.pause();
      stopMusicVisualization();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        startMusicVisualization(audio);
        setPlaying(true);
      } catch (error) {
        console.error("Audio playback:", error);
      }
    }
  };

  const win = getCurrentWindow();

  return (
    <>
      <div className="remix-window-buttons">
        <button
          title="Minimize"
          onClick={() => void win.minimize()}
        >
          <Minus size={19} strokeWidth={1.5} />
        </button>

        <button
          title="Close"
          onClick={() => void win.close()}
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <button
        title={playing ? "Pause music" : "Play music"}
        className="remix-volume-button"
        onClick={() => void toggle()}
      >
        {playing ? <Volume2 size={20} strokeWidth={1.5} /> : <VolumeX size={20} strokeWidth={1.5} />}
      </button>
    </>
  );
}
