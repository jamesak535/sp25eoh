import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PredictionFormProps {
  onSubmit: (nickname: string) => void;
  onPredict: () => Promise<number>;
  isStructureValid: boolean;
  predictedIC50: number | null;
}

const PredictionForm = ({
  onSubmit,
  onPredict,
  isStructureValid,
  predictedIC50,
}: PredictionFormProps) => {
  const [nickname, setNickname] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);

  const handlePredict = async () => {
    if (!isStructureValid) {
      toast.error("Please draw a valid chemical structure first");
      return;
    }

    try {
      setIsPredicting(true);
      await onPredict();
      toast.success("🔬 Cure Scan Complete");
    } catch (error) {
      toast.error("Failed to predict IC50 value");
      console.error(error);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    if (!isStructureValid) {
      toast.error("Please draw a valid chemical structure first");
      return;
    }

    if (predictedIC50 === null) {
      toast.error("Please predict the IC50 value first");
      return;
    }

    onSubmit(nickname);
    setNickname("");
    toast.success("Compound submitted to leaderboard!");
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl">✨ Submit Your Super Formula</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="nickname">🧙 Hero Alias</Label>
            <Input
              id="nickname"
              placeholder="Enter your hero name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Smaller Score, Stronger Cure!</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePredict}
                disabled={!isStructureValid || isPredicting}
                className="flex-1"
                style={{
                  position: "relative",
                  zIndex: 10,           // ✅ 버튼을 위로!
                  pointerEvents: "auto"
                }}
              >
                {isPredicting ? "Predicting..." : "🔮 Scan Cure Power"}
              </Button>

              <div className="flex items-center justify-center flex-1 h-10 px-3 bg-muted rounded-md font-mono">
                {predictedIC50 !== null ? `${predictedIC50.toFixed(1)} μM` : "-- μM"}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          type="submit"
          onClick={handleSubmit}
          disabled={!isStructureValid || predictedIC50 === null}
        >
          🚀 Join the Hero Rankings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PredictionForm;
