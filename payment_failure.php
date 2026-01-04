<?php
// $status = $_POST["status"];
// $firstname = $_POST["firstname"];
// $amount = $_POST["amount"];
// $txnid = $_POST["txnid"];

// $posted_hash = $_POST["hash"];
// $key = $_POST["key"];
// $productinfo = $_POST["productinfo"];
// $email = $_POST["email"];
// $salt = "UkojH5TS";

// // Salt should be same Post Request 

// if (isset($_POST["additionalCharges"])) {
//     $additionalCharges = $_POST["additionalCharges"];
//     $retHashSeq = $additionalCharges . '|' . $salt . '|' . $status . '|||||||||||' . $email . '|' . $firstname . '|' . $productinfo . '|' . $amount . '|' . $txnid . '|' . $key;
// } else {
//     $retHashSeq = $salt . '|' . $status . '|||||||||||' . $email . '|' . $firstname . '|' . $productinfo . '|' . $amount . '|' . $txnid . '|' . $key;
// }
// $hash = hash("sha512", $retHashSeq);

// if ($hash != $posted_hash) {
//     echo "Invalid Transaction. Please try again";
// } else {
//     echo "<h3>Your order status is " . $status . ".</h3>";
//     echo "<h4>Your transaction id for this transaction is " . $txnid . ". You may try making the payment by clicking the link below.</h4>";
// }
?>


<?php
// Log the failure response
file_put_contents(__DIR__ . "/payu_failure_dump.txt",
    date('Y-m-d H:i:s') . "\n" . print_r($_POST, true) . "\n\n",
    FILE_APPEND
);

// Configure session settings
ini_set('session.cookie_lifetime', 86400);
ini_set('session.cookie_path', '/');
ini_set('session.cookie_secure', '0');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');

session_start();

ini_set("display_errors", "On");
error_reporting(E_ALL);

require __DIR__ . "/../../database/db_connect.php";
require "./PayU.php";
use APITestCode\PayU;

$payu = new PayU();
$payu->salt = "ha18Zct9kuxwAa0n33blItch8fpdMs6l";
$payu->key  = $_POST['key'] ?? '';

// Get payment details
$status        = $_POST["status"] ?? 'failed';
$firstname     = $_POST["firstname"] ?? '';
$amount        = $_POST["amount"] ?? '0';
$txnid         = $_POST["txnid"] ?? '';
$posted_hash   = $_POST["hash"] ?? '';
$key           = $_POST["key"] ?? '';
$productinfo   = $_POST["productinfo"] ?? '';
$email         = $_POST["email"] ?? '';
$error_message = $_POST["error_Message"] ?? $_POST["error"] ?? 'Payment failed';
$field         = $_POST["field"] ?? '';

$udf1 = $_POST['udf1'] ?? '';
$udf2 = $_POST['udf2'] ?? '';
$udf3 = $_POST['udf3'] ?? '';
$udf4 = $_POST['udf4'] ?? '';
$udf5 = $_POST['udf5'] ?? '';

// Verify hash for failure response (same as success)
$base = $payu->salt . '|' . $status;

if (!empty($_POST['additionalCharges'])) {
    $base .= '|' . $_POST['additionalCharges'];
}

$base .= '||||||' . $udf5 . '|' . $udf4 . '|' . $udf3 . '|' . $udf2 . '|' . $udf1 . '|' .
        $email . '|' . $firstname . '|' . $productinfo . '|' .
        $amount . '|' . $txnid . '|' . $key;

$calculatedHash = strtolower(hash('sha512', $base));

// Log hash verification
file_put_contents(__DIR__ . "/failure_hash_debug.txt",
    date('Y-m-d H:i:s') . "\n" .
    "Posted Hash: " . $posted_hash . "\n" .
    "Calculated Hash: " . $calculatedHash . "\n" .
    "Hash String: " . $base . "\n" .
    "Match: " . ($calculatedHash === $posted_hash ? 'YES' : 'NO') . "\n\n",
    FILE_APPEND
);

// Get order ID from session
$order_id = $_SESSION['current_order_id'] ?? 0;

// Update order status to FAILED
if ($order_id > 0 && !empty($txnid)) {
    $sql = "UPDATE orders 
            SET payment_status = 'FAILED',
                payment_txn_id = ?,
                payment_mode = 'ONLINE'
            WHERE order_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$txnid, $order_id]);
}

// Determine user-friendly error message
$user_message = "We're sorry, but your payment could not be processed.";
$error_details = $error_message;

switch (strtolower($status)) {
    case 'bounced':
        $user_message = "Your payment was declined by your bank.";
        $error_details = "Please check your card details or try a different payment method.";
        break;
    case 'failed':
        $user_message = "Payment processing failed.";
        break;
    case 'usercancel':
    case 'cancelled':
        $user_message = "You cancelled the payment.";
        $error_details = "No charges were made to your account.";
        break;
    case 'timeout':
        $user_message = "Payment session timed out.";
        $error_details = "Please try again.";
        break;
}

// Save session before rendering
session_write_close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }

        .icon-container {
            width: 100px;
            height: 100px;
            margin: 0 auto 30px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }

        .icon-container svg {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 3;
            fill: none;
        }

        h1 {
            color: #2d3748;
            font-size: 32px;
            margin-bottom: 15px;
        }

        .subtitle {
            color: #718096;
            font-size: 18px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .details-box {
            background: #f7fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #ff6b6b;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            color: #4a5568;
            font-weight: 600;
            font-size: 14px;
        }

        .detail-value {
            color: #2d3748;
            font-size: 14px;
            text-align: right;
        }

        .error-message {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #c53030;
            font-size: 14px;
        }

        .button-group {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            flex-wrap: wrap;
        }

        .btn {
            flex: 1;
            min-width: 150px;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }

        .btn-secondary:hover {
            background: #f7fafc;
            transform: translateY(-2px);
        }

        .support-text {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }

        .support-text a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .support-text a:hover {
            text-decoration: underline;
        }

        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
            }

            h1 {
                font-size: 24px;
            }

            .subtitle {
                font-size: 16px;
            }

            .button-group {
                flex-direction: column;
            }

            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-container">
            <svg viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>

        <h1>Payment Failed</h1>
        <p class="subtitle"><?= htmlspecialchars($user_message) ?></p>

        <?php if (!empty($error_details)): ?>
        <div class="error-message">
            <strong>Error:</strong> <?= htmlspecialchars($error_details) ?>
        </div>
        <?php endif; ?>

        <div class="details-box">
            <?php if ($order_id > 0): ?>
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#<?= htmlspecialchars($order_id) ?></span>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($txnid)): ?>
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value"><?= htmlspecialchars($txnid) ?></span>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($amount) && $amount > 0): ?>
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">₹<?= htmlspecialchars($amount) ?></span>
            </div>
            <?php endif; ?>
            
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #e53e3e; font-weight: 600;">
                    <?= htmlspecialchars(strtoupper($status)) ?>
                </span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value"><?= date('d M Y, h:i A') ?></span>
            </div>
        </div>

        <div class="button-group">
            <a href="/user/checkout.php" class="btn btn-primary">Try Again</a>
            <a href="/user/cart.php" class="btn btn-secondary">View Cart</a>
        </div>

        <div class="support-text">
            Need help? <a href="/contact.php">Contact Support</a> or call us at 1800-XXX-XXXX
        </div>
    </div>
</body>
</html>