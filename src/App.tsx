import { useState } from "react";
import ConjugateurScreen from "./screens/ConjugateurScreen";
import TCFScreen from "./screens/TCFScreen";
import GrammarQuiz from "./screens/GrammarQuiz";

export default function App() {
  const [mode, setMode] = useState<"conjugateur" | "tcf" | "grammar">(
    "conjugateur",
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full space-y-6">
        {mode === "conjugateur" && <ConjugateurScreen />}
        {mode === "tcf" && <TCFScreen />}
        {mode === "grammar" && <GrammarQuiz />}
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex space-x-2">
        <button
          onClick={() => setMode("conjugateur")}
          className={`rounded px-3 py-1.5 text-sm transition ${
            mode === "conjugateur"
              ? "bg-blue-800 text-white"
              : "bg-blue-700 bg-opacity-70 text-white hover:bg-blue-700 hover:bg-opacity-90"
          }`}
        >
          Quiz Conjugaison
        </button>

        <button
          onClick={() => setMode("tcf")}
          className={`rounded px-3 py-1.5 text-sm transition ${
            mode === "tcf"
              ? "bg-blue-800 text-white"
              : "bg-blue-700 bg-opacity-70 text-white hover:bg-blue-700 hover:bg-opacity-90"
          }`}
        >
          Générateur TCF
        </button>

        <button
          onClick={() => setMode("grammar")}
          className={`rounded px-3 py-1.5 text-sm transition ${
            mode === "grammar"
              ? "bg-blue-800 text-white"
              : "bg-blue-700 bg-opacity-70 text-white hover:bg-blue-700 hover:bg-opacity-90"
          }`}
        >
          Quiz Grammaire
        </button>
      </div>
    </div>
  );
}
