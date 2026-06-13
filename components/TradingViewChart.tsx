"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => unknown;
    };
  }
}

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = "tradingview-buy0050";

  useEffect(() => {
    const renderWidget = () => {
      if (!window.TradingView || !containerRef.current) return;
      containerRef.current.innerHTML = `<div id="${widgetId}" class="tradingview-inner"></div>`;
      new window.TradingView.widget({
        autosize: true,
        symbol: "TWSE:0050",
        interval: "D",
        timezone: "Asia/Taipei",
        theme: "light",
        style: "1",
        locale: "zh_TW",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        details: true,
        calendar: false,
        support_host: "https://www.tradingview.com",
        container_id: widgetId
      });
    };

    if (window.TradingView) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = renderWidget;
    document.body.appendChild(script);
  }, []);

  return <div ref={containerRef} className="tradingview-container" aria-label="0050 即時走勢圖" />;
}
