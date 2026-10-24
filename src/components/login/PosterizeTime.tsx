import { useEffect, useRef } from "react";
import html2canvas from "html2canvas-pro";

// CHANGE HERE
const FPS = 6;
const FRAME_INTERVAL = 1000 / FPS;

type Props = {
  active: boolean;
  targetSelector: string;
};

export default function PosterizeTime({
  active,
  targetSelector,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const source = document.querySelector<HTMLElement>(targetSelector);
    const output = canvasRef.current;

    if (!source || !output) return;

    const context = output.getContext("2d", {
      alpha: false,
    });

    if (!context) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const capture = async () => {
      if (cancelled) return;

      const started = performance.now();

      try {
        const snapshot = await html2canvas(source, {
          backgroundColor: "#0a0a0a",
          scale: 1,
          logging: false,
          useCORS: true,
        });

        if (cancelled) return;

        // Keep a complete frame unchanged between captures.
        if (
          output.width !== snapshot.width ||
          output.height !== snapshot.height
        ) {
          output.width = snapshot.width;
          output.height = snapshot.height;
        }

        context.clearRect(
          0,
          0,
          output.width,
          output.height
        );

        context.drawImage(snapshot, 0, 0);
      } catch (error) {
        console.error("Posterize Time capture failed:", error);
      }

      if (cancelled) return;

      // Never overlap capture jobs. Each completed frame is held.
      const elapsed = performance.now() - started;

      timer = setTimeout(
        capture,
        Math.max(0, FRAME_INTERVAL - elapsed)
      );
    };

    void capture();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [active, targetSelector]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1500] h-screen w-screen"
      style={{
        imageRendering: "auto",
      }}
    />
  );
}
