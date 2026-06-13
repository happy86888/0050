import { Resend } from "resend";
import { formatDateTimeForEmail } from "./utils";

export type NotifySubmissionInput = {
  id: string;
  name: string;
  email: string | null;
  type: "idea" | "statement";
  message: string;
  holdingStatus: string | null;
  permissionToPublish: string | null;
  attachmentUrl: string | null;
};

export async function notifySubmission(input: NotifySubmissionInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_TO_EMAIL || "hi@buy0050.com";
  const from = process.env.RESEND_FROM_EMAIL || "buy0050 <onboarding@resend.dev>";

  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const label = input.type === "statement" ? "對帳單投稿" : "網站建議";
  const lines = [
    `類型：${label}`,
    `時間：${formatDateTimeForEmail()}`,
    `投稿 ID：${input.id}`,
    `姓名／暱稱：${input.name}`,
    `Email：${input.email || "未提供"}`,
    input.holdingStatus ? `持有狀態：${input.holdingStatus}` : null,
    input.permissionToPublish ? `公開意願：${input.permissionToPublish}` : null,
    input.attachmentUrl ? `附件：${input.attachmentUrl}` : null,
    "",
    "內容：",
    input.message,
    "",
    "審核方式：到 /admin 使用 ADMIN_TOKEN 登入後批准或刪除。"
  ].filter(Boolean);

  await resend.emails.send({
    from,
    to,
    subject: `buy0050.com 新${label}`,
    text: lines.join("\n")
  });
}
