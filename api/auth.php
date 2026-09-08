<?php
// api/auth.php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 'On');
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? '1' : '0');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
session_start();
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://silverhythm.com', 'http://localhost', 'http://localhost:8080'];
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://silverhythm.com");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$envPath = dirname(__DIR__) . '/.env';
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

// Fallback if env fails
if (empty($_ENV['DB_HOST'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server configuration error.']);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'PUT':
        verifyCsrf();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'));
        $name    = trim($data->name ?? '');
        $phone   = trim($data->phone ?? '');
        $address = trim($data->address ?? '');
        if (mb_strlen($name) > 255 || mb_strlen($address) > 1000) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Input too long.']);
            exit;
        }
        $stmt = $conn->prepare("UPDATE users SET name=?, phone=?, address=? WHERE id=?");
        $stmt->bind_param("sssi", $name, $phone, $address, $_SESSION['user_id']);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => true]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if ($action === 'register') {
            if (empty($data->name) || empty($data->email) || empty($data->password)) {
                http_response_code(400);
                echo json_encode(["message" => "Incomplete data."]);
                exit;
            }
            if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["message" => "Invalid email address."]);
                exit;
            }
            if (mb_strlen($data->password) < 8) {
                http_response_code(400);
                echo json_encode(["message" => "Password must be at least 8 characters."]);
                exit;
            }
            
            $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
            
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $data->name, $data->email, $password_hash, $data->phone);
            
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["message" => "User registered."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Registration failed. Email might already exist."]);
            }
            $stmt->close();
        } 
        elseif ($action === 'login') {
            $loginId = trim($data->email ?? '');
            $password = (string)($data->password ?? '');
            if (empty($loginId) || empty($password)) {
                http_response_code(400);
                echo json_encode(["message" => "Username/email and password required."]);
                exit;
            }

            $attemptKey = 'login_attempts_' . md5(strtolower($loginId));
            $lockKey    = 'login_locked_'   . md5(strtolower($loginId));

            // Check if locked out
            if (!empty($_SESSION[$lockKey]) && $_SESSION[$lockKey] > time()) {
                $wait = ceil(($_SESSION[$lockKey] - time()) / 60);
                http_response_code(429);
                echo json_encode(["message" => "Too many failed attempts. Try again in {$wait} minute(s)."]);
                exit;
            }

            $stmt = $conn->prepare("SELECT id, name, email, password, is_admin FROM users WHERE email = ? OR name = ? LIMIT 1");
            $stmt->bind_param("ss", $loginId, $loginId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($user = $result->fetch_assoc()) {
                if (password_verify($data->password, $user['password'])) {
                    // Success — clear attempt counters
                    unset($_SESSION[$attemptKey], $_SESSION[$lockKey]);
                    session_regenerate_id(true);
                    $_SESSION['user_id']   = $user['id'];
                    $_SESSION['user_name'] = $user['name'];
                    $_SESSION['is_admin']  = (int)$user['is_admin'] === 1;
                    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
                    echo json_encode([
                        "success" => true,
                        "message" => "Login successful.",
                        "user"    => [
                            "id"       => $user['id'],
                            "name"     => $user['name'],
                            "email"    => $user['email'],
                            "is_admin" => (bool)$user['is_admin']
                        ]
                    ]);
                } else {
                    // Wrong password — increment attempts
                    $_SESSION[$attemptKey] = ($_SESSION[$attemptKey] ?? 0) + 1;
                    if ($_SESSION[$attemptKey] >= 5) {
                        $_SESSION[$lockKey] = time() + (15 * 60); // lock for 15 minutes
                        unset($_SESSION[$attemptKey]);
                        http_response_code(429);
                        echo json_encode(["message" => "Too many failed attempts. Try again in 15 minute(s)."]);
                    } else {
                        $remaining = 5 - $_SESSION[$attemptKey];
                        http_response_code(401);
                        echo json_encode(["message" => "Invalid credentials. {$remaining} attempt(s) remaining."]);
                    }
                }
            } else {
                // Unknown email — still increment to prevent email enumeration timing attacks
                $_SESSION[$attemptKey] = ($_SESSION[$attemptKey] ?? 0) + 1;
                if ($_SESSION[$attemptKey] >= 5) {
                    $_SESSION[$lockKey] = time() + (15 * 60);
                    unset($_SESSION[$attemptKey]);
                    http_response_code(429);
                    echo json_encode(["message" => "Too many failed attempts. Try again in 15 minute(s)."]);
                } else {
                    http_response_code(401);
                    echo json_encode(["message" => "Invalid credentials."]);
                }
            }
            $stmt->close();
        }
        elseif ($action === 'logout') {

            // Logout via POST only — prevents CSRF via GET
            session_destroy();
            echo json_encode(["message" => "Logged out."]);
        }
        elseif ($action === 'delete_user') {
            verifyCsrf();
            if (!isset($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Unauthorised']);
                exit;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $target_id = (int)($data['user_id'] ?? 0);
            if (!$target_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'user_id required']);
                exit;
            }
            if ($target_id === (int)$_SESSION['user_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Cannot delete your own account']);
                exit;
            }
            $chk = $conn->prepare("SELECT is_admin FROM users WHERE id = ?");
            $chk->bind_param("i", $target_id);
            $chk->execute();
            $row = $chk->get_result()->fetch_assoc();
            $chk->close();
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
                exit;
            }
            if ($row['is_admin']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Cannot delete admin accounts']);
                exit;
            }
            $del = $conn->prepare("DELETE FROM users WHERE id = ? AND is_admin = 0");
            $del->bind_param("i", $target_id);
            $del->execute();
            $del->close();
            echo json_encode(['success' => true, 'message' => 'User deleted']);
        }

        break;

    case 'GET':
        if ($action === 'profile') {
            if (isset($_SESSION['user_id'])) {
                $stmt = $conn->prepare("SELECT id, name, email, phone, address FROM users WHERE id = ?");
                $stmt->bind_param("i", $_SESSION['user_id']);
                $stmt->execute();
                $result = $stmt->get_result();
                echo json_encode($result->fetch_assoc());
                $stmt->close();
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Not authenticated."]);
            }
        } elseif ($action === 'list_users') {
            if (!isset($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
                http_response_code(401);
                echo json_encode(['message' => 'Unauthorised']);
                exit;
            }
            $result = $conn->query("
                SELECT 
                    u.id, u.name, u.email, u.created_at,
                    COUNT(o.id) as order_count
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id
                WHERE u.is_admin = 0
                GROUP BY u.id
                ORDER BY u.created_at DESC
            ");
            echo json_encode(['users' => $result->fetch_all(MYSQLI_ASSOC)]);
        } elseif ($action === 'csrf') {


            if (session_status() === PHP_SESSION_NONE) session_start();
            if (empty($_SESSION['csrf_token'])) {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            }
            echo json_encode(['token' => $_SESSION['csrf_token']]);
            exit;
        }
        break;
}

$conn->close();
?>
