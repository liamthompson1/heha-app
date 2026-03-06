import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSession, getSessionCookieName } from "@/lib/auth/session";
import Anthropic from "@anthropic-ai/sdk";

const CONVERSATIONS_BASE =
  "https://apigw.holidayextras.com/chat-assistant-gateway/llm-platform/v0beta2/conversations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  const { id, conversationId } = await params;

  const supabase = getSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("traveller_trip_id")
    .eq("id", id)
    .single();

  if (error || !trip?.traveller_trip_id) {
    return new Response(JSON.stringify({ error: "Trip not found" }), {
      status: 404,
    });
  }

  const authSession = request.cookies.get("auth_session")?.value;
  if (!authSession) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const sessionData = await getSession(
    request.cookies.get(getSessionCookieName())?.value
  );
  const userHash = sessionData?.userHash?.slice(0, 8) ?? null;

  const apiKey = process.env.HX_STORIES_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
    });
  }

  const body = await request.json();
  const { modelId, messages, variables, storyText } = body;

  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  // Anthropic fallback mode (modelId is null)
  if (modelId === null) {
    return handleAnthropicFallback(messages, storyText, sseHeaders);
  }

  // Platform mode (modelId is a string)
  return handlePlatformStream(
    conversationId,
    authSession,
    apiKey,
    userHash,
    messages,
    variables,
    sseHeaders
  );
}

async function handlePlatformStream(
  conversationId: string,
  authSession: string,
  apiKey: string,
  userHash: string | null,
  messages: Array<{ text: string }>,
  variables: Record<string, string> | undefined,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const lastMessage = messages[messages.length - 1];
    const res = await fetch(`${CONVERSATIONS_BASE}/${conversationId}`, {
      method: "POST",
      headers: {
        Cookie: `auth_token=${authSession}`,
        "x-apikey": apiKey,
        "Content-Type": "application/json",
        Accept: "text/stream",
      },
      body: JSON.stringify({
        userHash,
        messages: [{ text: lastMessage.text }],
        variables: variables ?? {},
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Conversations API] Stream failed:", res.status, errText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Stream failed", status: res.status }),
        { status: res.status }
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: "No response body" }), {
        status: 502,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Strip T\d{3} timing markers
            const cleaned = chunk.replace(/T\d{3}/g, "");
            if (cleaned) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: cleaned })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("[Conversations API] Stream read error:", err);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Conversations API] Error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 502 });
  }
}

async function handleAnthropicFallback(
  messages: Array<{ role: string; text: string }>,
  storyText: string,
  headers: Record<string, string>
): Promise<Response> {
  const anthropic = new Anthropic();

  const systemPrompt = `You are a helpful travel assistant. Answer questions about the following travel content. Be concise and friendly.\n\n--- Story Content ---\n${storyText}`;

  const anthropicMessages = messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
    content: m.text,
  }));

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("[Anthropic fallback] Error:", err);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
