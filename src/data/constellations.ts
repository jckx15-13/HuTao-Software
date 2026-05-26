/**
 * @file constellations.ts
 * @description Astronomical coordinates and star connections for major constellations.
 * RA is in decimal hours (0.0 to 24.0) and Dec is in decimal degrees (-90.0 to +90.0).
 */

export interface Star {
  name: string;
  ra: number;   // Right Ascension (decimal hours)
  dec: number;  // Declination (decimal degrees)
  magnitude?: number;
}

export interface Constellation {
  id: string;
  name: string;
  stars: Star[];
  connections: [number, number][]; // Index pairs representing lines connecting the stars
  synopsis: string;
}

export const constellations: Constellation[] = [
  {
    id: "orion",
    name: "Orion",
    synopsis: "Known as the Hunter, Orion is one of the most conspicuous and recognizable constellations in the night sky. It lies on the celestial equator and is visible throughout the world.",
    stars: [
      { name: "Betelgeuse", ra: 5.9194, dec: 7.4069, magnitude: 0.5 },
      { name: "Rigel", ra: 5.2422, dec: -8.2017, magnitude: 0.1 },
      { name: "Bellatrix", ra: 5.4189, dec: 6.3500, magnitude: 1.6 },
      { name: "Alnilam", ra: 5.6036, dec: -1.2019, magnitude: 1.7 },
      { name: "Alnitak", ra: 5.6794, dec: -1.9425, magnitude: 1.7 },
      { name: "Mintaka", ra: 5.5333, dec: -0.2992, magnitude: 2.2 },
      { name: "Saiph", ra: 5.7958, dec: -9.6697, magnitude: 2.1 }
    ],
    connections: [
      [0, 2], // Betelgeuse to Bellatrix (shoulders)
      [0, 4], // Betelgeuse to Alnitak
      [2, 5], // Bellatrix to Mintaka
      [1, 5], // Rigel to Mintaka
      [6, 4], // Saiph to Alnitak
      [1, 6], // Rigel to Saiph (feet)
      [5, 3], // Mintaka to Alnilam (belt)
      [3, 4]  // Alnilam to Alnitak (belt)
    ]
  },
  {
    id: "ursa_major",
    name: "Ursa Major (Big Dipper)",
    synopsis: "The Great Bear. The seven brightest stars of Ursa Major form the famous 'Big Dipper' asterism, one of the most important navigational aids in the northern sky.",
    stars: [
      { name: "Dubhe", ra: 11.0622, dec: 61.7511, magnitude: 1.8 },
      { name: "Merak", ra: 11.0306, dec: 56.3825, magnitude: 2.3 },
      { name: "Phecda", ra: 11.8972, dec: 53.7025, magnitude: 2.4 },
      { name: "Megrez", ra: 12.2569, dec: 57.0325, magnitude: 3.3 },
      { name: "Alioth", ra: 12.9006, dec: 55.9597, magnitude: 1.8 },
      { name: "Mizar", ra: 13.3989, dec: 54.9253, magnitude: 2.2 },
      { name: "Alkaid", ra: 13.7922, dec: 49.3133, magnitude: 1.9 }
    ],
    connections: [
      [1, 0], // Merak to Dubhe (pointers)
      [0, 3], // Dubhe to Megrez (bowl top)
      [3, 2], // Megrez to Phecda (bowl inner side)
      [2, 1], // Phecda to Merak (bowl bottom)
      [3, 4], // Megrez to Alioth (bowl to handle)
      [4, 5], // Alioth to Mizar (handle)
      [5, 6]  // Mizar to Alkaid (handle tip)
    ]
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    synopsis: "A prominent constellation in the northern sky, named after the boastful queen Cassiopeia. Its five brightest stars form a highly distinctive 'W' shape.",
    stars: [
      { name: "Caph", ra: 0.1531, dec: 59.1500, magnitude: 2.3 },
      { name: "Schedar", ra: 0.6750, dec: 56.5400, magnitude: 2.2 },
      { name: "Gamma Cas", ra: 0.9453, dec: 60.7200, magnitude: 2.2 },
      { name: "Ruchbah", ra: 1.4303, dec: 60.2400, magnitude: 2.7 },
      { name: "Segin", ra: 1.9067, dec: 63.6700, magnitude: 3.4 }
    ],
    connections: [
      [0, 1], // Caph to Schedar
      [1, 2], // Schedar to Gamma Cas
      [2, 3], // Gamma Cas to Ruchbah
      [3, 4]  // Ruchbah to Segin
    ]
  }
];
