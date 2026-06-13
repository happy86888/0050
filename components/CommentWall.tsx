import type { PublicComment } from "../lib/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export default function CommentWall({ comments }: { comments: PublicComment[] }) {
  if (!comments.length) {
    return (
      <div className="empty-wall">
        <h3>留言牆還在等第一則公開留言</h3>
        <p>投稿送出後會先進審核區；站長批准後，才會顯示在這裡。</p>
      </div>
    );
  }

  return (
    <div className="wall-grid">
      {comments.map((comment) => (
        <article className="wall-card" key={comment.id}>
          <div className="wall-card-head">
            <span className={`pill ${comment.type}`}>{comment.type === "statement" ? "對帳單" : "建議"}</span>
            <time>{formatDate(comment.created_at)}</time>
          </div>
          <h3>{comment.name || "匿名朋友"}</h3>
          {comment.holding_status ? <p className="meta-line">{comment.holding_status}</p> : null}
          <p className="wall-message">{comment.message}</p>
          {comment.type === "statement" && comment.attachment_url ? (
            <a className="attachment-link" href={comment.attachment_url} target="_blank" rel="noopener noreferrer">
              查看對帳單附件
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}
