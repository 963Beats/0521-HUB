// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.YOUTUBE_API_KEY;
if(!API_KEY){
  console.warn('Warning: YOUTUBE_API_KEY not set in env — API calls will fail.');
}

// helper to call YouTube Data API
async function ytFetch(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Get uploads playlistId for a channel
app.get('/api/channelUploads', async (req, res) => {
  try{
    const channelId = req.query.channelId;
    if(!channelId) return res.status(400).json({error:'channelId required'});
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
    const data = await ytFetch(url);
    const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    return res.json({uploadsPlaylistId: uploads});
  }catch(err){
    console.error(err); res.status(500).json({error: err.message});
  }
});

// Get videos from a playlist (paginated); returns simplified metadata
app.get('/api/playlistVideos', async (req, res) => {
  try{
    const playlistId = req.query.playlistId;
    if(!playlistId) return res.status(400).json({error:'playlistId required'});
    const maxResults = 50; // YouTube allows up to 50
    const pageToken = req.query.pageToken || '';
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&maxResults=${maxResults}&pageToken=${pageToken}&key=${API_KEY}`;
    const list = await ytFetch(url);

    // gather video IDs to fetch durations
    const videoIds = list.items.map(i=>i.contentDetails.videoId).join(',');
    let durations = {};
    if(videoIds){
      const url2 = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
      const vinfo = await ytFetch(url2);
      vinfo.items.forEach(v=>{
        durations[v.id] = {
          duration: v.contentDetails?.duration || '',
          viewCount: v.statistics?.viewCount || 0
        };
      });
    }

    const simplified = list.items.map(i=>{
      const vid = i.contentDetails.videoId;
      return {
        id: vid,
        title: i.snippet.title,
        url: `https://www.youtube.com/watch?v=${vid}`,
        thumbnail: i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.default?.url,
        publishedAt: i.snippet.publishedAt,
        durationISO: durations[vid]?.duration || '',
        durationSec: durations[vid]?.duration || '',
        viewCount: durations[vid]?.viewCount || 0,
        description: i.snippet.description
      };
    });

    res.json({items: simplified, nextPageToken: list.nextPageToken || null});
  }catch(err){ console.error(err); res.status(500).json({error: err.message}); }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`YouTube proxy running at http://localhost:${PORT}`));
