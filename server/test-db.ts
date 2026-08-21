import mongoose from 'mongoose';
import { Message } from './models/Message.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/talkflow');
  const messages = await Message.find().limit(2).lean();
  console.log("DB MESSAGES:");
  console.log(JSON.stringify(messages, null, 2));
  process.exit(0);
}
run().catch(console.error);
