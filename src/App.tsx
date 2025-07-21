import { useState } from "react";
import ConjugateurScreen from "./screens/ConjugateurScreen";
import TCFScreen from "./screens/TCFScreen";

export default function App() {
  const [showTCFScreen, setShowTCFScreen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full space-y-6">
        {showTCFScreen ? <TCFScreen /> : <ConjugateurScreen />}
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowTCFScreen((v) => !v)}
          className="rounded bg-blue-700 bg-opacity-70 px-3 py-1.5 text-sm text-white hover:bg-blue-700 hover:bg-opacity-90 transition"
        >
          {showTCFScreen ? "Revenir au quiz" : "Aller au générateur TCF"}
        </button>
      </div>
    </div>
  );
}
