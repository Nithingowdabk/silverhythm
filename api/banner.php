<?php
require 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Public GET: Fetch banners
if ($method === 'GET') {
    if ($action === 'settings') {
        $res = $conn->query("SELECT * FROM banner_strip_settings WHERE id = 1");
        echo json_encode($res->fetch_assoc());
        exit;
    }

    $brand = $_GET['brand'] ?? 'all';
    $sql = "SELECT * FROM banner_strip WHERE is_active = 1 AND (brand = 'all' OR brand = ?) ORDER BY sort_order ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $brand);
    $stmt->execute();
    $result = $stmt->get_result();
    $banners = [];
    while ($row = $result->fetch_assoc()) {
        $banners[] = $row;
    }

    // Fetch settings too
    $settingsRes = $conn->query("SELECT * FROM banner_strip_settings WHERE id = 1");
    $settings = $settingsRes->fetch_assoc();

    echo json_encode([
        "banners" => $banners,
        "settings" => $settings
    ]);
    exit;
}

// Admin only methods
requireAdmin();
verifyCsrf();

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($action === 'update_settings') {
        $isEnabled = isset($data['is_enabled']) ? (int)$data['is_enabled'] : 0;
        $speed = isset($data['scroll_speed']) ? (int)$data['scroll_speed'] : 40;
        
        $stmt = $conn->prepare("UPDATE banner_strip_settings SET is_enabled = ?, scroll_speed = ? WHERE id = 1");
        $stmt->bind_param("ii", $isEnabled, $speed);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        exit;
    }

    // Add new banner
    $imageUrl = $data['image_url'] ?? '';
    $linkUrl = $data['link_url'] ?? '';
    $brand = $data['brand'] ?? 'all';
    $sortOrder = $data['sort_order'] ?? 0;

    if (!$imageUrl) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Image URL is required"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO banner_strip (image_url, link_url, brand, sort_order) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $imageUrl, $linkUrl, $brand, $sortOrder);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if ($action === 'toggle') {
        $isActive = $data['is_active'] ? 1 : 0;
        $stmt = $conn->prepare("UPDATE banner_strip SET is_active = ? WHERE id = ?");
        $stmt->bind_param("ii", $isActive, $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        exit;
    }
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = (int)($data['id'] ?? 0);
    if ($id > 0) {
        $conn->query("DELETE FROM banner_strip WHERE id = $id");
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
    }
    exit;
}
