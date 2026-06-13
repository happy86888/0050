import CommentForm from "../components/CommentForm";
import CommentWall from "../components/CommentWall";
import TradingViewChart from "../components/TradingViewChart";
import { getSupabaseAdmin, hasSupabaseConfig } from "../lib/supabaseAdmin";
import type { PublicComment } from "../lib/types";

export const dynamic = "force-dynamic";

async function getApprovedComments(): Promise<PublicComment[]> {
  if (!hasSupabaseConfig()) return [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("comments")
      .select("id, created_at, name, type, message, holding_status, permission_to_publish, attachment_url")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return (data || []) as PublicComment[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const comments = await getApprovedComments();

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="badge">New domain idea wanted</div>
        <p className="eyebrow">我買了一個網址</p>
        <h1 id="hero-title">buy0050.com</h1>
        <p className="lead">
          目前還沒有很好的點子。這個網站到底可以拿來做什麼？如果你有想法、靈感、吐槽、商業建議，或想分享自己的 0050 對帳單故事，歡迎留言告訴我。
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#idea-form">留下建議</a>
          <a className="button secondary" href="#statement-form">貼對帳單</a>
          <a className="button secondary" href="#wall">看留言牆</a>
          <a className="button secondary" href="mailto:hi@buy0050.com?subject=給 buy0050.com 的網站建議">聯絡管理員</a>
        </div>
      </section>

      <section className="chart-section" aria-labelledby="chart-title">
        <div className="section-head split-head">
          <div>
            <p className="section-kicker">0050 走勢</p>
            <h2 id="chart-title">0050 即時走勢</h2>
          </div>
          <a className="small-link" href="https://tw.tradingview.com/symbols/TWSE-0050/" target="_blank" rel="noopener noreferrer">打開完整圖表</a>
        </div>
        <p className="section-intro">
          下方圖表使用 TradingView 顯示 TWSE:0050。行情即時或延遲狀況依 TradingView 與交易所資料源為準。
        </p>
        <div className="chart-card">
          <TradingViewChart />
        </div>
        <p className="disclaimer">提醒：本站不是金融商品或機構的官方網站，圖表僅供參考，不構成投資建議。</p>
      </section>

      <section className="idea-panel" aria-labelledby="idea-title">
        <div>
          <p className="section-kicker">可能的方向</p>
          <h2 id="idea-title">這個網站可以變成什麼？</h2>
        </div>
        <div className="idea-grid">
          <article className="idea-card">
            <span>01</span>
            <h3>0050 資訊整理站</h3>
            <p>整理和 0050 相關的常見問題、文章、工具與資料來源。</p>
          </article>
          <article className="idea-card">
            <span>02</span>
            <h3>投資工具小網站</h3>
            <p>做成定期定額試算、殖利率紀錄、費用比較或投資筆記工具。</p>
          </article>
          <article className="idea-card">
            <span>03</span>
            <h3>對帳單分享牆</h3>
            <p>收集大家匿名分享的 0050 對帳單，再整理成故事或統計資料。</p>
          </article>
          <article className="idea-card">
            <span>04</span>
            <h3>品牌或專案入口</h3>
            <p>未來可以變成電子報、社群、課程、工具或內容專案的首頁。</p>
          </article>
        </div>
        <p className="disclaimer">註：本站目前只是點子募集與投稿頁，不是任何金融商品或機構的官方網站，也不提供投資建議。</p>
      </section>

      <section className="wall-section" id="wall" aria-labelledby="wall-title">
        <div className="section-head split-head">
          <div>
            <p className="section-kicker">公開留言牆</p>
            <h2 id="wall-title">大家給 buy0050.com 的建議</h2>
          </div>
          <a className="small-link" href="#idea-form">也來留一則</a>
        </div>
        <CommentWall comments={comments} />
      </section>

      <section className="form-section" id="statement-form" aria-labelledby="statement-title">
        <div className="form-copy">
          <p className="section-kicker">對帳單投稿</p>
          <h2 id="statement-title">貼上你的 0050 對帳單</h2>
          <p>可以貼上文字、摘要或上傳截圖／PDF。請先遮蔽姓名、帳號、身分證字號、銀行帳戶與任何可識別個資。</p>
          <div className="privacy-box">
            <strong>公開規則</strong>
            <p>投稿會先進後台審核；只有你批准後，才會顯示在公開留言牆。</p>
          </div>
        </div>
        <CommentForm type="statement" />
      </section>

      <section className="form-section" id="idea-form" aria-labelledby="form-title">
        <div className="form-copy">
          <p className="section-kicker">留言給我</p>
          <h2 id="form-title">你覺得 buy0050.com 可以做什麼？</h2>
          <p>留下你的想法。送出後會先進審核；批准後會出現在留言牆。也可以聯絡管理員：<a href="mailto:hi@buy0050.com">hi@buy0050.com</a>。</p>
        </div>
        <CommentForm type="idea" />
      </section>
    </main>
  );
}
