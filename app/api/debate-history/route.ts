import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Debate from '../../models/Debate';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || '');
  }
}

// सभी पुरानी डिबेट्स की लिस्ट लाने के लिए (GET)
export async function GET() {
  try {
    await connectDB();
    const debates = await Debate.find({}).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ success: true, debates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// नई डिबेट सेव करने के लिए (POST)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { topic, mode, messages, winner } = body;

    const newDebate = await Debate.create({
      topic,
      mode: mode || 'topic',
      messages,
      winner: winner || 'pending',
    });

    return NextResponse.json({ success: true, debate: newDebate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}