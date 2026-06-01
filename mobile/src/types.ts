export type ReportType = "emergency" | "watch";

export interface ReportRequest {
  nickname: string;
  type: ReportType;
  latitude: number;
  longitude: number;
}
