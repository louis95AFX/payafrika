<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

function safe_json_encode($data) {
if (function_exists('json_encode')) {
return json_encode($data);
} else {
// Simple fallback for basic arrays
if (isset($data['error'])) {
return '{"error":"' . addslashes($data['error']) . '"}';
} elseif (isset($data['success'])) {
return '{"success":' . ($data['success'] ? 'true' : 'false') . ',"message":"' . addslashes($data['message']) . '"}';
}
return '{"error":"JSON encoding not available"}';
}
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
http_response_code(405);
echo safe_json_encode(['error' => 'Method not allowed']);
exit;
}

// Sanitize and validate input
function sanitizeInput($data) {
return htmlspecialchars(strip_tags(trim($data)));
}

function validateEmail($email) {
return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Get form data
$issue = sanitizeInput($_POST['issue'] ?? '');
$fullName = sanitizeInput($_POST['fullName'] ?? '');
$contactNumber = sanitizeInput($_POST['contactNumber'] ?? '');
$emailAddress = sanitizeInput($_POST['emailAddress'] ?? '');
$description = sanitizeInput($_POST['description'] ?? '');

// Validate required fields
$errors = [];
if (empty($issue)) $errors[] = 'Issue type is required';
if (empty($fullName)) $errors[] = 'Full name is required';
if (empty($contactNumber)) $errors[] = 'Contact number is required';
if (empty($emailAddress) || !validateEmail($emailAddress)) $errors[] = 'Valid email address is required';
if (empty($description)) $errors[] = 'Description is required';

if (!empty($errors)) {
http_response_code(400);
echo safe_json_encode(['error' => 'Validation failed: ' . implode(', ', $errors)]);
exit;
}

// Map issue types to readable names
$issueTypes = [
'general' => 'General Inquiry',
'loan' => 'Loan Application',
'complaint' => 'Complaint',
'support' => 'Technical Support',
'partnership' => 'Partnership'
];

$issueTypeName = $issueTypes[$issue] ?? $issue;

// Email configuration
$to = 'info@payafrika.co.za';
$subject = 'Contact Form Submission - ' . $issueTypeName . ' - ' . $fullName;
$headers = [
'From: noreply@payafrika.co.za',
'Reply-To: ' . $emailAddress,
'X-Mailer: PHP/' . phpversion(),
'Content-Type: text/html; charset=UTF-8'
];

// Create email body
$emailBody = "
<!DOCTYPE html>
<html>
<head>
<meta charset='UTF-8'>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.header { background: #182f57; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; }
.field { margin-bottom: 15px; }
.field strong { display: inline-block; width: 150px; }
.description { background: #f8f9fa; padding: 15px; border-left: 4px solid #84f4fc; margin: 20px 0; }
.footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
</style>
</head>
<body>
<div class='header'>
<h2>Contact Form Submission</h2>
<p>{$issueTypeName}</p>
</div>

<div class='content'>
<div class='field'><strong>Full Name:</strong> {$fullName}</div>
<div class='field'><strong>Contact Number:</strong> {$contactNumber}</div>
<div class='field'><strong>Email Address:</strong> {$emailAddress}</div>
<div class='field'><strong>Issue Type:</strong> {$issueTypeName}</div>

<div class='description'>
<h3>Description:</h3>
<p>{$description}</p>
</div>
</div>

<div class='footer'>
<p>This message was submitted through the PayAfrika website contact form.</p>
<p>Submitted on: " . date('Y-m-d H:i:s') . "</p>
</div>
</body>
</html>
";

// Send email
$success = mail($to, $subject, $emailBody, implode("\r\n", $headers));

if ($success) {
echo safe_json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
http_response_code(500);
echo safe_json_encode(['error' => 'Failed to send email']);
}
?>