'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Perspective Grid Tunnel ───
// Rectangular opening (matching frame) tapers to a perfect SQUARE at the center.
// Like the SUPERSELF logo: not infinite convergence, but a visible square end.

interface GridTunnelProps {
  halfW: number;     // half-width of outer opening
  halfH: number;     // half-height of outer opening
  divisions?: number; // grid lines per wall edge
}

function GridTunnel({ halfW, halfH, divisions = 8 }: GridTunnelProps) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    // The far end is a perfect square, centered, sized to fit inside the frame
    const squareHalf = Math.min(halfW, halfH) * 0.15;  // small square at center
    const depth = 12; // how far back the square sits
    const layers = divisions * 3; // number of depth slices for smooth taper

    const addLine = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      b1: number, b2: number,
    ) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(b1, b1, b1, b2, b2, b2);
    };

    // Brightness: brighter near camera, dimmer at the square
    const brightness = (t: number) => {
      return Math.max(0.04, 0.35 * Math.pow(1 - t, 1.2));
    };

    // Interpolate between outer rect and inner square at depth t (0=near, 1=far)
    const lerpRect = (t: number) => {
      const w = halfW + (squareHalf - halfW) * t;
      const h = halfH + (squareHalf - halfH) * t;
      const z = -depth * t;
      return { w, h, z };
    };

    // ─── Longitudinal lines: connect grid points from outer to inner ───

    // Top & bottom edges: divisions+1 lines across width
    for (let i = 0; i <= divisions; i++) {
      const frac = i / divisions; // 0 to 1 across the edge

      // Outer position (near face)
      const outerX = -halfW + frac * (halfW * 2);
      // Inner position (far face) — same fraction but on the square
      const innerX = -squareHalf + frac * (squareHalf * 2);

      const b0 = brightness(0);
      const b1 = brightness(1);

      // Bottom edge
      addLine(outerX, -halfH, 0, innerX, -squareHalf, -depth, b0, b1);
      // Top edge
      addLine(outerX, halfH, 0, innerX, squareHalf, -depth, b0, b1);
    }

    // Left & right edges: divisions+1 lines across height
    for (let i = 0; i <= divisions; i++) {
      const frac = i / divisions;

      const outerY = -halfH + frac * (halfH * 2);
      const innerY = -squareHalf + frac * (squareHalf * 2);

      const b0 = brightness(0);
      const b1 = brightness(1);

      // Left edge
      addLine(-halfW, outerY, 0, -squareHalf, innerY, -depth, b0, b1);
      // Right edge
      addLine(halfW, outerY, 0, squareHalf, innerY, -depth, b0, b1);
    }

    // ─── Cross rings: rectangles at each depth layer ───
    for (let i = 0; i <= layers; i++) {
      const t = i / layers;
      const { w, h, z } = lerpRect(t);
      const b = brightness(t);

      // Four edges of the rectangle at this depth
      addLine(-w, -h, z, w, -h, z, b, b);   // bottom
      addLine(-w, h, z, w, h, z, b, b);     // top
      addLine(-w, -h, z, -w, h, z, b, b);   // left
      addLine(w, -h, z, w, h, z, b, b);     // right
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [halfW, halfH, divisions]);

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.6} />
    </lineSegments>
  );
}

// ─── Compute tunnel dimensions to match the frame ───
function useTunnelDimensions(fov: number, cameraZ: number) {
  const [dims, setDims] = useState({ halfW: 4, halfH: 3 });

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Frame inset: clamp(30px, 5vw, 60px)
      const insetPx = Math.max(30, Math.min(vw * 0.05, 60));

      const frameW = vw - insetPx * 2;
      const frameH = vh - insetPx * 2;

      const fracW = frameW / vw;
      const fracH = frameH / vh;

      const fovRad = (fov * Math.PI) / 180;
      const totalH = 2 * cameraZ * Math.tan(fovRad / 2);
      const totalW = totalH * (vw / vh);

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

// ─── Inner scene ───
function Scene({ fov, cameraZ }: { fov: number; cameraZ: number }) {
  const { halfW, halfH } = useTunnelDimensions(fov, cameraZ);

  return (
    <GridTunnel halfW={halfW} halfH={halfH} />
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
