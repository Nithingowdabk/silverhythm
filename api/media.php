<?php
// api/media.php - Unified Media Asset Explorer
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-CSRF-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $sql = "SELECT DISTINCT image AS url, name AS filename FROM products WHERE image IS NOT NULL AND image != '' ORDER BY id DESC LIMIT 100";
        $result = $conn->query($sql);
        $media = [];
        while ($row = $result->fetch_assoc()) {
            $media[] = $row;
        }
        echo json_encode($media);
        break;

    case 'POST':
        verifyCsrf();
        $data = json_decode(file_get_contents("php://input"), true);
        if (is_array($data)) {
            $allowedKeys = ['bannerText', 'heroImage', 'whatsappNumber'];
            $stmt = $conn->prepare("INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`)");
            foreach ($data as $key => $value) {
                if (in_array($key, $allowedKeys)) {
                    $stmt->bind_param("ss", $key, $value);
                    $stmt->execute();
                }
            }
            $stmt->close();
            echo json_encode(["success" => true, "message" => "Settings updated."]);
        }
 else {
            http_response_code(400);
            echo json_encode(["message" => "Invalid data."]);
        }
        break;

    case 'DELETE':
        verifyCsrf();
        $data = json_decode(file_get_contents("php://input"), true);
        $filename = $data['filename'] ?? '';
        if ($filename) {
            $path = '../uploads/' . basename($filename);
            if (file_exists($path)) {
                unlink($path);
                echo json_encode(["success" => true]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "File not found."]);
            }
        }
        break;
}

$conn->close();
?>
