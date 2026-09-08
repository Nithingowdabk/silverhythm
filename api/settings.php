<?php
// api/settings.php - Manage key-value store for site-wide settings
require_once 'db.php';

// Security check
if (session_status() === PHP_SESSION_NONE) session_start();
$method = $_SERVER['REQUEST_METHOD'];

// Only protect write operations; allow public GET for site-wide settings (WA number, etc)
if ($method !== 'GET') {
    requireAdmin();
}

if ($method === 'GET') {
    $key = $_GET['key'] ?? '';
    if (!$key) {
        $result = $conn->query("SELECT * FROM settings");
        $settings = [];
        while ($row = $result->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        echo json_encode($settings);
    } else {
        $stmt = $conn->prepare("SELECT `setting_value` FROM settings WHERE `setting_key` = ?");
        $stmt->bind_param("s", $key);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        echo json_encode($row ? ['value' => $row['setting_value']] : ['value' => '']);
    }
}

if ($method === 'POST') {
    verifyCsrf();
    $data = json_decode(file_get_contents('php://input'), true);
    $key = $data['key'] ?? '';
    $value = $data['value'] ?? '';

    if (!$key) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Key required']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `setting_value` = ?");
    $stmt->bind_param("sss", $key, $value, $value);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}
?>
