export type ReportType = "emergency" | "watch";

export interface Report {
  id: string;
  nickname: string;
  type: ReportType;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface ReportRow {
  id: string;
  nickname: string;
  type: ReportType;
  latitude: number;
  longitude: number;
  created_at: string;
}
