import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Preload, Line } from '@react-three/drei';
import * as THREE from 'three';

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/* ─── Helper: Fibonacci Sphere Points ─── */
function fibonacciSphere(samples: number, radius: number): Float32Array {
  const positions = new Float32Array(samples * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return positions;
}

/* ─── Globe Core: dotted sphere surface ─── */
function GlobeDots({ dotCount }: { dotCount: number }) {

  const geometry = useMemo(() => {
    const random = createSeededRandom(1337);
    const geo = new THREE.BufferGeometry();
    const pos = fibonacciSphere(dotCount, 2);
    const col = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      const brightness = 0.3 + random() * 0.7;
      const isContinentDot = random() > 0.5;
      if (isContinentDot) {
        col[i * 3] = 0.2 * brightness;
        col[i * 3 + 1] = 0.7 * brightness;
        col[i * 3 + 2] = 0.85 * brightness;
      } else {
        col[i * 3] = 0.05;
        col[i * 3 + 1] = 0.12;
        col[i * 3 + 2] = 0.3;
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, [dotCount]);

  return (
    <points geometry={geometry}>
      <pointsMaterial size={0.025} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

/* ─── Globe Inner Sphere ─── */
function GlobeInner() {
  return (
    <mesh>
      <sphereGeometry args={[1.92, 64, 64]} />
      <meshStandardMaterial
        color="#030810"
        emissive="#0a1a3a"
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
        roughness={0.8}
      />
    </mesh>
  );
}

/* ─── Atmosphere glow via custom shader ─── */
function GlobeAtmosphere() {
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#3bb4d2') },
      },
      vertexShader: `
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(vec3(0.0, 0.0, 1.0));
          intensity = pow(0.7 - dot(vNormal, vNormel), 3.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.55);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh material={shaderMaterial}>
      <sphereGeometry args={[2.15, 64, 64]} />
    </mesh>
  );
}

/* ─── Orbiting Ring with a travelling data-dot ─── */
function OrbitalRing({ radius, color, tilt, speed }: { radius: number; color: string; tilt: [number, number, number]; speed: number }) {
  const dotRef = useRef<THREE.Mesh>(null);
  const initialAngle = useMemo(() => {
    const random = createSeededRandom(Math.floor(radius * 1000 + speed * 10000));
    return random() * Math.PI * 2;
  }, [radius, speed]);
  const angleRef = useRef(initialAngle);

  useFrame((_, delta) => {
    angleRef.current += delta * speed;
    if (dotRef.current) {
      dotRef.current.position.x = Math.cos(angleRef.current) * radius;
      dotRef.current.position.z = Math.sin(angleRef.current) * radius;
    }
  });

  return (
    <group rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, 0.006, 16, 200]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/* ─── Network Connection Arcs (using drei Line) ─── */
function ConnectionArcs() {
  const arcs = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(1.2, 1.2, 1.0), new THREE.Vector3(-0.8, 0.5, 1.6)],
      [new THREE.Vector3(-1.5, -0.5, 1.0), new THREE.Vector3(0.5, 1.4, 1.2)],
      [new THREE.Vector3(0.3, -1.5, 1.2), new THREE.Vector3(1.6, 0.3, 0.8)],
      [new THREE.Vector3(-1.0, 1.0, 1.4), new THREE.Vector3(1.0, -1.2, 1.0)],
      [new THREE.Vector3(0.8, 0.8, 1.6), new THREE.Vector3(-1.4, -0.8, 0.9)],
    ];
    const colors = ['#3bb4d2', '#932DC2', '#3bb4d2', '#932DC2', '#3bb4d2'];

    return pairs.map(([start, end], i) => {
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).normalize().multiplyScalar(3.2);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(50);
      return { points: pts.map(p => [p.x, p.y, p.z] as [number, number, number]), color: colors[i] };
    });
  }, []);

  return (
    <group>
      {arcs.map((arc, i) => (
        <Line key={i} points={arc.points} color={arc.color} transparent opacity={0.4} lineWidth={1} />
      ))}
    </group>
  );
}

/* ─── Full Tech Globe (reusable) ─── */
function TechGlobe({ dotCount }: { dotCount: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <GlobeInner />
      <GlobeDots dotCount={dotCount} />
      <GlobeAtmosphere />
      <ConnectionArcs />
      <OrbitalRing radius={2.6} color="#3bb4d2" tilt={[Math.PI / 3, 0, 0.2]} speed={0.6} />
      <OrbitalRing radius={2.9} color="#932DC2" tilt={[-Math.PI / 4, Math.PI / 6, -0.1]} speed={0.45} />
      <OrbitalRing radius={3.2} color="#73449E" tilt={[0.1, Math.PI / 3, 0.3]} speed={0.35} />
    </group>
  );
}

/* ─── Molecular Particles (full-screen background) ─── */
function MolecularParticles({ count = 500, spread = 25 }: { count?: number; spread?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const random = createSeededRandom(424242);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (random() - 0.5) * spread;
      pos[i * 3 + 1] = (random() - 0.5) * spread;
      pos[i * 3 + 2] = (random() - 0.5) * spread;

      const palette = random();
      if (palette < 0.4) {
        col[i * 3] = 0.23; col[i * 3 + 1] = 0.7; col[i * 3 + 2] = 0.82;
      } else if (palette < 0.7) {
        col[i * 3] = 0.576; col[i * 3 + 1] = 0.176; col[i * 3 + 2] = 0.761;
      } else {
        col[i * 3] = 0.451; col[i * 3 + 1] = 0.267; col[i * 3 + 2] = 0.62;
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, [count, spread]);

  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      elapsedRef.current += delta;
      pointsRef.current.rotation.y -= delta * 0.012;
      pointsRef.current.rotation.x += delta * 0.006;
      const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(elapsedRef.current * 0.4 + i) * 0.0002;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.7} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/* ─── Circuit Lines (login background, using drei Line) ─── */
function CircuitLines({ lineCount }: { lineCount: number }) {
  const { lines, junctions } = useMemo(() => {
    const random = createSeededRandom(98765);
    const lineData: [number, number, number][][] = [];
    const junctionPts: [number, number, number][] = [];
    for (let i = 0; i < lineCount; i++) {
      const pts: [number, number, number][] = [];
      let x = (random() - 0.5) * 20;
      let y = (random() - 0.5) * 14;
      const z = -5 + random() * -5;
      pts.push([x, y, z]);
      junctionPts.push([x, y, z]);
      const segments = 3 + Math.floor(random() * 4);
      for (let s = 0; s < segments; s++) {
        if (random() > 0.5) { x += (random() - 0.5) * 6; }
        else { y += (random() - 0.5) * 4; }
        pts.push([x, y, z]);
        junctionPts.push([x, y, z]);
      }
      lineData.push(pts);
    }
    return { lines: lineData, junctions: junctionPts };
  }, [lineCount]);

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#1a1030" transparent opacity={0.35} lineWidth={1} />
      ))}
      {junctions.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#932DC2" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Exported Scene Component ─── */
export default function Scene({ page }: { page: 'home' | 'login' }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dotCount = isMobile ? 900 : 2000;
  const particleCount = isMobile ? 160 : 400;
  const circuitIntensity = isMobile ? 8 : 15;

  return (
    <Canvas
      camera={{ position: page === 'login' ? [0, 0, 4.5] : [0, 0, 6], fov: 45 }}
      dpr={isMobile ? [1, 1.25] : [1, 2]}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={1.0} color="#3bb4d2" />
      <pointLight position={[-10, -10, -5]} intensity={0.7} color="#932DC2" />
      <directionalLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />

      {/* Interactive orbit controls — drag to rotate, scroll to zoom */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        autoRotate={false}
        minDistance={3}
        maxDistance={12}
        zoomSpeed={0.5}
        rotateSpeed={0.5}
      />

      {page === 'home' && (
        <>
          <group position={[1.5, -0.2, 0]}>
            <TechGlobe dotCount={dotCount} />
          </group>
          <MolecularParticles count={particleCount} spread={isMobile ? 20 : 30} />
        </>
      )}

      {page === 'login' && (
        <>
          <group position={[2.5, 0.3, -1]}>
            <TechGlobe dotCount={dotCount} />
          </group>
          <CircuitLines lineCount={circuitIntensity} />
          <MolecularParticles count={particleCount} spread={isMobile ? 20 : 30} />
        </>
      )}

      <Preload all />
    </Canvas>
  );
}
