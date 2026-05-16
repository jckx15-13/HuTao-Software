import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

/* NASA Blue Marble textures — public domain CDN */
const TEX = {
  day: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  night: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
};

/* Atmosphere Fresnel glow shader */
const ATMOS_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const ATMOS_FRAG = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
  }`;

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const nightRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const [dayMap, bumpMap, cloudsMap, nightMap] = useLoader(THREE.TextureLoader, [
    TEX.day, TEX.bump, TEX.clouds, TEX.night,
  ]);

  const atmosMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ATMOS_VERT,
    fragmentShader: ATMOS_FRAG,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y = t * 0.04;
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.055;
    if (nightRef.current) nightRef.current.rotation.y = t * 0.04;
    if (glowRef.current) glowRef.current.rotation.y = t * 0.04;
  });

  return (
    <group scale={2.8} position={[0, -0.3, 0]}>
      {/* Earth surface */}
      <Sphere ref={earthRef} args={[1, 128, 128]}>
        <meshPhongMaterial
          map={dayMap} bumpMap={bumpMap} bumpScale={0.05}
          specularMap={bumpMap} specular={new THREE.Color('#1a3a5c')} shininess={15}
        />
      </Sphere>

      {/* Night-side city lights */}
      <Sphere ref={nightRef} args={[1.001, 128, 128]}>
        <meshBasicMaterial
          map={nightMap} transparent opacity={0.6}
          blending={THREE.AdditiveBlending} depthWrite={false}
        />
      </Sphere>

      {/* Cloud layer */}
      <Sphere ref={cloudsRef} args={[1.012, 128, 128]}>
        <meshPhongMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere ref={glowRef} args={[1.08, 64, 64]} material={atmosMat} />
    </group>
  );
}

export function BackgroundEarth() {
  return (
    <div className="fixed inset-0 z-[-1] bg-black pointer-events-none">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera makeDefault position={[0, 0.5, 4.8]} fov={45} />
        <directionalLight position={[5, 3, 5]} intensity={2.2} color="#fff5e6" />
        <ambientLight intensity={0.15} color="#4a6fa5" />
        <Stars radius={300} depth={80} count={15000} factor={5} saturation={0.1} fade speed={0.5} />

        {/* Suspense boundary — critical for useLoader's async texture fetching */}
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </Canvas>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 100%)',
        }}
      />
    </div>
  );
}
