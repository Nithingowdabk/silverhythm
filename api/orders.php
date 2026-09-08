<?php
// api/orders.php
if (session_status() === PHP_SESSION_NONE) session_start();
header("Content-Type: application/json; charset=UTF-8");
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://silverhythm.com', 'http://localhost', 'http://localhost:8080', 'http://127.0.0.1:8080'];
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://silverhythm.com");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once 'db.php';


$action = $_GET['action'] ?? '';
$user_id = $_SESSION['user_id'] ?? null;

try {
    switch ($action) {
        case 'create':
            verifyCsrf();
            if (!$user_id) {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Unauthorised"]);
                exit;
            }

            // 1. Read cart items
            $cart_stmt = $conn->prepare("
                SELECT c.product_id, c.quantity, p.price, p.name 
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = ?
            ");
            $cart_stmt->bind_param("i", $user_id);
            $cart_stmt->execute();
            $result = $cart_stmt->get_result();
            $cart_items = $result->fetch_all(MYSQLI_ASSOC);

            if (empty($cart_items)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Cart is empty"]);
                exit;
            }

            // 2. Calculate total
            $total_amount = 0;
            foreach ($cart_items as $item) {
                $db_price = (float) $item['price'];
                $qty = max(1, (int) $item['quantity']);
                $total_amount += $db_price * $qty;
            }

            // 3. Get address and payment method
            $data = json_decode(file_get_contents("php://input"), true);
            $address = isset($data['address']) ? trim((string)$data['address']) : '';

            if (empty($address)) {
                $user_stmt = $conn->prepare("SELECT address FROM users WHERE id = ?");
                $user_stmt->bind_param("i", $user_id);
                $user_stmt->execute();
                $user_res = $user_stmt->get_result()->fetch_assoc();
                $address = $user_res['address'] ?? '';
            }

            if (empty(trim($address))) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Delivery address is required.']);
                exit;
            }

            $payment_method = isset($data['payment_method']) ? trim((string)$data['payment_method']) : 'cod';
            $allowed_methods = ['cod', 'upi', 'card', 'online', 'razorpay'];
            if (!in_array($payment_method, $allowed_methods)) { $payment_method = 'cod'; }

            unset($data['price'], $data['total'], $data['total_amount'], $data['amount']);


            // 4b. Insert order
            $conn->begin_transaction();
            $order_stmt = $conn->prepare("
                INSERT INTO orders (user_id, total_amount, status, payment_status, payment_method, address) 
                VALUES (?, ?, 'pending', 'pending', ?, ?)
            ");
            $order_stmt->bind_param("idss", $user_id, $total_amount, $payment_method, $address);
            $order_stmt->execute();
            $order_id = $conn->insert_id;

            // 5. Insert items
            $item_stmt = $conn->prepare("
                INSERT INTO order_items (order_id, product_id, quantity, price) 
                VALUES (?, ?, ?, ?)
            ");
            foreach ($cart_items as $item) {
                $item_stmt->bind_param("iiid", $order_id, $item['product_id'], $item['quantity'], $item['price']);
                $item_stmt->execute();
            }

            // 6. Clear cart (only for COD/offline orders. Online orders clear the cart when payment succeeds)
            if ($payment_method !== 'razorpay') {
                $clear_stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
                $clear_stmt->bind_param("i", $user_id);
                $clear_stmt->execute();
            }

            $rzp_order_id = null;
            $razorpay_key_id = $_ENV['RAZORPAY_KEY_ID'] ?? '';
            $razorpay_key_secret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';

            if ($payment_method === 'razorpay') {
                if (empty($razorpay_key_id) || empty($razorpay_key_secret)) {
                    throw new Exception("Razorpay API keys are not configured on the server.");
                }

                $ch = curl_init('https://api.razorpay.com/v1/orders');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERPWD, $razorpay_key_id . ':' . $razorpay_key_secret);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                    'amount' => round($total_amount * 100),
                    'currency' => 'INR',
                    'receipt' => 'order_rcptid_' . $order_id,
                ]));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                ]);
                $response = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curl_err = curl_error($ch);
                curl_close($ch);

                if ($response === false) {
                    throw new Exception("Razorpay API connection error: " . $curl_err);
                }

                $rzp_data = json_decode($response, true);
                if ($http_code === 200 && isset($rzp_data['id'])) {
                    $rzp_order_id = $rzp_data['id'];
                    $update_stmt = $conn->prepare("UPDATE orders SET razorpay_order_id = ? WHERE id = ?");
                    $update_stmt->bind_param("si", $rzp_order_id, $order_id);
                    $update_stmt->execute();
                } else {
                    $error_msg = $rzp_data['error']['description'] ?? 'Unknown Razorpay error';
                    throw new Exception("Failed to initiate online payment: " . $error_msg);
                }
            }

            $conn->commit();

            echo json_encode([
                "success" => true,
                "order_id" => $order_id,
                "total" => $total_amount,
                "item_count" => count($cart_items),
                "payment_method" => $payment_method,
                "razorpay_order_id" => $rzp_order_id,
                "razorpay_key_id" => $razorpay_key_id
            ]);
            break;

        case 'list':
            if (!$user_id) {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Unauthorised"]);
                exit;
            }

            $list_stmt = $conn->prepare("
                SELECT id, total_amount, status, payment_status, payment_method, created_at 
                FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            ");
            $list_stmt->bind_param("i", $user_id);
            $list_stmt->execute();
            $orders = $list_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            echo json_encode($orders);
            break;

        case 'get':
            if (!$user_id && empty($_SESSION['is_admin'])) {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Unauthorised"]);
                exit;
            }

            $id = $_GET['id'] ?? 0;
            
            if (!empty($_SESSION['is_admin'])) {
                $header_stmt = $conn->prepare("
                    SELECT o.id, o.total_amount, o.status, o.payment_status, o.payment_method, o.address, o.created_at, o.razorpay_order_id, o.razorpay_payment_id, o.razorpay_signature, u.name as customer_name, u.email as customer_email
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    WHERE o.id = ?
                ");
                $header_stmt->bind_param("i", $id);
            } else {
                $header_stmt = $conn->prepare("
                    SELECT id, total_amount, status, payment_status, payment_method, address, created_at, razorpay_order_id, razorpay_payment_id, razorpay_signature
                    FROM orders 
                    WHERE id = ? AND user_id = ?
                ");
                $header_stmt->bind_param("ii", $id, $user_id);
            }
            $header_stmt->execute();
            $order = $header_stmt->get_result()->fetch_assoc();

            if (!$order) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Order not found"]);
                exit;
            }

            $items_stmt = $conn->prepare("
                SELECT oi.product_id, p.name as product_name, p.image as product_image, oi.quantity, oi.price as unit_price, (oi.quantity * oi.price) as line_total 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            ");
            $items_stmt->bind_param("i", $id);
            $items_stmt->execute();
            $order['items'] = $items_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            echo json_encode($order);
            break;

        case 'list_all':
            if (empty($_SESSION['is_admin'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Unauthorised']);
                exit;
            }

            $filterStatus = trim($_GET['status'] ?? '');
            $filterBrand  = trim($_GET['brand'] ?? '');
            $filterSearch = trim($_GET['search'] ?? '');

            $allowed_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
            $allowed_brands   = ['silverythm', 'devaramane', 'udugore'];

            $where = [];
            $params = [];
            $types  = '';

            if ($filterStatus && in_array($filterStatus, $allowed_statuses)) {
                $where[] = 'o.status = ?';
                $params[] = $filterStatus;
                $types   .= 's';
            }
            if ($filterBrand && in_array($filterBrand, $allowed_brands)) {
                $where[] = 'p.brand = ?';
                $params[] = $filterBrand;
                $types   .= 's';
            }
            if ($filterSearch) {
                $like = '%' . $filterSearch . '%';
                $where[] = '(u.name LIKE ? OR u.email LIKE ? OR CAST(o.id AS CHAR) LIKE ?)';
                $params[] = $like; $params[] = $like; $params[] = $like;
                $types   .= 'sss';
            }

            $whereClause = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

            $sql = "
                SELECT 
                    o.id,
                    u.name, u.email, u.phone,
                    o.address,
                    o.total_amount as total,
                    o.status,
                    o.payment_method,
                    o.payment_status,
                    o.created_at,
                    COUNT(oi.id) as item_count,
                    GROUP_CONCAT(DISTINCT p.brand) as brand
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                $whereClause
                GROUP BY o.id
                ORDER BY o.created_at DESC
            ";

            if ($params) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query($sql);
            }

            echo json_encode(['success' => true, 'orders' => $result->fetch_all(MYSQLI_ASSOC)]);
            break;



        case 'update_status':
            verifyCsrf();
            requireAdmin();
            $data = json_decode(file_get_contents("php://input"), true);
            $order_id = (int)($data['order_id'] ?? 0);
            $status = $data['status'] ?? '';
            $payment_status = $data['payment_status'] ?? '';

            $allowed_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
            $allowed_payment_statuses = ['pending', 'paid', 'failed', 'refunded'];

            if (!$order_id || !$status) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'order_id and status required']);
                exit;
            }
            if (!in_array($status, $allowed_statuses)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid status value']);
                exit;
            }
            if ($payment_status && !in_array($payment_status, $allowed_payment_statuses)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid payment_status value']);
                exit;
            }

            if ($payment_status) {
                $stmt = $conn->prepare("UPDATE orders SET status = ?, payment_status = ? WHERE id = ?");
                $stmt->bind_param("ssi", $status, $payment_status, $order_id);
            } else {
                $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
                $stmt->bind_param("si", $status, $order_id);
            }
            $stmt->execute();
            echo json_encode(['success' => true, 'message' => 'Order updated']);
            break;

        case 'verify_payment':
            verifyCsrf();
            if (!$user_id) {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Unauthorised"]);
                exit;
            }

            $data = json_decode(file_get_contents("php://input"), true);
            $order_id = (int)($data['order_id'] ?? 0);
            $razorpay_payment_id = trim((string)($data['razorpay_payment_id'] ?? ''));
            $razorpay_order_id = trim((string)($data['razorpay_order_id'] ?? ''));
            $razorpay_signature = trim((string)($data['razorpay_signature'] ?? ''));

            if (!$order_id || !$razorpay_payment_id || !$razorpay_order_id || !$razorpay_signature) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing payment details for verification"]);
                exit;
            }

            // 1. Fetch order details to ensure it belongs to the user and matches the sent razorpay_order_id
            $stmt = $conn->prepare("SELECT id, payment_status, total_amount, razorpay_order_id FROM orders WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $order_id, $user_id);
            $stmt->execute();
            $order = $stmt->get_result()->fetch_assoc();

            if (!$order) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Order not found"]);
                exit;
            }

            if ($order['razorpay_order_id'] !== $razorpay_order_id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Razorpay Order ID mismatch"]);
                exit;
            }

            $razorpay_key_secret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
            if (empty($razorpay_key_secret)) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Razorpay key secret not configured on server"]);
                exit;
            }

            // 2. Verify Razorpay signature
            $generated_signature = hash_hmac(
                'sha256',
                $razorpay_order_id . '|' . $razorpay_payment_id,
                $razorpay_key_secret
            );

            if ($generated_signature === $razorpay_signature) {
                // 3. Signature is valid! Update order payment status
                $update_stmt = $conn->prepare("
                    UPDATE orders 
                    SET payment_status = 'paid', 
                        status = 'confirmed', 
                        razorpay_payment_id = ?, 
                        razorpay_signature = ? 
                    WHERE id = ?
                ");
                $update_stmt->bind_param("ssi", $razorpay_payment_id, $razorpay_signature, $order_id);
                $update_stmt->execute();

                // Clear user's cart on verified success
                $clear_stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
                $clear_stmt->bind_param("i", $user_id);
                $clear_stmt->execute();

                echo json_encode(["success" => true, "message" => "Payment verified successfully", "order_id" => $order_id]);
            } else {
                // 4. Invalid signature
                $update_stmt = $conn->prepare("
                    UPDATE orders 
                    SET payment_status = 'failed', 
                        razorpay_payment_id = ?, 
                        razorpay_signature = ? 
                    WHERE id = ?
                ");
                $update_stmt->bind_param("ssi", $razorpay_payment_id, $razorpay_signature, $order_id);
                $update_stmt->execute();

                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Payment verification failed. Invalid signature."]);
            }
            break;

        case 'invoice':
            if (!$user_id && empty($_SESSION['is_admin'])) {
                http_response_code(401);
                echo "Unauthorised";
                exit;
            }

            $id = (int)($_GET['id'] ?? 0);
            if (!$id) {
                http_response_code(400);
                echo "Order ID required";
                exit;
            }

            if (!empty($_SESSION['is_admin'])) {
                $header_stmt = $conn->prepare("
                    SELECT o.id, o.total_amount, o.status, o.payment_status, o.payment_method, o.address, o.created_at, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    WHERE o.id = ?
                ");
                $header_stmt->bind_param("i", $id);
            } else {
                $header_stmt = $conn->prepare("
                    SELECT o.id, o.total_amount, o.status, o.payment_status, o.payment_method, o.address, o.created_at, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    WHERE o.id = ? AND o.user_id = ?
                ");
                $header_stmt->bind_param("ii", $id, $user_id);
            }

            $header_stmt->execute();
            $order = $header_stmt->get_result()->fetch_assoc();

            if (!$order) {
                http_response_code(404);
                echo "Order not found";
                exit;
            }

            $items_stmt = $conn->prepare("
                SELECT oi.product_id, p.name as product_name, oi.quantity, oi.price as unit_price, (oi.quantity * oi.price) as line_total 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            ");
            $items_stmt->bind_param("i", $id);
            $items_stmt->execute();
            $items = $items_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            header("Content-Type: text/html; charset=UTF-8");
            ?>
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice #<?php echo $order['id']; ?></title>
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
                    .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-section h1 { margin: 0; font-size: 24px; color: #111827; }
                    .logo-section p { margin: 5px 0 0 0; color: #6b7280; font-size: 14px; }
                    .invoice-details { text-align: right; }
                    .invoice-details h2 { margin: 0; font-size: 20px; color: #374151; }
                    .invoice-details p { margin: 5px 0 0 0; color: #6b7280; font-size: 14px; }
                    .billing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .billing-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; }
                    .billing-box p { margin: 0 0 5px 0; font-size: 15px; color: #4b5563; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-weight: 600; font-size: 14px; }
                    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 15px; color: #1f2937; }
                    .text-right { text-align: right; }
                    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
                    .totals-table { width: 320px; }
                    .totals-table td { border: none; padding: 8px 0; }
                    .totals-table tr.grand-total td { font-weight: 700; font-size: 18px; border-top: 2px solid #e5e7eb; color: #111827; padding-top: 12px; }
                    .no-print-btn { display: inline-flex; align-items: center; gap: 8px; background: #111827; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; font-size: 14px; transition: background 0.2s; }
                    .no-print-btn:hover { background: #374151; }
                    .action-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <div class="logo-section">
                        <h1>Silverhythm</h1>
                        <p>Devaramane Collections</p>
                    </div>
                    <div class="invoice-details">
                        <h2>INVOICE</h2>
                        <p>Order ID: #<?php echo $order['id']; ?></p>
                        <p>Date: <?php echo date("d M Y, h:i A", strtotime($order['created_at'])); ?></p>
                    </div>
                </div>

                <div class="billing-section">
                    <div class="billing-box">
                        <h3>Customer Details</h3>
                        <p><strong>Name:</strong> <?php echo htmlspecialchars($order['customer_name'] ?? 'Guest'); ?></p>
                        <p><strong>Email:</strong> <?php echo htmlspecialchars($order['customer_email'] ?? ''); ?></p>
                        <p><strong>Phone:</strong> <?php echo htmlspecialchars($order['customer_phone'] ?? ''); ?></p>
                    </div>
                    <div class="billing-box">
                        <h3>Delivery Address</h3>
                        <p><?php echo nl2br(htmlspecialchars($order['address'])); ?></p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th class="text-right" style="width: 80px;">Qty</th>
                            <th class="text-right" style="width: 120px;">Price</th>
                            <th class="text-right" style="width: 120px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($items as $item): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($item['product_name']); ?></td>
                                <td class="text-right"><?php echo $item['quantity']; ?></td>
                                <td class="text-right">₹<?php echo number_format($item['unit_price'], 2); ?></td>
                                <td class="text-right">₹<?php echo number_format($item['line_total'], 2); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <div class="totals-section">
                    <table class="totals-table">
                        <tr>
                            <td>Payment Status:</td>
                            <td class="text-right" style="font-weight: 600; text-transform: uppercase;"><?php echo htmlspecialchars($order['payment_status']); ?></td>
                        </tr>
                        <tr>
                            <td>Payment Method:</td>
                            <td class="text-right" style="font-weight: 600; text-transform: uppercase;"><?php echo htmlspecialchars($order['payment_method']); ?></td>
                        </tr>
                        <tr class="grand-total">
                            <td>Total Paid:</td>
                            <td class="text-right">₹<?php echo number_format($order['total_amount'], 2); ?></td>
                        </tr>
                    </table>
                </div>

                <div class="action-bar no-print">
                    <span style="color: #6b7280; font-size: 14px;">Thank you for your order!</span>
                    <button onclick="window.print()" class="no-print-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print / Save PDF
                    </button>
                </div>
            </body>
            </html>
            <?php
            exit;

        default:
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid action"]);
            break;
    }
} catch (Exception $e) {
    if ($conn->in_transaction) $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
