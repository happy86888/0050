<?php
// buy0050.com contact form endpoint
// Requirements: PHP hosting with mail() enabled, or SMTP mail configured by the host.

header('Content-Type: application/json; charset=utf-8');

const RECIPIENT_EMAIL = 'hi@buy0050.com';
const SITE_EMAIL = 'noreply@buy0050.com';
const RATE_LIMIT_SECONDS = 3600;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 3000;

function json_response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_text(string $value, int $maxLength): string {
    $value = trim($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }
    return substr($value, 0, $maxLength);
}

function get_client_ip(): string {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'message' => '不支援的請求方式。']);
}

// Simple honeypot field. Real visitors will not fill this.
$website = clean_text($_POST['website'] ?? '', 120);
if ($website !== '') {
    json_response(200, ['ok' => true, 'message' => '謝謝你的來信']);
}

$name = clean_text($_POST['name'] ?? '', MAX_NAME_LENGTH);
$email = clean_text($_POST['email'] ?? '', MAX_EMAIL_LENGTH);
$message = clean_text($_POST['message'] ?? '', MAX_MESSAGE_LENGTH);

if ($name === '' || $message === '') {
    json_response(422, ['ok' => false, 'message' => '請填寫名字和留言內容。']);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['ok' => false, 'message' => 'Email 格式看起來不正確。']);
}

$ip = get_client_ip();
$rateDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'buy0050_rate_limit';
if (!is_dir($rateDir)) {
    mkdir($rateDir, 0700, true);
}

$rateKey = hash('sha256', $ip);
$rateFile = $rateDir . DIRECTORY_SEPARATOR . $rateKey . '.txt';
$now = time();

if (is_file($rateFile)) {
    $lastSentAt = (int)trim((string)file_get_contents($rateFile));
    if ($lastSentAt > 0 && ($now - $lastSentAt) < RATE_LIMIT_SECONDS) {
        $remaining = RATE_LIMIT_SECONDS - ($now - $lastSentAt);
        $minutes = max(1, (int)ceil($remaining / 60));
        json_response(429, [
            'ok' => false,
            'message' => '你已經送出過留言，請約 ' . $minutes . ' 分鐘後再試。'
        ]);
    }
}

$subject = 'buy0050.com 新留言';
$bodyLines = [
    'buy0050.com 收到一則新留言',
    '',
    '名字／暱稱：' . $name,
    'Email：' . ($email !== '' ? $email : '未提供'),
    'IP：' . $ip,
    '時間：' . date('Y-m-d H:i:s O'),
    '',
    '留言內容：',
    $message,
];
$body = implode("\n", $bodyLines);

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: buy0050.com <' . SITE_EMAIL . '>';
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
} else {
    $headers[] = 'Reply-To: ' . SITE_EMAIL;
}
$headers[] = 'X-Mailer: PHP/' . phpversion();

$encodedSubject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
    : '=?UTF-8?B?' . base64_encode($subject) . '?=';

$sent = @mail(RECIPIENT_EMAIL, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    json_response(500, [
        'ok' => false,
        'message' => '目前主機無法寄信，請稍後再試或直接寄到 hi@buy0050.com。'
    ]);
}

file_put_contents($rateFile, (string)$now, LOCK_EX);
json_response(200, ['ok' => true, 'message' => '謝謝你的來信']);
