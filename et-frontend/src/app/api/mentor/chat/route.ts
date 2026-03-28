import { NextRequest } from "next/server";
import { callAI } from "@/lib/ai-proxy";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await callAI<{ response: string }>("/ai/mentor/chat", {
      message: data.message,
      context: data.context || {},
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { response: "I'm having trouble connecting right now. Please try again in a moment.", error: (err as Error).message },
      { status: 500 }
    );
  }
}
