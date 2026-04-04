'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Perspective Grid Tunnel ───
// The tunnel opening aligns with the page's frame/marquee border.
// Camera looks straight into the tunnel along -Z.
// The tunnel's near face (z=0) is sized so its corners match the frame corners
// as projected by the camera's FOV.

interface GridTunnelProps {
  /** Half-width of tunnel opening in world units (computed from frame) */
  halfW: number;
  /** Half-height of tunnel opening in world units (computed from frame) */
  halfH: number;
  depth?: number;
  gridSpacing?: number;
}

function GridTunnel({ halfW, halfH, depth = 50, gridSpacing = 1.0 }: GridTunnelProps) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const step = gridSpacing;

    const addLine = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      b1: number, b2: number,
    ) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(b1, b1, b1, b2, b2, b2);
    };

    // Brightness fades with depth
    const brightness = (z: number) => {
      const t = Math.abs(z) / depth;
      return Math.max(0.02, 0.4 * Math.pow(1 - t, 1.8));
    };

    // ─── Longitudinal lines (into depth) ───

    // Floor
    for (let x = -halfW; x <= halfW + 0.01; x += step) {
      addLine(x, -halfH, 0, x, -halfH, -depth, brightness(0), brightness(depth));
    }
    // Ceiling
    for (let x = -halfW; x <= halfW + 0.01; x += step) {
      addLine(x, halfH, 0, x, halfH, -depth, brightness(0), brightness(depth));
    }
    // Left wall
    for (let y = -halfH; y <= halfH + 0.01; y += step) {
      addLine(-halfW, y, 0, -halfW, y, -depth, brightness(0), brightness(depth));
    }
    // Right wall
    for (let y = -halfH; y <= halfH + 0.01; y += step) {
      addLine(halfW, y, 0, halfW, y, -depth, brightness(0), brightness(depth));
    }

    // ─── Cross lines (at depth intervals) ───
    for (let z = 0; z >= -depth; z -= step) {
      const b = brightness(Math.abs(z));
      // Floor
      addLine(-halfW, -halfH, z, halfW, -halfH, z, b, b);
      // Ceiling
      addLine(-halfW, halfH, z, halfW, halfH, z, b, b);
      // Left wall
      addLine(-halfW, -halfH, z, -halfW, halfH, z, b, b);
      // Right wall
      addLine(halfW, -halfH, z, halfW, halfH, z, b, b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [halfW, halfH, depth, gridSpacing]);

  // Subtle drift — cross lines slowly scroll toward viewer
  const scrollRef = useRef(0);
  useFrame((_, delta) => {
    if (!linesRef.current) return;
    scrollRef.current += delta * 0.15;
    linesRef.current.position.z = scrollRef.current % gridSpacing;
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.7} />
    </lineSegments>
  );
}

// ─── Camera controller: very subtle mouse parallax ───
function CameraController() {
  const { camera } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const targetRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      targetRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.02;
    mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.02;
    // Very gentle tilt — just enough to feel alive
    camera.rotation.y = mouseRef.current.x * 0.03;
    camera.rotation.x = mouseRef.current.y * 0.02;
  });

  return null;
}

// ─── Compute tunnel dimensions to match the frame ───
// Given camera FOV + distance, compute world-space size that maps to
// the frame rectangle on screen.
function useTunnelDimensions(fov: number, cameraZ: number) {
  const [dims, setDims] = useState({ halfW: 4, halfH: 3 });

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Parse the frame inset: max(clamp(30px, 5vw, 60px), env(...))
      // Approximate: clamp(30, vw*0.05, 60)
      const insetPx = Math.max(30, Math.min(vw * 0.05, 60));

      // Frame rectangle in pixels (from edge)
      const frameW = vw - insetPx * 2;
      const frameH = vh - insetPx * 2;

      // Frame rectangle as fraction of viewport
      const fracW = frameW / vw;
      const fracH = frameH / vh;

      // Total visible height in world units at z=0
      const fovRad = (fov * Math.PI) / 180;
      const totalH = 2 * cameraZ * Math.tan(fovRad / 2);
      const totalW = totalH * (vw / vh);

      // Tunnel opening = frame fraction of total visible area
      setDims({
        halfW: (totalW * fracW) / 2,
        halfH: (totalH * fracH) / 2,
      });
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [fov, cameraZ]);

  return dims;
}

// ─── Inner scene (needs useThree context) ───
function Scene({ fov, cameraZ }: { fov: number; cameraZ: number }) {
  const { halfW, halfH } = useTunnelDimensions(fov, cameraZ);

  return (
    <>
      <GridTunnel halfW={halfW} halfH={halfH} />
      <CameraController />
      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Main component ───
interface GridSceneProps {
  isVisible?: boolean;
}

const CAM_FOV = 65;
const CAM_Z = 2;

export default function GridScene({ isVisible = true }: GridSceneProps) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 1.5s ease',
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, CAM_Z], fov: CAM_FOV, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene fov={CAM_FOV} cameraZ={CAM_Z} />
      </Canvas>
    </div>
  );
}
