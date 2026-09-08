<?php
// api/migrate.php
require 'db.php';
if (php_sapi_name() !== 'cli') {
    requireAdmin();
}

// Helper function to check if a column exists
function columnExists($conn, $table, $column) {
    $result = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $result && $result->num_rows > 0;
}

// Helper function to check if an index exists
function indexExists($conn, $table, $indexName) {
    $result = $conn->query("SHOW INDEX FROM `$table` WHERE Key_name = '$indexName'");
    return $result && $result->num_rows > 0;
}

// Helper function to run a query and print the result
function runQuery($conn, $sql, $description) {
    if ($conn->query($sql)) {
        echo "✅ Success: $description\n";
        return true;
    } else {
        echo "❌ Error: $description - " . $conn->error . "\n";
        return false;
    }
}

echo "Starting migration...\n";

// 1. Create tables if not exists
$tables = [
    "users" => "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        is_admin TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "cart" => "CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )",
    "orders" => "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        payment_method VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "order_items" => "CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )",
    "settings" => "CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
    )",
    "banner_strip" => "CREATE TABLE IF NOT EXISTS banner_strip (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        link_url VARCHAR(500) DEFAULT NULL,
        brand VARCHAR(50) DEFAULT 'all',
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "banner_strip_settings" => "CREATE TABLE IF NOT EXISTS banner_strip_settings (
        id INT PRIMARY KEY DEFAULT 1,
        is_enabled TINYINT(1) DEFAULT 0,
        scroll_speed INT DEFAULT 40,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )"
];

foreach ($tables as $name => $sql) {
    runQuery($conn, $sql, "Create table '$name'");
}

// 2. Add columns if they do not exist
$columnsToAdd = [
    ['products', 'brand', "ALTER TABLE products ADD COLUMN brand VARCHAR(50) DEFAULT 'silverythm' AFTER image"],
    ['users', 'is_admin', "ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0"],
    ['products', 'category', "ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT NULL AFTER brand"],
    ['products', 'images', "ALTER TABLE products ADD COLUMN images TEXT DEFAULT NULL AFTER image"],
    ['products', 'weight', "ALTER TABLE products ADD COLUMN weight VARCHAR(100) DEFAULT NULL AFTER category"],
    ['products', 'dimensions', "ALTER TABLE products ADD COLUMN dimensions VARCHAR(100) DEFAULT NULL AFTER weight"],
    ['products', 'stock', "ALTER TABLE products ADD COLUMN stock INT DEFAULT 1 AFTER dimensions"],
    ['products', 'size', "ALTER TABLE products ADD COLUMN size VARCHAR(255) DEFAULT NULL AFTER stock"],
    ['products', 'frame', "ALTER TABLE products ADD COLUMN frame VARCHAR(255) DEFAULT NULL AFTER size"],
    ['products', 'material', "ALTER TABLE products ADD COLUMN material VARCHAR(255) DEFAULT NULL AFTER frame"],
    ['orders', 'razorpay_order_id', "ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(255) DEFAULT NULL AFTER payment_method"],
    ['orders', 'razorpay_payment_id', "ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(255) DEFAULT NULL AFTER razorpay_order_id"],
    ['orders', 'razorpay_signature', "ALTER TABLE orders ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL AFTER razorpay_payment_id"]
];

foreach ($columnsToAdd as $col) {
    list($table, $column, $sql) = $col;
    if (!columnExists($conn, $table, $column)) {
        runQuery($conn, $sql, "Add column '$column' to '$table'");
    } else {
        echo "ℹ️ Info: Column '$column' already exists in '$table'. Skipping.\n";
    }
}

// 3. Modify columns (e.g. price)
runQuery($conn, "ALTER TABLE products MODIFY COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00", "Modify products.price to DECIMAL(10,2)");

// 4. Add indexes if they do not exist
$indexesToAdd = [
    ['products', 'idx_brand', 'brand', "ALTER TABLE products ADD INDEX idx_brand (brand)"],
    ['products', 'idx_brand_category', 'brand, category', "ALTER TABLE products ADD INDEX idx_brand_category (brand, category)"],
    ['cart', 'idx_cart_user', 'user_id', "ALTER TABLE cart ADD INDEX idx_cart_user (user_id)"],
    ['cart', 'idx_cart_product', 'product_id', "ALTER TABLE cart ADD INDEX idx_cart_product (product_id)"]
];

foreach ($indexesToAdd as $idx) {
    list($table, $indexName, $fields, $sql) = $idx;
    if (!indexExists($conn, $table, $indexName)) {
        runQuery($conn, $sql, "Add index '$indexName' to '$table'");
    } else {
        echo "ℹ️ Info: Index '$indexName' already exists on '$table'. Skipping.\n";
    }
}

// 5. Seed initial data
runQuery($conn, "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('whatsappNumber', '916364051237')", "Seed whatsappNumber");
runQuery($conn, "INSERT IGNORE INTO banner_strip_settings (id, is_enabled) VALUES (1, 0)", "Seed banner_strip_settings");

echo "Migration completed.\n";
$conn->close();
?>
