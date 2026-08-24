import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  createLovableResponsesProvider,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the data quality assistant for an enterprise data observability product by Reltio.

You help data engineers and stewards with:
- Profiling tables and interpreting column profiles (completeness, uniqueness, distribution, patterns).
- Recommending and explaining data quality checks across dimensions (completeness, validity, uniqueness, consistency, timeliness, accuracy).
- Diagnosing anomalies: volume drift, schema changes, fill-rate drops, failing checks.
- Translating natural-language cadence requests into concrete schedules for profiling and DQ check runs.

Style: concise, practical, and specific. Use short paragraphs and tight bullet lists. Prefer concrete rule names, columns, thresholds, and cadences over generalities. Never invent connection credentials. When the user asks for a schedule, state the exact cadence you would apply.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured (missing LOVABLE_API_KEY).", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const provider = createLovableResponsesProvider(apiKey, runIdFetch);

        try {
          const result = streamText({
            model: provider.responses("openai/gpt-5.6-sol"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages as UIMessage[]),
            abortSignal: request.signal,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });

          return withLovableAiGatewayRunIdHeader(
            result.toUIMessageStreamResponse({
              originalMessages: messages as UIMessage[],
              sendReasoning: true,
            }),
            runIdFetch,
          );
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return new Response("Client closed request", { status: 499 });
          }
          const message = error instanceof Error ? error.message : "AI request failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
