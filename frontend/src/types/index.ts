
export interface CompoundEntry {
  id: string;
  nickname: string;
  smiles: string;
  ic50: number;
  timestamp: number;
  structureImage?: string;
}

export interface MarvinEditorRef {
  exportStructure: (format: string) => Promise<string>;
  importStructure: (data: string, format: string) => Promise<void>;
  clear: () => void;
}
