export type ConversationMessage = {
  id: string;
  senderId: string;
  senderLabel: string;
  content: string;
  createdAt: string;
};

export type PersonaPerspectiveMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequestPayload = {
  personaId: string;
  otherPersonaId: string;
  topic?: string;
  perspective: PersonaPerspectiveMessage[];
  guidance?: string;
};

export type ChatResponsePayload = {
  content: string;
};
