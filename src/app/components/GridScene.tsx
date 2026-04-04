'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Perspective Grid Tunnel ───
// Rectangular opening (matching frame) tapers to a perfect SQUARE at center.
// Two layers: static converging lines + animated cross rings.

interface GridTunnelProps {
  halfW: number;
  halfH: number;
  divisions?: number;
}

// Shared constants
const DEPTH = 12;
const SQUARE_FRAC = 0.15; // inner square = 15% of min(halfW, halfH)

// Interpolate between outer rect and inner square
function lerpRect(halfW: number, halfH: number, squareHalf: number, t: number) {
  return {
    w: halfW + (squareHalf - halfW) * t,
    h: halfH + (squareHalf - halfH) * t,
    z: -DEPTH * t,
  };
}

function brightness(t: number) {
  return Math.max(0.04, 0.35 * Math.pow(1 - t, 1.2));
}

// ─── Static converging lines (don't animate) ───
function ConvergingLines({ halfW, halfH, divisions = 8 }: GridTunnelProps) {
  const squareHalf = Math.min(halfW, halfH) * SQUARE_FRAC;

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, b1: number, b2: number) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(b1, b1, b1, b2, b2, b2);
    };

    const b0 = brightness(0);
    const b1 = brightness(1);

    // Top & bottom edges
    for (let i = 0; i <= divisions; i++) {
      const frac = i / divisions;
      const outerX = -halfW + frac * halfW * 2;
      const innerX = -squareHalf + frac * squareHalf * 2;
      addLine(outerX, -halfH, 0, innerX, -squareHalf, -DEPTH, b0, b1);
      addLine(outerX, halfH, 0, innerX, squareHalf, -DEPTH, b0, b1);
    }

    // Left & right edges
    for (let i = 0; i <= divisions; i++) {
      const frac = i / divisions;
      const outerY = -halfH + frac * halfH * 2;
      const innerY = -squareHalf + frac * squareHalf * 2;
      addLine(-halfW, outerY, 0, -squareHalf, innerY, -DEPTH, b0, b1);
      addLine(halfW, outerY, 0, squareHalf, innerY, -DEPTH, b0, b1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [halfW, halfH, divisions, squareHalf]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.6} />
    </lineSegments>
  );
}

// ─── Animated cross rings (scroll toward viewer, seamless loop) ───
function CrossRings({ halfW, halfH, divisions = 8 }: GridTunnelProps) {
  const meshRef = useRef<THREE.LineSegments>(null);
  const squareHalf = Math.min(halfW, halfH) * SQUARE_FRAC;
  const ringCount = divisions * 3;
  const ringStep = 1 / ringCount; // normalized step between rings

  // Build ring geometry with 2 extra rings (one beyond each end) for seamless wrap
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, b1: number, b2: number) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(b1, b1, b1, b2, b2, b2);
    };

    // Generate rings from t=-ringStep to t=1+ringStep (extra on each end)
    const totalRings = ringCount + 2;
    for (let i = -1; i <= ringCount; i++) {
      const t = i / ringCount; // can be slightly negative or >1
      const tClamped = Math.max(0, Math.min(1, t));
      const { w, h, z } = lerpRect(halfW, halfH, squareHalf, tClamped);
      // Use unclamped t for z position so extra rings are at correct depth
      const actualZ = -DEPTH * t;
      const b = brightness(tClamped);

      addLine(-w, -h, actualZ, w, -h, actualZ, b, b);
      addLine(-w, h, actualZ, w, h, actualZ, b, b);
      addLine(-w, -h, actualZ, -w, h, actualZ, b, b);
      addLine(w, -h, actualZ, w, h, actualZ, b, b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [halfW, halfH, squareHalf, ringCount]);

  // Animate: scroll z position, loop seamlessly every ringStep in world units
  const scrollRef = useRef(0);
  const worldStep = DEPTH / ringCount;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scrollRef.current += delta * 0.15;
    // Modulo by one ring spacing in world units — seamless loop
    meshRef.current.position.z = scrollRef.current % worldStep;
  });

  return (
    <lineSegments ref={meshRef} geometry={geometry}>
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
      const insetPx = Math.max(30, Math.min(vw * 0.05, 60));
      const fracW = (vw - insetPx * 2) / vw;
      const fracH = (vh - insetPx * 2) / vh;
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

// ─── Scene ───
function Scene({ fov, cameraZ }: { fov: number; cameraZ: number }) {
  const { halfW, halfH } = useTunnelDimensions(fov, cameraZ);

  return (
    <>
      <ConvergingLines halfW={halfW} halfH={halfH} />
      <CrossRings halfW={halfW} halfH={halfH} />
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
