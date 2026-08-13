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

    // 1. वीडियो का ट्रांसक्रिप्ट (Subtitles) निकालो
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (error) {
      return NextResponse.json({ error: 'Could not fetch transcript. Make sure the video has captions enabled.' }, { status: 400 });
    }

    // ट्रांसक्रिप्ट को एक सिंगल टेक्स्ट में जोड़ो
    const fullText = transcriptItems.map(item => item.text).join(' ');
    
    // LLM के लिए टेक्स्ट को लिमिट करो (ताकि 10 सेकंड की लिमिट क्रॉस न हो)
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

  } catch (error) {
    console.error("YouTube API Error:", error);
    return NextResponse.json({ error: 'An error occurred while processing the video.' }, { status: 500 });
  }
}