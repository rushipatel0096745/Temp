<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);
session_start();

if (!isset($_SESSION["login_user_id"])) {
    header("Location: ./login.php");
    exit();
} else {
    $user_id = $_SESSION["login_user_id"];
}

require '../database/db_connect.php';


$sql = "
        SELECT O.order_id, P.product_name, OI.order_id, OI.quantity, OI.unit_price, (OI.quantity * OI.unit_price) AS product_total, PI.url AS image, O.order_date, O.payment_mode, O.order_total
        FROM orders O
        JOIN order_items OI ON O.order_id = OI.order_id
        JOIn product P ON P.p_id = OI.p_id
        JOIN product_images PI ON PI.p_id = P.p_id
        WHERE PI.is_main = 1 AND O.user_id = ?
    ";

$stmt = $conn->prepare($sql);
$stmt->execute([$user_id]);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// print_r($orders);

$temp = [];
$order_ids = [];
foreach ($orders as $order) {
    $order_ids[] = $order["order_id"];
}

$order_ids = array_unique($order_ids);

print_r($order_ids);

foreach ($order_ids as $order_id) {
    $products = [];
    foreach ($orders as $order) {
        if ($order_id == $order["order_id"]) {
            $products += [
                "product_name" => $order["product_name"],
                "quantity" => $order["quantity"],
                "unit_price" => $order["unit_price"],
                "product_total" => $order["product_total"],
                "image" => $order["image"],
            ];
        }
        $temp[$order_id] = [
            "order_date" => $order["order_date"],
            "payment_mode" => $order["payment_mode"],
            "order_total" => $order["order_total"],
            "products" => $products
        ];
    }
}

print_r($temp);




?>

<!doctype html>
<html lang="en" data-bs-theme="dark">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Orders</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
</head>

<style>
    .dropdown-submenu {
        position: relative;
    }

    .dropdown-submenu>.dropdown-menu {
        top: 0;
        left: 100%;
        margin-left: .1rem;
    }

    .dropdown-submenu:hover>.dropdown-menu {
        display: block;
    }
</style>

<body>

    <div class="container-fluid m-0 p-0">

        <?php require '../user/components/user_navbar.php'; ?>

        <!-- listing all products -->
        <div class="products container">
            <div class="row">
                <div class="col-7">
                    <div class="row mt-3 mb-3">
                        <div class="col col-md-8">
                            <h1>Order Items</h1>
                        </div>
                    </div>
                    <?php if (empty($orders)) { ?>
                        <div>
                            No orders
                        </div>
                    <?php } else { ?>
                        <?php foreach ($orders as $o) { ?>
                            <div class="card mb-3" style="max-width: 540px;">
                                <div class="row g-0">
                                    <div class="col-md-4">
                                        <img src="<?php echo $o["image"] ?>" class="img-fluid rounded-start h-100" alt="..." width="200px">
                                    </div>
                                    <div class="col-md-8">
                                        <div class="card-body">
                                            <h5 class="card-title"><?php echo $o["product_name"] ?></h5>
                                            <p class="card-text">Quantity :
                                                <span id="quantity-<?php echo $o["p_id"] ?>"><?php echo $o["quantity"] ?></span>
                                            </p>
                                            <p class="card-text">Price : <?php echo $o["price"] ?></p>
                                            <p class="card-text">Order Date : <?php echo date("d M Y", strtotime($o["order_date"])) ?></p>
                                            <p class="card-text">Subtotal : <?php echo $o["price"] * $o["quantity"] ?></p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        <?php } ?>
                    <?php } ?>
                </div>
            </div>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
</body>

</html>