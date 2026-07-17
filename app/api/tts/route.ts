import { NextResponse } from 'next/server';

// 🔥 FIX: Vercel का default timeout सिर्फ 10 सेकंड होता है (Hobby plan)।
// पहली (cold-start) ElevenLabs call अक्सर इससे ज़्यादा समय लेती है, इसलिए
// Proponent (जो हमेशा पहले बोलता है) टाइमआउट होकर चुप रह जाता था।
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, speaker } = await req.json();

    const cleanText = text
      .replace(/[*#_]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: 'Empty text' }, { status: 400 });
    }

    let voiceId = 'EXAVITQu4vr4xnSDxMaL';
    if (speaker === 'proponent') {
      voiceId = 'TxGEqnHWrfWFTfGW9XjX'; // Josh
    } else if (speaker === 'opponent') {
      voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam
    } else if (speaker === 'judge') {
      voiceId = 'VR6AewLTigWG4xSOukaG'; // Arnold
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[TTS] ELEVENLABS_API_KEY missing');
      return NextResponse.json({ error: 'ElevenLabs API Key missing' }, { status: 500 });
    }

    // 🔥 FIX: Manual timeout controller ताकि हैंग होने की बजाय साफ़ error आए
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let response: Response;
    try {
      response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.text().catch(() => 'unknown');
      console.error(`[TTS] ElevenLabs error for speaker=${speaker}:`, response.status, errorData);
      return NextResponse.json({ error: 'ElevenLabs API error', details: errorData }, { status: 502 });
    }

    // 🔥 FIX: पूरी audio को buffer करके भेजना (streaming pass-through के बजाय)
    // ताकि partial/cut audio Vercel edge पर कभी न फँसे
    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      console.error(`[TTS] Empty audio buffer received for speaker=${speaker}`);
      return NextResponse.json({ error: 'Empty audio received from ElevenLabs' }, { status: 502 });
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(arrayBuffer.byteLength),
      },
    });
  } catch (error: any) {
    console.error('[TTS API Fatal Error]', error?.message || error);
    return NextResponse.json({ error: 'TTS Failed', details: String(error?.message || error) }, { status: 500 });
  }
}