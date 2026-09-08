<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json; charset=UTF-8");

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://silverhythm.com', 'http://localhost', 'http://localhost:8080', 'http://127.0.0.1:8080'];
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://silverhythm.com");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'db.php';

$conn->query("CREATE TABLE IF NOT EXISTS brand_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50) NOT NULL DEFAULT 'all',
    title VARCHAR(255) DEFAULT NULL,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $brand = isset($_GET['brand']) ? trim($_GET['brand']) : 'all';
    if ($brand !== 'all') {
        $stmt = $conn->prepare("SELECT * FROM brand_videos WHERE (brand = ? OR brand = 'all') AND is_active = 1 ORDER BY sort_order ASC, id DESC");
        $stmt->bind_param("s", $brand);
    } else {
        $stmt = $conn->prepare("SELECT * FROM brand_videos WHERE is_active = 1 ORDER BY sort_order ASC, id DESC");
    }
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

requireAdmin();

if ($method === 'POST') {
    verifyCsrf();
    $data = json_decode(file_get_contents('php://input'), true);
    $brand = trim($data['brand'] ?? 'all');
    $title = trim($data['title'] ?? '');
    $video_url = trim($data['video_url'] ?? '');
    $thumbnail_url = trim($data['thumbnail_url'] ?? '');
    $sort_order = (int)($data['sort_order'] ?? 0);
    if (!$video_url) { http_response_code(400); echo json_encode(['error' => 'video_url required']); exit; }
    $stmt = $conn->prepare("INSERT INTO brand_videos (brand, title, video_url, thumbnail_url, sort_order) VALUES (?,?,?,?,?)");
    $stmt->bind_param("ssssi", $brand, $title, $video_url, $thumbnail_url, $sort_order);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    exit;
}

if ($method === 'PUT') {
    verifyCsrf();
    $data = json_decode(file_get_contents('php://input'), true);
    $id = (int)($data['id'] ?? 0);
    $is_active = (int)($data['is_active'] ?? 1);
    $sort_order = (int)($data['sort_order'] ?? 0);
    $title = trim($data['title'] ?? '');
    $brand = trim($data['brand'] ?? 'all');
    $stmt = $conn->prepare("UPDATE brand_videos SET is_active=?, sort_order=?, title=?, brand=? WHERE id=?");
    $stmt->bind_param("iissi", $is_active, $sort_order, $title, $brand, $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE') {
    verifyCsrf();
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM brand_videos WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}
?>
