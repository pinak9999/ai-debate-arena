import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, speaker } = await req.json();

    // 🔥 यहाँ अपने ElevenLabs के Voice IDs डालें (ये बस डेमो IDs हैं)
    // ElevenLabs के डैशबोर्ड से हिन्दी सपोर्ट करने वाली आवाज़ों की ID कॉपी करें
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

    // ElevenLabs API Call (v2 model हिन्दी सपोर्ट करता है)
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

    // Audio Buffer को सीधा Frontend पर भेजें
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