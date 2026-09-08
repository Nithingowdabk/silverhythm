<?php
// api/upload.php
if (session_status() === PHP_SESSION_NONE) session_start();
require 'db.php';
requireAdmin();
verifyCsrf();

header("Access-Control-Allow-Origin: https://silverhythm.com");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Rate limit: max 30 uploads per admin session per hour
if (!isset($_SESSION['upload_count'])) $_SESSION['upload_count'] = 0;
if (!isset($_SESSION['upload_window_start'])) $_SESSION['upload_window_start'] = time();

// Reset counter if window has expired (1 hour)
if (time() - $_SESSION['upload_window_start'] > 3600) {
    $_SESSION['upload_count'] = 0;
    $_SESSION['upload_window_start'] = time();
}

if ($_SESSION['upload_count'] >= 30) {
    http_response_code(429);
    echo json_encode(['status' => 'error', 'message' => 'Upload limit reached. Please wait before uploading more files.']);
    exit;
}

$_SESSION['upload_count']++;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    // Max file size: 50MB for videos
    $maxSize = 50 * 1024 * 1024;
    if ($_FILES['image']['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "File too large. Maximum 50MB allowed."]);
        exit;
    }
    
    // Check for upload errors
    if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Upload error occurred."]);
        exit;
    }

    $targetDir = "../uploads/";
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    // Generate a unique filename and sanitize original name
    $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9.-]/", "_", basename($_FILES["image"]["name"]));
    $targetFilePath = $targetDir . $fileName;
    $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));
    
    // Allow certain file formats
    $allowTypes = ['jpg', 'png', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov'];
    if (!in_array($fileType, $allowTypes)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Only JPG, JPEG, PNG, GIF, WEBP, MP4, WEBM, OGG, & MOV files are allowed."]);
        exit;
    }
    
    // Validate MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $_FILES["image"]["tmp_name"]);
    finfo_close($finfo);
    $allowMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];
    if (!in_array($mimeType, $allowMimes)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid file type detected."]);
        exit;
    }
    
    if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFilePath)) {
        echo json_encode([
            "status" => "success", 
            "url" => "uploads/" . $fileName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to save file."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No image file provided."]);
}
?>