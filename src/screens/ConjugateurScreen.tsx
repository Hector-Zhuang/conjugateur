import { useEffect, useMemo, useRef, useState } from "react";
import type { QuestionGroup } from "../types";
import Header from "../components/Header";
import Controls from "../components/Controls";
import { QuestionCard } from "../components/QuestionCard";
import { generateQuestionGroupsWithAIAndMixWrong } from "../api";

export default function ConjugateurScreen() {
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wrongQuestionGroups, setWrongQuestionGroups] = useState<
    QuestionGroup[]
  >([]);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [selectedTenses, setSelectedTenses] = useState<string[]>([]);

  const isReviewModeRef = useRef<boolean>(isReviewMode);
  useEffect(() => {
    isReviewModeRef.current = isReviewMode;
  }, [isReviewMode]);

  // Load wrongQuestionGroups from localStorage (stored as JSON string)
  useEffect(() => {
    const saved = localStorage.getItem("frenchWrongQuestions");
    if (saved) {
      try {
        const parsed: QuestionGroup[] = JSON.parse(saved);
        setWrongQuestionGroups(parsed);
      } catch {
        setWrongQuestionGroups([]);
      }
    }
    // startNew();
  }, []);

  const startNew = async () => {
    setIsLoading(true);
    try {
      const newGroups: QuestionGroup[] =
        await generateQuestionGroupsWithAIAndMixWrong(
          questionCount,
          wrongQuestionGroups,
          selectedTenses,
        );
      if (isReviewModeRef.current) return;

      setQuestionGroups(newGroups);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setUserAnswers({});
      setIsReviewMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startReview = () => {
    setIsReviewMode(true);
    setIsLoading(false);
    setQuestionGroups(wrongQuestionGroups);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setUserAnswers({});
  };

  const clearWrong = () => {
    localStorage.removeItem("frenchWrongQuestions");
    setWrongQuestionGroups([]);
  };

  const checkAnswer = () => {
    const group = questionGroups[currentIndex];
    if (!group) return;

    const allCorrect = group.questions.every((q) => {
      const ans = userAnswers[q.person]?.trim().toLowerCase() ?? "";
      return ans === q.answer.toLowerCase();
    });

    setIsCorrect(allCorrect);
    setShowResult(true);

    if (allCorrect) {
      setScore((s) => s + 1);
      // Remove correct group questions from wrongQuestionGroups
      // const updatedWrong = wrongQuestionGroups.filter(
      //   (wg) =>
      //     !wg.questions.some((wq) =>
      //       group.questions.some((q) => q.id === wq.id),
      //     ),
      // );
      // setWrongQuestionGroups(updatedWrong);
      // localStorage.setItem(
      //   "frenchWrongQuestions",
      //   JSON.stringify(updatedWrong),
      // );
    } else {
      // Add wrong questions if not already present
      const updatedWrong = [...wrongQuestionGroups];
      const existingIds = new Set(
        updatedWrong.flatMap((g) => g.questions.map((q) => q.id)),
      );

      group.questions.forEach((q) => {
        if (!existingIds.has(q.id)) {
          // Find group in updatedWrong to add question or add entire group if not present
          const groupIndex = updatedWrong.findIndex(
            (g) => g.verb === group.verb && g.tense === group.tense,
          );
          if (groupIndex >= 0) {
            // Add question if missing
            if (
              !updatedWrong[groupIndex].questions.some((wq) => wq.id === q.id)
            ) {
              updatedWrong[groupIndex].questions.push(q);
            }
          } else {
            // Add whole group if missing
            updatedWrong.push(group);
          }
        }
      });

      setWrongQuestionGroups(updatedWrong);
      localStorage.setItem(
        "frenchWrongQuestions",
        JSON.stringify(updatedWrong),
      );
    }
  };

  const nextQuestion = () => {
    setUserAnswers({});
    setShowResult(false);
    setIsCorrect(null);
    setCurrentIndex((idx) => idx + 1);
  };

  const deleteCurrentGroup = () => {
    if (questionGroups.length === 0) return;
    const groupToDelete = questionGroups[currentIndex];
    if (!groupToDelete) return;

    const newGroups = questionGroups.filter((_, idx) => idx !== currentIndex);
    setQuestionGroups(newGroups);

    // Remove deleted group from wrongQuestionGroups if in review mode
    if (isReviewMode) {
      const updatedWrong = wrongQuestionGroups.filter(
        (wg) =>
          wg.verb !== groupToDelete.verb || wg.tense !== groupToDelete.tense,
      );
      setWrongQuestionGroups(updatedWrong);
      localStorage.setItem(
        "frenchWrongQuestions",
        JSON.stringify(updatedWrong),
      );
    }

    setUserAnswers({});
    setShowResult(false);
    setIsCorrect(null);

    if (currentIndex >= newGroups.length) {
      setCurrentIndex(newGroups.length - 1);
    }
  };

  const wrongVerbCount = useMemo(() => {
    const verbs = new Set(wrongQuestionGroups.map((g) => g.verb));
    return verbs.size;
  }, [wrongQuestionGroups]);

  const currentGroup = questionGroups[currentIndex];

  return (
    <div className="w-full space-y-6">
      <Header />
      <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-200">
        <label className="font-medium text-white">Choisir les temps :</label>
        <div className="flex flex-wrap gap-2">
          {[
            "présent",
            "passé composé",
            "futur simple",
            "imparfait",
            "conditionnel",
            "subjonctif",
          ].map((tense) => (
            <label key={tense} className="flex items-center gap-1">
              <input
                type="checkbox"
                value={tense}
                checked={selectedTenses.includes(tense)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTenses([...selectedTenses, tense]);
                  } else {
                    setSelectedTenses(
                      selectedTenses.filter((t) => t !== tense),
                    );
                  }
                }}
                className="accent-blue-500 bg-zinc-800 border-zinc-600 rounded"
              />
              <span className="text-white">{tense}</span>
            </label>
          ))}
        </div>
        <span className="text-zinc-400"></span>
      </div>

      <Controls
        questionCount={questionCount}
        wrongCount={wrongVerbCount}
        setQuestionCount={setQuestionCount}
        onStart={() => {
          setIsReviewMode(false);
          startNew();
        }}
        onReview={startReview}
        onClear={clearWrong}
        isLoading={isLoading}
      />
      {currentGroup && (
        <QuestionCard
          group={currentGroup}
          questions={currentGroup.questions}
          userAnswers={userAnswers}
          setUserAnswers={setUserAnswers}
          onCheck={checkAnswer}
          isCorrect={isCorrect}
          showResult={showResult}
          onNext={nextQuestion}
          onDelete={isReviewMode ? deleteCurrentGroup : undefined}
        />
      )}
      {currentIndex === questionGroups.length - 1 && showResult && (
        <div className="bg-gray-800 p-4 rounded text-center">
          <h3 className="text-lg font-semibold">
            {isReviewMode ? "Revue terminée" : "Session Complete"}
          </h3>
          <p>
            Score: {score} / {questionGroups.length}
          </p>
        </div>
      )}
    </div>
  );
}
