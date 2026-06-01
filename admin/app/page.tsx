"use client";

import { useEffect, useMemo, useState } from "react";
import { isRealtimeConfigured, supabaseClient } from "@/lib/supabaseClient";
import { mapReport } from "@/lib/reports";
import type { Report, ReportRow, ReportType } from "@/types/report";

const typeLabels: Record<ReportType, string> = {
  emergency: "緊急通報",
  watch: "様子を見てほしい"
};

const typeClasses: Record<ReportType, string> = {
  emergency: "border-red-400/50 bg-red-500/15 text-red-100",
  watch: "border-yellow-300/50 bg-yellow-400/15 text-yellow-50"
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error ?? "通知一覧を取得できませんでした");
        }

        if (mounted) {
          setReports(json);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "通知一覧を取得できませんでした");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    const realtimeClient = supabaseClient;

    if (!realtimeClient) {
      return () => {
        mounted = false;
      };
    }

    const channel = realtimeClient
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const report = mapReport(payload.new as ReportRow);
          setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      realtimeClient.removeChannel(channel);
    };
  }, []);

  const latestEmergency = useMemo(
    () => reports.find((report) => report.type === "emergency"),
    [reports]
  );

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-glow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Night Watch Console</p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal text-white sm:text-3xl">通知管理</h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="合計" value={reports.length} />
            <Metric label="緊急" value={reports.filter((report) => report.type === "emergency").length} />
            <Metric label="見守り" value={reports.filter((report) => report.type === "watch").length} />
          </div>
        </header>

        {!isRealtimeConfigured && (
          <div className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-50">
            Supabase の公開環境変数が未設定のため、リアルタイム更新は無効です。
          </div>
        )}

        {latestEmergency && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-100">最新の緊急通報</p>
            <p className="mt-1 text-lg font-bold text-white">
              {latestEmergency.nickname} / {formatTime(latestEmergency.createdAt)}
            </p>
          </div>
        )}

        <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/65 shadow-glow">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-base font-semibold">通知一覧</h2>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
              Realtime
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-slate-300">読み込み中</div>
          ) : error ? (
            <div className="px-4 py-10 text-center text-red-100">{error}</div>
          ) : reports.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-300">通知はまだありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-300">
                  <tr>
                    <Th>ニックネーム</Th>
                    <Th>種別</Th>
                    <Th>発生時刻</Th>
                    <Th>緯度</Th>
                    <Th>経度</Th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-t border-white/10">
                      <Td>{report.nickname}</Td>
                      <Td>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${typeClasses[report.type]}`}>
                          {typeLabels[report.type]}
                        </span>
                      </Td>
                      <Td>{formatTime(report.createdAt)}</Td>
                      <Td>{report.latitude.toFixed(5)}</Td>
                      <Td>{report.longitude.toFixed(5)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-slate-100">{children}</td>;
}
