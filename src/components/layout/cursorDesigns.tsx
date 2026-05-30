import React from 'react';

export type CursorDesign = {
  id: string;
  name: string;
  preview: React.ReactElement;
  description?: string;
};

export const CURSOR_DESIGNS: CursorDesign[] = [
  {
    id: 'reticle-v1',
    name: 'Reticle',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="12" stroke="#A67BEA" strokeWidth="1.5" fill="none" />
        <path d="M24 6 L24 12 M24 36 L24 42 M6 24 L12 24 M36 24 L42 24" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill="#FFF" />
      </svg>
    ),
    description: 'Directional reticle with subtle glow and center dot',
  },
  {
    id: 'dot-trail',
    name: 'Dot Trail',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="14" cy="24" r="3" fill="#9EE7FF" opacity="0.35" />
        <circle cx="22" cy="24" r="4" fill="#6BD4FF" />
        <circle cx="32" cy="24" r="6" fill="#2BD0FF" opacity="0.25" />
      </svg>
    ),
    description: 'Core dot with fading trailing dots (low-profile)',
  },
  {
    id: 'comet-tail',
    name: 'Comet Tail',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#8A5BC7" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <rect x="6" y="20" width="28" height="8" rx="4" fill="url(#g1)" />
        <circle cx="38" cy="24" r="4" fill="#fff" />
      </svg>
    ),
    description: 'Elongated glowing tail like a comet',
  },
  {
    id: 'crosshair',
    name: 'Crosshair',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <path d="M24 8 L24 40 M8 24 L40 24" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2.5" fill="#A67BEA" />
      </svg>
    ),
    description: 'Minimal crosshair with a colored center',
  },
  {
    id: 'ring-pulse',
    name: 'Ring Pulse',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="8" stroke="#7DE3C9" strokeWidth="1.5" fill="none" />
        <circle cx="24" cy="24" r="3" fill="#7DE3C9" />
      </svg>
    ),
    description: 'Concentric rings that pulse on click',
  },
  {
    id: 'orbit',
    name: 'Orbiting',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="6" stroke="#FFF" strokeWidth="1" fill="#111" />
        <circle cx="30" cy="18" r="2" fill="#FFD27A" />
        <circle cx="18" cy="30" r="2" fill="#9EE7FF" />
      </svg>
    ),
    description: 'Multiple small bodies orbiting the cursor center',
  },
  {
    id: 'pixel',
    name: 'Pixel Pointer',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <rect x="18" y="14" width="12" height="12" fill="#FFF" />
        <rect x="20" y="16" width="8" height="8" fill="#8A5BC7" />
      </svg>
    ),
    description: 'Blocky pixel-art inspired pointer',
  },
  {
    id: 'radar',
    name: 'Radar Scan',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="10" stroke="#74F5C4" strokeWidth="1.2" fill="none" />
        <path d="M24 24 L36 18" stroke="#74F5C4" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    description: 'Sweeping radar-like scan arc',
  },
  {
    id: 'arrow',
    name: 'Classic Arrow',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <path d="M14 8 L34 24 L22 28 L18 36 L14 8" fill="#FFF" />
      </svg>
    ),
    description: 'Familiar arrow pointer with crisp edges',
  },
  {
    id: 'vortex',
    name: 'Particle Vortex',
    preview: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="10" stroke="#B0E7FF" strokeWidth="1" fill="none" />
        <circle cx="20" cy="18" r="1.5" fill="#B0E7FF" />
        <circle cx="28" cy="30" r="1.5" fill="#C7A6FF" />
      </svg>
    ),
    description: 'Swirling particles that orbit and decay',
  },
];

export default CURSOR_DESIGNS;
