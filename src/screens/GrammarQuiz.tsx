import { useEffect, useState, useRef } from "react";
import type { GrammarQuestion } from "../api"; // define this type (see note)
import { generateGrammarQuestionsFromPrompt } from "../api";

const WRONG_STORAGE_KEY = "frenchWrongGrammarQuestions";

const PROMPT_STORAGE_KEY = "grammarQuizPrompt";

export default function GrammarQuiz() {
  const [prompt, setPrompt] = useState(
    localStorage.getItem(PROMPT_STORAGE_KEY),
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<GrammarQuestion[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reviewModeRef = useRef(reviewMode);
  useEffect(() => {
    reviewModeRef.current = reviewMode;
  }, [reviewMode]);

  // Load wrong questions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(WRONG_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: GrammarQuestion[] = JSON.parse(saved);
        setWrongQuestions(parsed);
      } catch {
        setWrongQuestions([]);
      }
    }
  }, []);

  // Start a new quiz
  const startNewQuiz = async () => {
    setIsLoading(true);
    setReviewMode(false);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setUserAnswers({});

    try {
      const newQuestions = await generateGrammarQuestionsFromPrompt(
        prompt || "",
        questionCount,
      );
      setQuestions(newQuestions);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      alert("Erreur lors de la génération des questions.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start review mode
  const startReview = () => {
    if (wrongQuestions.length === 0) {
      alert("Aucune question incorrecte à revoir.");
      return;
    }
    setReviewMode(true);
    setQuestions(wrongQuestions);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setUserAnswers({});
  };

  // Clear wrong questions
  const clearWrong = () => {
    localStorage.removeItem(WRONG_STORAGE_KEY);
    setWrongQuestions([]);
    if (reviewMode) {
      setQuestions([]);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: e.target.value,
    });
  };

  // Check answer correctness
  const checkAnswer = () => {
    if (!currentQuestion) return;

    const userAns = (userAnswers[currentQuestion.id] ?? "")
      .trim()
      .toLowerCase();
    const correctAns = currentQuestion.answer.trim().toLowerCase();

    const correct = userAns === correctAns;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((s) => s + 1);
      // Remove from wrongQuestions if present
      if (!reviewMode) return;
      const updatedWrong = wrongQuestions.filter(
        (q) => q.id !== currentQuestion.id,
      );
      setWrongQuestions(updatedWrong);
      localStorage.setItem(WRONG_STORAGE_KEY, JSON.stringify(updatedWrong));
    } else {
      // Add to wrongQuestions if not already present
      if (!wrongQuestions.find((q) => q.id === currentQuestion.id)) {
        const updatedWrong = [...wrongQuestions, currentQuestion];
        setWrongQuestions(updatedWrong);
        localStorage.setItem(WRONG_STORAGE_KEY, JSON.stringify(updatedWrong));
      }
    }
  };

  const nextQuestion = () => {
    setUserAnswers({});
    setShowResult(false);
    setIsCorrect(null);
    setCurrentIndex((idx) => idx + 1);
  };

  // Load prompt on mount
  useEffect(() => {
    const storedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
    if (storedPrompt) setPrompt(storedPrompt);
  }, []);

  // Save prompt on change
  useEffect(() => {
    localStorage.setItem(PROMPT_STORAGE_KEY, prompt || "");
  }, [prompt]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-black text-white rounded-md space-y-6">
      <h1 className="text-3xl font-bold text-center">Grammar Quiz</h1>

      {/* Prompt input & count */}
      {!reviewMode && (
        <div className="space-y-2">
          <label className="block font-semibold">
            Prompt for AI question generation:
          </label>
          <textarea
            rows={4}
            value={prompt || ""}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded border border-gray-700 bg-zinc-900 p-3 text-white resize-none"
          />
        </div>
      )}

      {/* Review controls */}
      {/* Review controls */}
      <div className="flex flex-wrap items-center gap-3 mt-4 justify-center">
        <label className="font-semibold flex items-center gap-2">
          Number of questions:
          <input
            type="number"
            min={1}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
            className="w-20 rounded border border-gray-700 bg-zinc-900 p-1.5 text-white text-sm"
          />
        </label>

        <button
          onClick={startNewQuiz}
          disabled={isLoading || !prompt!.trim()}
          className="bg-blue-600 hover:bg-blue-700 rounded py-1.5 px-4 font-semibold text-sm disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate Questions"}
        </button>

        <button
          onClick={startReview}
          disabled={wrongQuestions.length === 0}
          className="bg-yellow-600 hover:bg-yellow-700 rounded py-1.5 px-4 font-semibold text-sm disabled:opacity-50"
        >
          Review Wrong ({wrongQuestions.length})
        </button>

        <button
          onClick={clearWrong}
          disabled={wrongQuestions.length === 0}
          className="bg-red-600 hover:bg-red-700 rounded py-1.5 px-4 font-semibold text-sm disabled:opacity-50"
        >
          Clear Wrong
        </button>

        {reviewMode && (
          <button
            onClick={() => setReviewMode(false)}
            className="bg-green-600 hover:bg-green-700 rounded py-1.5 px-4 font-semibold text-sm"
          >
            Back to New Quiz
          </button>
        )}
      </div>

      {/* Quiz Question */}
      {questions.length === 0 && !reviewMode && (
        <p className="mt-6 text-center text-gray-400">
          No questions generated yet. Enter prompt and generate questions.
        </p>
      )}

      {questions.length > 0 && currentQuestion && (
        <div className="bg-zinc-800 p-6 rounded">
          <p className="mb-4 font-semibold text-lg">
            Question {currentIndex + 1} of {questions.length}:
          </p>
          <p className="mb-4 italic">{currentQuestion.sentence}</p>

          <input
            type="text"
            placeholder="Type the correct verb form"
            value={userAnswers[currentQuestion.id] ?? ""}
            onChange={handleInputChange}
            className="w-full rounded border border-gray-700 bg-zinc-900 p-3 text-white"
            disabled={showResult}
          />

          <div className="mt-4 flex justify-between items-center">
            {showResult && (
              <p
                className={
                  isCorrect
                    ? "text-green-400 font-semibold"
                    : "text-red-400 font-semibold"
                }
              >
                {isCorrect
                  ? "Correct!"
                  : `Incorrect. Correct answer: ${currentQuestion.answer}`}
              </p>
            )}

            <button
              onClick={showResult ? nextQuestion : checkAnswer}
              disabled={!userAnswers[currentQuestion.id]?.trim()}
              className="ml-auto bg-blue-600 hover:bg-blue-700 rounded py-2 px-4 font-semibold disabled:opacity-50"
            >
              {showResult
                ? currentIndex + 1 === questions.length
                  ? "Finish"
                  : "Next"
                : "Check"}
            </button>
          </div>
        </div>
      )}

      {/* Score summary */}
      {showResult && currentIndex + 1 === questions.length && (
        <div className="mt-6 bg-gray-800 p-4 rounded text-center">
          <h2 className="text-xl font-semibold">
            {reviewMode ? "Review Complete" : "Quiz Complete"}
          </h2>
          <p>
            Score: {score} / {questions.length}
          </p>
        </div>
      )}
    </div>
  );
}
