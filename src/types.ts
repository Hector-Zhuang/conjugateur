export interface Question {
  id: number;
  verb: string;
  tense: string;
  person: string; // "je", "nous", or "ils"
  englishMeaning: string;
  example: string;
  answer: string;
}

export interface QuestionGroup {
  verb: string;
  tense: string;
  englishMeaning: string;
  questions: Question[];
}

export type PracticeMode = "new" | "review";
