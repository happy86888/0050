buy0050.com 網站上傳說明

這版已經移除 FormSubmit，改成自己的 contact.php 收信端。

檔案：
- index.html：首頁與留言表單
- styles.css：樣式
- contact.php：寄信與 1 小時限制
- thanks.html：備用感謝頁

上傳方式：
1. 把整包檔案上傳到 buy0050.com 的網站根目錄。
2. 主機必須支援 PHP，且 mail() 必須可正常寄信。
3. 表單成功送出後，頁面會直接顯示「謝謝你的來信」。
4. 每個 IP 1 小時只能送出一次；前端 localStorage 會先擋一次，後端 contact.php 也會再擋一次。

重要：
如果主機沒有啟用 PHP mail()，表單會顯示「目前主機無法寄信」。這不是網站前端問題，而是主機寄信設定問題。若要提高收信穩定度，建議改成 SMTP、Cloudflare Worker + Resend、或主機商提供的 SMTP。
