import { useEffect, useState } from "react";
import {
  generateSpeakingQuestionsFromIntro,
  type SpeakingQuestion,
} from "./api";

const INTRO_KEY = "tcf_intro";

export default function TCFScreen() {
  const [intro, setIntro] = useState("");
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Load intro from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(INTRO_KEY);
    if (saved) setIntro(saved);
  }, []);

  // Save intro to localStorage on change
  useEffect(() => {
    localStorage.setItem(INTRO_KEY, intro);
  }, [intro]);

  const handleGenerate = async () => {
    if (!intro.trim()) return;
    setLoading(true);
    try {
      const result = await generateSpeakingQuestionsFromIntro(intro, 5);
      setQuestions(result);
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Générateur TCF Canada
      </h1>

      <div className="space-y-3">
        <label
          htmlFor="intro"
          className="block font-medium text-gray-700 dark:text-gray-200"
        >
          Présentez-vous (en anglais ou en français)
        </label>
        <textarea
          id="intro"
          rows={6}
          placeholder="Ex: Je m'appelle Clara. Je suis ingénieure et j'habite à Toronto depuis trois ans..."
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 p-4 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !intro.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Génération en cours..." : "Générer les questions"}
        </button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-6 pt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Questions générées
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {questions.map((q, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 p-5 shadow-sm"
              >
                <p className="font-medium text-gray-800 dark:text-white">
                  ❓ {q.question}
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  💬 {q.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
