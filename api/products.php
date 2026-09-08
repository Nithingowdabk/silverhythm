<?php
// api/products.php
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 'On');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://silverhythm.com', 'http://localhost', 'http://localhost:8080', 'http://127.0.0.1:8080'];
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://silverhythm.com");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Single product by ID
        if (isset($_GET['id']) && is_numeric($_GET['id'])) {
            $id = (int)$_GET['id'];
            
            // LOGGING
            $logMsg = date('[Y-m-d H:i:s] ') . "Fetching product ID: $id\n";
            
            $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? LIMIT 1");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $product = $result->fetch_assoc();
            
            if ($product) {
                $logMsg .= "  Found product: " . $product['name'] . "\n";
                // Ensure numeric types
                $product['id']    = (int)$product['id'];
                $product['price'] = (float)($product['price'] ?? 0);
                $product['stock'] = (int)($product['stock'] ?? 1);
                
                // Fallbacks
                $product['name']        = $product['name']        ?? 'Untitled Product';
                $product['description'] = $product['description'] ?? '';
                $product['image']       = $product['image']       ?? '';
                $product['images']      = $product['images']      ?? '[]';
                $product['brand']       = $product['brand']       ?? 'silverythm';
                $product['category']    = $product['category']    ?? '';
                $product['weight']      = $product['weight']      ?? '';
                $product['dimensions']  = $product['dimensions']  ?? '';
                $product['size']        = $product['size']        ?? '';
                $product['frame']       = $product['frame']       ?? '';
                $product['material']    = $product['material']    ?? '';
                
                // Replace cms/cm/centimeters with inches
                $product['dimensions'] = preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/i', '$1 inches', $product['dimensions']);
                $product['dimensions'] = preg_replace('/\b(?:cms?|centimeters?)\b/i', 'inches', $product['dimensions']);
                $product['size']       = preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/i', '$1 inches', $product['size']);
                $product['size']       = preg_replace('/\b(?:cms?|centimeters?)\b/i', 'inches', $product['size']);
                $product['description']= preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/i', '$1 inches', $product['description']);
                $product['description']= preg_replace('/\b(?:cms?|centimeters?)\b/i', 'inches', $product['description']);

                if ($product['brand'] === 'udugore' && stripos($product['description'], 'Pure 999.9 silver coated') === false) {
                    $product['description'] = trim($product['description'] . "\nPure 999.9 silver coated");
                }

                echo json_encode($product);
            } else {
                $logMsg .= "  Product NOT FOUND in database.\n";
                http_response_code(404);
                echo json_encode(["message" => "Product not found."]);
            }
            
            file_put_contents('debug_products.log', $logMsg, FILE_APPEND);
            
            $stmt->close();
            exit;
        }

        $brand    = isset($_GET['brand'])    ? trim($_GET['brand'])    : null;
        $category = isset($_GET['category']) ? trim($_GET['category']) : null;
        $limit    = isset($_GET['limit'])    ? min((int)$_GET['limit'], 10000) : 24;
        $offset   = isset($_GET['offset'])   ? max((int)$_GET['offset'], 0)  : 0;

        if ($brand && $category) {
            $stmt = $conn->prepare("SELECT id, name, description, price, image, images, brand, category, weight, dimensions, stock, size, frame, material FROM products WHERE brand = ? AND category = ? ORDER BY id DESC LIMIT ? OFFSET ?");
            $stmt->bind_param("ssii", $brand, $category, $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();

            $count_stmt = $conn->prepare("SELECT COUNT(*) as total FROM products WHERE brand = ? AND category = ?");
            $count_stmt->bind_param("ss", $brand, $category);
            $count_stmt->execute();
            $total = $count_stmt->get_result()->fetch_assoc()['total'];
            $count_stmt->close();
        } elseif ($brand) {
            $stmt = $conn->prepare("SELECT id, name, description, price, image, images, brand, category, weight, dimensions, stock, size, frame, material FROM products WHERE brand = ? ORDER BY id DESC LIMIT ? OFFSET ?");
            $stmt->bind_param("sii", $brand, $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();

            $count_stmt = $conn->prepare("SELECT COUNT(*) as total FROM products WHERE brand = ?");
            $count_stmt->bind_param("s", $brand);
            $count_stmt->execute();
            $total = $count_stmt->get_result()->fetch_assoc()['total'];
            $count_stmt->close();
        } else {
            $stmt = $conn->prepare("SELECT id, name, description, price, image, images, brand, category, weight, dimensions, stock, size, frame, material FROM products ORDER BY id DESC LIMIT ? OFFSET ?");
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $result = $stmt->get_result();

            $count_stmt = $conn->query("SELECT COUNT(*) as total FROM products");
            $total = $count_stmt->fetch_assoc()['total'];
        }

        if (!$result) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to fetch products."]);
            exit;
        }
        $products = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $row['id']          = (int)$row['id'];
                $row['price']       = (float)$row['price'];
                $row['stock']       = (int)($row['stock'] ?? 1);
                $row['name']        = $row['name']        ?? '';
                $row['description'] = $row['description'] ?? '';
                $row['image']       = $row['image']       ?? '';
                $row['images']      = $row['images']      ?? '[]';
                $row['brand']       = $row['brand']       ?? 'silverythm';
                $row['category']    = $row['category']    ?? '';
                $row['weight']      = $row['weight']      ?? '';
                $row['dimensions']  = $row['dimensions']  ?? '';
                $row['size']        = $row['size']        ?? '';
                $row['frame']       = $row['frame']       ?? '';
                $row['material']    = $row['material']    ?? '';

                // Replace cms/cm/centimeters with inches
                $row['dimensions'] = preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/i', '$1 inches', $row['dimensions']);
                $row['dimensions'] = preg_replace('/\b(?:cms?|centimeters?)\b/i', 'inches', $row['dimensions']);
                $row['size']       = preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/i', '$1 inches', $row['size']);
                $row['size']       = preg_replace('/\b(?:cms?|centimeters?)\b/i', 'inches', $row['size']);
                $row['description']= preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/i', '$1 inches', $row['description']);
                $row['description']= preg_replace('/\b(?:cms?|centimeters?)\b/i', 'inches', $row['description']);

                if ($row['brand'] === 'udugore' && stripos($row['description'], 'Pure 999.9 silver coated') === false) {
                    $row['description'] = trim($row['description'] . "\nPure 999.9 silver coated");
                }
                $products[] = $row;
            }
        }
        echo json_encode([
            'products' => $products,
            'total'    => (int)$total,
            'limit'    => $limit,
            'offset'   => $offset,
            'has_more' => ($offset + $limit) < (int)$total,
        ]);
        break;

    case 'POST':
        requireAdmin();
        
        // Handle both JSON and FormData
        $data = null;
        if (!empty($_POST)) {
            $data = (object)$_POST;
        } else {
            $data = json_decode(file_get_contents("php://input"));
        }
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(["message" => "No data provided."]);
            exit;
        }

        // Handle Image Upload or URL
        $image_path = $data->image ?? '';
        if (empty($image_path) && !empty($data->image_url)) {
            $image_path = $data->image_url;
        }
        
        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../assets/products/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
            
            $file_ext = strtolower(pathinfo($_FILES['image_file']['name'], PATHINFO_EXTENSION));
            $file_name = uniqid('prod_') . '.' . $file_ext;
            $target_file = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['image_file']['tmp_name'], $target_file)) {
                $image_path = 'assets/products/' . $file_name;
            }
        }

        // Validate required fields
        if (empty($data->name) || empty($data->description) || empty($image_path)) {
            http_response_code(400);
            echo json_encode(["message" => "Required fields missing: name, description, and image (file or URL)."]);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO products (name, description, price, image, images, brand, category, weight, dimensions, stock, size, frame, material) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["message" => "Database error."]);
            exit;
        }
        
        $name = trim($data->name);
        $desc = trim($data->description);
        $price = isset($data->price) ? (float)$data->price : 0.0;
        $images = isset($data->images) ? trim($data->images) : '[]';
        $brand = $data->brand ?? 'silverythm';
        $category = $data->category ?? '';
        $weight = $data->weight ?? '';
        $dimensions = $data->dimensions ?? '';
        $stock = isset($data->stock) ? (int)$data->stock : 1;
        $size = isset($data->size) ? trim($data->size) : '';
        $frame = isset($data->frame) ? trim($data->frame) : '';
        $material = isset($data->material) ? trim($data->material) : '';
        
        $stmt->bind_param("ssdssssssisss", $name, $desc, $price, $image_path, $images, $brand, $category, $weight, $dimensions, $stock, $size, $frame, $material);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["success" => true, "message" => "Product added.", "id" => $conn->insert_id]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Failed to save product."]);
        }
        $stmt->close();
        break;

    case 'PUT':
        requireAdmin();
        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->id) || empty($data->name) || empty($data->description) || empty($data->image)) {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
            exit;
        }
        
        if (mb_strlen($data->name) > 255 || mb_strlen($data->description) > 3000) {
            http_response_code(400);
            echo json_encode(["message" => "Name or description too long."]);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, image=?, images=?, brand=?, category=?, weight=?, dimensions=?, stock=?, size=?, frame=?, material=? WHERE id=?");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["message" => "Database error."]);
            exit;
        }
        $price = isset($data->price) ? trim($data->price) : '0';
        $name = trim($data->name);
        $desc = trim($data->description);
        $image = trim($data->image);
        $images = isset($data->images) ? trim($data->images) : '[]';
        $brand = isset($data->brand) ? trim($data->brand) : 'silverythm';
        $category = isset($data->category) ? trim($data->category) : null;
        $weight = isset($data->weight) ? trim($data->weight) : null;
        $dimensions = isset($data->dimensions) ? trim($data->dimensions) : null;
        $stock = isset($data->stock) ? (int)$data->stock : 1;
        $size = isset($data->size) ? trim($data->size) : '';
        $frame = isset($data->frame) ? trim($data->frame) : '';
        $material = isset($data->material) ? trim($data->material) : '';
        $id = (int)$data->id;
        $price_num = is_numeric($price) ? (float)$price : 0.0;
        
        $stmt->bind_param("ssdssssssisssi", $name, $desc, $price_num, $image, $images, $brand, $category, $weight, $dimensions, $stock, $size, $frame, $material, $id);
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Product updated."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Failed to update product."]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        requireAdmin();
        $data = json_decode(file_get_contents("php://input"));
        $id = !empty($data->id) ? (int)$data->id : (isset($_GET['id']) ? (int)$_GET['id'] : null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM products WHERE id=?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(["message" => "Database error."]);
                exit;
            }
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Product deleted."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Failed to delete product."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Product ID required."]);
        }
        break;
}
$conn->close();
?>
