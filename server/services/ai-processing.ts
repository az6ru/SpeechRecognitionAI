import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProcessedTranscription {
  summary: string;
  keyPoints: string[];
  topics: { topic: string; importance: number }[];
}

export async function processTranscription(text: string): Promise<ProcessedTranscription> {
  try {
    const prompt = `
    Проанализируй следующую транскрипцию и предоставь:
    1. Краткое саммари (2-3 предложения)
    2. Ключевые моменты (максимум 5 пунктов)
    3. Основные темы с их важностью (оценка 1-10)

    Верни результат в формате JSON с ключами:
    {
      "summary": "string",
      "keyPoints": ["string"],
      "topics": [{"topic": "string", "importance": number}]
    }

    Транскрипция:
    ${text}
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(response.choices[0].message.content);
    return result as ProcessedTranscription;
  } catch (error) {
    console.error("AI Processing error:", error);
    throw new Error("Failed to process transcription with AI");
  }
}