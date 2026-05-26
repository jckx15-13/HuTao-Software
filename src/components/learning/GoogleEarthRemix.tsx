import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ChevronDown,
  Compass,
  FolderKanban,
  Layers,
  Map,
  Minus,
  Navigation,
  Pin,
  Plus,
  Ruler,
  Search,
  Settings,
  UserCircle,
  Waypoints,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '../../core/state/store';
import { pluginManager } from '../../core/plugins/PluginManager';
import { locations, type LocationData } from '../../data/locations';
import { tours, type Tour, type TourStep } from '../../data/tours';
import {
  LANDMASS_POINTS_3D,
  MERIDIANS_3D,
  PARALLELS_3D,
  projectUnitVector,
  projectLatLng,
  latLngToVector,
  slerp,
} from '../../lib/globeProjection';
import './GoogleEarthRemix.css';

const menuItems = ['File', 'Edit', 'View', 'Add', 'Tools', 'Help'];
const mapLabels = ['India', 'China', 'Thailand', 'Vietnam', 'Malaysia', 'Indonesia', 'Japan', 'Australia'];


export default function GoogleEarthRemix() {
  // 1. Primitive useState hooks
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(42);
  
  // Connected to global Zustand uiStore to sync with Cesium background
  const showBorders = useUIStore((s) => s.showBorders);
  const setShowBorders = useUIStore((s) => s.setShowBorders);
  const showTerrain = useUIStore((s) => s.showTerrain);
  const setShowTerrain = useUIStore((s) => s.setShowTerrain);
  const showRoads = useUIStore((s) => s.showRoads);
  const setShowRoads = useUIStore((s) => s.setShowRoads);

  const selectedTour = useUIStore((s) => s.activeTour);
  const setSelectedTour = useUIStore((s) => s.setActiveTour);
  const currentStepIndex = useUIStore((s) => s.activeTourStepIndex);
  const setCurrentStepIndex = useUIStore((s) => s.setActiveTourStepIndex);
  const measureStart = useUIStore((s) => s.measureStart);
  const setMeasureStart = useUIStore((s) => s.setMeasureStart);
  const measureEnd = useUIStore((s) => s.measureEnd);
  const setMeasureEnd = useUIStore((s) => s.setMeasureEnd);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const [activePanorama, setActivePanorama] = useState<string | null>(null);
  const [hasCesium, setHasCesium] = useState(false);

  // 2. Zustand Store integrations
  const activeLocation = useUIStore((s) => s.activeLocation);
  const setActiveLocation = useUIStore((s) => s.setActiveLocation);
  const setIssFeedOpen = useUIStore((s) => s.setIssFeedOpen);

  const mapConfig = useStore((s) => s.mapConfig);
  const updateMapConfig = useStore((s) => s.updateMapConfig);
  const layers = useStore((s) => s.layers);

  // 3. Fallback Interactive Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef({ lng: 0, lat: 20 });
  const targetRef = useRef({ lng: 0, lat: 20 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const hoverLocationRef = useRef<LocationData | null>(null);

  // 4. Fallback Interactive Canvas Refs
  useEffect(() => {
    if (activeLocation) {
      targetRef.current = {
        lng: activeLocation.lng,
        lat: activeLocation.lat,
      };
    }
  }, [activeLocation]);

  // Set initial camera position if location selected on load
  useEffect(() => {
    const initialLoc = useUIStore.getState().activeLocation;
    if (initialLoc) {
      cameraRef.current = { lng: initialLoc.lng, lat: initialLoc.lat };
      targetRef.current = { lng: initialLoc.lng, lat: initialLoc.lat };
    }
  }, []);

  // Mouse drag & click handlers for canvas fallback globe
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    clickStartPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      
      const scale = 0.45 * (42 / zoom);
      cameraRef.current.lng -= dx * scale;
      cameraRef.current.lat += dy * scale;
      
      // Clamp lat to prevent upside-down camera flips
      cameraRef.current.lat = Math.max(-85, Math.min(85, cameraRef.current.lat));
      
      // Keep target synchronized so it doesn't glide back to previous location on release
      targetRef.current.lng = cameraRef.current.lng;
      targetRef.current.lat = cameraRef.current.lat;
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    } else {
      // Hover coordinate checks
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const R_base = Math.min(rect.width, rect.height) * 0.35;
      const R = R_base * (zoom / 42);
      
      let foundHover: LocationData | null = null;
      for (const loc of locations) {
        const p = projectLatLng(loc.lat, loc.lng, (cameraRef.current.lng * Math.PI) / 180, (cameraRef.current.lat * Math.PI) / 180, R, cx, cy);
        if (p.visible) {
          const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
          if (dist < 8) {
            foundHover = loc;
            break;
          }
        }
      }
      
      hoverLocationRef.current = foundHover;
      canvas.style.cursor = foundHover ? 'pointer' : 'grab';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    e.currentTarget.style.cursor = hoverLocationRef.current ? 'pointer' : 'grab';
    const dx = Math.abs(e.clientX - clickStartPosRef.current.x);
    const dy = Math.abs(e.clientY - clickStartPosRef.current.y);
    // If movement was minimal, handle as click
    if (dx < 3 && dy < 3) {
      if (hoverLocationRef.current) {
        setActiveLocation(hoverLocationRef.current);
      }
    }
  };

  // Touch drag handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      const touch = e.touches[0];
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
      clickStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePosRef.current.x;
      const dy = touch.clientY - lastMousePosRef.current.y;
      
      const scale = 0.45 * (42 / zoom);
      cameraRef.current.lng -= dx * scale;
      cameraRef.current.lat += dy * scale;
      cameraRef.current.lat = Math.max(-85, Math.min(85, cameraRef.current.lat));
      
      targetRef.current.lng = cameraRef.current.lng;
      targetRef.current.lat = cameraRef.current.lat;
      
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - clickStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - clickStartPosRef.current.y);
      if (dx < 5 && dy < 5) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const touchX = touch.clientX - rect.left;
          const touchY = touch.clientY - rect.top;
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const R_base = Math.min(rect.width, rect.height) * 0.35;
          const R = R_base * (zoom / 42);
          
          for (const loc of locations) {
            const p = projectLatLng(loc.lat, loc.lng, (cameraRef.current.lng * Math.PI) / 180, (cameraRef.current.lat * Math.PI) / 180, R, cx, cy);
            if (p.visible) {
              const dist = Math.hypot(touchX - p.x, touchY - p.y);
              if (dist < 15) {
                setActiveLocation(loc);
                break;
              }
            }
          }
        }
      }
    }
  };

  // High performance Canvas 2D Vector Globe rendering loop
  useEffect(() => {
    if (hasCesium) return;

    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const renderFrame = () => {
      if (!active) return;

      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const R_base = Math.min(rect.width, rect.height) * 0.35;
      const R = R_base * (zoom / 42);

      // Smooth camera glide (LERP)
      const current = cameraRef.current;
      const target = targetRef.current;
      
      let diffLng = target.lng - current.lng;
      diffLng = ((diffLng + 180) % 360) - 180;
      current.lng += diffLng * 0.12; // Slow glide LERP
      
      const diffLat = target.lat - current.lat;
      current.lat += diffLat * 0.12;

      const rotationRad = (current.lng * Math.PI) / 180;
      const tiltRad = (current.lat * Math.PI) / 180;

      const sinRot = Math.sin(rotationRad);
      const cosRot = Math.cos(rotationRad);
      const sinTilt = Math.sin(tiltRad);
      const cosTilt = Math.cos(tiltRad);

      // Clear viewport
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. Atmosphere edge glow
      ctx.strokeStyle = 'rgba(66, 133, 244, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.stroke();

      // 2. Spherical gradient ocean fill
      const oceanGrad = ctx.createRadialGradient(cx - R / 3, cy - R / 3, 5, cx, cy, R);
      oceanGrad.addColorStop(0, '#2b61b3');
      oceanGrad.addColorStop(0.65, '#15397a');
      oceanGrad.addColorStop(1, '#030814');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.fill();

      // (Grid lines removed to prevent CRT scanline effects)

      // 5. Landmass continent node markers
      ctx.fillStyle = 'rgba(91, 168, 98, 0.65)';
      const pointSize = Math.max(1, 1.8 * (zoom / 42));
      const pointsLen = LANDMASS_POINTS_3D.length;
      for (let i = 0; i < pointsLen; i += 3) {
        const p = projectUnitVector(
          LANDMASS_POINTS_3D[i],
          LANDMASS_POINTS_3D[i + 1],
          LANDMASS_POINTS_3D[i + 2],
          sinRot,
          cosRot,
          sinTilt,
          cosTilt,
          R,
          cx,
          cy
        );
        if (p.visible) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pointSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // 6. Spherical terminator overlay shadow
      const shadowGrad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
      shadowGrad.addColorStop(0.75, 'rgba(0,0,0,0.5)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.fill();

      // 7. Distance Ruler Geodetic Line (Great Circle Path)
      if (measureStart && measureEnd) {
        const v1 = latLngToVector(measureStart.lat, measureStart.lng);
        const v2 = latLngToVector(measureEnd.lat, measureEnd.lng);
        
        ctx.strokeStyle = 'rgba(66, 133, 244, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let firstPt = true;
        const segments = 45;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const v = slerp(v1, v2, t);
          const lat = (Math.asin(v.z) * 180) / Math.PI;
          const lng = (Math.atan2(v.y, v.x) * 180) / Math.PI;
          
          const opt = projectLatLng(lat, lng, rotationRad, tiltRad, R, cx, cy);
          if (opt.visible) {
            if (firstPt) {
              ctx.moveTo(opt.x, opt.y);
              firstPt = false;
            } else {
              ctx.lineTo(opt.x, opt.y);
            }
          } else {
            firstPt = true;
          }
        }
        ctx.stroke();

        // Start and End nodes drawing
        const ptStart = projectLatLng(measureStart.lat, measureStart.lng, rotationRad, tiltRad, R, cx, cy);
        const ptEnd = projectLatLng(measureEnd.lat, measureEnd.lng, rotationRad, tiltRad, R, cx, cy);

        if (ptStart.visible) {
          ctx.fillStyle = '#34a853';
          ctx.beginPath();
          ctx.arc(ptStart.x, ptStart.y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        if (ptEnd.visible) {
          ctx.fillStyle = '#ea4335';
          ctx.beginPath();
          ctx.arc(ptEnd.x, ptEnd.y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 8. Locations / Landmark Markers
      for (const loc of locations) {
        const p = projectLatLng(loc.lat, loc.lng, rotationRad, tiltRad, R, cx, cy);
        if (p.visible) {
          const isActive = activeLocation && loc.id === activeLocation.id;
          const isHovered = hoverLocationRef.current && loc.id === hoverLocationRef.current.id;

          ctx.beginPath();
          ctx.arc(p.x, p.y, isActive ? 6 : (isHovered ? 5 : 4), 0, 2 * Math.PI);
          ctx.fillStyle = isActive ? '#4285f4' : '#ea4335';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isActive || isHovered ? 2 : 1;
          ctx.stroke();

          // Active/Hover pulse indicator rings
          if (isActive || isHovered) {
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
            ctx.strokeStyle = isActive ? 'rgba(66, 133, 244, 0.4)' : 'rgba(234, 67, 53, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, (isActive ? 10 : 8) + pulse * 4, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Text labels for landmarks
          if (showBorders || isActive || isHovered) {
            ctx.font = isHovered || isActive ? 'bold 9px system-ui' : '9px system-ui';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.textAlign = 'left';
            ctx.fillText(loc.name.split(',')[0], p.x + 8, p.y + 3);
            
            // Clear text shadow context
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
        }
      }

      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);

    return () => {
      active = false;
    };
  }, [hasCesium, zoom, measureStart, measureEnd, showBorders, activeLocation]);

  useEffect(() => {
    const checkCesium = () => {
      const viewer = (window as any).cesiumViewer;
      if (viewer) {
        setHasCesium(true);
      }
    };
    checkCesium();
    const interval = setInterval(checkCesium, 1000);
    return () => clearInterval(interval);
  }, []);


  // Sync Borders and Labels visibility to Cesium
  useEffect(() => {
    const viewer = (window as any).cesiumViewer;
    if (!viewer) return;

    for (let i = 0; i < viewer.entities.values.length; i++) {
      const entity = viewer.entities.values[i];
      if (entity.label) {
        entity.label.show = new Cesium.ConstantProperty(showBorders);
      }
      if (entity.point) {
        entity.point.show = new Cesium.ConstantProperty(showBorders);
      }
    }
    viewer.scene.requestRender();
  }, [showBorders, hasCesium]);

  // Sync Terrain layers to Cesium
  useEffect(() => {
    const viewer = (window as any).cesiumViewer;
    if (!viewer) return;

    for (let i = 0; i < viewer.scene.primitives.length; i++) {
      const primitive = viewer.scene.primitives.get(i);
      if (primitive.show !== undefined) {
        primitive.show = showTerrain;
      }
    }
    for (let i = 0; i < viewer.imageryLayers.length; i++) {
      const layer = viewer.imageryLayers.get(i);
      layer.show = showTerrain;
    }
    viewer.scene.requestRender();
  }, [showTerrain, hasCesium]);

  // Draw holographic measurement line in Cesium
  useEffect(() => {
    const viewer = (window as any).cesiumViewer;
    if (!viewer) return;

    let polylineEntity: Cesium.Entity | null = null;

    if (measureStart && measureEnd) {
      polylineEntity = viewer.entities.add({
        id: 'measure-line',
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            measureStart.lng, measureStart.lat,
            measureEnd.lng, measureEnd.lat,
          ]),
          width: 3,
          material: Cesium.Color.fromCssColorString('#4285f4'),
          clampToGround: true,
        },
      });

      // Calculate great circle distance
      const distance = calculateDistance(
        measureStart.lat,
        measureStart.lng,
        measureEnd.lat,
        measureEnd.lng
      );
      setMeasureDistance(distance);
      viewer.scene.requestRender();
    } else {
      setMeasureDistance(null);
    }

    return () => {
      if (viewer && polylineEntity) {
        viewer.entities.remove(polylineEntity);
        viewer.scene.requestRender();
      }
    };
  }, [measureStart, measureEnd, hasCesium]);

  // Search filter for both landmarks and active plugin entities
  const filteredResults = useMemo(() => {
    const term = query.trim().toLowerCase();

    // Map static locations
    const staticMatches = locations.map(l => ({
      id: l.id,
      name: l.name,
      country: l.country,
      category: l.category,
      lat: l.lat,
      lng: l.lng,
      type: 'landmark' as const,
      raw: l
    }));

    // Map plugin entities
    const pluginMatches: any[] = [];
    const entitiesByPlugin = useStore.getState().entitiesByPlugin;
    Object.entries(entitiesByPlugin).forEach(([pluginId, entities]) => {
      entities.forEach((entity) => {
        const name = entity.label || entity.id;
        const category = pluginManager.getPlugin(pluginId)?.plugin.category || 'plugin';
        pluginMatches.push({
          id: entity.id,
          name,
          country: pluginId.toUpperCase(),
          category,
          lat: entity.latitude,
          lng: entity.longitude,
          type: 'entity' as const,
          raw: entity
        });
      });
    });

    const allItems = [...staticMatches, ...pluginMatches];
    if (!term) return allItems.slice(0, 5);

    return allItems.filter((item) =>
      `${item.name} ${item.country} ${item.category}`.toLowerCase().includes(term)
    );
  }, [query, layers]);

  const applyGraphicsPreset = (preset: 'low' | 'high') => {
    if (preset === 'low') {
      updateMapConfig({
        shadowsEnabled: false,
        enableLighting: false,
        resolutionScale: 0.7,
        antiAliasing: 'none',
        maxScreenSpaceError: 64,
        showOsmBuildings: false
      });
      useUIStore.getState().setShowBorders(true);
      useUIStore.getState().setShowTerrain(true);
      useUIStore.getState().addChangeLog('GRAPHICS', 'Performance Preset Applied: shadows off, 0.7x scale, AA off.', 'info');
    } else {
      updateMapConfig({
        shadowsEnabled: true,
        enableLighting: true,
        resolutionScale: 1.0,
        antiAliasing: 'msaa4x',
        maxScreenSpaceError: 16,
        showOsmBuildings: true
      });
      useUIStore.getState().setShowBorders(true);
      useUIStore.getState().setShowTerrain(true);
      useUIStore.getState().addChangeLog('GRAPHICS', 'Cinematic Preset Applied: shadows on, 1.0x scale, MSAA 4x, OSM buildings active.', 'success');
    }
  };

  // Calculate distance formula (Haversine)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Camera flights
  const handleZoomIn = () => {
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.35);
      viewer.scene.requestRender();
    } else {
      setZoom((value) => Math.min(72, value + 8));
    }
  };

  const handleZoomOut = () => {
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.35);
      viewer.scene.requestRender();
    } else {
      setZoom((value) => Math.max(24, value - 8));
    }
  };

  const handleCompass = () => {
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      viewer.camera.flyTo({
        destination: viewer.camera.position,
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0,
        },
        duration: 1.5,
        complete: () => viewer.scene.requestRender(),
      });
    }
  };

  const handleRecenter = () => {
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      if (activeLocation) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(activeLocation.lng, activeLocation.lat, 1800000),
          duration: 1.5,
          complete: () => viewer.scene.requestRender(),
        });
      } else {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
          duration: 1.5,
          complete: () => viewer.scene.requestRender(),
        });
      }
    }
  };

  // Tour Step Handlers
  const handleStartTour = (tour: Tour) => {
    setSelectedTour(tour);
    setCurrentStepIndex(0);
    flyToStep(tour.steps[0]);
  };

  const handleNextStep = () => {
    if (!selectedTour) return;
    const nextIndex = (currentStepIndex + 1) % selectedTour.steps.length;
    setCurrentStepIndex(nextIndex);
    flyToStep(selectedTour.steps[nextIndex]);
  };

  const handlePrevStep = () => {
    if (!selectedTour) return;
    const prevIndex = (currentStepIndex - 1 + selectedTour.steps.length) % selectedTour.steps.length;
    setCurrentStepIndex(prevIndex);
    flyToStep(selectedTour.steps[prevIndex]);
  };

  const flyToStep = (step: TourStep) => {
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(step.lng, step.lat, 250000), // Fly close (250km)
        duration: 2.0,
        complete: () => viewer.scene.requestRender(),
      });

      // Maintain rendering
      const listener = viewer.scene.preUpdate.addEventListener(() => viewer.scene.requestRender());
      setTimeout(() => listener(), 2500);
    }
  };

  const activeTourStep = selectedTour?.steps[currentStepIndex];

  return (
    <section className="earth-remix" aria-label="Orbital explorer">
      {/* Top Pro-Style Menu Bar */}
      <header className="earth-menu">
        <button
          type="button"
          className="earth-logo-container cursor-pointer hover:opacity-85 active:scale-95 transition-all border-0 bg-transparent text-left flex items-center gap-2 p-0"
          onClick={() => {
            useUIStore.getState().addChangeLog('ORBITAL', 'Orbital Core diagnostics synced. Status: OPTIMAL.', 'success');
            alert('Orbital Engine Status: OPTIMAL\nActive Array: WWT/WWV Composite');
          }}
        >
          <div className="earth-logo" aria-hidden="true" />
          <span className="earth-logo-text">Google Orbital</span>
        </button>
        
        <button 
          type="button" 
          className="earth-menu-item"
          onClick={() => {
            useUIStore.getState().setLeftPanelOpen(true);
            useUIStore.getState().addChangeLog('UI', 'Unified Spatial Sidebar opened. Navigate to Plugins section.', 'info');
          }}
        >
          File
        </button>
        <button 
          type="button" 
          className="earth-menu-item"
          onClick={() => {
            setMeasureStart(null);
            setMeasureEnd(null);
            setMeasureDistance(null);
            useUIStore.getState().addChangeLog('MEASUREMENT', 'Ruler markers reset.', 'info');
          }}
        >
          Edit
        </button>
        <button 
          type="button" 
          className="earth-menu-item"
          onClick={() => {
            handleCompass();
            useUIStore.getState().addChangeLog('CAMERA', 'Camera heading reset to North up.', 'info');
          }}
        >
          View
        </button>
        <button 
          type="button" 
          className="earth-menu-item"
          onClick={() => {
            useUIStore.getState().setLeftPanelOpen(true);
            useUIStore.getState().addChangeLog('UI', 'Unified Spatial Sidebar opened. Navigate to Saved Places section.', 'info');
          }}
        >
          Add
        </button>
        <button 
          type="button" 
          className="earth-menu-item"
          onClick={() => {
            useUIStore.getState().setLeftPanelOpen(true);
            useUIStore.getState().addChangeLog('UI', 'Unified Spatial Sidebar opened. Navigate to Style & Graphics section.', 'info');
          }}
        >
          Tools
        </button>
        <button 
          type="button" 
          className="earth-menu-item"
          onClick={() => {
            useUIStore.getState().setRightPanelTab('browser');
            useUIStore.getState().setRightPanelOpen(true);
            useUIStore.getState().setBrowserUrl('https://html.duckduckgo.com/html/?q=Silver+Wolf+VI+Operator+Manual');
            useUIStore.getState().addChangeLog('HELP', 'Opened Help Manual query in Browser.', 'info');
          }}
        >
          Help
        </button>

        <div className="earth-menu-spacer" />
        <span className="earth-menu-badge">Orbital Edition</span>
      </header>

      <div className="earth-workspace">
        {/* Core Stage */}
        <div className="earth-stage">
          
          {/* Spatial HUD Migration Notice */}
          {!useUIStore.getState().leftPanelOpen && (
            <div className="absolute top-4 left-4 z-50 glass-panel p-3 px-4 flex items-center gap-3 animate-fade-in">
              <div className="flex items-center gap-2 text-white/80 text-xs font-mono">
                <Compass className="w-4 h-4 text-primary animate-pulse" />
                <span>Controls moved to Spatial HUD</span>
              </div>
              <button
                onClick={() => useUIStore.getState().setLeftPanelOpen(true)}
                className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer"
              >
                Open HUD
              </button>
            </div>
          )}
          {/* Fallback 2D Sphere Globe when Cesium has not loaded */}
          {!hasCesium && (
            <div className="earth-globe-fallback pointer-events-auto">
              <div className="earth-starfield" aria-hidden="true" />
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-[min(65vw,680px)] aspect-square max-h-[75vh]"
                style={{ display: 'block', touchAction: 'none', cursor: 'grab' }}
              />
            </div>
          )}

          {/* Direct Pass-Through: Clicks go straight to the background Cesium canvas */}

          {/* Active Voyager Tour Step Overlay */}
          {selectedTour && activeTourStep && (
            <aside className="earth-tour-guide" aria-label="Tour step guides">
              <div className="earth-tour-guide-header">
                <span className="earth-tour-guide-name">{selectedTour.title}</span>
                <button 
                  type="button" 
                  className="earth-tour-close" 
                  onClick={() => setSelectedTour(null)}
                  title="End Tour"
                >
                  ✕
                </button>
              </div>
              <div className="earth-tour-step-card">
                {activeTourStep.image && (
                  <img src={activeTourStep.image} alt={activeTourStep.title} className="earth-tour-step-img" />
                )}
                <div className="earth-tour-step-content">
                  <div className="earth-tour-step-badge">Step {currentStepIndex + 1} of {selectedTour.steps.length}</div>
                  <h2>{activeTourStep.title}</h2>
                  <small className="earth-tour-step-meta">{activeTourStep.location}</small>
                  <p className="scroller">{activeTourStep.description}</p>
                  
                  <div className="earth-tour-controls">
                    <button type="button" onClick={handlePrevStep} className="earth-tour-btn-nav"><ChevronLeft size={16} /></button>
                    {activeTourStep.panoramaUrl && (
                      <button 
                        type="button" 
                        onClick={() => setActivePanorama(activeTourStep.panoramaUrl || null)}
                        className="earth-tour-streetview-btn"
                      >
                        <Camera size={14} /> Street View
                      </button>
                    )}
                    <button type="button" onClick={handleNextStep} className="earth-tour-btn-nav"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Right-Side Google Earth Knowledge Card (Slides in when location selected) */}
          {activeLocation && !selectedTour && (
            <aside className="earth-place pointer-events-auto" aria-label="Selected place details">
              <button 
                type="button" 
                className="earth-place-close"
                onClick={() => setActiveLocation(null)}
                title="Dismiss knowledge card"
              >
                <X size={16} />
              </button>
              <img src={activeLocation.image} alt="" loading="lazy" />
              <div className="earth-place-content">
                <span className="earth-place-category">{activeLocation.category}</span>
                <h2 className="earth-place-name">{activeLocation.name}</h2>
                <span className="earth-place-country">{activeLocation.country}</span>
                
                <p className="scroller">{activeLocation.description}</p>
                
                <div className="earth-facts-grid">
                  <div className="earth-fact-node">
                    <span className="lbl">Elevation</span>
                    <span className="val">{activeLocation.elevation}</span>
                  </div>
                  <div className="earth-fact-node">
                    <span className="lbl">Coordinates</span>
                    <span className="val">{activeLocation.lat.toFixed(3)}° N, {activeLocation.lng.toFixed(3)}° E</span>
                  </div>
                </div>
                
                {activeLocation.facts && activeLocation.facts.length > 0 && (
                  <div className="earth-facts-bullet">
                    <h4>Landmark Codex</h4>
                    <ul>
                      {activeLocation.facts.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Minimap (Radar Grid) */}
          <button 
            type="button"
            className="earth-minimap cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200" 
            title="Recenter Camera to Global View"
            onClick={handleRecenter}
          >
            <Map size={20} className="earth-minimap-icon" />
            <div className="earth-radar-ping" />
          </button>

          {/* Bottom Right Globe Navigation Controls */}
          <div className="earth-controls" aria-label="Map controls">
            <button 
              type="button" 
              className="earth-ctrl-btn pegman-btn" 
              title="Drag Pegman / ISS Tracker"
              onClick={() => setIssFeedOpen(true)}
            >
              <UserCircle size={22} />
            </button>
            <button 
              type="button" 
              className="earth-ctrl-btn" 
              onClick={handleRecenter} 
              title="Fly to active location"
            >
              <Navigation size={20} />
            </button>
            <button 
              type="button" 
              className="earth-ctrl-btn compass-btn" 
              onClick={handleCompass} 
              title="Reset camera heading (North up)"
            >
              <Compass size={20} />
            </button>
            <div className="earth-zoom-cluster">
              <button type="button" onClick={handleZoomOut} title="Zoom Out">
                <Minus size={20} />
              </button>
              <div className="earth-zoom-bar" />
              <button type="button" onClick={handleZoomIn} title="Zoom In">
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Draggable Street View Panorama Overlayer */}
          {activePanorama && (
            <PanoramaViewer 
              imageUrl={activePanorama} 
              onClose={() => setActivePanorama(null)} 
            />
          )}

          {/* Bottom Status Information Bar */}
          <footer className="earth-status">
            <span className="earth-copyright">Map data ©2026 Google</span>
            <span className="earth-status-spacer" />
            <span>Camera Altitude: {hasCesium ? 'Dynamic' : `${Math.round((78 - zoom) * 920)} km`}</span>
            <span>Scale: {hasCesium ? 'Dynamic' : (zoom < 36 ? '10,000 km' : '1,000 km')}</span>
            {activeLocation && (
              <span>Coords: {activeLocation.lat.toFixed(4)}° N, {activeLocation.lng.toFixed(4)}° E</span>
            )}
          </footer>
        </div>
      </div>
    </section>
  );
}

// Draggable 360-degree Panorama Component
function PanoramaViewer({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Center the panorama image on mount
  useEffect(() => {
    if (containerRef.current) {
      const scrollWidth = containerRef.current.scrollWidth;
      const clientWidth = containerRef.current.clientWidth;
      containerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
    }
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.8; // Scroll speed
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="earth-panorama-overlay pointer-events-auto">
      <button 
        type="button" 
        className="earth-panorama-close" 
        onClick={onClose} 
        aria-label="Exit Street View"
        title="Exit Street View"
      >
        ✕
      </button>
      <div 
        ref={containerRef}
        className="earth-panorama-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <img 
          src={imageUrl} 
          alt="Street View 360" 
          className="earth-panorama-image"
          draggable="false"
        />
      </div>
      <div className="earth-panorama-help">
        DRAG MOUSE TO PAN 360° STREET VIEW // PRESS ESC OR CLICK CLOSE TO EXIT
      </div>
    </div>
  );
}

function ToolbarIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button type="button" className="earth-tool" aria-label={label} title={label}>
      {children}
    </button>
  );
}

function markerStyle(location: LocationData) {
  return {
    left: `${Math.max(8, Math.min(92, ((location.lng + 180) / 360) * 100))}%`,
    top: `${Math.max(10, Math.min(88, ((90 - location.lat) / 180) * 100))}%`,
  };
}

function labelStyle(index: number) {
  const points = [
    [37, 43], [55, 29], [61, 52], [66, 50], [58, 70], [69, 75], [79, 31], [74, 91],
  ];
  const [left, top] = points[index] || [50, 50];
  return { left: `${left}%`, top: `${top}%` };
}
