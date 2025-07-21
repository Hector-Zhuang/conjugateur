import React from "react";
import type { Question } from "../../types";

interface QuestionCardProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  setUserAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onCheck: () => void;
  onNext: () => void;
  isCorrect: boolean | null;
  showResult: boolean;
}

const tenseColors: Record<string, string> = {
  présent: "text-green-400",
  imparfait: "text-yellow-400",
  "futur simple": "text-blue-400",
  "passé composé": "text-pink-400",
  "plus-que-parfait": "text-purple-400",
  "passé simple": "text-red-400",
  "futur antérieur": "text-indigo-400",
  "subjonctif présent": "text-teal-400",
  "subjonctif passé": "text-cyan-400",
  "conditionnel présent": "text-orange-400",
  "conditionnel passé": "text-amber-400",
  "impératif présent": "text-lime-400",
  "impératif passé": "text-emerald-400",
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questions,
  userAnswers,
  setUserAnswers,
  onCheck,
  onNext,
  isCorrect,
  showResult,
}) => {
  const order = ["je", "nous", "ils"];
  const sortedQuestions = order
    .map((p) => questions.find((q) => q.person === p))
    .filter(Boolean) as Question[];

  const handleChange = (person: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [person]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!showResult) {
        onCheck();
      } else {
        onNext();
      }
    }
  };

  const { verb, tense, englishMeaning } = questions[0];
  const tenseColorClass = tenseColors[tense] || "text-indigo-400";

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-2 text-center">
      <h2 className="text-xl font-semibold mb-2">
        Verbe: <span className="text-indigo-400">{verb}</span> | Temps:{" "}
        <span className={tenseColorClass}>{tense}</span>
      </h2>
      <p className="text-sm text-gray-300 italic mb-4">{englishMeaning}</p>

      {sortedQuestions.map(({ id, person, answer }) => {
        const userAnswer = userAnswers[person] || "";
        const isPersonCorrect =
          userAnswer.trim().toLowerCase() === answer.toLowerCase();
        const showAnswer = showResult && !isPersonCorrect;
        return (
          <div key={id} className="mb-4">
            <p className="font-medium capitalize mb-1">{person}</p>
            <input
              type="text"
              className="mt-1 w-72 max-w-full px-3 py-2 rounded-md bg-gray-800 text-white text-center border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={`Entrez la conjugaison pour "${person}"`}
              value={userAnswer}
              onChange={(e) => handleChange(person, e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {showAnswer && (
              <p className="mt-1 text-green-400 text-sm">
                Réponse correcte:{" "}
                <span className="font-semibold">{answer}</span>
              </p>
            )}
          </div>
        );
      })}

      {!showResult && (
        <button
          onClick={onCheck}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded"
        >
          Vérifier
        </button>
      )}

      {showResult && (
        <div className="space-y-4">
          <p
            className={`text-lg font-semibold ${
              isCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {isCorrect ? "Correct!" : "Incorrect, essayez encore."}
          </p>
          <button
            onClick={onNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded"
          >
            Question Suivante
          </button>
        </div>
      )}
    </div>
  );
};
