export interface Question {
  id: number;
  person: string; // "je", "nous", or "ils"
  answer: string;
}

export interface QuestionGroup {
  verb: string;
  tense: string;
  englishMeaning: string;
  questions: Question[];
}

export type PracticeMode = "new" | "review";

export type GrammarQuestion = {
  id: string;
  sentence: string;
  answer: string;
};
