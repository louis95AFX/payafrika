<?php
include 'db_config.php';

// In a real app, you'd get the ID from a secure session
$userId = 1; 

$sql = "SELECT u.full_name, w.balance, w.currency 
        FROM users u 
        JOIN wallets w ON u.id = w.user_id 
        WHERE u.id = $userId";

$result = $conn->query($sql);
echo json_encode($result->fetch_assoc());
?>