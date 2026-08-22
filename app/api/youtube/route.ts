import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// अगर API Key नहीं है, तो खाली स्ट्रिंग पास करो ताकि ऐप तुरंत क्रैश न हो
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// यूट्यूब URL से Video ID निकालने का फंक्शन
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

    // 🔥 THE MASTER FIX FOR "Request Entity Too Large" 🔥
    // 25000 कैरेक्टर्स सर्वर को क्रैश कर रहे थे। 10000 कैरेक्टर्स एकदम सेफ हैं और समरी के लिए काफी हैं।
    const limitedText = fullText.slice(0, 10000); 

    // 2. Groq AI से वीडियो की समरी और मेन दावे (Claims) निकलवाओ
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
        model: groq('groq/compound'), // 🔥 70K TPM वाला सबसे सेफ मॉडल
        temperature: 0.1,
        prompt
      });

      // 🔥 BULLETPROOF JSON PARSER: AI अगर एक्स्ट्रा टेक्स्ट दे दे, तो भी क्रैश नहीं होगा
      let cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIndex = cleanJson.indexOf('{');
      const endIndex = cleanJson.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = cleanJson.substring(startIndex, endIndex + 1);
      }
      
      result = JSON.parse(cleanJson);
      
    } catch (aiError) {
      console.warn("⚠️ AI Summarization failed, triggering Safe Fallback:", aiError);
      
      // 🔥 FALLBACK: अगर AI क्रैश हुआ, तो भी ऐप चलती रहेगी
      result = {
        topic: "YouTube Video Analysis",
        claims: limitedText.slice(0, 300) + "... [Full context sent to backend for debate]"
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
    return NextResponse.json({ error: `ASLI ERROR: ${error.message || String(error)}` }, { status: 500 });
  }
}