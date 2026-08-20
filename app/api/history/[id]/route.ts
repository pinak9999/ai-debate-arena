import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Debate from '@/app/models/Debate'; // यहाँ अपना वही पुराना वाला पाथ रखना

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

// 🔥 यहाँ params के टाइप को Promise कर दिया गया है
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // 🔥 डेटाबेस कॉल से पहले params को await करना ज़रूरी है
    const resolvedParams = await params;
    
    const debate = await Debate.findById(resolvedParams.id);
    
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
    
    return NextResponse.json(debate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch debate' }, { status: 500 });
  }
}