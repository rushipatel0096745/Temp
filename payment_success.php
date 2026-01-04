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
//     echo "<h3>Thank You. Your order status is " . $status . ".</h3>";
//     echo "<h4>Your Transaction ID for this transaction is " . $txnid . ".</h4>";
//     echo "<h4>We have received a payment of Rs. " . $amount . ". Your order will soon be shipped.</h4>";
// }
?>


<?php
file_put_contents(__DIR__ . "/payu_post_dump.txt",
    print_r($_POST, true),
    FILE_APPEND
);
ini_set("display_errors", "On");
error_reporting(E_ALL);
ini_set('session.cookie_lifetime', 86400); // 24 hours
ini_set('session.cookie_path', '/');
ini_set('session.cookie_secure', '0'); // Set to '1' if using HTTPS
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
session_start();
require __DIR__ . "/../../database/db_connect.php";
require "./PayU.php";
use APITestCode\PayU;

$payu = new PayU();
$payu->salt = "ha18Zct9kuxwAa0n33blItch8fpdMs6l";
$payu->key  = $_POST['key'];

$status        = $_POST["status"];
$firstname     = $_POST["firstname"];
$amount        = $_POST["amount"];
$txnid         = $_POST["txnid"];
$posted_hash   = $_POST["hash"];
$key           = $_POST["key"];
$productinfo   = $_POST["productinfo"];
$email         = $_POST["email"];

$udf1 = $_POST['udf1'] ?? '';
$udf2 = $_POST['udf2'] ?? '';
$udf3 = $_POST['udf3'] ?? '';
$udf4 = $_POST['udf4'] ?? '';
$udf5 = $_POST['udf5'] ?? '';

// CORRECTED: Response hash is in REVERSE order
$base = $payu->salt . '|' . $_POST['status'];

// Add additional charges if present (in reverse, it comes first after status)
if (!empty($_POST['additionalCharges'])) {
    $base .= '|' . $_POST['additionalCharges'];
}

// Continue with reverse order
$base .= '||||||' . $udf5 . '|' . $udf4 . '|' . $udf3 . '|' . $udf2 . '|' . $udf1 . '|' .
        $_POST['email'] . '|' . $_POST['firstname'] . '|' . $_POST['productinfo'] . '|' .
        $_POST['amount'] . '|' . $_POST['txnid'] . '|' . $_POST['key'];

$calculatedHash = strtolower(hash('sha512', $base));

// Debug: Log the hash comparison
file_put_contents(__DIR__ . "/hash_debug.txt",
    "Posted Hash: " . $_POST['hash'] . "\n" .
    "Calculated Hash: " . $calculatedHash . "\n" .
    "Hash String: " . $base . "\n\n",
    FILE_APPEND
);

if ($calculatedHash !== $_POST['hash']) {
    die("Invalid Transaction - Hash Mismatch");
}

/* ---------- PAYMENT VERIFIED ---------- */
$order_id = $_SESSION['current_order_id'] ?? 0;

/* Update order */
$sql = "UPDATE orders 
        SET payment_status = 'PAID',
            payment_txn_id = ?,
            payment_mode = 'ONLINE'
        WHERE o_id = ?";
$stmt = $conn->prepare($sql);
$stmt->execute([$txnid, $order_id]);

/* Clear cart */
unset($_SESSION['cart']);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Payment Success</title>
</head>
<body>
    <h2>Payment Successful</h2>
    <p>Order ID: <?= htmlspecialchars($order_id) ?></p>
    <p>Transaction ID: <?= htmlspecialchars($txnid) ?></p>
    <p>Amount Paid: ₹<?= htmlspecialchars($amount) ?></p>
    <a href="../orders.php">View My Orders</a>
</body>
</html>