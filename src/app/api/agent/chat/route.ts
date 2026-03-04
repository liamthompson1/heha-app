import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentChatRequest, AgentChatResponse, SavedMemory } from "@/types/agent";
import type { TripData } from "@/types/trip";
import { agentTools } from "@/lib/agent/tools";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { handleToolCalls } from "@/lib/agent/tool-handlers";
import { loadMemories } from "@/lib/supabase/memories";

const MAX_TOOL_ROUNDS = 5;

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentChatRequest;
    const { messages, tripData, userId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Load user memories from Supabase (if logged in)
    let userMemories: SavedMemory[] = [];
    if (userId) {
      userMemories = await loadMemories(userId);
    }

    // Build system prompt with current trip state + memories
    const systemPrompt = buildSystemPrompt(tripData, userMemories);

    // Convert chat messages to Claude format (with vision support)
    const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => {
      if (m.role === "user" && m.image) {
        return {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: m.image.mediaType,
                data: m.image.base64,
              },
            },
            {
              type: "text" as const,
              text: m.content || "Please extract any travel information from this image and update my trip details.",
            },
          ],
        };
      }
      return {
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      };
    });

    // Tool-use loop
    let currentTripData: TripData = { ...tripData };
    const allMemories: SavedMemory[] = [];
    let formComplete = false;
    let finalText = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        tools: agentTools,
        messages: claudeMessages,
      });

      // Collect text blocks
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text"
      );
      if (textBlocks.length > 0) {
        finalText = textBlocks.map((b) => b.text).join("\n");
      }

      // Collect tool_use blocks
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0) break;

      // Execute tool calls
      const toolResult = await handleToolCalls(
        toolUseBlocks.map((b) => ({
          id: b.id,
          name: b.name,
          input: b.input as Record<string, unknown>,
        })),
        currentTripData,
        userId
      );

      currentTripData = toolResult.updatedTripData;
      allMemories.push(...toolResult.memories);
      if (toolResult.formComplete) formComplete = true;

      // Feed tool results back into conversation for next round
      claudeMessages.push({
        role: "assistant",
        content: response.content,
      });

      claudeMessages.push({
        role: "user",
        content: toolUseBlocks.map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: toolResult.toolResults[b.id] ?? JSON.stringify({ success: true }),
        })),
      });

      // If stop_reason is end_turn (text was also produced), we're done
      if (response.stop_reason === "end_turn") break;
    }

    const result: AgentChatResponse = {
      message: finalText || "I've updated your trip details!",
      updatedTripData: currentTripData,
      memories: allMemories,
      formComplete,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
