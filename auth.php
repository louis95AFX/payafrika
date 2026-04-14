<?php
include 'db_config.php';

$action = $_GET['action'] ?? '';

if ($action == 'login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Querying the users table from your SQL dump
    $stmt = $conn->prepare("SELECT id, full_name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    // Note: If you stored plain text in your SQL dump, use ($password == $user['password'])
    if ($user && password_verify($password, $user['password'])) {
        echo json_encode(["status" => "success", "user" => $user['full_name']]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    }
}

if ($action == 'register') {
    $fname = $_POST['first_name'];
    $sname = $_POST['surname'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $pass  = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $fullname = $fname . " " . $sname;

    $stmt = $conn->prepare("INSERT INTO users (full_name, email, phone, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $fullname, $email, $phone, $pass);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Registration failed"]);
    }
}
?>