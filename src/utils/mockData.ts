
import { CompoundEntry } from "@/types";

export const mockLeaderboard: CompoundEntry[] = [
  {
    id: "1",
    nickname: "ChemWhiz",
    smiles: "CCO",
    ic50: 0.23,
    timestamp: Date.now() - 1000000,
  },
  {
    id: "2",
    nickname: "MolecularMaster",
    smiles: "CC(=O)OC1=CC=CC=C1C(=O)O",
    ic50: 0.45,
    timestamp: Date.now() - 2000000,
  },
  {
    id: "3",
    nickname: "DrugDesigner",
    smiles: "C1=CC=C2C(=C1)C(=CN2)CCN3CCN(CC3)C4=CC=C(C=C4)C(=O)NS(=O)(=O)C5=CC=C(C=C5)N",
    ic50: 1.2,
    timestamp: Date.now() - 3000000,
  },
  {
    id: "4",
    nickname: "BioChemPro",
    smiles: "COC1=C(C=C(C=C1)CC(=O)N)OC",
    ic50: 2.5,
    timestamp: Date.now() - 4000000,
  },
  {
    id: "5",
    nickname: "SynthWizard",
    smiles: "CC1=C(C(=CC=C1)C)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C",
    ic50: 5.7,
    timestamp: Date.now() - 5000000,
  },
];

// Mock function to predict IC50 value (randomly for demo)
export const predictIC50 = async (smiles: string): Promise<number> => {
  // In a real app, this would call an API with ML model
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  return parseFloat((Math.random() * 10).toFixed(2));
};
