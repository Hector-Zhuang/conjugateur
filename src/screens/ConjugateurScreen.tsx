import { useEffect, useMemo, useRef, useState } from "react";
import type { Question, QuestionGroup } from "../types";
import Header from "../components/Header";
import Controls from "../components/Controls";
import { QuestionCard } from "../components/QuestionCard";
import { generateQuestionsWithAIAndMixWrong } from "../api";

export default function ConjugateurScreen() {
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const isReviewModeRef = useRef(isReviewMode);
  useEffect(() => {
    isReviewModeRef.current = isReviewMode;
  }, [isReviewMode]);

  const groupQuestions = (qs: Question[]): QuestionGroup[] => {
    const groups: QuestionGroup[] = [];
    for (let i = 0; i < qs.length; i += 3) {
      const groupQs = qs.slice(i, i + 3);
      if (
        groupQs.length === 3 &&
        groupQs.some((q) => q.person === "je") &&
        groupQs.some((q) => q.person === "nous") &&
        groupQs.some((q) => q.person === "ils")
      ) {
        groups.push({
          verb: groupQs[0].verb,
          tense: groupQs[0].tense,
          englishMeaning: groupQs[0].englishMeaning,
          questions: groupQs,
        });
      }
    }
    return groups;
  };

  useEffect(() => {
    const saved = localStorage.getItem("frenchWrongQuestions");
    if (saved) setWrongQuestions(JSON.parse(saved));
    startNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = async () => {
    setIsLoading(true);
    try {
      const newQuestions = await generateQuestionsWithAIAndMixWrong(
        questionCount,
        wrongQuestions,
      );
      if (isReviewModeRef.current) return;

      setQuestionGroups(groupQuestions(newQuestions));
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
    setQuestionGroups(groupQuestions(wrongQuestions));
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setUserAnswers({});
  };

  const clearWrong = () => {
    localStorage.removeItem("frenchWrongQuestions");
    setWrongQuestions([]);
  };

  const checkAnswer = () => {
    const group = questionGroups[currentIndex];
    if (!group) return;

    const allCorrect = group.questions.every((q) => {
      const ans = userAnswers[q.person]?.trim().toLowerCase() || "";
      return ans === q.answer.toLowerCase();
    });

    setIsCorrect(allCorrect);
    setShowResult(true);

    if (allCorrect) {
      setScore((s) => s + 1);
      const updatedWrong = wrongQuestions.filter(
        (wq) => !group.questions.find((q) => q.id === wq.id),
      );
      setWrongQuestions(updatedWrong);
      localStorage.setItem(
        "frenchWrongQuestions",
        JSON.stringify(updatedWrong),
      );
    } else {
      const updatedWrong = [...wrongQuestions];
      group.questions.forEach((q) => {
        if (!updatedWrong.find((wq) => wq.id === q.id)) updatedWrong.push(q);
      });
      setWrongQuestions(updatedWrong);
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

    const updatedWrong = wrongQuestions.filter(
      (q) => !groupToDelete.questions.find((delQ) => delQ.id === q.id),
    );
    setWrongQuestions(updatedWrong);
    localStorage.setItem("frenchWrongQuestions", JSON.stringify(updatedWrong));

    setUserAnswers({});
    setShowResult(false);
    setIsCorrect(null);

    if (currentIndex >= newGroups.length) {
      setCurrentIndex(newGroups.length - 1);
    }
  };

  const wrongVerbCount = useMemo(() => {
    const verbs = new Set(wrongQuestions.map((q) => q.verb));
    return verbs.size;
  }, [wrongQuestions]);

  const currentGroup = questionGroups[currentIndex];

  return (
    <div className="w-full space-y-6">
      <Header />
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
          questions={currentGroup.questions}
          userAnswers={userAnswers}
          setUserAnswers={setUserAnswers}
          onCheck={checkAnswer}
          isCorrect={isCorrect ?? null}
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
