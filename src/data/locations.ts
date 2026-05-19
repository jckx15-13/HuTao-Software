export interface LocationData {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
  elevation: string;
  category: string;
  image: string;
  facts: string[];
}

export const locations: LocationData[] = [
  {
    id: 'eiffel',
    name: 'Eiffel Tower, Paris',
    country: 'France',
    lat: 48.8584,
    lng: 2.2945,
    description: 'Constructed in 1889 as the entrance arch to the 1889 World\'s Fair, the Eiffel Tower has become a global cultural icon of France and one of the most recognizable structures in the world.',
    elevation: '34m',
    category: 'Monuments',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Height: 330 meters (including antennas)',
      'Architect: Gustave Eiffel',
      'Completed: March 31, 1889',
      'Nicknamed: "La dame de fer" (The Iron Lady)'
    ]
  },
  {
    id: 'grand_canyon',
    name: 'Grand Canyon, Arizona',
    country: 'United States',
    lat: 36.0544,
    lng: -112.1401,
    description: 'The Grand Canyon is a steep-sided canyon carved by the Colorado River in Arizona. It is 277 miles long, up to 18 miles wide and attains a depth of over a mile (6,093 feet or 1,857 meters).',
    elevation: '2,074m',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1615551043360-33de8b5f410c?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Age: The Colorado River established its course through the canyon 5 to 6 million years ago',
      'Length: 446 km (277 miles)',
      'Deepest Point: ~1,857 meters (6,093 feet)',
      'Protected status: National Park established in 1919'
    ]
  },
  {
    id: 'pyramids',
    name: 'Great Pyramids of Giza',
    country: 'Egypt',
    lat: 29.9792,
    lng: 31.1342,
    description: 'The Great Pyramid of Giza is the oldest and largest of the three pyramids in the Giza pyramid complex bordering present-day Giza in Greater Cairo, Egypt. It is the oldest of the Seven Wonders of the Ancient World.',
    elevation: '15m',
    category: 'Ancient Wonders',
    image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Built for: Pharaoh Khufu',
      'Age: Over 4,500 years old (c. 2560 BC)',
      'Height: Originally 146.6 meters, now 138.8 meters due to erosion',
      'Materials: Constructed of an estimated 2.3 million limestone blocks'
    ]
  },
  {
    id: 'colosseum',
    name: 'The Colosseum, Rome',
    country: 'Italy',
    lat: 41.8902,
    lng: 12.4922,
    description: 'The Colosseum is an oval amphitheatre in the centre of the city of Rome, Italy, just east of the Roman Forum. It is the largest ancient amphitheatre ever built, and is still the largest standing amphitheatre in the world.',
    elevation: '20m',
    category: 'Monuments',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Construction started: Under Emperor Vespasian in 72 AD',
      'Capacity: Estimated to hold between 50,000 and 80,000 spectators',
      'Usage: Gladiator combats, mock sea battles, drama executions',
      'Status: One of the New 7 Wonders of the World'
    ]
  },
  {
    id: 'everest',
    name: 'Mount Everest, Himalayas',
    country: 'Nepal / China',
    lat: 27.9881,
    lng: 86.9250,
    description: 'Mount Everest is Earth\'s highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas. The international border between Nepal and China runs across its summit point.',
    elevation: '8,848m',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Elevation: 8,848.86 meters (29,031.7 ft) verified in 2020',
      'First Ascent: Sir Edmund Hillary & Tenzing Norgay on May 29, 1953',
      'Name: Named after Sir George Everest, British Surveyor General of India',
      'Sanskrit Name: Sagarmatha ("Peak of Heaven")'
    ]
  },
  {
    id: 'taj_mahal',
    name: 'Taj Mahal, Agra',
    country: 'India',
    lat: 27.1751,
    lng: 78.0421,
    description: 'An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra, India. It was commissioned in 1631 by the Mughal emperor Shah Jahan to house the tomb of his favorite wife, Mumtaz Mahal.',
    elevation: '171m',
    category: 'Ancient Wonders',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Completed: Around 1643 for the main tomb, 1653 for the full complex',
      'Cost: Estimated 32 million rupees at the time (billions today)',
      'Architects: Led by Ustad Ahmad Lahori',
      'UNESCO World Heritage Site since 1983'
    ]
  },
  {
    id: 'statue_liberty',
    name: 'Statue of Liberty, New York',
    country: 'United States',
    lat: 40.6892,
    lng: -74.0445,
    description: 'A colossal neoclassical copper sculpture on Liberty Island in New York Harbor. The statue, a gift from the people of France to the United States, was designed by French sculptor Frédéric-Auguste Bartholdi.',
    elevation: '2m',
    category: 'Monuments',
    image: 'https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Dedicated: October 28, 1886',
      'Torch: Covered in thin sheets of 24k gold leaf',
      'Height: 93 meters (305 feet) from ground to torch tip',
      'Representing: Libertas, the Roman goddess of freedom'
    ]
  },
  {
    id: 'kyoto',
    name: 'Fushimi Inari-taisha, Kyoto',
    country: 'Japan',
    lat: 34.9671,
    lng: 135.7727,
    description: 'The head shrine of the kami Inari, located at the base of Inari Mountain in Kyoto. The path up the mountain is famously lined with over 10,000 vibrant orange Torii gates, donated by businesses and individuals.',
    elevation: '50m',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Dedicated to: Inari, the Shinto god of rice and agriculture',
      'Founded: In 711 AD, making it older than Kyoto itself',
      'Messenger animals: Many stone fox (kitsune) statues hold keys in their mouths',
      'Trail length: About 4 kilometers, taking 2-3 hours to climb'
    ]
  },
  {
    id: 'sydney_opera',
    name: 'Sydney Opera House',
    country: 'Australia',
    lat: -33.8568,
    lng: 151.2153,
    description: 'Designed by Danish architect Jørn Utzon, this masterpiece of 20th-century architecture is famous for its distinctive white sail-like shells. It sits on Bennelong Point in Sydney Harbour.',
    elevation: '4m',
    category: 'Monuments',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Opened: October 20, 1973, by Queen Elizabeth II',
      'Acoustics: Features the Grand Organ, the largest mechanical action organ in the world',
      'Design Selection: Won an international design competition in 1957 out of 233 entries',
      'UNESCO status: Inscribed in 2007'
    ]
  },
  {
    id: 'christ_redeemer',
    name: 'Christ the Redeemer, Rio',
    country: 'Brazil',
    lat: -22.9519,
    lng: -43.2105,
    description: 'An Art Deco statue of Jesus Christ in Rio de Janeiro, created by French sculptor Paul Landowski and built by Brazilian engineer Heitor da Silva Costa. It towers over the city from Mount Corcovado.',
    elevation: '710m',
    category: 'Monuments',
    image: 'https://images.unsplash.com/photo-1564659979032-f39400d7a8d4?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Materials: Constructed of reinforced concrete and soapstone',
      'Completed: October 12, 1931',
      'Dimensions: 30 meters tall (not including 8m pedestal) with a 28m arm span',
      'Location: Tijuca Forest National Park'
    ]
  },
  {
    id: 'petra',
    name: 'Petra Ancient City',
    country: 'Jordan',
    lat: 30.3285,
    lng: 35.4444,
    description: 'Famous for its rock-cut architecture and water conduit system, Petra is also called the "Rose City" due to the color of the stone out of which it is carved. It was the capital of the Nabataean Kingdom.',
    elevation: '810m',
    category: 'Ancient Wonders',
    image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80',
    facts: [
      'Age: Established as early as the 4th century BC',
      'Famous building: "Al-Khazneh" (The Treasury) carved directly into sandstone cliffs',
      'Re-discovery: Introduced to Western world in 1812 by Swiss explorer Johann Burckhardt',
      'Seven Wonders: Named one of the New Seven Wonders of the World'
    ]
  }
];
