import type { ThreeElements } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useMemo } from "react";
import {
  CanvasTexture,
  DoubleSide,
  SRGBColorSpace,
} from "three";
import { assetUrl } from "../utils/assetUrl";

type CakeProps = ThreeElements["group"];

const CAKE_RADIUS = 0.95;
const CAKE_HEIGHT = 1.05;
const NAVY = "#1c3b63";
const NAVY_TRIM = "#2c4f7c";
const GOLD = "#d8b34a";
const GOLD_DARK = "#8a6d1f";

const DUCK_COUNT = 10;
const DRIP_COUNT = 16;
const SHELL_COUNT = 40;
const PEARL_COUNT = 10;
const SCRIPT_FONT = assetUrl("/fonts/Sacramento-Regular.woff");

function createDuckTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  // body
  ctx.fillStyle = "#f6cf3e";
  ctx.beginPath();
  ctx.ellipse(66, 78, 46, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.ellipse(40, 42, 28, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // wing
  ctx.fillStyle = "#e0b52f";
  ctx.beginPath();
  ctx.ellipse(74, 82, 22, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = "#f2933a";
  ctx.beginPath();
  ctx.moveTo(14, 40);
  ctx.quadraticCurveTo(-4, 40, 6, 50);
  ctx.quadraticCurveTo(16, 52, 22, 44);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = "#2b2b2b";
  ctx.beginPath();
  ctx.ellipse(34, 34, 4.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(35.5, 32, 1.6, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function Cake({ children, ...groupProps }: CakeProps) {
  const duckTexture = useMemo(() => createDuckTexture(), []);

  const ducks = useMemo(() => {
    const items: { position: [number, number, number]; rotationY: number; scale: number }[] = [];
    for (let i = 0; i < DUCK_COUNT; i += 1) {
      const theta = (i / DUCK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const height = CAKE_HEIGHT * (0.32 + Math.random() * 0.22);
      const r = CAKE_RADIUS * 1.001;
      items.push({
        position: [r * Math.sin(theta), height, r * Math.cos(theta)],
        rotationY: theta,
        scale: 0.32 + Math.random() * 0.08,
      });
    }
    return items;
  }, []);

  const drips = useMemo(() => {
    const items: { x: number; z: number; len: number; radius: number }[] = [];
    for (let i = 0; i < DRIP_COUNT; i += 1) {
      const theta = (i / DRIP_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
      const len = 0.1 + Math.random() * 0.22;
      const radius = 0.045 + Math.random() * 0.025;
      items.push({
        x: CAKE_RADIUS * 0.985 * Math.sin(theta),
        z: CAKE_RADIUS * 0.985 * Math.cos(theta),
        len,
        radius,
      });
    }
    return items;
  }, []);

  const shellRing = useMemo(() => {
    const items: [number, number][] = [];
    for (let i = 0; i < SHELL_COUNT; i += 1) {
      const theta = (i / SHELL_COUNT) * Math.PI * 2;
      items.push([Math.sin(theta), Math.cos(theta)]);
    }
    return items;
  }, []);

  const pearls = useMemo(() => {
    const items: { position: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < PEARL_COUNT; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const height = CAKE_HEIGHT * (0.15 + Math.random() * 0.65);
      const r = CAKE_RADIUS * 1.001;
      items.push({
        position: [r * Math.sin(theta), height, r * Math.cos(theta)],
        scale: 0.02 + Math.random() * 0.015,
      });
    }
    return items;
  }, []);

  return (
    <group {...groupProps}>
      {/* gold cake board */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <cylinderGeometry args={[CAKE_RADIUS * 1.32, CAKE_RADIUS * 1.32, 0.04, 56]} />
        <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.35} />
      </mesh>

      {/* cake body */}
      <mesh position={[0, CAKE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[CAKE_RADIUS, CAKE_RADIUS, CAKE_HEIGHT, 48]} />
        <meshStandardMaterial color={NAVY} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* gold drip around the top edge */}
      {drips.map((drip, index) => (
        <group key={index}>
          <mesh position={[drip.x, CAKE_HEIGHT, drip.z]}>
            <sphereGeometry args={[drip.radius * 1.3, 10, 8]} />
            <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.25} />
          </mesh>
          <mesh position={[drip.x, CAKE_HEIGHT - drip.len / 2, drip.z]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[drip.radius, drip.len, 10]} />
            <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* top piped shell border */}
      {shellRing.map(([sx, sz], index) => (
        <mesh key={index} position={[CAKE_RADIUS * sx, CAKE_HEIGHT, CAKE_RADIUS * sz]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={NAVY_TRIM} roughness={0.6} />
        </mesh>
      ))}

      {/* bottom piped shell border */}
      {shellRing.map(([sx, sz], index) => (
        <mesh key={index} position={[CAKE_RADIUS * 1.03 * sx, 0.04, CAKE_RADIUS * 1.03 * sz]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color={NAVY_TRIM} roughness={0.6} />
        </mesh>
      ))}

      {/* gold pearl accents */}
      {pearls.map((pearl, index) => (
        <mesh key={index} position={pearl.position} scale={pearl.scale}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}

      {/* rubber duck decals */}
      {ducks.map((duck, index) => (
        <mesh
          key={index}
          position={duck.position}
          rotation={[0, duck.rotationY, 0]}
          scale={duck.scale}
        >
          <planeGeometry args={[1, 0.85]} />
          <meshStandardMaterial
            map={duckTexture}
            transparent
            alphaTest={0.4}
            side={DoubleSide}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* icing message */}
      <Text
        font={SCRIPT_FONT}
        position={[0.35, CAKE_HEIGHT + 0.005, 0.02]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={0.26}
        color={GOLD}
        anchorX="center"
        anchorY="middle"
        lineHeight={1.15}
        textAlign="center"
      >
        {"my first\nseason"}
      </Text>

      {/* "27" gold topper */}
      <group position={[-0.05, CAKE_HEIGHT, 0]}>
        <mesh position={[0, 0.28, 0.28]}>
          <cylinderGeometry args={[0.008, 0.008, 0.56, 6]} />
          <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.32, -0.22]}>
          <cylinderGeometry args={[0.008, 0.008, 0.64, 6]} />
          <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
        </mesh>
        <Text
          position={[0, 0.6, 0.28]}
          rotation={[0, Math.PI / 2, 0.04]}
          fontSize={0.42}
          color={GOLD}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor={GOLD_DARK}
        >
          2
        </Text>
        <Text
          position={[0, 0.68, -0.22]}
          rotation={[0, Math.PI / 2, -0.05]}
          fontSize={0.46}
          color={GOLD}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor={GOLD_DARK}
        >
          7
        </Text>
      </group>

      {children}
    </group>
  );
}
