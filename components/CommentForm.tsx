"use client";

import { FormEvent, useRef, useState } from "react";

type CommentFormProps = {
  type: "idea" | "statement";
};

const oneHour = 60 * 60 * 1000;

export default function CommentForm({ type }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const isStatement = type === "statement";
  const cooldownKey = isStatement ? "buy0050-last-statement-submit" : "buy0050-last-idea-submit";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || busy) return;

    const lastSubmitAt = Number(localStorage.getItem(cooldownKey) || 0);
    const now = Date.now();

    if (now - lastSubmitAt < oneHour) {
      const minutesLeft = Math.ceil((oneHour - (now - lastSubmitAt)) / 60000);
      setStatus(`你已經送出過，請約 ${minutesLeft} 分鐘後再試。`);
      return;
    }

    const formData = new FormData(formRef.current);
    formData.set("type", type);
    setBusy(true);
    setStatus("送出中...");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setStatus(result.message || "送出失敗，請稍後再試。");
        return;
      }

      localStorage.setItem(cooldownKey, String(now));
      formRef.current.reset();
      setStatus(result.message || "謝謝你的來信");
    } catch {
      setStatus("送出失敗，請稍後再試，或直接寄信到 hi@buy0050.com。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="form-card" onSubmit={onSubmit}>
      <input type="hidden" name="type" value={type} />
      <label className="hidden-field" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label>
        你的名字／暱稱
        <input name="name" type="text" maxLength={80} placeholder="例如：匿名存股族、Brian" required />
      </label>

      <label>
        Email（選填，方便我回覆）
        <input name="email" type="email" maxLength={160} placeholder="you@example.com" />
      </label>

      {isStatement ? (
        <>
          <div className="form-grid two">
            <label>
              目前持有狀態
              <select name="holding_status" required defaultValue="">
                <option value="" disabled>請選擇</option>
                <option value="已持有 0050">已持有 0050</option>
                <option value="曾經持有 0050">曾經持有 0050</option>
                <option value="正在觀望 0050">正在觀望 0050</option>
                <option value="其他">其他</option>
              </select>
            </label>
            <label>
              是否同意匿名公開？
              <select name="permission_to_publish" required defaultValue="">
                <option value="" disabled>請選擇</option>
                <option value="可以匿名公開">可以匿名公開</option>
                <option value="只給站長看，不要公開">只給站長看，不要公開</option>
              </select>
            </label>
          </div>
          <label>
            對帳單重點或故事
            <textarea name="message" rows={7} maxLength={5000} placeholder="例如：持有多久、買進方式、成本、感想、想給新手的提醒。請不要貼未遮蔽的個資。" required />
          </label>
          <label>
            上傳截圖或 PDF（選填，5MB 以內）
            <input name="attachment" type="file" accept="image/*,.pdf" />
            <span className="field-note">建議先遮蔽姓名、帳號、身分證字號、銀行帳戶等可識別個資。</span>
          </label>
          <label className="check-label">
            <input type="checkbox" name="privacy_confirmed" value="yes" required />
            <span>我確認已盡量遮蔽個資，且知道本站不是投資建議或官方金融服務。</span>
          </label>
        </>
      ) : (
        <label>
          你的建議
          <textarea name="message" rows={7} maxLength={3000} placeholder="我覺得 buy0050.com 可以做成……" required />
        </label>
      )}

      <button type="submit" disabled={busy}>{busy ? "送出中..." : isStatement ? "送出對帳單" : "送出建議"}</button>
      <p className="form-status" role="status" aria-live="polite">{status}</p>
      <p className="form-note">送出後會先進入審核；通過後才會出現在公開留言牆。同一個瀏覽器與同一個 IP 1 小時只能送一次。</p>
    </form>
  );
}
