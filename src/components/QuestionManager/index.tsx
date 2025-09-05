import { useState } from "react";
import type { SpeakingQuestion } from "../../api";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 10);
}

function groupQuestionsByDate(questions: SpeakingQuestion[]) {
  const groups: Record<string, SpeakingQuestion[]> = {};
  for (const q of questions) {
    const dateKey =
      q.date ?? new Date(parseInt(q.id?.slice(0, 13))).toISOString();
    const key = formatDate(dateKey);
    if (!groups[key]) groups[key] = [];
    groups[key].push(q);
  }

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return sortedDates.map((date) => ({
    date,
    questions: groups[date],
  }));
}

type Props = {
  questions: SpeakingQuestion[];
  setQuestions: (qs: SpeakingQuestion[]) => void;
};

export default function QuestionManager({ questions, setQuestions }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
    localStorage.setItem("tcf_speaking_questions_new", JSON.stringify(updated));
  };

  const clearAll = () => {
    setQuestions([]);
    localStorage.removeItem("tcf_speaking_questions_new");
  };

  const grouped = groupQuestionsByDate(questions);

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
        <div className="space-y-6">
          {grouped.map(({ date, questions }) => (
            <div key={date}>
              <h3 className="text-sm text-gray-400 font-medium mb-2 border-b border-gray-700 pb-1">
                {date}
              </h3>
              <div className="space-y-3">
                {questions.map(({ id, question, answer }) => (
                  <div
                    key={id}
                    className="bg-zinc-800 p-4 rounded border border-gray-700 select-text relative"
                  >
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
                              e.stopPropagation();
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
