<?php
include 'db_config.php';

// Example: Fetching users from the WordPress table
$sql = "SELECT user_login, user_email FROM wpsf_users";
$result = $conn->query($sql);

$data = [];
while($row = $result->fetch_assoc()) {
    $data[] = $row;
}

header('Content-Type: application/json');
echo json_encode($data);
?>