export interface ResultEntry {
  position: number;
  name: string;
  time?: string;
  team?: string;
  category?: string;
  [key: string]: string | number | undefined;
}

export interface CyclingResult {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  results: ResultEntry[];
  sourceType: 'excel' | 'google_sheets';
  googleSheetUrl?: string;
}

export interface CreateResultInput {
  title: string;
  results: ResultEntry[];
  sourceType: 'excel' | 'google_sheets';
  googleSheetUrl?: string;
}

export interface UpdateResultInput {
  title?: string;
  results?: ResultEntry[];
  googleSheetUrl?: string;
}
