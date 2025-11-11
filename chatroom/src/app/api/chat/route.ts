import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getPersonaById } from "@/data/personas";
import type { ChatRequestPayload } from "@/types/chat";

const resolveModel = (preferred?: string) => {
  if (preferred) return preferred;
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  if (process.env.OPENAI_FALLBACK_MODEL) return process.env.OPENAI_FALLBACK_MODEL;
  return "gpt-4o-mini";
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured.",
        action: "Set OPENAI_API_KEY in your environment to enable AI personas.",
      },
      { status: 500 },
    );
  }

  let payload: ChatRequestPayload | null = null;
  try {
    payload = (await request.json()) as ChatRequestPayload;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        details: error instanceof Error ? error.message : "Unable to parse JSON payload.",
      },
      { status: 400 },
    );
  }

  if (!payload.personaId || !payload.otherPersonaId) {
    return NextResponse.json(
      {
        error: "Missing persona identifiers.",
        hint: "Provide personaId and otherPersonaId in the request payload.",
      },
      { status: 400 },
    );
  }

  const persona = getPersonaById(payload.personaId);
  const otherPersona = getPersonaById(payload.otherPersonaId);

  if (!persona) {
    return NextResponse.json(
      {
        error: `Unknown persona '${payload.personaId}'.`,
      },
      { status: 404 },
    );
  }

  if (!otherPersona) {
    return NextResponse.json(
      {
        error: `Unknown counterpart persona '${payload.otherPersonaId}'.`,
      },
      { status: 404 },
    );
  }

  const topicLine = payload.topic?.trim()
    ? `Conversation topic focus: ${payload.topic.trim()}.`
    : null;

  const guidanceLine = payload.guidance?.trim()
    ? `User guidance for this turn: ${payload.guidance.trim()}`
    : null;

  const systemMessageParts = [
    persona.systemPrompt,
    `Your persona summary: ${persona.role}. ${persona.description}`,
    `Your counterpart is ${otherPersona.label} (${otherPersona.role}). ${otherPersona.description}`,
    `Speaking style to embody: ${persona.speakingStyle}`,
    `Primary strengths to leverage: ${persona.expertise}`,
    "Always stay in character, using first-person voice. Build on the dialogue naturally.",
    topicLine,
    guidanceLine,
    "Deliver a single cohesive message. No meta-commentary about being an AI. Keep responses under approximately 12 sentences.",
  ].filter(Boolean);

  const messages = [
    { role: "system" as const, content: systemMessageParts.join("\n\n") },
    ...(payload.perspective ?? []),
  ];

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: resolveModel(persona.defaultModel),
      messages,
      temperature: persona.defaultTemperature ?? 0.7,
      max_tokens: persona.maxTokens ?? 320,
    });

    const content =
      completion.choices?.[0]?.message?.content?.trim() ??
      completion.choices?.[0]?.message?.refusal ??
      "";

    if (!content) {
      return NextResponse.json(
        {
          error: "Model returned empty content.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[chat-route] LLM error", error);
    return NextResponse.json(
      {
        error: "Failed to generate response.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
