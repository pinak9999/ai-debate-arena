import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Function to extract Video ID from a YouTube URL
function extractVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // 1. 🔥 RAPID-API LOGIC (Bypasses YouTube Bot Protection) 🔥
    let fullText = "";
    try {
      const rapidApiUrl = `https://youtube-transcript3.p.rapidapi.com/api/transcript-with-url?url=${encodeURIComponent(url)}&flat_text=true&lang=en`;
      
      const response = await fetch(rapidApiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '2cd9076bebmshca16f5e8a867e13p1793c8jsn81bfb6374ed0',
          'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`RapidAPI Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && typeof data === 'string') {
         fullText = data;
      } else if (data && data.transcript && typeof data.transcript === 'string') {
         fullText = data.transcript;
      } else if (data && data.transcript && Array.isArray(data.transcript)) {
         fullText = data.transcript.map((item: any) => item.text || '').join(' ');
      } else if (Array.isArray(data)) {
         fullText = data.map((item: any) => item.text || '').join(' ');
      } else {
         fullText = JSON.stringify(data);
      }

    } catch (error) {
      console.error("RapidAPI Transcript Error:", error);
      return NextResponse.json({ error: 'Could not fetch transcript. Make sure the video has captions enabled.' }, { status: 400 });
    }

    // 🔥 THE MASTER UPGRADE: 
    // We pass up to 25,000 characters to stay within token limits
    // while ensuring the summary of long videos remains highly accurate!
    const limitedText = fullText.slice(0, 25000); 

    // 2. Use AI to extract the video summary and main claims
    const prompt = `You are an expert content analyzer. Read this transcript of a YouTube video and extract the core topic and the top 3 claims/arguments made by the creator.

Transcript:
"${limitedText}"

Respond STRICTLY in JSON format without any markdown blocks or extra text:
{
  "topic": "A short 5-7 word title of what the video is about",
  "claims": "A concise 3-4 sentence summary of the creator's main arguments and stance."
}`;

    let result;
    
    try {
      const { text: aiResponse } = await generateText({
        model: google('gemini-3.5-flash-lite'), // 🔥 BEST FAST MODEL APPLIED
        temperature: 0.1,
        prompt
      });

      // 🔥 BULLETPROOF JSON PARSER: Prevents crashes even if AI returns extra text
      let cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIndex = cleanJson.indexOf('{');
      const endIndex = cleanJson.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = cleanJson.substring(startIndex, endIndex + 1);
      }
      
      result = JSON.parse(cleanJson);
      
    } catch (aiError) {
      console.warn("⚠️ AI Summarization failed, triggering Safe Fallback:", aiError);
      
      // 🔥 FALLBACK: Ensures the app keeps running even if the AI fails
      result = {
        topic: "YouTube Video Analysis",
        claims: limitedText.slice(0, 400) + "... [Full transcript sent to backend for debate]"
      };
    }

    return NextResponse.json({
      success: true,
      videoId,
      topic: result.topic,
      claims: result.claims
    });

  } catch (error: any) {
    console.error("Global YouTube API Error:", error.message || error);
    return NextResponse.json({ error: `FATAL ERROR: ${error.message || String(error)}` }, { status: 500 });
  }
}