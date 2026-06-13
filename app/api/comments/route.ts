import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "../../../lib/supabaseAdmin";
import { cleanMultiline, cleanText, getClientIp, hashIp, isValidEmail } from "../../../lib/utils";
import { notifySubmission } from "../../../lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONE_HOUR_AGO = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true, comments: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select("id, created_at, name, type, message, holding_status, permission_to_publish, attachment_url")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return jsonError("讀取留言失敗，請稍後再試。", 500);
  return NextResponse.json({ ok: true, comments: data || [] });
}

export async function POST(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return jsonError("網站尚未設定 Supabase，暫時無法送出。", 500);
  }

  const supabase = getSupabaseAdmin();
  const formData = await req.formData();

  if (cleanText(formData.get("website"), 200)) {
    return NextResponse.json({ ok: true, message: "謝謝你的來信" });
  }

  const rawType = cleanText(formData.get("type"), 30);
  const type = rawType === "statement" ? "statement" : "idea";
  const name = cleanText(formData.get("name"), 80) || "匿名朋友";
  const email = cleanText(formData.get("email"), 160) || null;
  const holdingStatus = cleanText(formData.get("holding_status"), 80) || null;
  const permissionToPublish = cleanText(formData.get("permission_to_publish"), 80) || null;
  const message = cleanMultiline(formData.get("message"), type === "statement" ? 5000 : 3000);
  const privacyConfirmed = cleanText(formData.get("privacy_confirmed"), 20);

  if (!message || message.length < 5) return jsonError("請輸入至少 5 個字的內容。");
  if (email && !isValidEmail(email)) return jsonError("Email 格式不正確。");
  if (type === "statement" && privacyConfirmed !== "yes") {
    return jsonError("請先勾選已遮蔽個資的確認欄位。");
  }

  const ip = getClientIp(req.headers);
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

  const { count, error: countError } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", ONE_HOUR_AGO());

  if (countError) return jsonError("檢查送出限制失敗，請稍後再試。", 500);
  if ((count || 0) > 0) {
    return jsonError("你已經送出過留言，請 1 小時後再試。", 429);
  }

  let attachmentUrl: string | null = null;
  let attachmentPath: string | null = null;
  const upload = formData.get("attachment");

  if (upload instanceof File && upload.size > 0) {
    if (upload.size > MAX_FILE_SIZE) return jsonError("附件請控制在 5MB 以內。");
    if (!ALLOWED_MIME_TYPES.has(upload.type)) return jsonError("附件只支援圖片或 PDF。");

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "statements";
    const safeName = upload.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "statement-upload";
    attachmentPath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await upload.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(attachmentPath, buffer, {
        contentType: upload.type,
        upsert: false
      });

    if (uploadError) return jsonError("附件上傳失敗，請稍後再試，或改用文字投稿。", 500);
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(attachmentPath);
    attachmentUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      name,
      email,
      type,
      message,
      holding_status: holdingStatus,
      permission_to_publish: permissionToPublish,
      attachment_url: attachmentUrl,
      attachment_path: attachmentPath,
      status: "pending",
      ip_hash: ipHash,
      user_agent: userAgent
    })
    .select("id")
    .single();

  if (error) return jsonError("留言儲存失敗，請稍後再試。", 500);

  try {
    await notifySubmission({
      id: data.id,
      name,
      email,
      type,
      message,
      holdingStatus,
      permissionToPublish,
      attachmentUrl
    });
  } catch {
    // Email notification is optional. The submission remains saved in Supabase.
  }

  return NextResponse.json({
    ok: true,
    message: "謝謝你的來信，我收到投稿後會先審核，通過後才會出現在留言牆。"
  });
}
