
export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

export interface AIInsight {
  summary: string;
  suggestions: string[];
}
