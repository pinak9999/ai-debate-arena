import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, speaker } = await req.json();

    // 🔥 ElevenLabs के Voice IDs (आप अपनी पसंद के हिसाब से इन्हें बदल सकते हैं)
    let voiceId = 'EXAVITQu4vr4xnSDxMaL'; // डिफ़ॉल्ट
    
    if (speaker === 'proponent') {
      voiceId = 'TxGEqnHWrfWFTfGW9XjX'; // Josh (थोड़ा अग्रेसिव और एनर्जेटिक)
    } else if (speaker === 'opponent') {
      voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam (शार्प और कोर्ट वकील जैसा)
    } else if (speaker === 'judge') {
      voiceId = 'VR6AewLTigWG4xSOukaG'; // Arnold (भारी और जज जैसी डीप आवाज़)
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API Key missing' }, { status: 500 });
    }

    // ElevenLabs API कॉल (eleven_multilingual_v2 मॉडल हिंदी/Hinglish के लिए बेस्ट है)
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
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
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs Error:', errorData);
      throw new Error('ElevenLabs API error');
    }

    // ऑडियो स्ट्रीम को सीधे वापस भेजें
    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
    
  } catch (error) {
    console.error('[TTS API Error]', error);
    return NextResponse.json({ error: 'TTS Failed' }, { status: 500 });
  }
}