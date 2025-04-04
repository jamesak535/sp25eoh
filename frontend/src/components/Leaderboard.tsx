
import { useEffect, useState } from "react";
import { CompoundEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


interface LeaderboardProps {
  entries: CompoundEntry[];
}

const Leaderboard = ({ entries }: LeaderboardProps) => {  
  const [expandedSmiles, setExpandedSmiles] = useState<string | null>(null);
  useEffect(() => {
    console.log("🔍 entries 확인:", entries);
  }, [entries]);
  
  // Sort by IC50 value (ascending - lower is better)
  const sortedEntries = [...entries].sort((a, b) => a.ic50 - b.ic50);

  const toggleExpand = (id: string) => {
    setExpandedSmiles(expandedSmiles === id ? null : id);
  };
  
  const formatSmiles = (smiles: string, id: string) => {
    const isExpanded = expandedSmiles === id;
    if (smiles.length <= 20 || isExpanded) return smiles;
    return smiles.substring(0, 20) + "...";
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Leaderboard</span>
          <Badge variant="outline" className="font-normal">
            {entries.length} Heros Ready
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead className="w-40 overflow-hidden whitespace-nowrap">Hero name</TableHead>
              <TableHead className="pl-6">SMILES</TableHead>
              <TableHead className="text-right">Cure Power (μM)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
  {sortedEntries.map((entry, index) => (
    <TableRow key={entry.id}>
      <TableCell className="font-medium text-center">
        {index === 0 ? (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-base px-3 py -1">🥇</Badge>
        ) : index === 1 ? (
          <Badge className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-base px-3 py -1">🥈</Badge>
        ) : index === 2 ? (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-base px-3 py -1">🥉</Badge>
        ) : (
          <span>{index + 1}</span>
        )}
      </TableCell>
      <TableCell>{entry.nickname}</TableCell>
      <TableCell className="max-w-[200px] break-words pl-6">
        <span className="font-mono text-xs">{entry.smiles}</span>
      </TableCell>
      <TableCell className="text-right font-mono">
        {entry.ic50.toFixed(5)}
      </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
