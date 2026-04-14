<?php
$host = "localhost";
$user = "payafrik_wp545"; // Use the user from wp-config
$pass = "SApy7)-63d";      // Use the password from wp-config
$db   = "payafrik_paydatas"; // The name from your SQL file

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>