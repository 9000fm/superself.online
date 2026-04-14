'use client';
/* eslint-disable react-hooks/purity, react-hooks/immutability */
// R3F components mutate typed arrays and use Math.random() at init — standard Three.js patterns

import { useRef, useMemo, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

// ─── Mode type ───
export type LogoSceneMode = 'particles' | 'text3d' | 'portal';

interface LogoSceneProps {
  mode: LogoSceneMode;
  isVisible?: boolean;
}

// ─── Shared: sample logo pixels into point positions ───
function useLogoPoints(count: number = 3000): THREE.Vector3[] {
  const [points, setPoints] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/superself-logo-wh.webp';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256; // downsample for sampling
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Collect all white-ish pixel positions
      const candidates: [number, number][] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          // Alpha > 128 means part of the logo
          if (data[i + 3] > 128) {
            candidates.push([x, y]);
          }
        }
      }

      // Random sample from candidates
      const sampled: THREE.Vector3[] = [];
      const scale = 4; // world units
      for (let i = 0; i < Math.min(count, candidates.length); i++) {
        const idx = Math.floor(Math.random() * candidates.length);
        const [px, py] = candidates[idx];
        // Center and normalize to world coords
        const wx = ((px / size) - 0.5) * scale;
        const wy = -((py / size) - 0.5) * scale; // flip Y
        const wz = (Math.random() - 0.5) * 0.3; // slight depth scatter
        sampled.push(new THREE.Vector3(wx, wy, wz));
      }
      setPoints(sampled);
    };
  }, [count]);

  return points;
}

// ─── MODE 1: Particle Logo ───
// Logo sampled into floating particles that drift, breathe, and scatter on hover
function ParticleLogo() {
  const points = useLogoPoints(4000);
  const meshRef = useRef<THREE.Points>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  // Store original + current positions
  const { positions, originals, velocities } = useMemo(() => {
    if (points.length === 0) return { positions: new Float32Array(0), originals: new Float32Array(0), velocities: new Float32Array(0) };
    const pos = new Float32Array(points.length * 3);
    const orig = new Float32Array(points.length * 3);
    const vel = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      const sx = p.x + (Math.random() - 0.5) * 8;
      const sy = p.y + (Math.random() - 0.5) * 8;
      const sz = p.z + (Math.random() - 0.5) * 4;
      pos[i * 3] = sx;
      pos[i * 3 + 1] = sy;
      pos[i * 3 + 2] = sz;
      orig[i * 3] = p.x;
      orig[i * 3 + 1] = p.y;
      orig[i * 3 + 2] = p.z;
    });
    return { positions: pos, originals: orig, velocities: vel };
  }, [points]);

  // Track mouse
  const onPointerMove = useCallback((e: THREE.Event & { point: THREE.Vector3 }) => {
    mouseRef.current.set(e.point.x, e.point.y);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || positions.length === 0) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const dt = Math.min(delta, 0.05);
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    for (let i = 0; i < points.length; i++) {
      const i3 = i * 3;
      const ox = originals[i3], oy = originals[i3 + 1], oz = originals[i3 + 2];
      const cx = positions[i3], cy = positions[i3 + 1], cz = positions[i3 + 2];

      // Mouse repulsion
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repulseRadius = 0.8;
      if (dist < repulseRadius && dist > 0.01) {
        const force = (1 - dist / repulseRadius) * 3;
        velocities[i3] += (dx / dist) * force * dt;
        velocities[i3 + 1] += (dy / dist) * force * dt;
      }

      // Spring back to original position
      const springStrength = 2.0;
      velocities[i3] += (ox - cx) * springStrength * dt;
      velocities[i3 + 1] += (oy - cy) * springStrength * dt;
      velocities[i3 + 2] += (oz - cz) * springStrength * dt;

      // Damping
      velocities[i3] *= 0.95;
      velocities[i3 + 1] *= 0.95;
      velocities[i3 + 2] *= 0.95;

      // Subtle breathing
      const breathe = Math.sin(Date.now() * 0.001 + i * 0.1) * 0.005;

      // Apply
      positions[i3] += velocities[i3] + breathe;
      positions[i3 + 1] += velocities[i3 + 1] + breathe * 0.5;
      positions[i3 + 2] += velocities[i3 + 2];

      posAttr.array[i3] = positions[i3];
      posAttr.array[i3 + 1] = positions[i3 + 1];
      posAttr.array[i3 + 2] = positions[i3 + 2];
    }
    posAttr.needsUpdate = true;
  });

  if (positions.length === 0) return null;

  return (
    <group>
      {/* Invisible plane to track mouse */}
      <mesh onPointerMove={onPointerMove} visible={false}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial />
      </mesh>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.02}
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ─── MODE 2: 3D Extruded Text ───
// "SUPERSELF" as solid 3D geometry with metallic material
function Text3DLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle float
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
    // Mouse-driven tilt
    const targetRotX = mouseRef.current.y * 0.15;
    const targetRotY = mouseRef.current.x * 0.15;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.05;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <Text
          fontSize={0.6}
          letterSpacing={0.15}
          font="/fonts/mono.woff"
          anchorX="center"
          anchorY="middle"
          maxWidth={10}
        >
          SUPERSELF
          <meshStandardMaterial
            color="#ffffff"
            emissive="#0000FF"
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
          />
        </Text>
      </Float>
      {/* Subtle ambient particles */}
      <AmbientParticles count={200} />
    </group>
  );
}

// Small ambient particles floating around the text
function AmbientParticles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posAttr.array[i3 + 1] += Math.sin(t + i) * 0.0003;
      posAttr.array[i3] += Math.cos(t * 0.5 + i * 0.7) * 0.0002;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#0000FF" size={0.015} transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── MODE 3: Logo as Portal ───
// Logo shape rendered as a mask — through it you see a particle void
function PortalLogo() {
  const points = useLogoPoints(2000);
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  // Particles inside the "portal" — deep field
  const deepParticles = useMemo(() => {
    const pos = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = -Math.random() * 10 - 1; // behind the logo plane
    }
    return pos;
  }, []);

  const deepRef = useRef<THREE.Points>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    // Parallax tilt based on mouse
    groupRef.current.rotation.y = mouseRef.current.x * 0.1;
    groupRef.current.rotation.x = mouseRef.current.y * 0.08;

    // Animate deep particles — slowly drift forward then loop
    if (deepRef.current) {
      const posAttr = deepRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < 800; i++) {
        const i3 = i * 3;
        posAttr.array[i3 + 2] += 0.01; // drift forward
        if (posAttr.array[i3 + 2] > 0) {
          posAttr.array[i3 + 2] = -10 - Math.random() * 2;
          posAttr.array[i3] = (Math.random() - 0.5) * 4;
          posAttr.array[i3 + 1] = (Math.random() - 0.5) * 4;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  // Logo outline rendered as points (the portal edge)
  const logoPositions = useMemo(() => {
    if (points.length === 0) return new Float32Array(0);
    const pos = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = 0;
    });
    return pos;
  }, [points]);

  if (logoPositions.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Deep field particles (behind logo) */}
      <points ref={deepRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[deepParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#0000FF" size={0.03} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
      </points>

      {/* Logo outline as bright particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[logoPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.018} transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}

// ─── Post-processing effects ───
function Effects({ mode }: { mode: LogoSceneMode }) {
  return (
    <EffectComposer>
      <Bloom
        intensity={mode === 'text3d' ? 1.5 : 0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0005, 0.0005)}
      />
    </EffectComposer>
  );
}

// ─── Main component ───
export default function LogoScene({ mode, isVisible = true }: LogoSceneProps) {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 1s ease',
      pointerEvents: 'auto',
    }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
        <pointLight position={[-3, -3, 2]} intensity={0.3} color="#0000FF" />

        <Suspense fallback={null}>
          {mode === 'particles' && <ParticleLogo />}
          {mode === 'text3d' && <Text3DLogo />}
          {mode === 'portal' && <PortalLogo />}
        </Suspense>

        <Effects mode={mode} />
      </Canvas>
    </div>
  );
}
