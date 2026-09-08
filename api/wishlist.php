<?php
if (session_status() === PHP_SESSION_NONE) session_start();
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://silverhythm.com', 'http://localhost', 'http://localhost:8080', 'http://127.0.0.1:8080'];
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://silverhythm.com");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/db.php';

// Create wishlist table if not exists
$conn->query("
    CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_wish (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
");

$user_id = $_SESSION['user_id'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($action === 'analytics') {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['is_admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $result = $conn->query("
        SELECT p.id, p.name, p.image, p.brand, p.description, COUNT(w.id) as wish_count
        FROM wishlist w
        JOIN products p ON p.id = w.product_id
        GROUP BY p.id
        ORDER BY wish_count DESC
        LIMIT 20
    ");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Guest wishlist via localStorage is handled client-side
// This API handles authenticated users only

if (!$user_id && $method !== 'GET') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Login required to save wishlist']);
    exit;
}

switch ($method) {
    case 'GET':
        // action=check&product_id=X — check if specific product is wishlisted
        if ($action === 'check' && isset($_GET['product_id'])) {
            if (!$user_id) {
                echo json_encode(['wishlisted' => false]);
                exit;
            }
            $pid = (int)$_GET['product_id'];
            $stmt = $conn->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("ii", $user_id, $pid);
            $stmt->execute();
            $exists = $stmt->get_result()->num_rows > 0;
            echo json_encode(['wishlisted' => $exists]);
            $stmt->close();
            break;
        }
        // Default GET — return all wishlisted products with full product data
        if (!$user_id) {
            echo json_encode([]);
            exit;
        }
        $stmt = $conn->prepare("
            SELECT p.id, p.name, p.description, p.price, p.image, p.brand, p.category, w.id as wish_id, w.created_at as wishlisted_at
            FROM wishlist w
            JOIN products p ON p.id = w.product_id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $items = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        echo json_encode($items);
        $stmt->close();
        break;

    case 'POST':
        verifyCsrf();
        // Toggle wishlist — add if not exists, remove if exists
        $data = json_decode(file_get_contents("php://input"), true);
        $pid = (int)($data['product_id'] ?? 0);
        if (!$pid) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'product_id required']);
            exit;
        }
        // Check if exists
        $check = $conn->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
        $check->bind_param("ii", $user_id, $pid);
        $check->execute();
        $exists = $check->get_result()->fetch_assoc();
        $check->close();

        if ($exists) {
            // Remove
            $del = $conn->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
            $del->bind_param("ii", $user_id, $pid);
            $del->execute();
            $del->close();
            echo json_encode(['success' => true, 'action' => 'removed', 'wishlisted' => false]);
        } else {
            // Add
            $ins = $conn->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)");
            $ins->bind_param("ii", $user_id, $pid);
            $ins->execute();
            $ins->close();
            echo json_encode(['success' => true, 'action' => 'added', 'wishlisted' => true]);
        }
        break;

    case 'DELETE':
        verifyCsrf();
        // Clear entire wishlist
        $stmt = $conn->prepare("DELETE FROM wishlist WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Wishlist cleared']);
        break;
}

$conn->close();
?>
