# buy0050.com Vercel 版本

這是一個可部署到 Vercel 的 Next.js 專案，包含：

- buy0050.com 首頁
- 0050 TradingView 走勢圖
- 公開留言牆
- 網站建議投稿
- 0050 對帳單投稿與附件上傳
- 1 小時送出限制
- `/admin` 簡易審核後台
- 可選的 Resend email 通知

## 1. 建立 Supabase 專案

1. 到 Supabase 建立新 project。
2. 打開 Supabase Dashboard > SQL Editor。
3. 貼上 `supabase/schema.sql` 的內容並執行。
4. 到 Project Settings > API，複製：
   - Project URL
   - service_role key

注意：`service_role key` 是後端密鑰，只能放在 Vercel Environment Variables，不能放到前端或公開檔案。

## 2. 設定 Vercel Environment Variables

在 Vercel 專案：Settings > Environment Variables，加入：

```txt
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=statements
ADMIN_TOKEN=請換成一串很長的隨機字串
IP_HASH_SALT=請換成另一串很長的隨機字串
```

如果你要每次投稿都收到 email 通知，再加：

```txt
RESEND_API_KEY=你的 Resend API Key
RESEND_FROM_EMAIL=buy0050 <你驗證過的寄件網域 email>
NOTIFY_TO_EMAIL=hi@buy0050.com
```

如果沒有設定 Resend，投稿仍然會存在 Supabase，並可在 `/admin` 審核。

## 3. 部署到 Vercel

最簡單方式：

1. 把整個專案資料夾上傳到 GitHub repository。
2. 到 Vercel 選 New Project。
3. Import 這個 GitHub repository。
4. Framework preset 選 Next.js。
5. 加入上面的 Environment Variables。
6. Deploy。

## 4. 綁定 buy0050.com

在 Vercel 專案：Settings > Domains，加入：

```txt
buy0050.com
www.buy0050.com
```

再依照 Vercel 提供的 DNS 設定，到你的網域商後台加入對應紀錄。

## 5. 使用審核後台

部署完成後打開：

```txt
https://buy0050.com/admin
```

輸入你在 Vercel 設定的 `ADMIN_TOKEN`，即可載入待審核留言。

- 批准公開：顯示在首頁留言牆
- 拒絕：保留在資料庫，但不公開
- 刪除：從資料庫刪除；若有附件，也會嘗試從 Supabase Storage 刪除

## 6. 對帳單與個資提醒

網站已提醒使用者遮蔽姓名、身分證字號、銀行帳戶、券商帳號等資訊；但站長審核時仍建議再次確認，避免公開可識別個資。

## 7. 本機開發

```bash
npm install
cp .env.example .env.local
npm run dev
```

打開：

```txt
http://localhost:3000
```

## 8. 檔案結構

```txt
app/page.tsx                    首頁
app/admin/page.tsx              審核後台
app/api/comments/route.ts       投稿與公開留言 API
app/api/admin/comments/route.ts 管理 API
components/CommentForm.tsx      投稿表單
components/CommentWall.tsx      留言牆
components/TradingViewChart.tsx 0050 圖表
supabase/schema.sql             Supabase 資料表與 Storage bucket
```
