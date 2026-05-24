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
  const [showBorders, setShowBorders] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showRoads, setShowRoads] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [measureStart, setMeasureStart] = useState<LocationData | null>(null);
  const [measureEnd, setMeasureEnd] = useState<LocationData | null>(null);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const [activePanorama, setActivePanorama] = useState<string | null>(null);
  const [hasCesium, setHasCesium] = useState(false);
  const [activePanel, setActivePanel] = useState<'search' | 'voyager' | 'places' | 'layers' | 'measure' | null>('search');

  // 2. Zustand Store integrations
  const activeLocation = useUIStore((s) => s.activeLocation);
  const setActiveLocation = useUIStore((s) => s.setActiveLocation);
  const setIssFeedOpen = useUIStore((s) => s.setIssFeedOpen);

  // 3. Fallback Interactive Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef({ lng: 0, lat: 20 });
  const targetRef = useRef({ lng: 0, lat: 20 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const hoverLocationRef = useRef<LocationData | null>(null);


  // Synchronize target coordinates with active location
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
      canvas.style.cursor = foundHover ? 'pointer' : 'default';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
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

      // 3. Meridians (Longitudinal grid lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      for (const path of MERIDIANS_3D) {
        ctx.beginPath();
        let firstPoint = true;
        const len = path.length;
        for (let i = 0; i < len; i += 3) {
          const pt = projectUnitVector(
            path[i],
            path[i + 1],
            path[i + 2],
            sinRot,
            cosRot,
            sinTilt,
            cosTilt,
            R,
            cx,
            cy
          );
          if (pt.visible) {
            if (firstPoint) {
              ctx.moveTo(pt.x, pt.y);
              firstPoint = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            firstPoint = true;
          }
        }
        ctx.stroke();
      }

      // 4. Parallels (Latitudinal grid lines)
      for (const path of PARALLELS_3D) {
        ctx.beginPath();
        let firstPoint = true;
        const len = path.length;
        for (let i = 0; i < len; i += 3) {
          const pt = projectUnitVector(
            path[i],
            path[i + 1],
            path[i + 2],
            sinRot,
            cosRot,
            sinTilt,
            cosTilt,
            R,
            cx,
            cy
          );
          if (pt.visible) {
            if (firstPoint) {
              ctx.moveTo(pt.x, pt.y);
              firstPoint = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            firstPoint = true;
          }
        }
        ctx.stroke();
      }

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

  // Search filter
  const filteredLocations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return locations.slice(0, 5);
    return locations.filter((location) =>
      `${location.name} ${location.country} ${location.category}`.toLowerCase().includes(term),
    );
  }, [query]);

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
    <section className="earth-remix" aria-label="Earth explorer">
      {/* Top Pro-Style Menu Bar */}
      <header className="earth-menu">
        <div className="earth-logo-container">
          <div className="earth-logo" aria-hidden="true" />
          <span className="earth-logo-text">Google Earth</span>
        </div>
        {menuItems.map((item) => (
          <button key={item} type="button" className="earth-menu-item">{item}</button>
        ))}
        <div className="earth-menu-spacer" />
        <span className="earth-menu-badge">Remix Edition</span>
      </header>

      <div className="earth-workspace">
        {/* Left Side Vertical Toolbar */}
        <aside className="earth-sidebar" aria-label="Sidebar Toolbar">
          <button
            type="button"
            className={`earth-sidebar-btn ${activePanel === 'search' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'search' ? null : 'search')}
            title="Search Locations"
          >
            <Search size={20} />
            <span>Search</span>
          </button>
          <button
            type="button"
            className={`earth-sidebar-btn ${activePanel === 'voyager' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'voyager' ? null : 'voyager')}
            title="Voyager Guided Tours"
          >
            <Compass size={20} />
            <span>Voyager</span>
          </button>
          <button
            type="button"
            className={`earth-sidebar-btn ${activePanel === 'places' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'places' ? null : 'places')}
            title="Saved Places"
          >
            <Pin size={20} />
            <span>Places</span>
          </button>
          <button
            type="button"
            className={`earth-sidebar-btn ${activePanel === 'layers' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'layers' ? null : 'layers')}
            title="Map Style Layers"
          >
            <Layers size={20} />
            <span>Style</span>
          </button>
          <button
            type="button"
            className={`earth-sidebar-btn ${activePanel === 'measure' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'measure' ? null : 'measure')}
            title="Measure Distance"
          >
            <Ruler size={20} />
            <span>Measure</span>
          </button>
          
          <div className="earth-sidebar-spacer" />
          
          <button type="button" className="earth-sidebar-btn" title="Settings">
            <Settings size={20} />
          </button>
          <button type="button" className="earth-sidebar-btn" title="User Account">
            <UserCircle size={20} />
          </button>
        </aside>

        {/* Core Stage */}
        <div className="earth-stage">
          
          {/* Fallback 2D Sphere Globe when Cesium has not loaded */}
          {!hasCesium && (
            <div className="earth-globe-fallback">
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
                style={{ display: 'block', touchAction: 'none' }}
              />
            </div>
          )}

          {/* Floating Panels: Rendered absolute on top of the stage next to sidebar */}

          {/* 1. Search Results / Explore Panel */}
          {activePanel === 'search' && (
            <aside className="earth-panel earth-results-panel" aria-label="Search Panel">
              <div className="earth-panel-header">
                <span className="earth-panel-title">Search & Explore</span>
                <button type="button" className="earth-panel-close" onClick={() => setActivePanel(null)}><X size={16} /></button>
              </div>
              <div className="earth-search-input-wrapper">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cities, monuments, peaks..."
                  aria-label="Search locations"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="earth-search-clear">✕</button>
                )}
              </div>
              <div className="earth-result-list scroller">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    className={`earth-result-item ${activeLocation && location.id === activeLocation.id ? 'selected' : ''}`}
                    onClick={() => setActiveLocation(location)}
                  >
                    <span className="earth-result-name">{location.name}</span>
                    <small className="earth-result-meta">{location.country} · {location.category}</small>
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* 2. Voyager Guided Tours Panel */}
          {activePanel === 'voyager' && (
            <aside className="earth-panel earth-voyager-panel" aria-label="Voyager Tours Panel">
              <div className="earth-panel-header">
                <span className="earth-panel-title">Voyager Stories</span>
                <button type="button" className="earth-panel-close" onClick={() => setActivePanel(null)}><X size={16} /></button>
              </div>
              <div className="earth-tour-list scroller">
                {tours.map((tour) => (
                  <div key={tour.id} className="earth-tour-card">
                    <img src={tour.image} alt={tour.title} className="earth-tour-card-img" />
                    <div className="earth-tour-card-content">
                      <h3>{tour.title}</h3>
                      <p>{tour.description}</p>
                      <button 
                        type="button" 
                        className="earth-tour-start-btn" 
                        onClick={() => {
                          handleStartTour(tour);
                          setActivePanel(null); // Close sidebar panel to see guide
                        }}
                      >
                        <Play size={12} style={{ fill: 'currentColor' }} /> Start Tour
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* 3. Places Location Database Explorer */}
          {activePanel === 'places' && (
            <aside className="earth-panel earth-places-panel" aria-label="Saved Places Panel">
              <div className="earth-panel-header">
                <span className="earth-panel-title">Landmark Database</span>
                <button type="button" className="earth-panel-close" onClick={() => setActivePanel(null)}><X size={16} /></button>
              </div>
              <div className="earth-result-list scroller">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    className={`earth-result-item ${activeLocation && location.id === activeLocation.id ? 'selected' : ''}`}
                    onClick={() => setActiveLocation(location)}
                  >
                    <div className="flex items-center gap-2">
                      <Pin size={12} className="text-red-500 shrink-0" />
                      <span className="earth-result-name">{location.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* 4. Map Style & Layers Panel */}
          {activePanel === 'layers' && (
            <aside className="earth-panel earth-layers-panel" aria-label="Map Style Panel">
              <div className="earth-panel-header">
                <span className="earth-panel-title">Map Style Layers</span>
                <button type="button" className="earth-panel-close" onClick={() => setActivePanel(null)}><X size={16} /></button>
              </div>
              <div className="earth-layers-list">
                <div className="earth-layer-preset-grid">
                  <button 
                    type="button" 
                    className={`earth-preset-card ${showBorders && showTerrain ? 'active' : ''}`}
                    onClick={() => { setShowBorders(true); setShowTerrain(true); }}
                  >
                    <Map size={18} />
                    <span>Exploration</span>
                  </button>
                  <button 
                    type="button" 
                    className={`earth-preset-card ${!showBorders && showTerrain ? 'active' : ''}`}
                    onClick={() => { setShowBorders(false); setShowTerrain(true); }}
                  >
                    <Eye size={18} />
                    <span>Clean Globe</span>
                  </button>
                </div>
                
                <div className="earth-layer-toggles">
                  <label className="earth-layer-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={showBorders} 
                      onChange={(e) => setShowBorders(e.target.checked)} 
                    />
                    <span>Borders and Landmarks Labels</span>
                  </label>
                  <label className="earth-layer-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={showTerrain} 
                      onChange={(e) => setShowTerrain(e.target.checked)} 
                    />
                    <span>Photoreal 3D Terrain Tiles</span>
                  </label>
                  <label className="earth-layer-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={showRoads} 
                      onChange={(e) => setShowRoads(e.target.checked)} 
                    />
                    <span>Show Atmospheric Shadows</span>
                  </label>
                </div>
              </div>
            </aside>
          )}

          {/* 5. Measurement Tool Panel */}
          {activePanel === 'measure' && (
            <aside className="earth-panel earth-measure-panel" aria-label="Measure Distance Panel">
              <div className="earth-panel-header">
                <span className="earth-panel-title">Distance Ruler</span>
                <button type="button" className="earth-panel-close" onClick={() => setActivePanel(null)}><X size={16} /></button>
              </div>
              <div className="earth-measure-content">
                <p className="earth-measure-instructions">
                  Calculate distance by selecting a Start and End landmark.
                </p>

                <div className="earth-measure-selectors">
                  <div className="earth-measure-node">
                    <label>Start Location:</label>
                    <select 
                      value={measureStart?.id || ''} 
                      onChange={(e) => {
                        const loc = locations.find(l => l.id === e.target.value);
                        setMeasureStart(loc || null);
                      }}
                      className="earth-measure-select"
                    >
                      <option value="">-- Select Point A --</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="earth-measure-node">
                    <label>End Location:</label>
                    <select 
                      value={measureEnd?.id || ''} 
                      onChange={(e) => {
                        const loc = locations.find(l => l.id === e.target.value);
                        setMeasureEnd(loc || null);
                      }}
                      className="earth-measure-select"
                    >
                      <option value="">-- Select Point B --</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {measureDistance !== null && (
                  <div className="earth-measure-result">
                    <div className="earth-result-val">
                      {measureDistance.toFixed(2)} <span>km</span>
                    </div>
                    <div className="earth-result-val-miles">
                      {(measureDistance * 0.621371).toFixed(2)} <span>miles</span>
                    </div>
                    <div className="earth-measure-reset-wrapper">
                      <button 
                        type="button" 
                        className="earth-measure-reset-btn"
                        onClick={() => {
                          setMeasureStart(null);
                          setMeasureEnd(null);
                        }}
                      >
                        <RotateCcw size={12} /> Reset Ruler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

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
          <div className="earth-minimap" title="Orbital Minimap">
            <Map size={20} className="earth-minimap-icon" />
            <div className="earth-radar-ping" />
          </div>

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
