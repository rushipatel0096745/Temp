  <?php
    ini_set('display_errors', 'On');
    error_reporting(E_ALL);

    session_start();
    if (!isset($_SESSION["admin"])) {
        header("Location: ../login.php");
        exit();
    }
    ?>

  <?php
    $product_id = intval($_GET["p_id"]);

    echo "$product_id";


    require __DIR__ . "/../../constants.php";
    require_once __DIR__ . "/../../database/db_connect.php";
    // echo "product_id: " . " " . $product_id;

    // fetch all categories
    $cat_sql = "SELECT * FROM category order by c_id";
    $cat_stmt = $conn->prepare($cat_sql);
    $cat_stmt->execute();
    $categories = $cat_stmt->fetchAll(PDO::FETCH_ASSOC);

    // fetch the current value
    $curre_sql = "SELECT * FROM product WHERE p_id = ?";
    $curr_stmt = $conn->prepare($curre_sql);
    $curr_stmt->execute([$product_id]);
    $current_data = $curr_stmt->fetchAll(PDO::FETCH_ASSOC);

    // echo var_dump($current_data) . "<br>";
    $product_name = $price = $compare_price = $image = $description = "";
    $existing_category = [];

    $exist_cat_sql = "SELECT c_id FROM product_category WHERE p_id = ?";
    $exist_cat_stmt = $conn->prepare($exist_cat_sql);
    $exist_cat_stmt->execute([$product_id]);
    $exist_cat = $exist_cat_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($exist_cat as $c) {
        $existing_category[] = $c["c_id"];
    }

    // echo var_dump($existing_category);

    foreach ($current_data as $cd) {
        $product_name = $cd["product_name"];
        $price = $cd["price"];
        $compare_price = $cd["compare_price"];
        // $image = $cd["image"];
        $description = $cd["description"];
    }

    // echo "product name: " . $current_data[0]["product_name"];


    // getting images for product
    $img_stmt = $conn->prepare("SELECT * FROM product_images WHERE p_id = ?");
    $img_stmt->execute([$product_id]);
    $images = $img_stmt->fetchAll(PDO::FETCH_ASSOC);


    function imageUpload($images, $target_dir = "/var/www/html/rushikesh/php_ecomm/")
    {
        // images is an array
        $allowed_types = array('jpg', 'png', 'jpeg', 'gif');

        // Define maxsize for files i.e 2MB
        $maxsize = 2 * 1024 * 1024;

        $response = [];
        $filenames = [];
        $error_msg = [];
        $file_error = "";

        // Checks if user sent an empty form 
        if (!empty(array_filter($images['name']))) {

            // Loop through each file in files[] array
            foreach ($images['tmp_name'] as $key => $value) {

                $file_tmpname = $images['tmp_name'][$key];
                $file_name = $images['name'][$key];
                $file_size = $images['size'][$key];
                $file_ext = pathinfo($file_name, PATHINFO_EXTENSION);

                // Set upload file path
                $filepath = $target_dir . $file_name;

                // Check file type is allowed or not
                if (in_array(strtolower($file_ext), $allowed_types)) {

                    // Verify file size - 2MB max 
                    if ($file_size > $maxsize)
                        // echo "Error: File size is larger than the allowed limit.";
                        $error_msg[] = "Error: File size is larger than the allowed limit.";

                    // If file with name already exist then append time in
                    // front of name of the file to avoid overwriting of file
                    if (file_exists($filepath)) {
                        $filepath = $target_dir . time() . $file_name;  //target_dir/time().filename

                        if (move_uploaded_file($file_tmpname, $filepath)) {
                            // echo "{$file_name} successfully uploaded <br />";
                            $filenames[] = time() . $file_name;
                        } else {
                            $error_msg[] = "Error uploading {$file_name} <br />";
                        }
                    } else {

                        if (move_uploaded_file($file_tmpname, $filepath)) {
                            // echo "{$file_name} successfully uploaded <br />";
                            $filenames[] = $file_name;
                        } else {
                            $error_msg[] = "Error uploading {$file_name} <br />";
                        }
                    }
                } else {
                    // If file extension not valid
                    $error_msg[] = "({$file_ext} file type is not allowed)<br / >";
                }
            }
        } else {
            // If no files selected
            $error_msg[] = "No files selected.";
        }
        $response["filenames"] = $filenames;
        $response["error_msg"] = $error_msg;
        return $response;
    }


    $p_nameErr = $catErr = $priceErr = $comparePriceErr = $descriptionErr = $imageErr = "";


    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $p_id = intval($_POST["p_id"]);

        echo "p_id: " . $p_id;
        // foreach($cats as $c){
        //     echo $c . "<br>";
        // }

        if (empty($_POST["product_name"])) {
            $p_nameErr = "Enter the product name";
        } else {
            $product_name = $_POST["product_name"];
        }
        if (empty($_POST["categories"])) {
            $catErr = "select the category";
        } else {
            $product_category = $_POST["categories"];
        }
        if (empty($_POST["price"])) {
            $priceErr = "Enter the price";
        } else {
            $price = (float)$_POST["price"];
        }
        if (empty($_POST["compare_price"])) {
            $comparePriceErr = "Enter the compare price";
        } else {
            $compare_price = $_POST["compare_price"];
        }
        if (empty($_POST["image"])) {
            $imageErr = "Enter the image url";
        } else {
            $image = $_POST["image"];
        }
        if (empty($_POST["description"])) {
            $descriptionErr = "Enter the description";
        } else {
            $description = $_POST["description"];
        }

        // echo "product name: " . $product_name . "<br>";
        // echo "product price: " . $price . "<br>";
        // echo "product cprice: " . $compare_price . "<br>";
        // echo "product image: " . $image . "<br>";
        // echo "product description: " . $description . "<br>";
        // echo var_dump($product_category);    

        $remove_images = $_POST["remove_images"];
        $main_img = $_POST["main_img"] ?? 0;
        $upload_images = $_FILES["images"] ?? [];

        
        echo var_dump($_POST);


        if ($p_nameErr == "" and $catErr == "" and $priceErr == "" and $comparePriceErr == "" and $imageErr == "" and $descriptionErr == "" and !empty($p_id)) {

            try {
                // upadate into products table
                $update_sql = "UPDATE product SET product_name = ?, price = ?, compare_price = ?, image = ?, description = ? WHERE p_id = ?";
                $update_stmt = $conn->prepare($update_sql);
                $update_stmt->execute([$product_name, floatval($price), floatval($compare_price), $image, $description, $p_id]);

                // delete exisiting categories for product in product_category table
                $delete_sql = "DELETE FROM product_category WHERE p_id = ?";
                $delete_stmt = $conn->prepare($delete_sql);
                $delete_stmt->execute([$p_id]);

                // insert new selected categories
                foreach ($product_category as $pc) {
                    // insert into product category table
                    echo "pc: " . $pc;
                    $insert_pc_sql = "INSERT INTO product_category (p_id, c_id) VALUES (?, ?)";
                    $insert_pc_stmt = $conn->prepare($insert_pc_sql);
                    $insert_pc_stmt->execute([$p_id, intval($pc)]);
                }


                // removing images
                if (count($remove_images) > 0) {
                    $placeholders = implode(', ', array_fill(0, count($remove_images), "?"));
                    $remove_stmt = $conn->prepare("DELETE FROM product_images WHERE id IN ($placeholders)");
                    $remove_stmt->execute($remove_images);
                }

                //update is_main for image

                // first marking all prodcut image is_main to false
                $setting_false_stmt = $conn->prepare("UPDATE product_images SET is_main = ? WHERE p_id = ?");
                $setting_false_stmt->execute([0, $product_id]);

                // seting new is main for product
                $update_is_main_stmt = $conn->prepare("UPDATE product_images SET is_main = ? WHERE id = ?");
                $update_is_main_stmt->execute([1, intval($main_img)]);

                // if there any new images then upload 
                if (!empty($upload_images)) {
                    if (isset($_POST["submit"])) {
                        $image_data = imageUpload($upload_images);
                        $image_names = $image_data["filenames"];

                        foreach ($image_names as $img) {
                            $insert_image_stmt = $conn->prepare("INSERT INTO product_images(url, p_id, is_main) VALUES (?,?,?)");
                            $insert_image_stmt->execute([$img, $product_id, 0]);
                        }
                    }
                }

                $_SESSION["success"] = "Product updated successfully";
                header("Location: ../all_products.php");
                exit();
            } catch (PDOException $e) {
                echo "<br>" . $e->getMessage();
            }
        }
    }
    ?>


  <!doctype html>
  <html lang="en" data-bs-theme="dark">

  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Update Product</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
  </head>

  <body>
      <div class="container d-flex align-items-center justify-content-center vh-100">
          <div class="row">
              <div class="col col-md-12">
                  <div class="card">
                      <div class="card-header">
                          Update Product
                      </div>
                      <div class="card-body">
                          <form method="post" action="<?php echo $_SERVER["PHP_SELF"]; ?>" id="product_update" onsubmit="return submitHandler(event)">

                              <label for="product_name">Product name</label>
                              <input type="text" name="product_name" class="form-control mb-2 req" value="<?php echo $product_name ?>">
                              <div class="text-danger"><?php echo $p_nameErr ?></div>

                              <label for="category">Categories</label>
                              <?php foreach ($categories as $cat) { ?>
                                  <div class="form-check mt-2">
                                      <input class="form-check-input req" type="checkbox" name="categories[]"
                                          value="<?php echo $cat["c_id"] ?>" <?php echo in_array($cat["c_id"], $existing_category) ? 'checked' : ' '; ?>>
                                      <label class="form-check-label"><?php echo $cat["category_name"] ?></label>
                                      <div class="text-danger"><?php echo $catErr ?></div>
                                  </div>
                              <?php } ?>

                              <label for="price">Price</label>
                              <input type="text" name="price" class="form-control mb-2 req" value="<?php echo $price ?>">
                              <div class="text-danger"><?php echo $priceErr ?></div>


                              <label for="compare_price">Compare Price</label>
                              <input type="text" name="compare_price" class="form-control mb-2 req" value="<?php echo $compare_price ?>">
                              <div class="text-danger"><?php echo $comparePriceErr ?></div>


                              <!-- <label for="image">Image url</label>
                                  <input type="text" name="image" class="form-control mb-2 req" value="<?php echo $image ?>">
                                  <div class="text-danger"><?php // echo $imageErr
                                                            ?></div> -->


                              <label for="description">Description</label>
                              <textarea class="form-control req" name="description"><?php echo $description ?></textarea>
                              <div class="text-danger"><?php echo $descriptionErr ?></div>

                              <div class="row mt-3">
                                  <label for="">Product Images</label>

                                  <!-- displaying all images -->
                                  <div class="row mt-3">
                                      <?php foreach ($images as $img): ?>
                                          <div class="col-3">
                                              <div>
                                                  <input type="radio" name="main_img" <?php echo $img['is_main'] == 1 ? "checked" : "" ?> value="<?php echo $img['is_main'] ?>"> <span>main img</span>
                                                  <input type="checkbox" name="remove_images[]" value="<?php echo $img['id'] ?>" id="">
                                                  <img src="<?php echo IMG_PATH . $img['url'] ?>" alt="" style="width: 100px; height: 100px;">
                                              </div>
                                          </div>
                                      <?php endforeach ?>
                                  </div>

                                  <div class="col mt-3">
                                      <label for="">Add images</label>
                                      <input class="" type="file" name="images[]" id="imageUploadInput" accept="image/*" multiple>
                                  </div>
                              </div>


                              <input type="hidden" name="p_id" value="<?php echo $product_id ?>">
                              <input type="submit" class="btn btn-primary mt-3"></input>
                          </form>
                      </div>
                  </div>
              </div>


          </div>
      </div>
      <script>
          const updateForm = document.getElementById("product_update");
      </script>


      <script src="validation.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
  </body>


  </html>

ix-H81M-S:~/Rushikesh$ composer create-project --prefer-dist yiisoft/yii2-app-basic yii_ecomm
Creating a "yiisoft/yii2-app-basic" project at "./yii_ecomm"
Installing yiisoft/yii2-app-basic (2.0.54)
  - Installing yiisoft/yii2-app-basic (2.0.54): Extracting archive
Created project in /home/corewix/Rushikesh/yii_ecomm
Loading composer repositories with package information
Updating dependencies
Your requirements could not be resolved to an installable set of packages.

  Problem 1
    - yiisoft/yii2[2.0.45, ..., 2.0.48.1] require bower-asset/jquery 3.6.*@stable | 3.5.*@stable | 3.4.*@stable | 3.3.*@stable | 3.2.*@stable | 3.1.*@stable | 2.2.*@stable | 2.1.*@stable | 1.11.*@stable | 1.12.*@stable -> could not be found in any version, but the following packages provide it:
      - yidas/yii2-bower-asset Bower Assets for Yii 2 app provided via Composer repository
      - craftcms/cms Craft CMS
      - yidas/yii2-composer-bower-skip A Composer package that allows you to install or update Yii2 without Bower-Asset
      - demokn/yii2-composer-asset
      - lsat/yii2-bower-asset Bower Assets for Yii 2 app provided via Composer repository
      - kriss/yii2-calendar-schedule Yii2 Calendar Schedule
      - yidas/yii2-jquery jQuery Asset Bundle extension with fixed and CDN sources for Yii2 framework
      - craftcms/yii2-dynamodb Yii2 implementation of a cache, session, and queue driver for DynamoDB
      - jamband/yii2-schemadump Generate the schema from an existing database
      - craftcms/yii2-adapter Craft CMS Yii2 adapter
      - umono/yaa-yii2 一个基于Vue3 yii2 的后台框架，可快速助你开发。
      - maiscrm/yii2-composer-bower-skip A Composer package that allows you to install or update Yii2 without Bower-Asset
      - kriss/yii2-amap Yii2 Amap
      - blackhive/yii2-app-advanced Yii 2 Advanced Project Template
      - cliff363825/yii2-bower-asset Yii2 bower asset
      - getdkan/recline recline.js module for DKAN/Drupal
      - jamband/yii2-ensure-unique-behavior This extension insert unique identifier automatically for the Yii 2 framework
      - kriss/yii2-advanced Yii2 advanced project template, Frontend for API and Backend with AdminLTE
      - kriss/yii2-geo Yii2 GEO
      - maniakalen/tags Yii2 Element tags integration module
      ... and 11 more.
      Consider requiring one of these to satisfy the bower-asset/jquery requirement.
    - yiisoft/yii2[2.0.49, ..., 2.0.54] require bower-asset/jquery 3.7.*@stable | 3.6.*@stable | 3.5.*@stable | 3.4.*@stable | 3.3.*@stable | 3.2.*@stable | 3.1.*@stable | 2.2.*@stable | 2.1.*@stable | 1.11.*@stable | 1.12.*@stable -> could not be found in any version, but the following packages provide it:
      - yidas/yii2-bower-asset Bower Assets for Yii 2 app provided via Composer repository
      - craftcms/cms Craft CMS
      - yidas/yii2-composer-bower-skip A Composer package that allows you to install or update Yii2 without Bower-Asset
      - demokn/yii2-composer-asset
      - lsat/yii2-bower-asset Bower Assets for Yii 2 app provided via Composer repository
      - kriss/yii2-calendar-schedule Yii2 Calendar Schedule
      - yidas/yii2-jquery jQuery Asset Bundle extension with fixed and CDN sources for Yii2 framework
      - craftcms/yii2-dynamodb Yii2 implementation of a cache, session, and queue driver for DynamoDB
      - jamband/yii2-schemadump Generate the schema from an existing database
      - craftcms/yii2-adapter Craft CMS Yii2 adapter
      - umono/yaa-yii2 一个基于Vue3 yii2 的后台框架，可快速助你开发。
      - maiscrm/yii2-composer-bower-skip A Composer package that allows you to install or update Yii2 without Bower-Asset
      - kriss/yii2-amap Yii2 Amap
      - blackhive/yii2-app-advanced Yii 2 Advanced Project Template
      - cliff363825/yii2-bower-asset Yii2 bower asset
      - getdkan/recline recline.js module for DKAN/Drupal
      - jamband/yii2-ensure-unique-behavior This extension insert unique identifier automatically for the Yii 2 framework
      - kriss/yii2-advanced Yii2 advanced project template, Frontend for API and Backend with AdminLTE
      - kriss/yii2-geo Yii2 GEO
      - maniakalen/tags Yii2 Element tags integration module
      ... and 11 more.
      Consider requiring one of these to satisfy the bower-asset/jquery requirement.
    - Root composer.json requires yiisoft/yii2 ~2.0.45 -> satisfiable by yiisoft/yii2[2.0.45, ..., 2.0.54].

Potential causes:
 - A typo in the package name
 - The package is not available in a stable-enough version according to your minimum-stability setting
   see <https://getcomposer.org/doc/04-schema.md#minimum-stability> for more details.
 - It's a private package and you forgot to add a custom repository to find it

Read <https://getcomposer.org/doc/articles/troubleshooting.md> for further common problems.
