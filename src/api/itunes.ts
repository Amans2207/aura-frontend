import type { Track } from '../data/tracks';

export async function searchTracks(query: string): Promise<Track[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`);
    const data = await res.json();
    
    return data.results.map((item: any) => ({
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      url: item.previewUrl, // 30 second preview
      coverArt: item.artworkUrl100.replace('100x100', '300x300') // Higher quality art
    })).filter((track: Track) => track.url); // Ensure the track has an audio url
  } catch (error) {
    console.error('Error fetching tracks from iTunes API:', error);
    return [];
  }
}

export async function getNewReleases(): Promise<Track[]> {
  // Since iTunes search API doesn't have a strict "new releases" endpoint for free,
  // we simulate it by searching for generic popular terms or the current year
  const queries = ['new pop', 'hits 2024', 'viral hits', 'top songs'];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];
  return searchTracks(randomQuery);
}
