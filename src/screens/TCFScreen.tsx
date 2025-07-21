import { useEffect, useState } from "react";
import type { SpeakingQuestion } from "../api";
import { generateSpeakingQuestionsFromIntro } from "../api";

const STORAGE_KEY = "tcf_speaking_questions";
const INTRO_STORAGE_KEY = "tcf_intro";

function loadStoredQuestions(): SpeakingQuestion[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredQuestions(questions: SpeakingQuestion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export default function TCFScreen() {
  const [intro, setIntro] = useState(
    () => localStorage.getItem(INTRO_STORAGE_KEY) || "",
  );
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [storedQuestions, setStoredQuestions] = useState<SpeakingQuestion[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Track which question ids have their answers visible
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setStoredQuestions(loadStoredQuestions());
  }, []);

  useEffect(() => {
    localStorage.setItem(INTRO_STORAGE_KEY, intro);
  }, [intro]);

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

  const generateQuestions = async () => {
    if (!intro.trim()) {
      alert(
        "Veuillez entrer votre introduction avant de générer des questions.",
      );
      return;
    }

    setLoading(true);
    try {
      const newQs = await generateSpeakingQuestionsFromIntro(intro, 5);

      const newQsWithIds = newQs.map((q, i) => ({
        ...q,
        id: q.id ?? `gen-${Date.now()}-${i}`,
      }));

      const uniqueNewQs = newQsWithIds.filter(
        (q) =>
          !storedQuestions.some(
            (sq) => sq.id === q.id || sq.question === q.question,
          ),
      );

      if (uniqueNewQs.length === 0) {
        alert(
          "Aucune nouvelle question générée. Essayez une autre introduction.",
        );
        setLoading(false);
        return;
      }

      const updated = [...storedQuestions, ...uniqueNewQs];
      setStoredQuestions(updated);
      saveStoredQuestions(updated);
      setQuestions(uniqueNewQs);
      setReviewMode(false);
      setExpandedIds(new Set()); // reset expanded state on new questions
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  const listToShow = reviewMode ? storedQuestions : questions;

  return (
    <div className="min-h-screen bg-black p-6 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-center">
        Générateur TCF Canada
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column: input + buttons */}
        <div className="md:w-1/2 flex flex-col">
          <label htmlFor="intro" className="block mb-2 font-medium">
            Présentez-vous (en anglais ou en français)
          </label>
          <textarea
            id="intro"
            rows={10}
            placeholder="Ex: Je m'appelle Hector. Je travaille en informatique..."
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-zinc-900 p-4 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />

          <div className="flex space-x-4 mt-4">
            <button
              disabled={loading || !intro.trim()}
              onClick={generateQuestions}
              className="px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex-1"
            >
              {loading ? "Génération en cours..." : "Générer des questions"}
            </button>

            <button
              onClick={() => setReviewMode(!reviewMode)}
              className="px-5 py-2.5 rounded border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition flex-1"
            >
              {reviewMode
                ? "Retour à la génération"
                : "Voir les questions sauvegardées"}
            </button>
          </div>
        </div>

        {/* Right column: questions */}
        <div className="md:w-1/2 max-h-[80vh] overflow-y-auto space-y-4">
          {listToShow.length === 0 ? (
            <p className="text-center mt-10 text-gray-400">
              {reviewMode
                ? "Aucune question sauvegardée."
                : 'Aucune question générée. Cliquez sur "Générer des questions".'}
            </p>
          ) : (
            listToShow.map(({ id, question, answer }) => (
              <div
                key={id}
                className="bg-zinc-800 p-4 rounded border border-gray-700 cursor-pointer select-none"
                onClick={() => toggleAnswer(id)}
              >
                <p className="font-semibold">❓ {question}</p>
                {expandedIds.has(id) && (
                  <p className="mt-2 text-gray-300 whitespace-pre-wrap">
                    💬 {answer}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
