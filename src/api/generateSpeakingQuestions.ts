import OpenAI from "openai";

export interface SpeakingQuestion {
  id: string;
  question: string;
  answer: string;
  date: string; // ISO string like "2025-07-22"
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

const SYSTEM_MESSAGE = `You are a French teacher helping a student prepare for the TCF Canada speaking test.`;

function getStoredQuestions(): string[] {
  const raw = localStorage.getItem("tcfAskedQuestions");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function storeNewQuestions(newQuestions: SpeakingQuestion[]) {
  const existing = getStoredQuestions();
  const updated = [...existing, ...newQuestions.map((q) => q.question)];
  localStorage.setItem("tcfAskedQuestions", JSON.stringify(updated));
}

function buildPrompt(userIntro: string, count: number, asked: string[]) {
  const askedBlock =
    asked.length > 0
      ? `AVOID generating questions similar to these already-asked questions:\n${asked
          .map((q) => `- ${q}`)
          .join("\n")}\n`
      : "";

  return `
You are a French teacher preparing students for the TCF Canada speaking test.

${askedBlock}

Based on the following self-introduction, generate exactly ${count} **different** French speaking questions with personalized, realistic answers.

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
  }
]

Rules:
- DO NOT use markdown code blocks (like \`\`\`)
- DO NOT add explanations, intros, comments, or formatting
- ONLY return valid JSON — not wrapped in quotes, not inside Markdown
- If unsure, return an empty array []
`;
}

export async function generateSpeakingQuestionsFromIntro(
  intro: string,
  count = 6,
): Promise<SpeakingQuestion[]> {
  const alreadyAsked = getStoredQuestions();
  const prompt = buildPrompt(intro, count, alreadyAsked);

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
    const parsed = JSON.parse(raw) as Omit<SpeakingQuestion, "id" | "date">[];

    const today = new Date().toISOString().slice(0, 10); // e.g., "2025-07-22"
    const withMeta: SpeakingQuestion[] = parsed.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      date: today,
    }));

    const newUnique = withMeta.filter(
      (q) => !alreadyAsked.includes(q.question),
    );

    storeNewQuestions(newUnique);
    return newUnique;
  } catch (e) {
    console.error("JSON parse failed:", raw);
    throw e;
  }
}
