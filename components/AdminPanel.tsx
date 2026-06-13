"use client";

import { useEffect, useState } from "react";
import type { AdminComment, CommentStatus } from "../lib/types";

type StatusFilter = Extract<CommentStatus, "pending" | "approved" | "rejected">;

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("buy0050-admin-token") || "";
    setToken(saved);
  }, []);

  async function loadComments(nextStatus = status, nextToken = token) {
    if (!nextToken) {
      setMessage("請先輸入 ADMIN_TOKEN。");
      return;
    }
    setBusy(true);
    setMessage("讀取中...");
    try {
      const response = await fetch(`/api/admin/comments?status=${nextStatus}`, {
        headers: { "x-admin-token": nextToken }
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(result.message || "讀取失敗。");
        return;
      }
      localStorage.setItem("buy0050-admin-token", nextToken);
      setComments(result.comments || []);
      setMessage(`已載入 ${result.comments?.length || 0} 筆資料。`);
    } catch {
      setMessage("讀取失敗，請確認 Vercel 環境變數與 Supabase 設定。");
    } finally {
      setBusy(false);
    }
  }

  async function updateComment(id: string, action: "approve" | "reject" | "delete") {
    if (!token) return;
    const label = action === "approve" ? "批准" : action === "reject" ? "拒絕" : "刪除";
    if (action === "delete" && !confirm("確定要永久刪除這則投稿嗎？")) return;
    setBusy(true);
    setMessage(`${label}中...`);
    try {
      const response = await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ id, action })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(result.message || `${label}失敗。`);
        return;
      }
      setComments((current) => current.filter((item) => item.id !== id));
      setMessage(`${label}完成。`);
    } catch {
      setMessage(`${label}失敗。`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell admin-shell">
      <section className="hero compact">
        <p className="eyebrow">buy0050.com</p>
        <h1>投稿審核後台</h1>
        <p className="lead">輸入 Vercel 環境變數裡的 ADMIN_TOKEN，即可批准、拒絕或刪除投稿。</p>
      </section>

      <section className="admin-controls">
        <label>
          ADMIN_TOKEN
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="貼上你的管理 token"
          />
        </label>
        <label>
          狀態
          <select
            value={status}
            onChange={(event) => {
              const nextStatus = event.target.value as StatusFilter;
              setStatus(nextStatus);
              loadComments(nextStatus, token);
            }}
          >
            <option value="pending">待審核</option>
            <option value="approved">已公開</option>
            <option value="rejected">已拒絕</option>
          </select>
        </label>
        <button onClick={() => loadComments(status, token)} disabled={busy}>載入投稿</button>
        <p className="form-status">{message}</p>
      </section>

      <section className="admin-list">
        {comments.map((comment) => (
          <article className="admin-card" key={comment.id}>
            <div className="wall-card-head">
              <span className={`pill ${comment.type}`}>{comment.type === "statement" ? "對帳單" : "建議"}</span>
              <time>{formatDate(comment.created_at)}</time>
            </div>
            <h2>{comment.name || "匿名朋友"}</h2>
            <p className="meta-line">Email：{comment.email || "未提供"}</p>
            {comment.holding_status ? <p className="meta-line">持有狀態：{comment.holding_status}</p> : null}
            {comment.permission_to_publish ? <p className="meta-line">公開意願：{comment.permission_to_publish}</p> : null}
            <p className="wall-message">{comment.message}</p>
            {comment.attachment_url ? (
              <a className="attachment-link" href={comment.attachment_url} target="_blank" rel="noopener noreferrer">查看附件</a>
            ) : null}
            <div className="admin-actions">
              {comment.status !== "approved" ? <button onClick={() => updateComment(comment.id, "approve")} disabled={busy}>批准公開</button> : null}
              {comment.status !== "rejected" ? <button className="secondary-action" onClick={() => updateComment(comment.id, "reject")} disabled={busy}>拒絕</button> : null}
              <button className="danger-action" onClick={() => updateComment(comment.id, "delete")} disabled={busy}>刪除</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
