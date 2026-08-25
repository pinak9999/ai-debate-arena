import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Debate from '../../models/Debate';

// Helper function to establish MongoDB connection
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || '');
  }
}

// Fetch a list of all past debates (GET)
export async function GET() {
  try {
    await connectDB();
    // Retrieve the 20 most recent debates sorted by creation date
    const debates = await Debate.find({}).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ success: true, debates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Save a newly completed debate (POST)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { topic, mode, messages, winner } = body;

    // Create and store the new debate record in the database
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

// Delete a specific debate by its ID (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    // Check if ID exists and delete the corresponding record
    if (id) {
      await Debate.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'No ID provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}