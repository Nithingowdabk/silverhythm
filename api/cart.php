<?php
// api/cart.php
session_start();
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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Please login to manage your cart."]);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $sql = "SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.description, p.price, p.image, p.brand, p.category 
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $cart_items = [];
        while($row = $result->fetch_assoc()) {
            $cart_items[] = $row;
        }
        echo json_encode($cart_items);
        $stmt->close();
        break;

    case 'POST':
        verifyCsrf();
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->product_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Product ID required."]);
            exit;
        }
        
        $product_id = (int)$data->product_id;
        $quantity = isset($data->quantity) ? (int)$data->quantity : 1;
        $quantity = max(1, min(99, $quantity));
        
        // GUARD: Reject Silverythm products from cart
        $brand_check = $conn->prepare("SELECT brand FROM products WHERE id = ?");
        $brand_check->bind_param("i", $product_id);
        $brand_check->execute();
        $brand_result = $brand_check->get_result();
        $product_row = $brand_result->fetch_assoc();
        $brand_check->close();

        if (!$product_row) {
            http_response_code(404);
            echo json_encode(["message" => "Product not found."]);
            exit;
        }

        if ($product_row['brand'] === 'silverythm') {
            http_response_code(403);
            echo json_encode(["message" => "Silverythm products cannot be added to cart. Please use WhatsApp to enquire."]);
            exit;
        }
        
        // Check if item already exists in cart
        $check = $conn->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
        $check->bind_param("ii", $user_id, $product_id);
        $check->execute();
        $res = $check->get_result();
        
        if ($row = $res->fetch_assoc()) {
            // Update quantity
            $new_qty = min(99, $row['quantity'] + $quantity);
            $update = $conn->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
            $update->bind_param("ii", $new_qty, $row['id']);
            $update->execute();
            $update->close();
            echo json_encode(["message" => "Cart updated.", "quantity" => $new_qty]);
        } else {
            // Insert new item
            $insert = $conn->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
            $insert->bind_param("iii", $user_id, $product_id, $quantity);
            $insert->execute();
            $insert->close();
            echo json_encode(["message" => "Item added to cart."]);
        }
        $check->close();
        break;

    case 'PUT':
        verifyCsrf();
        $data = json_decode(file_get_contents("php://input"));
        $cart_id  = isset($data->cart_id)  ? (int)$data->cart_id  : null;
        $quantity = isset($data->quantity) ? (int)$data->quantity : null;

        if (!$cart_id || $quantity === null) {
            http_response_code(400);
            echo json_encode(["message" => "cart_id and quantity required."]);
            exit;
        }

        if ($quantity <= 0) {
            // Quantity zero or below means remove the item
            $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $cart_id, $user_id);
            $stmt->execute();
            echo json_encode(["message" => "Item removed from cart."]);
            $stmt->close();
            break;
        }

        if ($quantity > 99) {
            http_response_code(400);
            echo json_encode(["message" => "Quantity cannot exceed 99."]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("iii", $quantity, $cart_id, $user_id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Cart item not found."]);
        } else {
            echo json_encode(["message" => "Cart updated.", "quantity" => $quantity]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        verifyCsrf();
        $cart_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if ($cart_id) {
            $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $cart_id, $user_id);
            if ($stmt->execute()) {
                echo json_encode(["message" => "Item removed from cart."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Failed to remove item."]);
            }
            $stmt->close();
        } else {
            // Clear cart
            $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            echo json_encode(["message" => "Cart cleared."]);
            $stmt->close();
        }
        break;
}

$conn->close();
?>
