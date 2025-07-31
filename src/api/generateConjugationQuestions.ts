import OpenAI from "openai";
import type { QuestionGroup } from "../types";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

export const generateQuestionGroupsWithAIAndMixWrong = async (
  count: number,
  wrongGroups: QuestionGroup[],
  allowedTenses?: string[],
): Promise<QuestionGroup[]> => {
  const askedRaw = localStorage.getItem("frenchAskedQuestions");
  const askedGroups: QuestionGroup[] = askedRaw ? JSON.parse(askedRaw) : [];

  const excludedVerbs = [...new Set(askedGroups.map((g) => g.verb))];
  const excludedList = excludedVerbs.length
    ? `Avoid using these verbs: ${excludedVerbs.join(", ")}.`
    : "";

  const tenseFilter =
    allowedTenses && allowedTenses.length
      ? `Only use these tenses: ${allowedTenses.join(", ")}.`
      : `Use a variety of tenses (présent, passé composé, futur simple, imparfait, conditionnel, subjonctif, etc.). No more than 30% of groups should use présent tense.`;

  const prompt = `
      Generate EXACTLY ${count} French verb conjugation question groups as a flat JSON array.
      
      Each group should follow this schema:
      interface QuestionGroup {
        verb: string;
        tense: string;
        englishMeaning: string;
        questions: Question[]; // contains exactly 3
      }
      interface Question {
        person: "je" | "nous" | "ils";
        answer: string; // includes subject pronoun, e.g. "je mange"
      }
      
      Rules:
      - Each group contains questions for the same verb and tense.
      - The 3 questions in each group correspond to "je", "nous", and "ils", in any order.
      - No verb should repeat across groups.
      - ${tenseFilter}
      - Include 15-20% basic verbs (être, avoir, aller, faire).
      - Provide accurate conjugations including subject pronouns.
      - For ALL groups with tense "subjonctif", ALL answers MUST start with "que" followed by the conjugated verb phrase (e.g., "que je vaille").
      - Do NOT include example sentences or explanations.
      - Output only the raw JSON array. Do NOT wrap the output in markdown or quotes.
      - Do NOT escape quotes or other characters.
      - The JSON must be valid and parsable.
      ${excludedList}
      `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant generating French conjugation questions.",
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

  let newGroups: QuestionGroup[] = [];
  try {
    newGroups = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from AI:", text);
    throw e;
  }

  const resultGroups: QuestionGroup[] = [];
  let newIndex = 0;
  // let wrongIndex = 0;

  // while (
  //   resultGroups.length < count &&
  //   (newIndex < newGroups.length || wrongIndex < wrongToInsert.length)
  // ) {
  //   if (wrongIndex < wrongToInsert.length) {
  //     const wrong = wrongToInsert[wrongIndex];
  //     resultGroups.push({
  //       verb: wrong.verb,
  //       tense: wrong.tense,
  //       englishMeaning: wrong.englishMeaning,
  //       questions: wrong.questions,
  //     });
  //     wrongIndex++;
  //   }
  //   if (newIndex < newGroups.length && resultGroups.length < count) {
  //     resultGroups.push(newGroups[newIndex]);
  //     newIndex++;
  //   }
  // }

  while (resultGroups.length < count && newIndex < newGroups.length) {
    resultGroups.push(newGroups[newIndex]);
    newIndex++;
  }

  let currentId =
    parseInt(localStorage.getItem("conjugationQuestionNum") || "") || 0;
  resultGroups.forEach((group) => {
    group.questions.forEach((q) => {
      q.id = currentId++;
    });
  });
  localStorage.setItem("conjugationQuestionNum", String(currentId));

  const updatedStorage = [...askedGroups, ...resultGroups];
  localStorage.setItem("frenchAskedQuestions", JSON.stringify(updatedStorage));

  return resultGroups;
};
