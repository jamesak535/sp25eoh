// src/lib/api.ts
import { config } from '../config';

const API_URL = config.api.baseUrl;

export async function predictFromMol(mol: string) {
  const res = await fetch(`${API_URL}/mol-to-smiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mol }),
  });
  return await res.json();
}

export async function submitToLeaderboard(nickname: string, smiles: string, ic50: number) {
  const res = await fetch(`${API_URL}/submit-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, smiles, ic50 }),
  });
  return await res.json();
}
// 127.0.0.1
export async function getLeaderboard() {
  const res = await fetch(`${API_URL}/leaderboard`);
  return await res.json();
}
