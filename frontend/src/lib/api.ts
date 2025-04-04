// src/lib/api.ts

export async function predictFromMol(mol: string) {
  const res = await fetch("http://10.195.29.214:5001/mol-to-smiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mol }),
  });
  return await res.json();
}

export async function submitToLeaderboard(nickname: string, smiles: string, ic50: number) {
  const res = await fetch("http://10.195.29.214:5001/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, smiles, ic50 }),
  });
  return await res.json();
}
// 127.0.0.1
export async function getLeaderboard() {
  const res = await fetch("http://10.195.29.214:5001/leaderboard");
  return await res.json();
}
