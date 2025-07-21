import { useState, useEffect } from "react";
import type { SpeakingQuestion } from "../../api";

const STORAGE_KEY = "tcf_speaking_questions";

export default function QuestionManager() {
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setQuestions(JSON.parse(stored));
    }
  }, []);

  const toggleAnswer = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const removeQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setQuestions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Generated Questions</h2>
        {questions.length > 0 && (
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-2 py-1 rounded"
          >
            Clear All
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-center mt-10 text-gray-400">
          No questions generated. Click "Generate Questions".
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map(({ id, question, answer }) => (
            <div
              key={id}
              className="bg-zinc-800 p-4 rounded border border-gray-700 select-text relative"
            >
              {/* Only this line toggles the answer */}
              <p
                className="font-semibold cursor-pointer select-none"
                onClick={() => toggleAnswer(id)}
              >
                ❓ {question}
              </p>

              {expandedIds.has(id) && (
                <>
                  <p className="mt-2 text-gray-300 whitespace-pre-wrap">
                    💬 {answer}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // in case it's nested inside another interactive block
                        removeQuestion(id);
                      }}
                      className="text-sm text-red-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
