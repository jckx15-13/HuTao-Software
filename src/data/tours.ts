export interface TourStep {
  title: string;
  location: string;
  lat: number;
  lng: number;
  description: string;
  image: string;
  panoramaUrl?: string; // High-quality 360-degree panorama placeholder or url
}

export interface Tour {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  steps: TourStep[];
}

export const tours: Tour[] = [
  {
    id: 'ancient_wonders',
    title: 'Wonders of the Ancient World',
    author: 'Google Earth Education',
    description: 'Travel through history and explore the architectural masterpieces that have defined ancient civilization. From the soaring heights of Giza to the rose-red sandstone of Petra.',
    image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80',
    steps: [
      {
        title: 'Great Pyramids of Giza',
        location: 'Cairo, Egypt',
        lat: 29.9792,
        lng: 31.1342,
        description: 'We begin our tour at the Giza Plateau, home to the Great Pyramids. These towering limestone monuments have stood for over 4,500 years as tombs for ancient Pharaohs and remain one of humanity\'s greatest architectural accomplishments.',
        image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'The Colosseum',
        location: 'Rome, Italy',
        lat: 41.8902,
        lng: 12.4922,
        description: 'Next, we travel to the heart of the Roman Empire. The Colosseum, built under Emperor Vespasian in 72 AD, is the largest standing ancient amphitheater. It could hold over 50,000 spectators for gladiatorial battles and public dramas.',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Al-Khazneh (The Treasury) in Petra',
        location: 'Ma\'an Governorate, Jordan',
        lat: 30.3285,
        lng: 35.4444,
        description: 'We now fly to Petra, the legendary Nabataean capital. Carved directly into the vibrant rose-red sandstone cliffs of Jordan around 300 BC, the Treasury is a breathtaking blend of Hellenistic and eastern architectural styles.',
        image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Taj Mahal',
        location: 'Agra, India',
        lat: 27.1751,
        lng: 78.0421,
        description: 'Our final ancient wonder is the majestic Taj Mahal. Commissioned in 1631 by Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal, this white marble mausoleum represents the pinnacle of Mughal craftsmanship and love.',
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80'
      }
    ]
  },
  {
    id: 'nature_wonders',
    title: 'Natural Majestic Landscapes',
    author: 'National Geographic',
    description: 'Embark on a global expedition to witness the awe-inspiring power of natural geological forces. Stand at the rim of grand canyons and look up at the highest peaks on Earth.',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    steps: [
      {
        title: 'Grand Canyon National Park',
        location: 'Arizona, USA',
        lat: 36.0544,
        lng: -112.1401,
        description: 'We begin our natural tour at the Grand Canyon in Arizona. Over millions of years, the Colorado River carved this massive chasm, exposing colorful bands of rock that reveal almost two billion years of Earth\'s geological history.',
        image: 'https://images.unsplash.com/photo-1615551043360-33de8b5f410c?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Mount Everest',
        location: 'Himalayas, Nepal / China',
        lat: 27.9881,
        lng: 86.9250,
        description: 'We fly to the rooftop of the world, Mount Everest. Reaching 8,848.86 meters above sea level, Everest stands as a monument to geological tectonic forces, where the Indian plate constantly collides with Eurasia.',
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Great Barrier Reef',
        location: 'Queensland, Australia',
        lat: -18.2871,
        lng: 147.6992,
        description: 'Finally, we dive into the sapphire waters of the Coral Sea. The Great Barrier Reef is the largest living structure on Earth, consisting of thousands of individual coral reefs that are home to countless species of marine life.',
        image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
      }
    ]
  },
  {
    id: 'modern_icons',
    title: 'Modern Architecture Icons',
    author: 'Architecture Digest',
    description: 'Discover the steel, concrete, and creative genius behind the modern structures that have come to represent and redefine their home cities.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    steps: [
      {
        title: 'The Eiffel Tower',
        location: 'Paris, France',
        lat: 48.8584,
        lng: 2.2945,
        description: 'We begin in Paris. The Eiffel Tower, completed in 1889, was originally critiqued by leading artists of the time but has since become the ultimate global icon of modernity and architectural romance.',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Sydney Opera House',
        location: 'Sydney, Australia',
        lat: -33.8568,
        lng: 151.2153,
        description: 'Next, we travel to Sydney Harbor. Jørn Utzon\'s expressionist design of sail-like shells was a triumph of structural engineering, pushing the limits of precast concrete technology in the 1960s.',
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Statue of Liberty',
        location: 'New York, USA',
        lat: 40.6892,
        lng: -74.0445,
        description: 'We conclude our tour in New York City. The Statue of Liberty, dedicated in 1886, is a neoclassical marvel of sheet copper and iron engineering. Its internal pylon was designed by none other than Gustave Eiffel.',
        image: 'https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=600&q=80',
        panoramaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80'
      }
    ]
  }
];
