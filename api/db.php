<?php
// api/db.php
mysqli_report(MYSQLI_REPORT_OFF);

$envPath = dirname(__DIR__) . '/.env';
if (!file_exists($envPath)) {
  // fallback: try same directory
  $envPath = __DIR__ . '/.env';
}
if (file_exists($envPath)) {
  $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    if (strpos($line, '=') !== false) {
      [$key, $val] = explode('=', $line, 2);
      $_ENV[trim($key)] = trim($val);
    }
  }
}

$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
$dbUser = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? '';
$dbPass = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
$dbName = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? '';

$conn = @new mysqli($host, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    error_log("Database connection failure: " . $conn->connect_error);
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "success" => false,
        "error" => "Unable to connect to database. Please try again later.",
        "code" => "DB_CONNECTION_ERROR"
    ]);
    exit;
}

// Set charset to utf8mb4 for full Unicode support
$conn->set_charset("utf8mb4");

// Auto-migration for products table and custom columns
$conn->query("CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `image` VARCHAR(500) DEFAULT '',
  `images` LONGTEXT DEFAULT NULL,
  `brand` VARCHAR(50) DEFAULT 'silverythm',
  `category` VARCHAR(100) DEFAULT '',
  `weight` VARCHAR(100) DEFAULT '',
  `dimensions` VARCHAR(100) DEFAULT '',
  `stock` INT DEFAULT 1,
  `size` VARCHAR(255) DEFAULT NULL,
  `frame` VARCHAR(255) DEFAULT NULL,
  `material` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$res_size = $conn->query("SHOW COLUMNS FROM `products` LIKE 'size'");
if ($res_size && $res_size->num_rows === 0) {
    $conn->query("ALTER TABLE products ADD COLUMN size VARCHAR(255) DEFAULT NULL");
}
$res_frame = $conn->query("SHOW COLUMNS FROM `products` LIKE 'frame'");
if ($res_frame && $res_frame->num_rows === 0) {
    $conn->query("ALTER TABLE products ADD COLUMN frame VARCHAR(255) DEFAULT NULL");
}
$res_material = $conn->query("SHOW COLUMNS FROM `products` LIKE 'material'");
if ($res_material && $res_material->num_rows === 0) {
    $conn->query("ALTER TABLE products ADD COLUMN material VARCHAR(255) DEFAULT NULL");
}

function isAdmin() {
  if (session_status() === PHP_SESSION_NONE) session_start();
  if (empty($_SESSION['user_id'])) return false;
  return !empty($_SESSION['is_admin']);
}

function requireAdmin() {
  if (!isAdmin()) {
    http_response_code(401);
    echo json_encode([
      "success" => false, 
      "error" => "Unauthorised"
    ]);
    exit;
  }
}
function verifyCsrf() {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || $token !== ($_SESSION['csrf_token'] ?? '')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid request']);
        exit;
    }
}
?>
