import { NextRequest } from "next/server";
import { callAI } from "@/lib/ai-proxy";

interface MentorResponse {
  response: string;
  tool_used?: string | null;
  tool_result?: Record<string, unknown> | null;
  display_type?: string | null;
  action_links?: Array<{ label: string; href: string }>;
  suggestions?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await callAI<MentorResponse>("/ai/mentor/chat", {
      message: data.message,
      context: data.context || {},
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      {
        response:
          "I'm having trouble connecting right now. Please try again in a moment.",
        tool_used: null,
        tool_result: null,
        display_type: null,
        action_links: [],
        suggestions: ["Calculate my SIP", "Compare tax regimes"],
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
