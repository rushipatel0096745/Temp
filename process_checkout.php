<?php
    namespace APITestCode;
    require_once('PayU.php');
    $payu_obj = new PayU();
    $payu_obj->env_prod = 0;
    $payu_obj->key = 'B8mbXl';
    $payu_obj->salt = 'ha18Zct9kuxwAa0n33blItch8fpdMs6l';


    ini_set("display_errors", "On");
    error_reporting(E_ALL);
    ini_set('session.cookie_lifetime', 86400); // 24 hours
    ini_set('session.cookie_path', '/');
    ini_set('session.cookie_secure', '0'); // Set to '1' if using HTTPS
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_start();

    require_once __DIR__ . "../../../constants.php";
    require __DIR__ . '../../../database/db_connect.php';

    $user_id = $_SESSION["login_user_id"] ?? 0;

    $payu_url = "https://test.payu.in/_payment";
    $key = "B8mbXl";
    $salt = "ha18Zct9kuxwAa0n33blItch8fpdMs6l"; 

    $firstname = $_POST["firstname"];
    $lastname = $_POST["lastname"];
    $email = $_POST["email"];
    $phone = $_POST["phone"];
    $address1 = $_POST["address1"];
    $country = $_POST["country"];
    $state = $_POST["state"];
    $city = $_POST["city"];
    $zipcode = $_POST["zipcode"]; 
    $amount = $_POST["amount"]; 
    $productinfo = $_POST["productinfo"];
    $paymentMethod = $_POST["paymentMethod"];
    // echo $productinfo . " " . $amount;
    // echo "payment method" . $_POST["paymentMethod"];

    

    $txnid = 'txn_' . uniqid();

    // $surl = 'http://localhost/rushikesh/php_ecomm/user/checkout/payment_success.php';
    $surl = 'http://localhost:3000/php_ecomm5/user/checkout/payment_success.php';
    $furl = 'http://localhost:3000/php_ecomm5/user/checkout/payment_failure.php';

    // create order 
    $order_sql = "INSERT INTO orders (u_id, order_total, payment_mode, payment_txn_id, payment_status) VALUES (?,?,?,?,?)";
    $order_stmt = $conn->prepare($order_sql);
    $order_stmt->execute([$user_id, floatval($amount), $paymentMethod, $txnid, "PENDING"]);
    $order_id = $conn->lastInsertId();
    $_SESSION["current_order_id"] = $order_id;

    // insert into the order items
    foreach($_SESSION["cart"] as $product_id => $quantity){
        // fetch price of product with product id
        $price_sql = "SELECT price from product WHERE p_id = $product_id";
        $price_stmt = $conn->prepare($price_sql);
        $price_stmt->execute();
        $price = $price_stmt->fetchColumn();

        $insert_order_item_sql = "INSERT INTO order_items (o_id, p_id, quantity, unit_price) VALUES (?,?,?,?)";
        $insert_order_item_stmt = $conn->prepare($insert_order_item_sql);
        $insert_order_item_stmt->execute([$order_id, $product_id, $quantity, $price]);
    }

    $payu_params = array();
    if($paymentMethod == "cod") {
        $update_sql = 'UPDATE orders SET payment_status = "SUCCESS" WHERE o_id = ?';
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->execute([$order_id]);
    } elseif ($paymentMethod == "online"){

        $res = $payu_obj->initGateway();

        $param['txnid'] = $txnid;
        $param['firstname'] = $firstname;
        $param['lastname'] = $lastname;
        // $param['amount'] = number_format($amount, 2, '.', '');
        $amount = floatval($_POST['amount']);
        $amount = number_format($amount, 2, '.', '');
        $param['amount'] = $amount;
        echo "Amount: " . $amount . "\n";
        $param['email'] = $email;
        $param['productinfo'] = $productinfo;
        $param['phone'] = $phone;
        $param['address1'] = $address1;
        $param['city'] = $city;
        $param['state'] = $state;
        $param['country'] = $country;
        $param['zipcode'] = $zipcode;
        $param['surl'] = $surl;
        $param['furl'] = $furl;
        // $param['udf1'] = 'test';


        $res = $payu_obj->showPaymentForm($param);

    }

?>