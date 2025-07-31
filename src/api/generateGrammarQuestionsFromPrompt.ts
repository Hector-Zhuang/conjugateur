import OpenAI from "openai";

export interface GrammarQuestion {
  id: string;
  sentence: string; // sentence with a missing conjugated verb (like "Je ____ au travail.")
  answer: string; // the correct conjugated verb (e.g., "vais")
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

export async function generateGrammarQuestionsFromPrompt(
  prompt: string,
  count: number,
): Promise<GrammarQuestion[]> {
  // Load already asked questions to avoid duplicates
  const askedRaw = localStorage.getItem("frenchAskedGrammarQuestions");
  const askedQuestions: GrammarQuestion[] = askedRaw
    ? JSON.parse(askedRaw)
    : [];
  const excludedSentences = new Set(askedQuestions.map((q) => q.sentence));

  const excludeList = excludedSentences.size
    ? `Avoid generating questions similar to these sentences:\n${[
        ...excludedSentences,
      ]
        .map((s) => `- ${s}`)
        .join("\n")}\n`
    : "";

  const promptText = `
Generate EXACTLY ${count} French grammar questions focused on verb conjugation.

Each question must be an object with:
{
  "id": string,  // unique id (can be numeric or string)
  "sentence": string,  // A sentence with one missing conjugated verb replaced by "____", e.g. "Je ____ au travail."
  "answer": string   // The correct conjugated verb form for the blank (just the verb part, e.g. "vais")
}

Rules:
- Use a variety of tenses and verbs.
- Questions should be practical and realistic.
- DO NOT include the subject pronoun in the answer, only the conjugated verb.
- Avoid generating duplicate or very similar sentences.
- Output only a valid JSON array of such objects, no explanations, no markdown, no quotes wrapping the JSON.
- Do NOT escape quotes or characters in the JSON.

${excludeList}

Use this theme or context for the sentences:
"""
${prompt}
"""
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant generating French grammar questions.",
      },
      {
        role: "user",
        content: promptText,
      },
    ],
    temperature: 1,
    top_p: 0.9,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  let questions: GrammarQuestion[] = [];
  try {
    questions = JSON.parse(raw) as GrammarQuestion[];
  } catch (err) {
    console.error("Failed to parse AI response JSON:", raw);
    throw err;
  }

  // Filter out duplicates by sentence (just in case)
  const uniqueQuestions = questions.filter(
    (q) => !excludedSentences.has(q.sentence),
  );

  // Save updated list to localStorage
  const updated = [...askedQuestions, ...uniqueQuestions];
  localStorage.setItem("frenchAskedGrammarQuestions", JSON.stringify(updated));

  return uniqueQuestions;
}
