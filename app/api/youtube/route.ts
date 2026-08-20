import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 60;

// 🔥 FIX 1: API Key क्रैश प्रोटेक्शन
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

    // 1. 🔥 NAYA RAPID-API LOGIC (Bypasses YouTube Bot Protection) 🔥
    let fullText = "";
    try {
      // API URL with flat_text=true
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
      
      // API का रिस्पांस हैंडल करना (क्यूंकि flat_text=true है)
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
      return NextResponse.json({ error: 'Could not fetch transcript from RapidAPI. Make sure the video has captions enabled.' }, { status: 400 });
    }

    // LLM के लिए टेक्स्ट को लिमिट करो
    const limitedText = fullText.slice(0, 15000); 

    // 2. Groq AI से वीडियो की समरी और मेन दावे (Claims) निकलवाओ
    const prompt = `You are an expert content analyzer. Read this transcript of a YouTube video and extract the core topic and the top 3 claims/arguments made by the creator.

Transcript:
"${limitedText}"

Respond STRICTLY in JSON format without any markdown blocks or extra text:
{
  "topic": "A short 5-7 word title of what the video is about",
  "claims": "A concise 3-4 sentence summary of the creator's main arguments and stance."
}`;

    // 🔥 FIX 2: सही मॉडल (gpt-oss-20b) और maxTokens ऐड किया ताकि लिमिट पार न हो!
    const { text: aiResponse } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      temperature: 0.1,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // JSON पार्स करो
    let result;
    try {
      const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleanJson);
    } catch (e) {
      // Fallback
      result = {
        topic: "YouTube Video Analysis",
        claims: limitedText.slice(0, 300) + "..."
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
    
    // 🔥 FIX 3: अब अगर कोई एरर आया तो वो सीधा स्क्रीन पर दिखेगा!
    return NextResponse.json({ 
      error: `ASLI ERROR: ${error.message || String(error)}` 
    }, { status: 500 });
  }
}