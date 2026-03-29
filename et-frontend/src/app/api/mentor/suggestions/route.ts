import { NextRequest } from "next/server";
import { callAI } from "@/lib/ai-proxy";

interface Suggestion {
  type: string;
  message: string;
  action: string;
  priority: string;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await callAI<{ suggestions: Suggestion[] }>(
      "/ai/mentor/suggestions",
      {
        message: data.message || "",
        context: data.context || {},
      }
    );
    return Response.json(result);
  } catch {
    return Response.json({ suggestions: [] });
  }
}
