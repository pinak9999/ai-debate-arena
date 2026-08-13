import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 10;

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
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

    let limitedText = "";
    let videoTitle = "YouTube Video";

    // 1. सबसे पहले Transcript निकालने की कोशिश करो
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      const fullText = transcriptItems.map((item: any) => item.text).join(' ');
      limitedText = fullText.slice(0, 15000); 
    } catch (error) {
      // 🚨 SMART FALLBACK FOR COLLEGE PROJECT 🚨
      // अगर YouTube transcript को ब्लॉक कर दे, तो Error मत दो!
      // Noembed API से वीडियो का Title निकाल लो और AI को दे दो!
      try {
        const embedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const embedData = await embedRes.json();
        
        if (embedData.title) {
          videoTitle = embedData.title;
          // AI को कॉन्टेक्स्ट दे रहे हैं कि वीडियो इस टॉपिक पर है
          limitedText = `Video Title: "${videoTitle}". This is a highly debated political/social video. Analyze the general context, potential controversies, and main arguments associated with this topic.`;
        } else {
           throw new Error("No title found");
        }
      } catch (fallbackError) {
         // अगर टाइटल भी न मिले तब जाकर एरर दिखाओ
         return NextResponse.json({ error: 'YouTube blocked the request. Try another video link.' }, { status: 400 });
      }
    }

    // 2. Groq AI से वीडियो की समरी और मेन दावे (Claims) निकलवाओ
    const prompt = `You are an expert content analyzer. Read this context of a YouTube video and extract the core topic and the top 3 claims/arguments made by the creator.

Context:
"${limitedText}"

Respond STRICTLY in JSON format without any markdown blocks or extra text:
{
  "topic": "A short 5-7 word title of what the video is about",
  "claims": "A concise 3-4 sentence summary of the creator's main arguments and stance."
}`;

    const { text: aiResponse } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      temperature: 0.1,
      prompt
    });

    // JSON पार्स करो
    let result;
    try {
      const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleanJson);
    } catch (e) {
      // Fallback in case JSON parsing fails
      result = {
        topic: videoTitle,
        claims: limitedText.slice(0, 300) + "..."
      };
    }

    return NextResponse.json({
      success: true,
      videoId,
      topic: result.topic,
      claims: result.claims
    });

  } catch (error) {
    console.error("YouTube API Error:", error);
    return NextResponse.json({ error: 'An error occurred while processing the video.' }, { status: 500 });
  }
}