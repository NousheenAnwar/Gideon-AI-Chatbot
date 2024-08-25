import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req) {
  const body = await req.json();
  console.log('Request body:', body);


  const { messages, newMessage } = body;

  // Ensure messages is an array
  const messageHistory = Array.isArray(messages) ? messages : [];
  console.log('Message history:', messageHistory);
  console.log('New message:', newMessage);

  try {
    let chat;
    if (messageHistory.length === 0) {
      // If there's no history, start a new chat
      chat = model.startChat();
      console.log('Started new chat');
    } else {
      // If there's history, convert it to the format expected by Gemini
      const history = messageHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts[0].text }]
      }));
      console.log('Formatted history:', history);
      // Start the chat with the history
      chat = model.startChat({
        history: history,
      });
      console.log('Started chat with history');
    }

    // Send the new message to get a response
    const result = await chat.sendMessage(newMessage);
    console.log('Recieved result:', result);
    const response = result.response;
    console.log('Response:', response);
    // Create a readable stream from the response
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(response.text());
        controller.close();
      },
    });

    // Return the response as a stream
    console.log('Returning stream');
    return new NextResponse(stream);

  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('An error occurred', { status: 500 });
  }
}

export const runtime = "edge";
