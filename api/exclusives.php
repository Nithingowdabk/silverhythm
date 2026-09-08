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

// Auto-create MySQL table on first run
$conn->query("CREATE TABLE IF NOT EXISTS exclusives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL DEFAULT 'OUR EXCLUSIVES',
    title VARCHAR(255) DEFAULT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;

    $sql = "SELECT * FROM exclusives WHERE is_active = 1";
    $types = "";
    $params = [];

    if ($category !== '') {
        $sql .= " AND category = ?";
        $types .= "s";
        $params[] = $category;
    }

    $sql .= " ORDER BY sort_order ASC, id DESC";

    if ($limit > 0) {
        $sql .= " LIMIT ?";
        $types .= "i";
        $params[] = $limit;
    }

    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
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
    
    $category = trim($data['category'] ?? 'OUR EXCLUSIVES');
    $title = isset($data['title']) ? trim($data['title']) : null;
    if ($title === '') $title = null;
    $image_url = trim($data['image_url'] ?? '');
    $sort_order = (int)($data['sort_order'] ?? 0);
    
    if (!$image_url) {
        http_response_code(400);
        echo json_encode(['error' => 'image_url required']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO exclusives (category, title, image_url, sort_order) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $category, $title, $image_url, $sort_order);
    $stmt->execute();
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    exit;
}

if ($method === 'PUT') {
    verifyCsrf();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = (int)($data['id'] ?? 0);
    $category = trim($data['category'] ?? 'OUR EXCLUSIVES');
    $title = isset($data['title']) ? trim($data['title']) : null;
    if ($title === '') $title = null;
    $image_url = trim($data['image_url'] ?? '');
    $sort_order = (int)($data['sort_order'] ?? 0);
    $is_active = (int)($data['is_active'] ?? 1);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id required']);
        exit;
    }
    
    if ($image_url !== '') {
        $stmt = $conn->prepare("UPDATE exclusives SET category = ?, title = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?");
        $stmt->bind_param("sssiii", $category, $title, $image_url, $sort_order, $is_active, $id);
    } else {
        $stmt = $conn->prepare("UPDATE exclusives SET category = ?, title = ?, sort_order = ?, is_active = ? WHERE id = ?");
        $stmt->bind_param("ssiii", $category, $title, $sort_order, $is_active, $id);
    }
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE') {
    verifyCsrf();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id required']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM exclusives WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}
?>
