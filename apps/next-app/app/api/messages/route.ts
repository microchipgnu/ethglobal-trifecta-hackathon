import connectDB from '@/lib/mongodb';
import { AppMessage } from '@/models/AppMessage';
import { NextRequest, NextResponse } from 'next/server';

// GET all messages
export async function GET() {
  try {
    await connectDB();

    const messages = await AppMessage.find({}).sort({ timestamp: 1 }).lean();

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST a new message
export async function POST(request: NextRequest) {
  try {
    const { content, sender } = await request.json();

    if (!content || !sender) {
      return NextResponse.json(
        { error: 'Content and sender are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const newMessage = await AppMessage.create({
      content,
      sender,
      timestamp: new Date(),
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
