import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

type BalloonsProps = {
  position: [number, number, number];
};

const COLORS = ["#ff5470", "#ff9f43", "#ffd166", "#2bc9c9", "#a06cff"];

type BalloonSpec = {
  color: string;
  offsetX: number;
  offsetZ: number;
  baseY: number;
  scale: number;
  phase: number;
  speed: number;
};

function buildBalloons(): BalloonSpec[] {
  return COLORS.map((color, index) => {
    const spread = (index - (COLORS.length - 1) / 2) * 0.22;
    return {
      color,
      offsetX: spread + (Math.random() - 0.5) * 0.08,
      offsetZ: (Math.random() - 0.5) * 0.15,
      baseY: 1.3 + Math.random() * 0.35,
      scale: 0.48 + Math.random() * 0.14,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.3,
    };
  });
}

function Balloon({ spec }: { spec: BalloonSpec }) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    const t = clock.elapsedTime;
    group.position.y = spec.baseY + Math.sin(t * spec.speed + spec.phase) * 0.12;
    group.rotation.z = Math.sin(t * spec.speed * 0.6 + spec.phase) * 0.06;
  });

  const stringLength = spec.baseY - 0.05;

  return (
    <group
      ref={groupRef}
      position={[spec.offsetX, spec.baseY, spec.offsetZ]}
      scale={spec.scale}
    >
      <mesh position={[0, 0.28, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color={spec.color} roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.03, 0.05, 12]} />
        <meshStandardMaterial color={spec.color} roughness={0.4} />
      </mesh>
      <mesh position={[0, -stringLength / 2, 0]}>
        <cylinderGeometry args={[0.004, 0.004, stringLength, 6]} />
        <meshStandardMaterial color="#cbb89a" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Balloons({ position }: BalloonsProps) {
  const balloons = useMemo(() => buildBalloons(), []);

  return (
    <group position={position}>
      {balloons.map((spec, index) => (
        <Balloon key={index} spec={spec} />
      ))}
    </group>
  );
}
