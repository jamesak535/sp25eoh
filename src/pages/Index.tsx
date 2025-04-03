
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import MarvinJSEditor from "@/components/MarvinJSEditor";
import Leaderboard from "@/components/Leaderboard";
import PredictionForm from "@/components/PredictionForm";
import { CompoundEntry, MarvinEditorRef } from "@/types";
import { mockLeaderboard, predictIC50 } from "@/utils/mockData";

const Index = () => {
  const [currentSmiles, setCurrentSmiles] = useState<string | null>(null);
  const [predictedIC50, setPredictedIC50] = useState<number | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<CompoundEntry[]>(mockLeaderboard);
  
  const marvinEditorRef = useRef<MarvinEditorRef>(null);
  
  const handleStructureChange = (smiles: string | null) => {
    setCurrentSmiles(smiles);
    // Reset prediction when structure changes
    setPredictedIC50(null);
  };
  
  const handlePredict = async () => {
    if (!currentSmiles) {
      toast.error("Please draw a valid chemical structure first");
      return 0;
    }
    
    try {
      const ic50Value = await predictIC50(currentSmiles);
      setPredictedIC50(ic50Value);
      return ic50Value;
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error("Failed to predict IC50 value");
      return 0;
    }
  };
  
  const handleSubmit = (nickname: string) => {
    if (!currentSmiles || predictedIC50 === null) return;
    
    const newEntry: CompoundEntry = {
      id: uuidv4(),
      nickname,
      smiles: currentSmiles,
      ic50: predictedIC50,
      timestamp: Date.now(),
    };
    
    setLeaderboardEntries([...leaderboardEntries, newEntry]);
    
    // Reset after submission
    if (marvinEditorRef.current) {
      marvinEditorRef.current.clear();
    }
    setPredictedIC50(null);
    setCurrentSmiles(null);
  };
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 container">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
          ChemDraw IC50 Predictor
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Draw a chemical compound structure and predict its IC50 value. 
          Compete with others to design the most potent compounds!
        </p>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Draw Your Compound</h2>
          <MarvinJSEditor 
            ref={marvinEditorRef}
            onStructureChange={handleStructureChange} 
          />
          
          <div className="mt-4">
            {currentSmiles && (
              <div className="bg-secondary/30 p-3 rounded-md">
                <p className="text-sm font-semibold mb-1">Current SMILES:</p>
                <p className="font-mono text-xs break-all">{currentSmiles}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <PredictionForm 
            onSubmit={handleSubmit}
            onPredict={handlePredict}
            isStructureValid={!!currentSmiles}
            predictedIC50={predictedIC50}
          />
        </div>
        
        <div className="md:col-span-3">
          <Leaderboard entries={leaderboardEntries} />
        </div>
      </main>
    </div>
  );
};

export default Index;
