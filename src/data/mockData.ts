export interface Tour {
  id: string;
  title: string;
  city: string;
  era: string;
  duration: string;
  stops: number;
  rating: number;
  image: string;
  progress?: number;
  completed?: boolean;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  visitedAt: string;
  era: string;
}

export const tours: Tour[] = [
  { id: "rome", title: "Glory of the Colosseum", city: "Rome, Italy", era: "80 AD", duration: "1h 20m", stops: 6, rating: 4.9,
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80", progress: 65 },
  { id: "athens", title: "Birthplace of Democracy", city: "Athens, Greece", era: "5th c. BC", duration: "2h", stops: 8, rating: 4.8,
    image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80", progress: 30 },
  { id: "egypt", title: "Pharaohs of Giza", city: "Cairo, Egypt", era: "2560 BC", duration: "1h 45m", stops: 5, rating: 4.9,
    image: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&q=80", progress: 0 },
  { id: "kyoto", title: "Samurai Streets", city: "Kyoto, Japan", era: "1603", duration: "1h 30m", stops: 7, rating: 4.7,
    image: "https://images.unsplash.com/photo-1493997181344-712f2f19d87a?w=800&q=80", progress: 100, completed: true },
  { id: "machu", title: "Lost City of the Incas", city: "Machu Picchu, Peru", era: "1450", duration: "2h 15m", stops: 9, rating: 5.0,
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80", progress: 0 },
  { id: "petra", title: "Rose City Mysteries", city: "Petra, Jordan", era: "300 BC", duration: "1h 50m", stops: 6, rating: 4.8,
    image: "https://images.unsplash.com/photo-1563177682-7e64c34cb2b9?w=800&q=80", progress: 15 },
];

export const visitedLocations: Location[] = [
  { id: "1", name: "Roman Forum", city: "Rome", visitedAt: "2 days ago", era: "Ancient Rome" },
  { id: "2", name: "Acropolis", city: "Athens", visitedAt: "1 week ago", era: "Classical Greece" },
  { id: "3", name: "Fushimi Inari", city: "Kyoto", visitedAt: "2 weeks ago", era: "Edo Period" },
  { id: "4", name: "Pantheon", city: "Rome", visitedAt: "3 weeks ago", era: "Ancient Rome" },
];
