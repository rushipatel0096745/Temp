<?php 

    session_start();
    
    ini_set('display_errors', 'On');
    error_reporting(E_ALL);

    require '../database/db_connect.php';

    $errMSg = $emailErr = $passwordErr = "";

    if($_SERVER["REQUEST_METHOD"] == "POST"){
        $email = $_POST["email"];
        $password = $_POST["password"];


        if(empty($email)){
            $emailErr = "Enter the email";
        } else {
            $emailErr = "";
        }
        if(empty($password)){
            $passwordErr = "Enter the password";
        } else {
            $passwordErr = "";
        }

        $check_email_sql = "SELECT * FROM users WHERE email = ?";
        $check_email_stmt = $conn->prepare($check_email_sql);
        $check_email_stmt->execute([$email]);
        $check_email = $check_email_stmt->fetchAll(PDO::FETCH_ASSOC);

        if($check_email){
            foreach($check_email as $d){
                $db_email = $d["email"];
                $db_password = $d["password_hash"];
                $db_user_id = $d["user_id"];
            } 
            $verify_password = password_verify($_POST["password"], $db_password);
            if($verify_password){
                $_SESSION["login_user_id"] = $db_user_id; 
                // echo "logged in";


                $guest_cart = $_SESSION["cart"] ?? [];

                $user_id = $_SESSION["login_user_id"];

                $stmt = $conn->prepare("SELECT cart_id FROM cart WHERE user_id = ?");
                $stmt->execute([$user_id]);
                $cart_id = $stmt->fetchColumn();

                if (!$cart_id) {
                    $stmt = $conn->prepare("INSERT INTO cart (user_id) VALUES (?)");
                    $stmt->execute([$user_id]);
                    $cart_id = $conn->lastInsertId();
                }

                // fetching existing cart items from database
                $stmt = $conn->prepare("SELECT p_id, quantity FROM cart_items WHERE cart_id = ?");
                $stmt->execute([$cart_id]);
                $db_items = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
                // $db_items[p_id] = quantity


                // merge guest cart with database cart
                foreach ($guest_cart as $product_id => $qty) {

                    if (isset($db_items[$product_id])) {
                        // Product exists then update quantity
                        $new_qty = $db_items[$product_id] + $qty;

                        $update = $conn->prepare(
                            "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND p_id = ?"
                        );
                        $update->execute([$new_qty, $cart_id, $product_id]);

                    } else {
                        // New product → insert
                        $insert = $conn->prepare(
                            "INSERT INTO cart_items (cart_id, p_id, quantity) VALUES (?, ?, ?)"
                        );
                        $insert->execute([$cart_id, $product_id, $qty]);
                    }
                }


                    $_SESSION["cart"] = [];

                    $stmt = $conn->prepare("SELECT p_id, quantity FROM cart_items WHERE cart_id = ?");
                    $stmt->execute([$cart_id]);
                    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    foreach ($items as $item) {
                        $_SESSION["cart"][$item["p_id"]] = $item["quantity"];
                    }


                header("Location: ./index.php");
                exit();     
            } else {
                $errMSg = "email or password is incorrect";
            }
        } else {
            $errMSg = "email or password is incorrect";
        }
    }

    // echo $_SESSION["login_user_id"] ?? 0;




?>

<!doctype html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
  </head>
  <body>
  <div class="container d-flex align-items-center justify-content-center vh-100"> 
            <form method="post" action="<?php echo $_SERVER["PHP_SELF"];?>" onsubmit="return submitHandler(event)">
                <div class="row mb-3 text-center">
                    <h1>Login</h1>
                </div>
                <div class="row mb-3">
                    <label for="email" class="col-sm-3 col-form-label">Email</label>
                    <div class="col-sm-9">
                    <input type="email" name="email" class="form-control req" id="inputEmail3">
                    <div class="text-danger">
                        <span class="bs-danger"><?php echo "$emailErr"; ?></span>
                    </div>
                    </div>
                </div>
                <div class="row mb-3">
                    <label for="inputPassword3" class="col-sm-3 col-form-label">Password</label>
                    <div class="col-sm-9">
                    <input type="password" name="password" class="form-control req" id="inputPassword3">
                    <div class="text-danger">
                        <span class="bs-danger"><?php echo "$passwordErr"; ?></span>
                    </div>
                    <div>
                        <a href="./forget_password/forget_password.php">forget password?</a>
                    </div>
                    </div>
                </div>
                <div class="row justify-content-center text-center text-danger">
                        <?php echo $errMSg ?>
                </div>
                <div class="row justify-content-center text-center" style="margin-top: 20px;">
                    <div class="col-auto">
                        <button type="submit" class="btn btn-primary">Login</button>
                    </div>
                </div>
                <div class="row justify-content-center text-center" style="margin-top: 10px;">
                    <div class="col-auto">
                        <a href="http://localhost/rushikesh/php_ecomm/user/signup.php">signup</a>
                    </div>
                </div>
        </form>

    </div>
    <script src="validation.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
  </body>
</html>