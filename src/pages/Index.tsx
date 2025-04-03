
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import MarvinJSEditor from "@/components/MarvinJSEditor";
import Leaderboard from "@/components/Leaderboard";
import PredictionForm from "@/components/PredictionForm";
import { CompoundEntry, MarvinEditorRef } from "@/types";
import { mockLeaderboard, predictIC50 } from "@/utils/mockData";
import { Beaker, Flask, Braces, Trophy } from "lucide-react";

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
    toast.success(`Compound submitted by ${nickname}!`);
    
    // Reset after submission
    if (marvinEditorRef.current) {
      marvinEditorRef.current.clear();
    }
    setPredictedIC50(null);
    setCurrentSmiles(null);
  };
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 container cyber-grid-bg">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <Flask className="text-cyber-accent animate-pulse-glow size-8" />
          <h1 className="cyber-title text-4xl sm:text-5xl">
            CyberChem<span className="text-foreground">Lab</span>
          </h1>
          <Beaker className="text-cyber-accent animate-pulse-glow size-8" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto bg-cyber-base/50 backdrop-blur-sm px-4 py-2 rounded-md border border-cyber-accent/20">
          Design molecular compounds and predict their IC50 values in our virtual laboratory.
          <br />Compete with other scientists to create the most potent structures!
        </p>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 cyber-panel">
          <div className="flex items-center mb-4 border-b border-cyber-accent/30 pb-2">
            <Braces className="text-cyber-accent mr-2" />
            <h2 className="text-xl font-semibold">Molecular Designer</h2>
          </div>
          
          <MarvinJSEditor 
            ref={marvinEditorRef}
            onStructureChange={handleStructureChange} 
          />
          
          {currentSmiles && (
            <div className="mt-4 bg-cyber-dark/50 p-3 rounded-md border border-cyber-accent/30">
              <p className="text-sm font-semibold mb-1 text-cyber-accent">SMILES Notation:</p>
              <p className="font-mono text-xs break-all bg-cyber-dark/80 p-2 rounded">{currentSmiles}</p>
            </div>
          )}
        </div>
        
        <div className="cyber-panel space-y-6">
          <PredictionForm 
            onSubmit={handleSubmit}
            onPredict={handlePredict}
            isStructureValid={!!currentSmiles}
            predictedIC50={predictedIC50}
          />
        </div>
        
        <div className="md:col-span-3 cyber-panel">
          <div className="flex items-center mb-4 border-b border-cyber-accent/30 pb-2">
            <Trophy className="text-cyber-accent mr-2" />
            <h2 className="text-xl font-semibold">Research Leaderboard</h2>
          </div>
          <Leaderboard entries={leaderboardEntries} />
        </div>
      </main>
    </div>
  );
};

export default Index;
