import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  PointsMaterial,
  Vector3,
} from "three";
import { createGlowTexture } from "../utils/sprites";

type ConfettiProps = {
  isActive: boolean;
  origin?: [number, number, number];
};

const CONFETTI_COUNT = 90;
const GRAVITY = -1.4;
const COLORS = ["#ff5470", "#ff9f43", "#ffd166", "#2bc9c9", "#a06cff", "#ffffff"];

type ConfettiData = {
  positions: Float32Array;
  origins: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  swayFreq: Float32Array;
  swayPhase: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
};

export function Confetti({ isActive, origin = [0, 5, -14] }: ConfettiProps) {
  const geometryRef = useRef<BufferGeometry>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const dataRef = useRef<ConfettiData | null>(null);
  const baseOrigin = useMemo(() => new Vector3(...origin), [origin]);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  useEffect(() => {
    return () => {
      glowTexture.dispose();
    };
  }, [glowTexture]);

  if (!dataRef.current) {
    dataRef.current = {
      positions: new Float32Array(CONFETTI_COUNT * 3),
      origins: new Float32Array(CONFETTI_COUNT * 3),
      velocities: new Float32Array(CONFETTI_COUNT * 3),
      colors: new Float32Array(CONFETTI_COUNT * 3),
      swayFreq: new Float32Array(CONFETTI_COUNT),
      swayPhase: new Float32Array(CONFETTI_COUNT),
      ages: new Float32Array(CONFETTI_COUNT),
      lifetimes: new Float32Array(CONFETTI_COUNT),
    };
  }

  const resetParticle = (index: number) => {
    const { positions, origins, velocities, colors, swayFreq, swayPhase, ages, lifetimes } =
      dataRef.current!;

    const idx3 = index * 3;
    const burstOrigin = baseOrigin
      .clone()
      .add(new Vector3((Math.random() - 0.5) * 2.5, Math.random() * 1.5, (Math.random() - 0.5) * 2.5));

    origins[idx3] = burstOrigin.x;
    origins[idx3 + 1] = burstOrigin.y;
    origins[idx3 + 2] = burstOrigin.z;

    positions[idx3] = burstOrigin.x;
    positions[idx3 + 1] = burstOrigin.y;
    positions[idx3 + 2] = burstOrigin.z;

    velocities[idx3] = (Math.random() - 0.5) * 0.6;
    velocities[idx3 + 1] = 1.2 + Math.random() * 1.2;
    velocities[idx3 + 2] = (Math.random() - 0.5) * 0.6;

    const color = new Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
    colors[idx3] = color.r;
    colors[idx3 + 1] = color.g;
    colors[idx3 + 2] = color.b;

    swayFreq[index] = 0.8 + Math.random() * 1.2;
    swayPhase[index] = Math.random() * Math.PI * 2;

    lifetimes[index] = 2.2 + Math.random() * 1.4;
    ages[index] = -Math.random() * 1.5;
  };

  useEffect(() => {
    for (let i = 0; i < CONFETTI_COUNT; i += 1) {
      resetParticle(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const geometry = geometryRef.current;
    const material = materialRef.current;
    const data = dataRef.current;
    if (!geometry || !material || !data) {
      return;
    }

    const targetOpacity = isActive ? 0.95 : 0;
    material.opacity = MathUtils.damp(material.opacity, targetOpacity, 5, delta);

    if (!isActive && material.opacity <= 0.01) {
      return;
    }

    const { positions, origins, velocities, swayFreq, swayPhase, ages, lifetimes } = data;
    const positionAttr = geometry.getAttribute("position") as BufferAttribute;
    const colorAttr = geometry.getAttribute("color") as BufferAttribute;

    for (let i = 0; i < CONFETTI_COUNT; i += 1) {
      const idx3 = i * 3;
      ages[i] += delta;

      if (!isActive) {
        continue;
      }

      const fallHeight = origins[idx3 + 1] + velocities[idx3 + 1] * ages[i];
      if (ages[i] > lifetimes[i] || fallHeight < baseOrigin.y - 4) {
        resetParticle(i);
        continue;
      }

      if (ages[i] < 0) {
        positions[idx3] = origins[idx3];
        positions[idx3 + 1] = origins[idx3 + 1];
        positions[idx3 + 2] = origins[idx3 + 2];
        continue;
      }

      const age = ages[i];
      const sway = Math.sin(age * swayFreq[i] + swayPhase[i]) * 0.4;

      positions[idx3] = origins[idx3] + velocities[idx3] * age + sway * 0.3;
      positions[idx3 + 1] =
        origins[idx3 + 1] + velocities[idx3 + 1] * age + 0.5 * GRAVITY * age * age;
      positions[idx3 + 2] = origins[idx3 + 2] + velocities[idx3 + 2] * age;
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[dataRef.current.positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[dataRef.current.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        map={glowTexture}
        size={0.09}
        vertexColors
        transparent
        depthWrite={false}
        opacity={0}
        sizeAttenuation
        blending={AdditiveBlending}
      />
    </points>
  );
}
