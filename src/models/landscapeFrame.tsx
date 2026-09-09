import type { ThreeElements } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { DoubleSide, SRGBColorSpace } from "three";

type LandscapeFrameProps = ThreeElements["group"] & {
  image: string;
  width?: number;
  height?: number;
  tilt?: number;
};

const WOOD = "#c9a06a";
const WOOD_DARK = "#a67c4a";

export function LandscapeFrame({
  image,
  width = 1.3,
  height = 0.92,
  tilt = 0.1,
  children,
  ...groupProps
}: LandscapeFrameProps) {
  const texture = useTexture(image);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
  }, [texture]);

  const border = 0.07;

  return (
    <group {...groupProps}>
      {/* pivot at the bottom edge so the frame always rests flush on the table */}
      <group rotation={[-tilt, 0, 0]}>
        {/* wooden border (backmost) */}
        <mesh position={[0, height / 2, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[width + border * 2, height + border * 2, 0.05]} />
          <meshStandardMaterial color={WOOD} roughness={0.6} metalness={0.05} />
        </mesh>
        {/* inner lip for depth */}
        <mesh position={[0, height / 2, -0.008]}>
          <boxGeometry args={[width + border, height + border, 0.02]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
        </mesh>
        {/* photo (frontmost, closest to viewer) */}
        <mesh position={[0, height / 2, -0.022]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} side={DoubleSide} />
        </mesh>
        {/* small back foot, purely decorative */}
        <mesh position={[0, height * 0.16, 0.2]} rotation={[-0.55, 0, 0]}>
          <boxGeometry args={[0.05, height * 0.5, 0.02]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
        </mesh>
      </group>
      {children}
    </group>
  );
}
