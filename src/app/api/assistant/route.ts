import { NextResponse } from "next/server";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { z } from "zod";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { toolDefinitions, executeTool } from "@/lib/assistant/tools";
import { getSystemPrompt } from "@/lib/assistant/system-prompt";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(20),
});

function getGeminiTools(): FunctionDeclaration[] {
  return toolDefinitions.map((tool) => {
    const schema = tool.input_schema as Record<string, unknown>;
    const properties = schema.properties as Record<string, Record<string, unknown>> || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geminiProperties: Record<string, any> = {};
    for (const [key, val] of Object.entries(properties)) {
      geminiProperties[key] = {
        type: val.type === "number" ? Type.NUMBER : val.type === "boolean" ? Type.BOOLEAN : Type.STRING,
        description: (val.description as string) || undefined,
      };
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: geminiProperties,
      },
    } as FunctionDeclaration;
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { messages } = requestSchema.parse(body);

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    });

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
    const systemPrompt = getSystemPrompt(org?.name || "your lab");
    const geminiTools = getGeminiTools();

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const toolsUsed: string[] = [];
    let iterations = 0;
    const maxIterations = 5;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: geminiTools }],
      },
    });

    let response = await chat.sendMessage({ message: lastMessage.content });

    while (iterations < maxIterations) {
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) break;

      iterations++;

      // Execute each function call and send results back one at a time
      for (const fc of functionCalls) {
        toolsUsed.push(fc.name!);
        const result = await executeTool(
          fc.name!,
          (fc.args as Record<string, unknown>) || {},
          user.organizationId
        );

        response = await chat.sendMessage({
          message: {
            functionResponse: {
              name: fc.name!,
              response: result as Record<string, unknown>,
            },
          },
        });
      }
    }

    // Extract text from response - handle cases where text might be in candidates
    let responseText = "";
    try {
      responseText = response.text || "";
    } catch {
      // response.text can throw if there are only function call parts
      responseText = "";
    }

    if (!responseText && response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ('text' in part && part.text) {
          responseText += part.text;
        }
      }
    }

    if (!responseText) {
      responseText = "I queried the data but could not generate a summary. Please try rephrasing your question.";
    }

    return NextResponse.json({
      response: responseText,
      toolsUsed: [...new Set(toolsUsed)],
    });
  } catch (error) {
    console.error("Assistant error:", error);
    if (error instanceof Error && error.message.includes("quota")) {
      return NextResponse.json(
        { error: "AI service rate limit reached. Please try again in a moment." },
        { status: 429 }
      );
    }
    return handleApiError(error);
  }
}
