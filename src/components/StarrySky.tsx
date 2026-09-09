import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  PointsMaterial,
  ShaderMaterial,
} from "three";
import { createGlowTexture } from "../utils/sprites";

type StarrySkyProps = {
  progress: number;
};

const SKY_RADIUS = 60;
const STAR_COUNT = 170;
const STAR_RADIUS = 48;
const BOKEH_COUNT = 16;
const BOKEH_RADIUS = 26;

const skyVertexShader = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uGlowColor;
  uniform float uOpacity;
  varying vec3 vPos;
  void main() {
    float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = mix(uHorizonColor, uTopColor, pow(h, 0.6));
    float glow = smoothstep(0.3, 0.0, h) * 0.12;
    color += uGlowColor * glow;
    gl_FragColor = vec4(color, uOpacity);
  }
`;

function buildField(count: number, radius: number, minElevation: number) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const elevation = minElevation + Math.random() * (1 - minElevation);
    const phi = Math.acos(elevation);
    const theta = Math.random() * Math.PI * 2;

    const idx = i * 3;
    positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = radius * Math.cos(phi);
    positions[idx + 2] = radius * Math.sin(phi) * Math.sin(theta);

    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.5 + Math.random() * 1.2;
  }

  return { positions, phases, speeds };
}

export function StarrySky({ progress }: StarrySkyProps) {
  const skyMaterialRef = useRef<ShaderMaterial>(null);
  const starMaterialRef = useRef<PointsMaterial>(null);
  const bokehMaterialRef = useRef<PointsMaterial>(null);
  const starGeometryRef = useRef<BufferGeometry>(null);
  const bokehGeometryRef = useRef<BufferGeometry>(null);
  const progressRef = useRef(progress);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    return () => {
      glowTexture.dispose();
    };
  }, [glowTexture]);

  const skyUniforms = useMemo(
    () => ({
      uTopColor: { value: new Color("#070a1e") },
      uHorizonColor: { value: new Color("#3a2c58") },
      uGlowColor: { value: new Color("#ffcf7a") },
      uOpacity: { value: 0 },
    }),
    []
  );

  const stars = useMemo(() => {
    const field = buildField(STAR_COUNT, STAR_RADIUS, 0.05);
    const baseColors = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i += 1) {
      const warm = Math.random() < 0.25;
      const color = warm ? new Color("#ffe9c4") : new Color("#ffffff");
      baseColors[i * 3] = color.r;
      baseColors[i * 3 + 1] = color.g;
      baseColors[i * 3 + 2] = color.b;
    }
    const displayColors = new Float32Array(baseColors);
    return { ...field, baseColors, displayColors };
  }, []);

  const bokeh = useMemo(() => {
    const field = buildField(BOKEH_COUNT, BOKEH_RADIUS, 0.25);
    const baseColors = new Float32Array(BOKEH_COUNT * 3);
    for (let i = 0; i < BOKEH_COUNT; i += 1) {
      const color = new Color("#ffcf7a").lerp(
        new Color("#ffe9c4"),
        Math.random()
      );
      baseColors[i * 3] = color.r;
      baseColors[i * 3 + 1] = color.g;
      baseColors[i * 3 + 2] = color.b;
    }
    return { ...field, baseColors };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = progressRef.current;

    if (skyMaterialRef.current) {
      skyMaterialRef.current.uniforms.uOpacity.value = p;
    }
    if (starMaterialRef.current) {
      starMaterialRef.current.opacity = p;
    }
    if (bokehMaterialRef.current) {
      bokehMaterialRef.current.opacity = p * 0.8;
    }

    const starColorAttr = starGeometryRef.current?.getAttribute(
      "color"
    ) as BufferAttribute | undefined;
    if (starColorAttr) {
      for (let i = 0; i < STAR_COUNT; i += 1) {
        const twinkle =
          0.55 + 0.45 * Math.sin(t * stars.speeds[i] + stars.phases[i]);
        stars.displayColors[i * 3] = stars.baseColors[i * 3] * twinkle;
        stars.displayColors[i * 3 + 1] = stars.baseColors[i * 3 + 1] * twinkle;
        stars.displayColors[i * 3 + 2] = stars.baseColors[i * 3 + 2] * twinkle;
      }
      starColorAttr.array.set(stars.displayColors);
      starColorAttr.needsUpdate = true;
    }

    const bokehPosAttr = bokehGeometryRef.current?.getAttribute(
      "position"
    ) as BufferAttribute | undefined;
    if (bokehPosAttr) {
      for (let i = 0; i < BOKEH_COUNT; i += 1) {
        const drift =
          Math.sin(t * bokeh.speeds[i] * 0.3 + bokeh.phases[i]) * 0.6;
        bokehPosAttr.setY(i, bokeh.positions[i * 3 + 1] + drift);
      }
      bokehPosAttr.needsUpdate = true;
    }
  });

  return (
    <>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[SKY_RADIUS, 32, 32]} />
        <shaderMaterial
          ref={skyMaterialRef}
          side={BackSide}
          transparent
          depthWrite={false}
          uniforms={skyUniforms}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
        />
      </mesh>

      <points renderOrder={-9}>
        <bufferGeometry ref={starGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[stars.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[stars.displayColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={starMaterialRef}
          map={glowTexture}
          size={0.7}
          vertexColors
          transparent
          depthWrite={false}
          opacity={0}
          sizeAttenuation
          blending={AdditiveBlending}
        />
      </points>

      <points renderOrder={-8}>
        <bufferGeometry ref={bokehGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[bokeh.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[bokeh.baseColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={bokehMaterialRef}
          map={glowTexture}
          size={5}
          vertexColors
          transparent
          depthWrite={false}
          opacity={0}
          sizeAttenuation
          blending={AdditiveBlending}
        />
      </points>
    </>
  );
}
