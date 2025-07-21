import OpenAI from "openai";
import type { Question } from "../types";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

export const generateQuestionsWithAIAndMixWrong = async (
  count: number,
  wrongQuestions: Question[],
): Promise<Question[]> => {
  const askedQuestionsRaw = localStorage.getItem("frenchAskedQuestions");
  const askedQuestions: Question[] = askedQuestionsRaw
    ? JSON.parse(askedQuestionsRaw)
    : [];
  const excludedVerbs = [...new Set(askedQuestions.map((q) => q.verb))];
  const excludedList = excludedVerbs.length
    ? `Avoid using these verbs: ${excludedVerbs.join(", ")}.`
    : "";

  const prompt = `
Generate EXACTLY ${count * 3} French verb conjugation questions as a flat JSON array.
Group every 3 questions by the same verb and tense, with persons "je", "nous", and "ils" respectively.

Use this schema:

interface Question {
  id: number;
  verb: string;
  tense: string;
  person: string;
  englishMeaning: string;
  example: string;
  answer: string;
}

Rules:
- Each 3-question group must use the same verb and tense
- Each group contains "je", "nous", and "ils"
- First verb MUST NOT be "choisir"
- No repeated verbs across groups
- 15-20% basic verbs (être, avoir, aller, faire)
- At least 5 unique verbs total in ${count} groups
${excludedList}
- Natural French example sentences with blanks
- All fields required, answers accurate
- NO markdown, explanations, or extra text

OUTPUT ONLY the RAW JSON ARRAY WITHOUT markdown or code block.
Do NOT wrap output in quotes or escape characters.
Only output valid JSON.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant generating French verb conjugation questions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 1,
    top_p: 0.9,
  });

  const text = completion.choices[0]?.message?.content ?? "";

  let newQuestions: Question[] = [];
  try {
    newQuestions = JSON.parse(text) as Question[];
  } catch (e) {
    console.error("Failed to parse JSON from AI:", text);
    throw e;
  }

  // 混入错题 (最多 20%)
  const maxWrongInsert = Math.floor(count * 3 * 0.2);
  const shuffledWrong = wrongQuestions.sort(() => Math.random() - 0.5);
  const wrongToInsert = shuffledWrong.slice(0, maxWrongInsert);

  const combinedQuestions: Question[] = [];
  let newIndex = 0;
  let wrongIndex = 0;

  while (
    combinedQuestions.length < count * 3 &&
    (newIndex < newQuestions.length || wrongIndex < wrongToInsert.length)
  ) {
    if (wrongIndex < wrongToInsert.length) {
      combinedQuestions.push(wrongToInsert[wrongIndex]);
      wrongIndex++;
    }
    if (
      newIndex < newQuestions.length &&
      combinedQuestions.length < count * 3
    ) {
      combinedQuestions.push(newQuestions[newIndex]);
      newIndex++;
    }
  }

  while (
    combinedQuestions.length < count * 3 &&
    newIndex < newQuestions.length
  ) {
    combinedQuestions.push(newQuestions[newIndex]);
    newIndex++;
  }

  combinedQuestions.forEach((q, i) => {
    q.id = i + 1;
  });

  const updatedAskedQuestions = [...askedQuestions, ...combinedQuestions];
  localStorage.setItem(
    "frenchAskedQuestions",
    JSON.stringify(updatedAskedQuestions),
  );

  return combinedQuestions;
};
