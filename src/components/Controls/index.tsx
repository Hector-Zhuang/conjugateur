interface ControlsProps {
  questionCount: number;
  setQuestionCount: (n: number) => void;
  onStart: () => void;
  onReview: () => void;
  onClear: () => void;
  isLoading: boolean;
  wrongCount: number;
}

export default function Controls({
  questionCount,
  setQuestionCount,
  onStart,
  onReview,
  onClear,
  isLoading,
  wrongCount,
}: ControlsProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-2">
        <label className="text-white">Questions:</label>
        <input
          type="number"
          value={questionCount}
          onChange={(e) => setQuestionCount(parseInt(e.target.value))}
          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-20"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={onStart}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded min-w-[100px]"
        >
          {isLoading ? "Loading..." : "New Practice"}
        </button>
        <button
          onClick={onReview}
          disabled={wrongCount === 0}
          className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded min-w-[100px]"
        >
          Review ({wrongCount})
        </button>
        <button
          onClick={onClear}
          className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-2 rounded min-w-[100px]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
