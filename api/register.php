<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['success' => false, 'message' => 'Ta metoda nie jest obsługiwana.']);
}

if (!empty($_POST['website'] ?? '')) {
    respond(200, ['success' => true, 'emailSent' => true]);
}

$clean = static function (string $value, int $maxLength): string {
    $value = trim(str_replace(["\r", "\n"], ' ', $value));
    return mb_substr($value, 0, $maxLength, 'UTF-8');
};

$firstName = $clean((string)($_POST['firstName'] ?? ''), 80);
$lastName = $clean((string)($_POST['lastName'] ?? ''), 100);
$email = filter_var(trim((string)($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$organization = $clean((string)($_POST['organization'] ?? ''), 180);

$errors = [];
if (mb_strlen($firstName, 'UTF-8') < 2) $errors['firstName'] = 'Wpisz poprawne imię.';
if (mb_strlen($lastName, 'UTF-8') < 2) $errors['lastName'] = 'Wpisz poprawne nazwisko.';
if ($email === false) $errors['email'] = 'Wpisz poprawny adres e-mail.';
if ($errors) respond(422, ['success' => false, 'message' => 'Sprawdź dane w formularzu.', 'errors' => $errors]);

$dataDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0750, true) && !is_dir($dataDirectory)) {
    respond(500, ['success' => false, 'message' => 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie później.']);
}

$csvPath = $dataDirectory . DIRECTORY_SEPARATOR . 'registrations.csv';
$isNew = !file_exists($csvPath);
$handle = fopen($csvPath, 'ab');
if ($handle === false || !flock($handle, LOCK_EX)) {
    if (is_resource($handle)) fclose($handle);
    respond(500, ['success' => false, 'message' => 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie później.']);
}
if ($isNew) fputcsv($handle, ['date', 'first_name', 'last_name', 'email', 'organization'], ';');
fputcsv($handle, [date('c'), $firstName, $lastName, $email, $organization], ';');
flock($handle, LOCK_UN);
fclose($handle);

$host = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'kuzniamlodych.pl')) ?: 'kuzniamlodych.pl';
$host = preg_replace('/:\d+$/', '', $host);
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl = $scheme . '://' . $host . rtrim(dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/api/register.php'), 2), '/\\') . '/';
$calendarUrl = $baseUrl . 'wydarzenie.ics';
$googleCalendar = 'https://calendar.google.com/calendar/render?' . http_build_query([
    'action' => 'TEMPLATE',
    'text' => 'Śląska Kuźnia Młodych Przedsiębiorców',
    'dates' => '20260925T130000Z/20260925T180000Z',
    'location' => 'D9 Space, Katowice',
    'details' => 'Praktyczne wydarzenie dla młodych przedsiębiorców. ' . $baseUrl,
]);

$safeName = htmlspecialchars($firstName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$subject = '=?UTF-8?B?' . base64_encode('Potwierdzenie zapisu — Śląska Kuźnia Młodych Przedsiębiorców') . '?=';
$message = '<!doctype html><html lang="pl"><body style="margin:0;background:#f2eee7;font-family:Arial,sans-serif;color:#11100f">'
    . '<div style="max-width:640px;margin:0 auto;padding:40px 24px"><div style="background:#11100f;color:#fff;padding:34px;border-radius:18px 18px 0 0">'
    . '<div style="color:#ff5c1b;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Zapis potwierdzony</div>'
    . '<h1 style="font-size:32px;line-height:1.05;margin:18px 0 0">Do zobaczenia,<br>' . $safeName . '!</h1></div>'
    . '<div style="background:#fff;padding:34px;border-radius:0 0 18px 18px"><p style="font-size:17px;line-height:1.6">Dziękujemy za zapis na <strong>Śląską Kuźnię Młodych Przedsiębiorców</strong>.</p>'
    . '<table style="width:100%;border-collapse:collapse;margin:28px 0"><tr><td style="padding:12px 0;border-top:1px solid #ddd;color:#777">Data</td><td style="padding:12px 0;border-top:1px solid #ddd;font-weight:bold">25 września 2026</td></tr>'
    . '<tr><td style="padding:12px 0;border-top:1px solid #ddd;color:#777">Godziny</td><td style="padding:12px 0;border-top:1px solid #ddd;font-weight:bold">15:00–20:00</td></tr>'
    . '<tr><td style="padding:12px 0;border-top:1px solid #ddd;color:#777">Miejsce</td><td style="padding:12px 0;border-top:1px solid #ddd;font-weight:bold">D9 Space, Katowice</td></tr></table>'
    . '<p><a href="' . htmlspecialchars($googleCalendar, ENT_QUOTES) . '" style="display:inline-block;background:#ff5c1b;color:#11100f;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:999px">Dodaj do Google Calendar</a></p>'
    . '<p style="font-size:13px;color:#666">Apple lub Outlook: <a href="' . htmlspecialchars($calendarUrl, ENT_QUOTES) . '">pobierz plik kalendarza</a>.</p>'
    . '<p style="font-size:13px;color:#666;margin-top:32px">Podstawowe informacje organizacyjne i aktualności znajdziesz na <a href="' . htmlspecialchars($baseUrl, ENT_QUOTES) . '">stronie wydarzenia</a>.</p></div></div></body></html>';

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: Śląska Kuźnia Młodych Przedsiębiorców <no-reply@' . $host . '>',
    'Reply-To: no-reply@' . $host,
];
$mailSent = @mail((string)$email, $subject, $message, implode("\r\n", $headers));

/* Wpisz docelowy adres, jeśli organizator ma otrzymywać kopie zgłoszeń. */
$organizerEmail = '';
if ($organizerEmail !== '' && filter_var($organizerEmail, FILTER_VALIDATE_EMAIL)) {
    @mail($organizerEmail, 'Nowy zapis — Śląska Kuźnia Młodych Przedsiębiorców', "Nowy uczestnik: {$firstName} {$lastName}\nE-mail: {$email}\nOrganizacja: {$organization}", 'From: no-reply@' . $host);
}

respond(200, ['success' => true, 'emailSent' => $mailSent]);

