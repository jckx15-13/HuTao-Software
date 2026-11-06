import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { AstronomyScene } from './useAstronomy';

const AU = 149597870.7;
const BENNU = 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/b/Bennu_1_1.glb';
const COLORS: Record<string, string> = { sun: '#ffe7a3', mercury: '#a5a1a0', venus: '#e5c79c', earth: '#69a9df', moon: '#aaaeb8', mars: '#d28b6a', jupiter: '#d7b193', saturn: '#e1cb9f', uranus: '#9cdbdf', neptune: '#6487e1' };

function disposeTree(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    }
  });
}

export default function SpatialView({ scene, asteroid }: { scene: AstronomyScene | null; asteroid: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [outer, setOuter] = useState(false);
  const [reset, setReset] = useState(0);
  const sceneReady = Boolean(scene);

  useEffect(() => {
    if (!host.current || (!asteroid && !sceneReady)) return;
    const element = host.current;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor('#07090e');
    element.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.001, 1000);
    camera.up.set(0, 0, 1);
    camera.position.set(asteroid ? 2.4 : outer ? 45 : 3.6, asteroid ? -3.5 : outer ? -60 : -4.8, asteroid ? 1.8 : outer ? 45 : 3.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = asteroid ? 1.3 : 0.05;
    controls.maxDistance = asteroid ? 12 : 160;
    world.add(new THREE.AmbientLight('#c5cce3', asteroid ? 1.6 : 2));
    const light = new THREE.DirectionalLight('#fff5e9', 3);
    light.position.set(3, -4, 5); world.add(light);
    const bodies = new Map<string, THREE.Mesh>();
    const labels: { element: HTMLSpanElement; object: THREE.Object3D }[] = [];
    const addLabel = (name: string, object: THREE.Object3D) => {
      const label = document.createElement('span'); label.className = 'obs-map-label'; label.textContent = name;
      element.appendChild(label); labels.push({ element: label, object });
    };
    let arrow: THREE.ArrowHelper | null = null;
    let observer: THREE.Mesh | null = null;
    if (asteroid) {
      new GLTFLoader().load(BENNU, (gltf) => {
        if (disposed) { disposeTree(gltf.scene); return; }
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const scale = 2 / Math.max(size.x, size.y, size.z);
        gltf.scene.position.copy(center).multiplyScalar(-scale); gltf.scene.scale.setScalar(scale);
        world.add(gltf.scene);
      });
    } else {
      for (const body of scene!.bodies) {
        if (!outer && ['jupiter', 'saturn', 'uranus', 'neptune'].includes(body.id)) continue;
        // All centers preserve one linear distance scale; body radii are enlarged.
        const radius = (outer ? 0.2 : 0.025) * (body.id === 'sun' ? 2.3 : body.id === 'jupiter' ? 1.6 : 1);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 24), new THREE.MeshStandardMaterial({ color: COLORS[body.id], roughness: 0.85, emissive: body.id === 'sun' ? COLORS.sun : '#000000', emissiveIntensity: body.id === 'sun' ? 1 : 0 }));
        world.add(mesh); bodies.set(body.id, mesh);
        // Moon's position is correct but its label is omitted at solar-system scale.
        if (body.id !== 'moon') addLabel(body.name, mesh);
      }
      observer = new THREE.Mesh(new THREE.ConeGeometry(outer ? .15 : .012, outer ? .4 : .035, 4), new THREE.MeshBasicMaterial({ color: '#A3E4D7' }));
      world.add(observer); addLabel('Observer at Earth', observer);
      labels.at(-1)?.element.classList.add('obs-observer-label');
      arrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), outer ? 8 : .65, '#A3E4D7', outer ? .8 : .08, outer ? .4 : .04);
      world.add(arrow);
      const grid = new THREE.GridHelper(outer ? 70 : 4, outer ? 14 : 8, '#363048', '#1a1e2b');
      grid.rotation.x = Math.PI / 2; world.add(grid);
    }
    const resize = () => { const width = element.clientWidth; const height = element.clientHeight; if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width/height; camera.updateProjectionMatrix(); };
    const observerResize = new ResizeObserver(resize); observerResize.observe(element); resize();
    let frame = 0;
    const draw = () => {
      if (disposed) return;
      const data = scene;
      if (!asteroid && data) {
        data.bodies.forEach((body) => bodies.get(body.id)?.position.fromArray(body.heliocentric_ecliptic_km).divideScalar(AU));
        observer?.position.fromArray(data.observer.heliocentric_ecliptic_km).divideScalar(AU);
        if (arrow && observer) { arrow.position.copy(observer.position); arrow.setDirection(new THREE.Vector3().fromArray(data.target.direction_ecliptic).normalize()); }
      }
      controls.update(); renderer.render(world, camera);
      for (const label of labels) {
        const p = label.object.position.clone().project(camera);
        label.element.style.transform = `translate(${(p.x + 1)*element.clientWidth/2}px,${(1-p.y)*element.clientHeight/2}px)`;
        label.element.hidden = p.z > 1 || Math.abs(p.x) > .95 || Math.abs(p.y) > .95;
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { disposed = true; cancelAnimationFrame(frame); observerResize.disconnect(); controls.dispose(); disposeTree(world); renderer.dispose(); renderer.domElement.remove(); labels.forEach((l) => l.element.remove()); };
  }, [asteroid, outer, reset, sceneReady, scene]);

  return <div className="obs-spatial">
    <div className="obs-spatial-canvas" ref={host} aria-label={asteroid ? 'Interactive three-dimensional Bennu model' : 'Third-person Solar System and observer position'} />
    <div className="obs-canvas-caption"><strong>{asteroid ? '101955 Bennu' : 'Where you are looking from'}</strong><span>{asteroid ? 'NASA shape model · drag to orbit · scroll to zoom' : 'Sun-centered positions · mint arrow shows the selected sky direction'}</span></div>
    {!asteroid && !sceneReady ? <div className="obs-loading">Waiting for Python observer calculations…</div> : null}
    {!scene && !asteroid ? <div className="obs-loading">Waiting for Python observer calculations…</div> : null}
    <div className="obs-map-footer"><p>{asteroid ? <><a href="https://science.nasa.gov/resource/bennu-3d-model/" target="_blank" rel="noreferrer">NASA model credit</a> · Shape inspection; no orbital position or spin simulation.</> : <>Distances use a linear AU scale. Spheres and observer marker are enlarged. Grid {outer ? '5' : '0.5'} AU.</>}</p><div>{!asteroid ? <button onClick={() => setOuter(!outer)}>{outer ? 'Inner planets' : 'All planets'}</button> : null}<button onClick={() => setReset((n) => n+1)}>Reset view</button></div></div>
  </div>;
}
