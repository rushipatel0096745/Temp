<?php 
    // ini_set("display_errors", "On");
    // error_reporting(E_ALL);
    // session_start();

    // require_once __DIR__ . "../../../constants.php";
    // require __DIR__ . '../../../database/db_connect.php';

    // $categories =[];

    // $name = $_GET["name"] ?? "";
    // $categories = $_GET["categories"];

    // // echo var_dump($name);
    // // echo var_dump($categories);

    // $categories = explode(",", $categories);
    // foreach($categories as &$c){
    //     $c = intval($c);
    // }
    // unset($c);
    // // echo var_dump($categories);

    // $base_sql = "
    //     SELECT P.p_id AS p_id, P.product_name AS product_name, P.price AS price, P.compare_price AS compare_price, P.image AS image, P.description AS description, GROUP_CONCAT(C.category_name) AS 'categories'
    //     FROM product P 
    //     LEFT JOIN product_category PC ON P.p_id = PC.p_id 
    //     LEFT JOIN category C ON C.c_id = PC.c_id
    //     GROUP BY P.p_id
    // ";x

    // $params = [];

    // // echo "block 0" . "<br>";

    // if($name == "undefined" and empty($categories)){
    //     $base_sql = $base_sql;
    //     // echo "block 1";
    // }
    // else if($name!="") {
    //     $pattern = "%" . $name . "%";
    //     $search_sql = $base_sql . " " . "HAVING product_name LIKE ?";
    //     $base_sql = $search_sql;
    //     $params = [$pattern];
    //     // echo "block 2";
    // }
    // else if ($name == "" and count($categories) !== 0){
    //     $placeholder = array_fill(0, count($categories), "?");
    //     $placeholder = implode(",", $placeholder);
    //     echo var_dump($categories) . " " . var_dump($placeholder) . " " . count($categories);
    //     $search_sql = "
    //         SELECT P.p_id AS p_id, P.product_name AS product_name, P.price AS price, P.compare_price AS compare_price, P.image AS image, P.description AS description, GROUP_CONCAT(C.category_name) AS 'categories'
    //         FROM product P 
    //         LEFT JOIN product_category PC ON P.p_id = PC.p_id 
    //         LEFT JOIN category C ON C.c_id = PC.c_id
    //         WHERE P.p_id IN (
    //             SELECT DISTINCT Pr.p_id FROM product Pr JOIN product_category PC ON Pr.p_id = PC.p_id WHERE PC.c_id IN ($placeholder)
    //         )
    //         GROUP BY P.p_id
    //     ";
    //     $base_sql = $search_sql;
    //     $params = $categories;
    //     echo "block 3";
    // }
    
    // $search_stmt = $conn->prepare($base_sql);
    // $search_stmt->execute($params);
    // $results = $search_stmt->fetchAll(PDO::FETCH_ASSOC);

    // if($results == null) {
    //     $results = [];
    // }

    // echo json_encode(["results" => $results]);

?>

<?php 
ini_set("display_errors", "On");
error_reporting(E_ALL);
session_start();

require_once __DIR__ . "../../../constants.php";
require __DIR__ . '../../../database/db_connect.php';

$name = $_GET["name"] ?? "";
$categories = $_GET["categories"] ?? [];

if (!is_array($categories)) {
    $categories = array_filter(explode(',', $categories));
}


$sql = "
SELECT 
    P.p_id,
    P.product_name,
    P.price,
    P.compare_price,
    P.image,
    P.description,
    GROUP_CONCAT(DISTINCT C.category_name) AS categories
FROM product P
JOIN product_category PC ON P.p_id = PC.p_id
JOIN category C ON C.c_id = PC.c_id
WHERE 1
";

$params = [];

/* 🔍 Search filter */
if (!empty($name) && $name !== "undefined") {
    $sql .= " AND P.product_name LIKE ? ";
    $params[] = "%$name%";
}

/* 📂 Category filter */
if (!empty($categories)) {
    $placeholders = implode(',', array_fill(0, count($categories), '?'));
    $sql .= " AND PC.c_id IN ($placeholders) ";
    $params = array_merge($params, $categories);
}

$sql .= " GROUP BY P.p_id ";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["results" => $results]);
?>