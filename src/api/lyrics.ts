export async function getLyrics(artist: string, title: string): Promise<string> {
  try {
    // Attempt to fetch from public lyrics API
    // Clean up strings to improve search chances (e.g. remove "(feat. ...)")
    const cleanTitle = title.split(' (')[0].split(' - ')[0];
    const cleanArtist = artist.split(' & ')[0].split(' feat.')[0];
    
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
    if (!res.ok) throw new Error('Lyrics not found');
    
    const data = await res.json();
    return data.lyrics || "Lyrics not available for this track.";
  } catch (error) {
    return "Oops! We couldn't find the lyrics for this song right now.\n\nEnjoy the music!";
  }
}
