import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { mapReport } from "@/lib/reports";
import type { ReportRow, ReportType } from "@/types/report";

const reportTypes: ReportType[] = ["emergency", "watch"];

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select("id,nickname,type,latitude,longitude,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data as ReportRow[]).map(mapReport));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const type = body.type as ReportType;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!nickname || !reportTypes.includes(type) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("reports").insert({
      nickname,
      type,
      latitude,
      longitude
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
