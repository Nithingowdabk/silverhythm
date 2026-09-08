<?php
// create_admin.php - Run via CLI or include in setup
require_once __DIR__ . '/api/db.php';

$username = 'Silverhythm';
$password = 'Silverhythm@2026';
$email = 'Silverhythm'; // Or 'silverhythm@silverhythm.com'
$password_hash = password_hash($password, PASSWORD_BCRYPT);

// Check if user already exists with name or email 'Silverhythm'
$stmt = $conn->prepare("SELECT id FROM users WHERE name = ? OR email = ?");
$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$res = $stmt->get_result();
$existing = $res->fetch_assoc();
$stmt->close();

if ($existing) {
    // Update existing user to be admin with new password
    $update = $conn->prepare("UPDATE users SET password = ?, is_admin = 1 WHERE id = ?");
    $update->bind_param("si", $password_hash, $existing['id']);
    $update->execute();
    $update->close();
    echo "Admin user '$username' updated successfully (ID: {$existing['id']}).\n";
} else {
    // Insert new admin user
    $insert = $conn->prepare("INSERT INTO users (name, email, password, phone, address, is_admin) VALUES (?, ?, ?, '', '', 1)");
    $insert->bind_param("sss", $username, $email, $password_hash);
    if ($insert->execute()) {
        echo "Admin user '$username' created successfully (ID: {$insert->insert_id}).\n";
    } else {
        echo "Failed to create admin user: " . $insert->error . "\n";
    }
    $insert->close();
}

$conn->close();
?>
