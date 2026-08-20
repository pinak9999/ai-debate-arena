import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Debate from '@/app/models/Debate';

// MongoDB कनेक्शन लॉजिक
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing!');
  await mongoose.connect(process.env.MONGODB_URI);
};

// 🟢 GET: साइडबार में पुरानी डिबेट्स दिखाने के लिए (सिर्फ टाइटल लाएगा)
export async function GET() {
  try {
    await connectDB();
    // सिर्फ टॉपिक, मोड और डेट लाएंगे ताकि साइडबार रॉकेट की तरह फ़ास्ट लोड हो
    const history = await Debate.find({}).select('topic mode createdAt').sort({ createdAt: -1 });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// 🔵 POST: जब डिबेट खत्म हो, तो उसे डेटाबेस में सेव करने के लिए
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const newDebate = await Debate.create({
      topic: body.topic,
      mode: body.mode,
      messages: body.messages, // पूरी चैट हिस्ट्री यहाँ सेव होगी
      winner: body.winner || 'pending'
    });

    return NextResponse.json({ success: true, id: newDebate._id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save debate' }, { status: 500 });
  }
}