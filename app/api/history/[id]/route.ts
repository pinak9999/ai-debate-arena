import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Debate from '@/app/models/Debate'; // यहाँ अपना वही पुराना वाला पाथ रखना जो तुमने फिक्स किया था

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

// GET: ID के हिसाब से डेटाबेस से एक सिंगल डिबेट निकालकर लाना
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const debate = await Debate.findById(params.id);
    
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
    
    return NextResponse.json(debate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch debate' }, { status: 500 });
  }
}