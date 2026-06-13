"use client";

import { useEffect, useRef } from "react";

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetHost = document.createElement("div");
    widgetHost.className = "tradingview-widget-container__widget";
    container.appendChild(widgetHost);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: "TWSE:0050",
      interval: "D",
      timezone: "Asia/Taipei",
      theme: "light",
      style: "1",
      locale: "zh_TW",
      enable_publishing: false,
      allow_symbol_change: false,
      hide_symbol_search: true,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="tradingview-widget-container tradingview-container" aria-label="TWSE:0050 元大台灣50 即時走勢圖">
      <div ref={containerRef} className="tradingview-widget-host" />
      <noscript>
        需要啟用 JavaScript 才能顯示 TradingView 圖表。你也可以打開完整圖表查看 TWSE:0050。
      </noscript>
    </div>
  );
}
