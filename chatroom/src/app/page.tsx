"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PERSONAS, type PersonaDefinition } from "@/data/personas";
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  ConversationMessage,
} from "@/types/chat";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const MAX_TURNS_CAP = 20;

type Side = "left" | "right";

const buildPerspective = (
  history: ConversationMessage[],
  personaId: string,
): ChatRequestPayload["perspective"] =>
  history.map((message) => ({
    role: message.senderId === personaId ? "assistant" : "user",
    content: message.content,
  }));

const ConversationBubble = ({
  message,
  side,
}: {
  message: ConversationMessage;
  side: Side;
}) => {
  const isLeft = side === "left";
  return (
    <div
      className={`flex w-full gap-3 ${
        isLeft ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-xl rounded-2xl px-5 py-4 shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-800 ${
          isLeft
            ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
            : "bg-indigo-600 text-white dark:bg-indigo-500"
        }`}
      >
        <div className="text-sm font-semibold">
          {message.senderLabel}
        </div>
        <div className="mt-2 whitespace-pre-line text-sm leading-6">
          {message.content}
        </div>
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [leftPersonaId, setLeftPersonaId] = useState(PERSONAS[0]?.id ?? "");
  const [rightPersonaId, setRightPersonaId] = useState(
    PERSONAS[1]?.id ?? PERSONAS[0]?.id ?? "",
  );
  const [topic, setTopic] = useState(
    "How might we accelerate sustainable supply chains without sacrificing resilience?",
  );
  const [guidance, setGuidance] = useState("");
  const [maxTurns, setMaxTurns] = useState(8);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeSide, setActiveSide] = useState<Side>("left");
  const [sessionId, setSessionId] = useState(createId());
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const leftPersona = useMemo<PersonaDefinition | undefined>(
    () => PERSONAS.find((persona) => persona.id === leftPersonaId),
    [leftPersonaId],
  );
  const rightPersona = useMemo<PersonaDefinition | undefined>(
    () => PERSONAS.find((persona) => persona.id === rightPersonaId),
    [rightPersonaId],
  );

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (
      PERSONAS.length > 1 &&
      leftPersonaId === rightPersonaId
    ) {
      const fallback = PERSONAS.find((persona) => persona.id !== leftPersonaId);
      if (fallback) {
        setRightPersonaId(fallback.id);
      }
    }
  }, [leftPersonaId, rightPersonaId]);

  const resetConversation = () => {
    setMessages([]);
    setActiveSide("left");
    setSessionId(createId());
    setError(null);
  };

  const startConversation = () => {
    if (!leftPersona || !rightPersona) {
      setError("Select two distinct personas to begin.");
      return;
    }

    if (leftPersona.id === rightPersona.id) {
      setError("Please choose two different personas.");
      return;
    }

    resetConversation();
    setIsRunning(autoAdvance);
  };

  const stopConversation = () => {
    setIsRunning(false);
  };

  const shouldStop =
    maxTurns > 0 && messages.length >= Math.min(maxTurns, MAX_TURNS_CAP);

  const runTurn = async () => {
    if (isLoading || shouldStop) {
      setIsRunning(false);
      return;
    }

    const currentSession = sessionId;

    const currentPersona = activeSide === "left" ? leftPersona : rightPersona;
    const counterpartPersona = activeSide === "left" ? rightPersona : leftPersona;

    if (!currentPersona || !counterpartPersona) {
      setError("Both personas must be selected.");
      setIsRunning(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload: ChatRequestPayload = {
      personaId: currentPersona.id,
      otherPersonaId: counterpartPersona.id,
      topic,
      perspective: buildPerspective(messages, currentPersona.id),
      guidance,
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | ChatResponsePayload
        | { error: string; details?: string };

      if (!response.ok) {
        const detailMessage =
          "error" in data
            ? `${data.error}${data.details ? ` · ${data.details}` : ""}`
            : "Failed to reach the AI service.";
        throw new Error(detailMessage);
      }

      const content =
        "content" in data && data.content
          ? data.content.trim()
          : "⚠️ The model returned an empty message.";

      if (currentSession !== sessionId) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          senderId: currentPersona.id,
          senderLabel: currentPersona.label,
          content,
          createdAt: new Date().toISOString(),
        },
      ]);

      setActiveSide((prev) => (prev === "left" ? "right" : "left"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error generating turn.",
      );
      setIsRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    if (isLoading) return;
    if (shouldStop) {
      setIsRunning(false);
      return;
    }

    void runTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, messages, activeSide, sessionId]);

  const currentSpeaker =
    activeSide === "left" ? leftPersona?.label : rightPersona?.label;

  const disableStart =
    !leftPersona ||
    !rightPersona ||
    leftPersona.id === rightPersona.id ||
    !topic.trim();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 lg:flex-row">
      <section className="w-full max-w-sm flex-shrink-0 space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header>
          <h1 className="text-2xl font-semibold">Persona Chat Salon</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Spin up two AI personas, set a topic, and watch them explore it
            together. You can advance turns manually or let them riff
            automatically.
          </p>
        </header>

        <div className="space-y-4">
          <PersonaSelectorCard
            title="Persona A"
            persona={leftPersona}
            onChange={(id) => setLeftPersonaId(id)}
            excludeId={rightPersonaId}
          />
          <PersonaSelectorCard
            title="Persona B"
            persona={rightPersona}
            onChange={(id) => setRightPersonaId(id)}
            excludeId={leftPersonaId}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Conversation Topic
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
              placeholder="Set the problem, brief, or scenario."
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Optional Guidance
            <textarea
              value={guidance}
              onChange={(event) => setGuidance(event.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
              placeholder="Add constraints or a twist for both personas."
            />
          </label>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Max Turns
            </label>
            <input
              type="number"
              min={2}
              max={MAX_TURNS_CAP}
              value={maxTurns}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(value)) return;
                setMaxTurns(Math.min(Math.max(2, value), MAX_TURNS_CAP));
              }}
              className="w-20 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-advance conversation
          </label>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <button
            type="button"
            onClick={startConversation}
            disabled={disableStart}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {autoAdvance ? "Start Auto Dialogue" : "Reset Conversation"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void runTurn();
              }}
              disabled={isLoading || disableStart || shouldStop}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              Step Turn
            </button>
            <button
              type="button"
              onClick={() => setIsRunning((prev) => !prev)}
              disabled={disableStart || shouldStop}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              {isRunning ? "Pause" : "Auto"}
            </button>
            <button
              type="button"
              onClick={stopConversation}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:border-red-900/80 dark:text-red-300 dark:hover:border-red-600 dark:hover:bg-red-900/30"
            >
              Stop
            </button>
          </div>
        </div>

        <footer className="pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Set <code className="font-mono">OPENAI_API_KEY</code> and optionally{" "}
          <code className="font-mono">OPENAI_MODEL</code> in{" "}
          <code className="font-mono">.env.local</code>, then run{" "}
          <code className="font-mono">npm run dev</code>.
        </footer>
      </section>

      <section className="flex h-[80vh] flex-1 flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Dialogue Feed
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {messages.length === 0
                ? "Start the session to generate the first turn."
                : `${messages.length} / ${Math.min(
                    maxTurns,
                    MAX_TURNS_CAP,
                  )} turns`}
            </p>
          </div>
          <div className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {isLoading
              ? "Generating…"
              : shouldStop
                ? "Reached turn cap"
                : isRunning
                  ? `Awaiting response: ${currentSpeaker ?? "persona"}`
                  : `Next: ${currentSpeaker ?? "—"}`}
          </div>
        </header>

        <div
          ref={scrollContainerRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No dialogue yet — set the stage and press start.
            </div>
          ) : (
            messages.map((message) => (
              <ConversationBubble
                key={message.id}
                message={message}
                side={message.senderId === leftPersona?.id ? "left" : "right"}
              />
            ))
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </section>
    </main>
  );
}

const PersonaSelectorCard = ({
  title,
  persona,
  onChange,
  excludeId,
}: {
  title: string;
  persona?: PersonaDefinition;
  onChange: (id: string) => void;
  excludeId?: string;
}) => {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {title}
        </h3>
        <select
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
          value={persona?.id ?? ""}
          onChange={(event) => onChange(event.target.value)}
        >
          {PERSONAS.map((candidate) => (
            <option
              key={candidate.id}
              value={candidate.id}
              disabled={candidate.id === excludeId}
            >
              {candidate.label}
            </option>
          ))}
        </select>
      </div>
      {persona ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-zinc-700 dark:text-zinc-200">
            {persona.role}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">{persona.description}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Voice: {persona.speakingStyle}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Choose a persona</p>
      )}
    </div>
  );
};
