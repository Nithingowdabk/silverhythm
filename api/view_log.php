<?php
header('Content-Type: text/plain');
if (file_exists('debug_products.log')) {
    echo file_get_contents('debug_products.log');
} else {
    echo "Log file not found.";
}
?>
