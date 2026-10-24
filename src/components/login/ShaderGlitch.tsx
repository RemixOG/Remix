import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  LinearFilter,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector4,
} from "three";
import remixLogo from "../../assets/image.png";

// ============================================================
// CHANGE HERE — EFFECT SETTINGS
// ============================================================
const GLITCH_DURATION = 0.65; // Match login glitch timing
const DISTORTION = 0.075;     // Strength of horizontal tearing
const COLOR_SPLIT = 0.014;    // Chromatic separation

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec4 uLogoRect;
  uniform float uTime;
  uniform float uProgress;
  uniform float uDistortion;
  uniform float uColorSplit;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float pulse(float x, float start, float end) {
    return smoothstep(start, start + 0.06, x) *
           (1.0 - smoothstep(end - 0.06, end, x));
  }

  vec4 logoSample(vec2 uv) {
    if (
      uv.x < 0.0 || uv.x > 1.0 ||
      uv.y < 0.0 || uv.y > 1.0
    ) return vec4(0.0);

    return texture2D(uTexture, uv);
  }

  void main() {
    vec2 pixel = gl_FragCoord.xy;

    // Convert screen coordinates into original logo coordinates.
    vec2 uv = (pixel - uLogoRect.xy) / uLogoRect.zw;

    float p = uProgress;

    if (p <= 0.0 || p >= 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Animation stages
    float disturbance = pulse(p, 0.06, 0.44);
    float tearing = pulse(p, 0.24, 0.94);
    float collapse = smoothstep(0.67, 1.0, p);

    float tick = floor(uTime * 38.0);

    // ========================================================
    // WAVE DISTORTION — smooth travelling waves
    // ========================================================
    float wave =
      sin(uv.y * 28.0 - uTime * 27.0) *
      sin(uv.y * 9.0 + uTime * 11.0);

    float waveShift = wave * 0.017 * disturbance;

    // ========================================================
    // SHARP TEARING — displaced horizontal regions
    // ========================================================
    float bandId = floor(uv.y * 21.0);
    float bandRandom = hash(vec2(bandId, tick));

    float selectedBand = step(0.67, bandRandom);

    float sliceShift =
      (bandRandom - 0.5) *
      2.0 *
      uDistortion *
      selectedBand *
      tearing;

    // Smaller fragments inside the large tear bands
    float thinBand = floor(uv.y * 67.0);

    float fragmentShift =
      (hash(vec2(thinBand, tick + 17.0)) - 0.5) *
      0.028 *
      tearing;

    float shift = waveShift + sliceShift + fragmentShift;

    vec2 distortedUV = uv + vec2(shift, 0.0);

    // ========================================================
    // DATAMOSH SMEAR — samples drag in one direction
    // ========================================================
    vec4 base = logoSample(distortedUV);

    vec4 smear = vec4(0.0);

    float smearDistance =
      (0.025 + abs(sliceShift) * 1.5) *
      (disturbance + tearing);

    for (int i = 0; i < 8; i++) {
      float t = float(i) / 7.0;

      vec2 trailUV = distortedUV - vec2(
        t * smearDistance,
        sin(t * 12.0 + uTime * 8.0) * 0.002 * tearing
      );

      vec4 sampleColor = logoSample(trailUV);

      float weight = 1.0 - t * 0.8;
      smear += sampleColor * weight;
    }

    smear /= 5.2;

    float smearAmount =
      clamp(
        (disturbance * 0.35 + tearing * 0.65) *
        (0.35 + selectedBand * 0.65),
        0.0,
        0.85
      );

    vec4 image = mix(base, smear, smearAmount);

    // ========================================================
    // CHROMATIC SPLITTING — remix overlay palette
    // ========================================================
    float separation =
      uColorSplit *
      (disturbance + tearing) *
      (0.5 + selectedBand);

    vec4 left = logoSample(
      distortedUV - vec2(separation, 0.0)
    );

    vec4 right = logoSample(
      distortedUV + vec2(separation, 0.0)
    );

    vec3 blue = vec3(0.08, 0.24, 0.91);
    vec3 pink = vec3(1.0, 0.16, 0.70);
    vec3 lime = vec3(0.55, 1.0, 0.30);
    vec3 orange = vec3(1.0, 0.53, 0.12);

    // Separate outlines only where displaced image exists.
    float leftEdge = max(0.0, left.a - base.a);
    float rightEdge = max(0.0, right.a - base.a);

    vec3 color = image.rgb;

    color = mix(
      color,
      blue,
      clamp(leftEdge * tearing * 0.9, 0.0, 1.0)
    );

    color = mix(
      color,
      pink,
      clamp(rightEdge * tearing * 0.9, 0.0, 1.0)
    );

    float extraEdge = max(leftEdge, rightEdge);

    float paletteNoise = hash(vec2(bandId, tick * 0.5));

    vec3 accent = paletteNoise > 0.7
      ? lime
      : orange;

    color = mix(
      color,
      accent,
      extraEdge * tearing * 0.3
    );

    // Brief colored displacement inside some real image fragments.
    float colorBurst =
      step(0.84, bandRandom) *
      tearing *
      image.a *
      0.30;

    color = mix(color, paletteNoise > 0.5 ? pink : lime, colorBurst);

    // ========================================================
    // FINAL BREAKUP
    // ========================================================
    float flicker =
      step(
        0.28,
        hash(vec2(bandId + 9.0, tick))
      );

    float alpha = max(
      image.a,
      max(leftEdge, rightEdge) * tearing
    );

    alpha *= mix(1.0, flicker, collapse);
    alpha *= 1.0 - smoothstep(0.88, 1.0, p);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

function GlitchScene({ active }: { active: boolean }) {
  const materialRef = useRef<ShaderMaterial>(null);
  const startedAt = useRef(0);
  const previousActive = useRef(false);
  const logoTexture = useLoader(TextureLoader, remixLogo);

  useEffect(() => {
    logoTexture.minFilter = LinearFilter;
    logoTexture.magFilter = LinearFilter;
    logoTexture.needsUpdate = true;
  }, [logoTexture]);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: logoTexture },
      uResolution: { value: new Vector2(1, 1) },
      uLogoRect: { value: new Vector4(0, 0, 1, 1) },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uDistortion: { value: DISTORTION },
      uColorSplit: { value: COLOR_SPLIT },
    }),
    [logoTexture]
  );

  useFrame(({ clock, size, gl }) => {
    const material = materialRef.current;
    if (!material) return;

    const now = clock.elapsedTime;

    if (active && !previousActive.current) {
      startedAt.current = now;
    }

    previousActive.current = active;

    const dpr = gl.getPixelRatio();

    // CHANGE HERE — Posterized glitch animation
    // The shader updates visually at 6 FPS, while React/WebGL
    // continue rendering normally.
    const GLITCH_FPS = 6;

    const elapsed = Math.max(0, now - startedAt.current);
    const steppedTime =
      Math.floor(elapsed * GLITCH_FPS) / GLITCH_FPS;

    material.uniforms.uTime.value = steppedTime;
    material.uniforms.uProgress.value = active
      ? Math.min(steppedTime / GLITCH_DURATION, 1)
      : 0;

    material.uniforms.uResolution.value.set(
      size.width * dpr,
      size.height * dpr
    );

    const logo = document.querySelector<HTMLElement>(
      ".remix-login-logo"
    );

    if (logo) {
      const rect = logo.getBoundingClientRect();

      material.uniforms.uLogoRect.value.set(
        rect.left * dpr,
        (size.height - rect.bottom) * dpr,
        rect.width * dpr,
        rect.height * dpr
      );
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function ShaderGlitch({
  active,
}: {
  active: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[1000] ${
        active ? "visible" : "invisible"
      }`}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        frameloop={active ? "always" : "demand"}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <Suspense fallback={null}>
          <GlitchScene active={active} />
        </Suspense>
      </Canvas>
    </div>
  );
}
