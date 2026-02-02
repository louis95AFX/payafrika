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
$businessName = sanitizeInput($_POST['businessName'] ?? '');
$businessAddress = sanitizeInput($_POST['businessAddress'] ?? '');
$businessWhatsApp = sanitizeInput($_POST['businessWhatsApp'] ?? '');
$businessMobile = sanitizeInput($_POST['businessMobile'] ?? '');
$businessTelephone = sanitizeInput($_POST['businessTelephone'] ?? '');
$businessEmail = sanitizeInput($_POST['businessEmail'] ?? '');
$contactName = sanitizeInput($_POST['contactName'] ?? '');
$contactPosition = sanitizeInput($_POST['contactPosition'] ?? '');
$contactWhatsApp = sanitizeInput($_POST['contactWhatsApp'] ?? '');
$contactMobile = sanitizeInput($_POST['contactMobile'] ?? '');
$contactEmail = sanitizeInput($_POST['contactEmail'] ?? '');
$projectDescription = sanitizeInput($_POST['projectDescription'] ?? '');

// Validate required fields
$errors = [];
if (empty($businessName)) $errors[] = 'Business name is required';
if (empty($businessAddress)) $errors[] = 'Business address is required';
if (empty($businessEmail) || !validateEmail($businessEmail)) $errors[] = 'Valid business email is required';
if (empty($contactName)) $errors[] = 'Contact name is required';
if (empty($contactEmail) || !validateEmail($contactEmail)) $errors[] = 'Valid contact email is required';
if (empty($projectDescription)) $errors[] = 'Project description is required';

if (!empty($errors)) {
http_response_code(400);
echo safe_json_encode(['error' => 'Validation failed: ' . implode(', ', $errors)]);
exit;
}

// Email configuration
$to = 'info@payafrika.co.za';
$subject = 'B2B Payment Facilitation Inquiry - ' . $businessName;
$headers = [
'From: noreply@payafrika.co.za',
'Reply-To: ' . $contactEmail,
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
.section { margin-bottom: 25px; }
.section h3 { color: #182f57; border-bottom: 2px solid #84f4fc; padding-bottom: 5px; }
.field { margin-bottom: 10px; }
.field strong { display: inline-block; width: 200px; }
.footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
</style>
</head>
<body>
<div class='header'>
<h2>B2B Payment Facilitation Inquiry</h2>
</div>

<div class='content'>
<div class='section'>
<h3>Company Details</h3>
<div class='field'><strong>Business Name:</strong> {$businessName}</div>
<div class='field'><strong>Business Address:</strong> {$businessAddress}</div>
<div class='field'><strong>Business WhatsApp:</strong> {$businessWhatsApp}</div>
<div class='field'><strong>Business Mobile:</strong> {$businessMobile}</div>
" . (!empty($businessTelephone) ? "<div class='field'><strong>Business Telephone:</strong> {$businessTelephone}</div>" : "") . "
<div class='field'><strong>Business Email:</strong> {$businessEmail}</div>
</div>

<div class='section'>
<h3>Contact Person</h3>
<div class='field'><strong>Name:</strong> {$contactName}</div>
<div class='field'><strong>Position:</strong> {$contactPosition}</div>
<div class='field'><strong>WhatsApp:</strong> {$contactWhatsApp}</div>
<div class='field'><strong>Mobile:</strong> {$contactMobile}</div>
<div class='field'><strong>Email:</strong> {$contactEmail}</div>
</div>

<div class='section'>
<h3>Project Description</h3>
<p>{$projectDescription}</p>
</div>
</div>

<div class='footer'>
<p>This inquiry was submitted through the PayAfrika website B2B Payment Facilitation form.</p>
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