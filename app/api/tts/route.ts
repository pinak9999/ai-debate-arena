import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, speaker } = await req.json();

    // 🔥 Insert your ElevenLabs Voice IDs here (these are just demo IDs)
    // Copy the Voice IDs that support Hindi/Multilingual from your ElevenLabs dashboard
    let voiceId = '';
    if (speaker === 'proponent') {
      voiceId = 'pNInz6obpgDQGcFmaJgB'; // Proponent Voice ID
    } else if (speaker === 'opponent') {
      voiceId = 'yoZ06aMxZJJ28mfd3POQ'; // Opponent Voice ID
    } else {
      voiceId = 'ThT5KcBeYPX3keUQqHPh'; // Judge Voice ID
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API Key missing' }, { status: 500 });
    }

    // ElevenLabs API Call (v2 model supports multilingual including Hindi)
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', 
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API Error: ${response.statusText}`);
    }

    // Send the Audio Buffer directly to the Frontend
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('[TTS Error]', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}