import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: NextRequest) {
  const expected = process.env.ADMIN_TOKEN;
  const provided = req.headers.get("x-admin-token") || "";
  return Boolean(expected && provided && expected === provided);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) return jsonError("沒有管理權限。", 401);
  if (!hasSupabaseConfig()) return jsonError("尚未設定 Supabase。", 500);

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const { data, error } = await supabase
    .from("comments")
    .select("id, created_at, name, email, type, message, holding_status, permission_to_publish, attachment_url, attachment_path, status, ip_hash, user_agent")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return jsonError("讀取管理資料失敗。", 500);
  return NextResponse.json({ ok: true, comments: data || [] });
}

export async function PATCH(req: NextRequest) {
  if (!authorize(req)) return jsonError("沒有管理權限。", 401);
  if (!hasSupabaseConfig()) return jsonError("尚未設定 Supabase。", 500);

  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => null) as { id?: string; action?: string } | null;
  if (!body?.id || !body?.action) return jsonError("缺少 id 或 action。");

  if (body.action === "approve" || body.action === "reject") {
    const nextStatus = body.action === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("comments")
      .update({ status: nextStatus })
      .eq("id", body.id);

    if (error) return jsonError("更新失敗。", 500);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "statements";
    const { data: comment } = await supabase
      .from("comments")
      .select("attachment_path")
      .eq("id", body.id)
      .single();

    if (comment?.attachment_path) {
      await supabase.storage.from(bucket).remove([comment.attachment_path]);
    }

    const { error } = await supabase.from("comments").delete().eq("id", body.id);
    if (error) return jsonError("刪除失敗。", 500);
    return NextResponse.json({ ok: true });
  }

  return jsonError("未知操作。");
}
