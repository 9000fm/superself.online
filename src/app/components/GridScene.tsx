'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Perspective Grid Tunnel ───
// Inspired by the SUPERSELF logo: a rectangular room of converging grid lines
// with a central vanishing point. White lines on black. Architectural, infinite.

interface GridTunnelProps {
  depth?: number;
  gridSpacing?: number;
}

function GridTunnel({ depth = 40, gridSpacing = 1.0 }: GridTunnelProps) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const halfW = 4;   // half width of tunnel
    const halfH = 3;   // half height of tunnel
    const step = gridSpacing;

    // Helper: add a line segment with depth-based opacity via vertex colors
    const addLine = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      brightness1: number, brightness2: number,
    ) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(brightness1, brightness1, brightness1, brightness2, brightness2, brightness2);
    };

    // Depth-based brightness: closer = brighter, further = dimmer
    const depthBrightness = (z: number) => {
      const t = Math.abs(z) / depth;
      return Math.max(0.03, 0.5 * Math.pow(1 - t, 1.5));
    };

    // ─── Longitudinal lines (running into the tunnel along Z) ───

    // Floor grid lines (horizontal, running into depth)
    for (let x = -halfW; x <= halfW; x += step) {
      addLine(x, -halfH, 0, x, -halfH, -depth, depthBrightness(0), depthBrightness(depth));
    }

    // Ceiling grid lines
    for (let x = -halfW; x <= halfW; x += step) {
      addLine(x, halfH, 0, x, halfH, -depth, depthBrightness(0), depthBrightness(depth));
    }

    // Left wall grid lines
    for (let y = -halfH; y <= halfH; y += step) {
      addLine(-halfW, y, 0, -halfW, y, -depth, depthBrightness(0), depthBrightness(depth));
    }

    // Right wall grid lines
    for (let y = -halfH; y <= halfH; y += step) {
      addLine(halfW, y, 0, halfW, y, -depth, depthBrightness(0), depthBrightness(depth));
    }

    // ─── Cross lines (across the tunnel at regular depth intervals) ───
    for (let z = 0; z >= -depth; z -= step) {
      const b = depthBrightness(Math.abs(z));

      // Floor cross lines
      addLine(-halfW, -halfH, z, halfW, -halfH, z, b, b);

      // Ceiling cross lines
      addLine(-halfW, halfH, z, halfW, halfH, z, b, b);

      // Left wall cross lines
      addLine(-halfW, -halfH, z, -halfW, halfH, z, b, b);

      // Right wall cross lines
      addLine(halfW, -halfH, z, halfW, halfH, z, b, b);
    }

    // ─── Corner edges (the 4 edges of the tunnel opening) ───
    const cornerBright = 0.3;
    addLine(-halfW, -halfH, 0, -halfW, -halfH, -depth, cornerBright, 0.02);
    addLine(halfW, -halfH, 0, halfW, -halfH, -depth, cornerBright, 0.02);
    addLine(-halfW, halfH, 0, -halfW, halfH, -depth, cornerBright, 0.02);
    addLine(halfW, halfH, 0, halfW, halfH, -depth, cornerBright, 0.02);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [depth, gridSpacing]);

  // Subtle drift animation — cross lines scroll toward viewer
  const scrollRef = useRef(0);
  useFrame((_, delta) => {
    if (!linesRef.current) return;
    scrollRef.current += delta * 0.3;
    // Subtle z-scroll for living feel
    linesRef.current.position.z = (scrollRef.current % gridSpacing);
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.8} />
    </lineSegments>
  );
}

// ─── Mouse-driven camera tilt ───
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
    // Smooth lerp toward target
    mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.03;
    mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.03;

    // Subtle rotation — like tilting your head
    camera.rotation.y = mouseRef.current.x * 0.08;
    camera.rotation.x = mouseRef.current.y * 0.05;
  });

  return null;
}

// ─── Post-processing ───
function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}

// ─── Main component ───
interface GridSceneProps {
  isVisible?: boolean;
}

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
        camera={{ position: [0, 0, 2], fov: 65, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <GridTunnel />
        <CameraController />
        <Effects />
      </Canvas>
    </div>
  );
}
