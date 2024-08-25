import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req) {
  const body = await req.json();
  const { messages, newMessage } = body;

  // Ensure messages is an array
  const messageHistory = Array.isArray(messages) ? messages : [];

  try {
    let chat;
    if (messageHistory.length === 0) {
      // If there's no history, start a new chat
      chat = model.startChat();
    } else {
      // If there's history, convert it to the format expected by Gemini
      const history = messageHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts[0].text }]
      }));

      // Start the chat with the history
      chat = model.startChat({
        history: history,
      });
    }

    // Send the new message to get a response
    const result = await chat.sendMessage(newMessage);
    const response = result.response;

    // Create a readable stream from the response
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(response.text());
        controller.close();
      },
    });

    // Return the response as a stream
    return new NextResponse(stream);

  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('An error occurred', { status: 500 });
  }
}

export const runtime = "edge";
