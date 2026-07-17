import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, speaker } = await req.json();

    // 🔥 FIX 1: AI के टेक्स्ट से सारे स्पेशल कैरेक्टर्स साफ करना 
    // (ताकि ElevenLabs बीच में बोलना बंद न करे)
    const cleanText = text
      .replace(/[*#_]/g, '') // Markdown के स्टार हटाना
      .replace(/\[.*?\]/g, '') // [UI_CHART] जैसे छुपे हुए टैग्स हटाना
      .trim();

    if (!cleanText) {
      return new NextResponse(null, { status: 200 });
    }

    let voiceId = 'EXAVITQu4vr4xnSDxMaL'; // डिफ़ॉल्ट
    
    if (speaker === 'proponent') {
      voiceId = 'TxGEqnHWrfWFTfGW9XjX'; // Josh
    } else if (speaker === 'opponent') {
      voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam
    } else if (speaker === 'judge') {
      voiceId = 'VR6AewLTigWG4xSOukaG'; // Arnold
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API Key missing' }, { status: 500 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('ElevenLabs API error');
    }

    // 🔥 FIX 2: ऑडियो स्ट्रीम को डायरेक्ट पास करना ताकि टाइमआउट एरर न आए
    return new NextResponse(response.body, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
    
  } catch (error) {
    console.error('[TTS API Error]', error);
    return NextResponse.json({ error: 'TTS Failed' }, { status: 500 });
  }
}