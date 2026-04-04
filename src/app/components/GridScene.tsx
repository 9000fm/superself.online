'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Perspective Grid Tunnel ───
// The tunnel opening aligns with the page's frame/marquee border.
// Camera looks straight into the tunnel along -Z.
// The tunnel's near face (z=0) is sized so its corners match the frame corners
// as projected by the camera's FOV.

interface GridTunnelProps {
  halfW: number;
  halfH: number;
  depth?: number;
  /** Number of grid divisions on each wall edge (same count everywhere) */
  divisions?: number;
}

function GridTunnel({ halfW, halfH, depth = 50, divisions = 8 }: GridTunnelProps) {
  const linesRef = useRef<THREE.LineSegments>(null);

  // Step sizes: divide each wall by the SAME number of divisions
  const stepW = (halfW * 2) / divisions;  // horizontal step (floor/ceiling)
  const stepH = (halfH * 2) / divisions;  // vertical step (left/right walls)
  const stepZ = depth / (divisions * 2);  // depth step (cross lines)

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const addLine = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      b1: number, b2: number,
    ) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(b1, b1, b1, b2, b2, b2);
    };

    const brightness = (z: number) => {
      const t = Math.abs(z) / depth;
      return Math.max(0.02, 0.4 * Math.pow(1 - t, 1.8));
    };

    const b0 = brightness(0);
    const bEnd = brightness(depth);

    // ─── Longitudinal lines (into depth) — same count on each wall ───

    // Floor + Ceiling: divisions+1 lines across width
    for (let i = 0; i <= divisions; i++) {
      const x = -halfW + i * stepW;
      addLine(x, -halfH, 0, x, -halfH, -depth, b0, bEnd);  // floor
      addLine(x, halfH, 0, x, halfH, -depth, b0, bEnd);     // ceiling
    }

    // Left + Right walls: divisions+1 lines across height
    for (let i = 0; i <= divisions; i++) {
      const y = -halfH + i * stepH;
      addLine(-halfW, y, 0, -halfW, y, -depth, b0, bEnd);   // left
      addLine(halfW, y, 0, halfW, y, -depth, b0, bEnd);     // right
    }

    // ─── Cross lines (at regular depth intervals) ───
    const depthDivisions = divisions * 2;
    for (let i = 0; i <= depthDivisions; i++) {
      const z = -(i * stepZ);
      const b = brightness(Math.abs(z));
      addLine(-halfW, -halfH, z, halfW, -halfH, z, b, b);   // floor
      addLine(-halfW, halfH, z, halfW, halfH, z, b, b);     // ceiling
      addLine(-halfW, -halfH, z, -halfW, halfH, z, b, b);   // left
      addLine(halfW, -halfH, z, halfW, halfH, z, b, b);     // right
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [halfW, halfH, depth, divisions, stepW, stepH, stepZ]);

  // Subtle drift — grid scrolls toward viewer
  const scrollRef = useRef(0);
  useFrame((_, delta) => {
    if (!linesRef.current) return;
    scrollRef.current += delta * 0.15;
    linesRef.current.position.z = scrollRef.current % stepZ;
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.7} />
    </lineSegments>
  );
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
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene fov={CAM_FOV} cameraZ={CAM_Z} />
      </Canvas>
    </div>
  );
}
