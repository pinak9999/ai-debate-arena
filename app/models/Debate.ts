import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  speaker: { type: String, required: true }, // 'proponent' | 'opponent' | 'judge'
  text: { type: String, required: true },
  round: { type: Number }
});

const DebateSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  mode: { type: String, default: 'topic' },
  messages: [MessageSchema],
  winner: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Workaround to prevent Mongoose model recompilation errors during Next.js hot reloads:
export default mongoose.models.Debate || mongoose.model('Debate', DebateSchema);