import OpenAI from "openai";

export interface SpeakingQuestion {
  id: string;
  question: string;
  answer: string;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

const SYSTEM_MESSAGE = `You are a French teacher helping a student prepare for the TCF Canada speaking test.`;

function buildPrompt(userIntro: string, count: number) {
  return `
You are a French teacher preparing students for the TCF Canada speaking test.

Based on the following self-introduction, generate ${count} pairs of French speaking questions and realistic, personalized answers.

SELF-INTRODUCTION:
"""
${userIntro}
"""

OUTPUT:
A raw JSON array of objects like this:

[
  {
    "question": "Pourquoi avez-vous choisi de vivre au Canada ?",
    "answer": "J'ai choisi de vivre au Canada pour découvrir une nouvelle culture et développer ma carrière."
  },
  ...
]

Rules:
- DO NOT use markdown code blocks (like \`\`\`)
- DO NOT add explanations, intros, comments, or formatting
- ONLY return valid JSON — not wrapped in quotes, not inside Markdown
- If you're unsure, return an empty array []
`;
}

export async function generateSpeakingQuestionsFromIntro(
  intro: string,
  count = 6,
): Promise<SpeakingQuestion[]> {
  const prompt = buildPrompt(intro, count);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [
      { role: "system", content: SYSTEM_MESSAGE },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    top_p: 0.95,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(raw) as SpeakingQuestion[];
  } catch (e) {
    console.error("JSON parse failed:", raw);
    throw e;
  }
}
