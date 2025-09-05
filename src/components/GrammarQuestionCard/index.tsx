import type { GrammarQuestion } from "../../types";

export default function GrammarQuestionCard({
  question,
  userInput,
  setUserInput,
  onCheck,
  showResult,
  isCorrect,
  onNext,
  isLast,
}: {
  question: GrammarQuestion;
  userInput: string;
  setUserInput: (val: string) => void;
  onCheck: () => void;
  showResult: boolean;
  isCorrect: boolean | null;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <div className="bg-zinc-800 p-4 rounded space-y-3 border border-zinc-700">
      <p className="font-medium">
        Complétez : <span className="text-blue-400">{question.sentence}</span>
      </p>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => {
          console.log("e", e.key);

          if (e.key === "Enter") {
            e.preventDefault();
            console.log("Enter pressed in input");
            onCheck();
          }
        }}
        className="w-full rounded p-2 bg-zinc-900 border border-zinc-600 text-white"
        placeholder="Entrez le verbe conjugué"
      />
      <div className="flex gap-2">
        {!showResult ? (
          <button
            onClick={onCheck}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded text-sm"
          >
            Vérifier
          </button>
        ) : (
          <>
            <p className={isCorrect ? "text-green-400" : "text-red-400"}>
              {isCorrect
                ? "✅ Correct"
                : `❌ Mauvais. Réponse : ${question.answer}`}
            </p>
            {!isLast && (
              <button
                onClick={onNext}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-1.5 rounded text-sm"
              >
                Suivant
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
