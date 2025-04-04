// src/pages/Index.tsx
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import MarvinJSEditor from "@/components/MarvinJSEditor";
import Leaderboard from "@/components/Leaderboard";
import PredictionForm from "@/components/PredictionForm";
import { CompoundEntry, MarvinEditorRef } from "@/types";
import { predictFromMol, submitToLeaderboard, getLeaderboard } from "@/lib/api";
import { Beaker, Braces, Trophy } from "lucide-react";
import atlasLogo from "./atlas.png"
import uiucLogo from "./uiuc.png"
import { config } from '../config';

const API_URL = config.api.baseUrl;

const Index = () => {
  const [currentSmiles, setCurrentSmiles] = useState<string | null>(null);
  const [predictedIC50, setPredictedIC50] = useState<number | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<CompoundEntry[]>([]);
  const marvinEditorRef = useRef<MarvinEditorRef>(null);

  // 리더보드 자동 로딩
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        if (data?.leaderboard) {
          setLeaderboardEntries(data.leaderboard);
        }
      } catch (error) {
        console.error("리더보드 불러오기 실패:", error);
      }
    };
    fetchLeaderboard();

    // Set up interval to fetch every second
    const intervalId = setInterval(fetchLeaderboard, 1000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);


  }, []);

  const handleStructureChange = async (mol: string | null) => {
    if (!mol) {
      setCurrentSmiles(null);
      return;
    }
  
    // Flask 서버로 mol 전송 → SMILES 변환 요청
    try {
      const res = await fetch(`${API_URL}/mol-to-smiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mol })
      });
  
      const result = await res.json();
  
      if (result.smiles) {
        setCurrentSmiles(result.smiles); // ✅ 실시간 SMILES 업데이트!
      } else {
        setCurrentSmiles(null);
      }
    } catch (err) {
      console.error("실시간 SMILES 변환 실패", err);
      setCurrentSmiles(null);
    }
  };
  

  const handlePredict = async () => {
    const mol = await marvinEditorRef.current?.exportStructure("mol");
  
    if (!mol) {
      toast.error("화합물을 먼저 그려주세요!");
      return 0;
    }
  
    try {
      // ✅ 백엔드에 mol과 smiles 둘 다 전송
      const response = await fetch(`${API_URL}/mol-to-smiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mol}) // ✅ 둘 다 보냄
      });
  
      const prediction = await response.json();
  
      if (!prediction || prediction.ic50 === undefined || !prediction.smiles) {
        throw new Error("예측 결과 오류");
      }
  
      setPredictedIC50(prediction.ic50);
      setCurrentSmiles(prediction.smiles); // ✅ 결과 반영
      toast.success("✅ IC50 예측 성공!");
  
      return prediction.ic50;
    } catch (error) {
      toast.error("IC50 예측 실패 😢");
      console.error("❌ 예측 에러:", error);
      return 0;
    }
  };
  
  

  const handleSubmit = async (nickname: string) => {
    console.log("🚀 제출할 데이터:", {
      nickname,
      currentSmiles,
      predictedIC50,
    });
    if (!currentSmiles || predictedIC50 === null) return;

    try {
      await submitToLeaderboard(nickname, currentSmiles, predictedIC50);

      const updated = await getLeaderboard();
      if (updated?.leaderboard) {
        setLeaderboardEntries(updated.leaderboard);
      }

      toast.success(`👏 ${nickname}'s super formula has been submitted!`);
      marvinEditorRef.current?.clear();
      setCurrentSmiles(null);
      setPredictedIC50(null);
    } catch (error) {
      console.error("제출 실패:", error);
      toast.error("제출 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 container cyber-grid-bg">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <Beaker className="text-cyber-accent animate-pulse-glow size-8" />
          <h1 className="cyber-title text-4xl sm:text-5xl">
            CyberChem<span className="text-foreground">Lab</span>
          </h1>
          <Beaker className="text-cyber-accent animate-pulse-glow size-8" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto bg-cyber-base/50 backdrop-blur-sm px-4 py-2 rounded-md border border-cyber-accent/20">
        The world is under attack by the evil MegaVirus and its nasty gang of Germinators!
          <br />Only YOU can invent the ultimate cure in our crazy chemical lab.
        </p>
      </header>

      <main className="flex flex-col gap-6">
  {/* Top row: Molecule Maker + Submission Form */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Molecule Maker (Left side - 2 columns) */}
    <div className="md:col-span-2">
      <div className="cyber-panel">
        <div className="flex items-center mb-4 border-b border-cyber-accent/30 pb-2">
          <h2 className="text-xl font-semibold">🔧 Molecule Maker 3000</h2>
        </div>

        <MarvinJSEditor
          ref={marvinEditorRef}
          onStructureChange={handleStructureChange}
        />
      </div>
    </div>

    {/* Submission Form (Right side - 1 column) */}
    <div className="md:col-span-1">
      <div className="cyber-panel h-full">
        <PredictionForm
          onSubmit={handleSubmit}
          onPredict={handlePredict}
          isStructureValid={!!currentSmiles}
          predictedIC50={predictedIC50}
        />
      </div>
    </div>
  </div>

  {/* Middle row: SMILES Notation */}
  {currentSmiles && (
    <div className="bg-cyber-dark/50 p-4 rounded-md border border-cyber-accent/30">
      <p className="text-sm font-semibold mb-1 text-cyber-accent">SMILES Notation:</p>
      <p className="font-mono text-xs break-all bg-cyber-dark/80 p-2 rounded">
        {currentSmiles}
      </p>
    </div>
  )}

  {/* Bottom row: Hero Rankings */}
  <div className="cyber-panel">
    <div className="flex items-center mb-4 border-b border-cyber-accent/30 pb-2">
      <h2 className="text-xl font-semibold">🌍 Hero Rankings</h2>
    </div>
    <Leaderboard entries={leaderboardEntries} />
  </div>

  {/* Information panel - optional */}
  <div className="cyber-panel mt-4">
    <div className="text-muted-foreground text-center">
      <p className="font-semibold text-base mb-2">MegaVirus just mutated! Your cures must be even stronger.</p>
      <p className="text-sm">Think fast, design faster and scan the formula!</p>
    </div>
  </div>
</main>



      {/* Sponsor section */}
      <footer className="mt-12 pt-10 py-4 border-t border-cyber-accent/30">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* <p className="text-sm text-muted-foreground">Sponsored by:</p> */}
          <div className="flex items-center gap-6">
            <img  
              src={atlasLogo}
              alt="atlas Logo" 
              className="h-16 w-auto object-contain"
            />
            {/* <span className="font-medium text-cyber-accent mx-2 text-3xl">   </span> */}
            <img 
              src={uiucLogo}
              alt="uiuc Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>
      </footer>


    </div>
  );
};

export default Index;
