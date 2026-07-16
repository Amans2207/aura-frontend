export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverArt: string;
}

export const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Lofi Study',
    artist: 'FASSounds',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    coverArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '2',
    title: 'Good Night',
    artist: 'FASSounds',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_271ad98218.mp3?filename=good-night-160166.mp3',
    coverArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '3',
    title: 'Fluidity',
    artist: 'QubeSounds',
    url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_b2b73bc110.mp3?filename=fluidity-100474.mp3',
    coverArt: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '4',
    title: 'Chill Abstract',
    artist: 'Coma-Media',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58be.mp3?filename=chill-abstract-intention-12099.mp3',
    coverArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200'
  }
];
