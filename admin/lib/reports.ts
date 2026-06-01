import type { Report, ReportRow } from "@/types/report";

export function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    nickname: row.nickname,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at
  };
}
