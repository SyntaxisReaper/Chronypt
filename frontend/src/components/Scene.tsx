import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Preload, Line } from '@react-three/drei';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

/* ─── GeoJSON country data (Natural Earth 110m, bundled locally) ─── */
const GEO_JSON_URL = '/countries.geojson';

type CountryFeature = {
  properties: {
    ISO_A2?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type CountriesGeoJson = {
  features: CountryFeature[];
};

/* ─── Arc connection data: city-to-city network links ─── */
const ARC_CONNECTIONS = [
  { startLat: 40.7128, startLng: -74.006,  endLat: 51.5074, endLng: -0.1278  }, // New York → London
  { startLat: 51.5074, startLng: -0.1278,  endLat: 28.6139, endLng: 77.209   }, // London → Delhi
  { startLat: 28.6139, startLng: 77.209,   endLat: 35.6762, endLng: 139.6503 }, // Delhi → Tokyo
  { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688,endLng: 151.2093 }, // Tokyo → Sydney
  { startLat: 37.7749, startLng: -122.4194,endLat: 1.3521,  endLng: 103.8198 }, // San Francisco → Singapore
  { startLat: 1.3521,  startLng: 103.8198, endLat: 25.2048, endLng: 55.2708  }, // Singapore → Dubai
  { startLat: 25.2048, startLng: 55.2708,  endLat: -23.5505,endLng: -46.6333 }, // Dubai → São Paulo
  { startLat: -23.5505,startLng: -46.6333, endLat: 40.7128, endLng: -74.006  }, // São Paulo → New York
  { startLat: 19.076,  startLng: 72.8777,  endLat: 37.7749, endLng: -122.4194}, // Mumbai → San Francisco
  { startLat: 48.8566, startLng: 2.3522,   endLat: 35.6762, endLng: 139.6503 }, // Paris → Tokyo
];

/* ─── Module-level cache to survive HMR and prevent leaks ─── */
let cachedGlobe: ThreeGlobe | null = null;
let cachedCountries: CountryFeature[] | null = null;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/* ─── Helper: recursively dispose all GPU resources on a Three.js object ─── */
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
    }
  });
}

/* ─── Three-Globe Earth Component ─── */
function EarthGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<ThreeGlobe | null>(null);
  const { camera } = useThree();
  const [countries, setCountries] = useState<CountryFeature[]>(() => cachedCountries ?? []);

  // Fetch GeoJSON once (cached at module level)
  useEffect(() => {
    if (cachedCountries) {
      return;
    }
    fetch(GEO_JSON_URL)
      .then((res) => res.json())
      .then((data: CountriesGeoJson) => {
        cachedCountries = data.features;
        setCountries(data.features);
      })
      .catch((err) => console.warn('Failed to load GeoJSON:', err));
  }, []);

  // Create and configure globe — reuse cached instance across HMR
  useEffect(() => {
    if (countries.length === 0 || !groupRef.current) return;

    const parentGroup = groupRef.current;

    // Reuse existing globe if available (prevents HMR context loss)
    if (cachedGlobe) {
      globeRef.current = cachedGlobe;
      parentGroup.add(cachedGlobe);
      cachedGlobe.resumeAnimation();
      return () => {
        cachedGlobe?.pauseAnimation();
        parentGroup.remove(cachedGlobe!);
        globeRef.current = null;
      };
    }

    const globe = new ThreeGlobe({ waitForGlobeReady: false, animateIn: false })
      .showGlobe(true)
      .showAtmosphere(true)
      .atmosphereColor('#3bb4d2')
      .atmosphereAltitude(0.2)
      .showGraticules(true)
      // Country polygons
      .polygonsData(countries.filter((d) => d.properties.ISO_A2 !== 'AQ'))
      .polygonCapColor(() => 'rgba(59, 180, 210, 0.15)')
      .polygonSideColor(() => 'rgba(147, 45, 194, 0.1)')
      .polygonStrokeColor(() => '#3bb4d2')
      .polygonAltitude(0.008)
      .polygonCapCurvatureResolution(5)
      // Arc connections between cities
      .arcsData(ARC_CONNECTIONS)
      .arcColor((): [string, string] => ['#3bb4d2', '#932DC2'])
      .arcAltitudeAutoScale(0.4)
      .arcStroke(0.4)
      .arcDashLength(0.6)
      .arcDashGap(0.3)
      .arcDashAnimateTime(4000);

    // Custom dark globe material
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#06101f'),
      emissive: new THREE.Color('#0d1f3c'),
      emissiveIntensity: 0.6,
      shininess: 25,
      transparent: false,
      opacity: 1.0,
    });
    globe.globeMaterial(globeMaterial);

    // Scale: three-globe default radius = 100 units → we want ~2 units
    globe.scale.set(0.02, 0.02, 0.02);

    cachedGlobe = globe;
    globeRef.current = globe;
    parentGroup.add(globe);

    return () => {
      globe.pauseAnimation();
      parentGroup.remove(globe);
      globeRef.current = null;
      // Don't dispose cachedGlobe — it will be reused on HMR
    };
  }, [countries]);

  // Slow auto-rotation + keep globe synced with camera
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
    if (globeRef.current) {
      globeRef.current.setPointOfView(camera);
    }
  });

  return <group ref={groupRef} />;
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
  const particleCount = isMobile ? 160 : 400;
  const circuitIntensity = isMobile ? 8 : 15;

  return (
    <Canvas
      camera={{ position: page === 'login' ? [0, 0, 4.5] : [0, 0, 6], fov: 45 }}
      dpr={isMobile ? [1, 1.25] : [1, 2]}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
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
            <EarthGlobe />
          </group>
          <MolecularParticles count={particleCount} spread={isMobile ? 20 : 30} />
        </>
      )}

      {page === 'login' && (
        <>
          <group position={[2.5, 0.3, -1]}>
            <EarthGlobe />
          </group>
          <CircuitLines lineCount={circuitIntensity} />
          <MolecularParticles count={particleCount} spread={isMobile ? 20 : 30} />
        </>
      )}

      <Preload all />
    </Canvas>
  );
}

/* ─── Clean up on full page unload (not HMR) ─── */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (cachedGlobe) {
      disposeObject(cachedGlobe);
      cachedGlobe = null;
    }
    cachedCountries = null;
  });
}
