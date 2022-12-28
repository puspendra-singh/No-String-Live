var modulePath = __dirname + "/model/products";
var modelPath = "/admin/products";
var { body, check, validationResult } = require("express-validator");

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get products listing **/
app.get(modelPath, isUserLogedIn, async (req, res, next) => {
  
  var products = require(modulePath);
  products.getProductsList(req, res, next);
});

app.post(modelPath, isUserLogedIn, async (req, res, next) => {
  var products = require(modulePath);
  products.postProductsList(req, res, next);
});

/** Routing is used to add product **/
// app.get(modelPath + "/add", isUserLogedIn,function (req, res) {
//   var products = require(modulePath);
//   products.getAddProduct(req, res);

// });


// app.post(modelPath + "/add", isUserLogedIn, async (req, res) => {
//   await body('product_title')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_enter_product_title'))
//     .isLength({ min: MIN_PRODUCT_NAME_LIMIT, max: MAX_PRODUCT_NAME_LIMIT})
//     .withMessage(res.__('admin.user.product_title_should_be_2_to_50_characters_long'))
//     .run(req);

//   await body('model')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_enter_product_model'))
//     .isLength({ min: MIN_PRODUCT_NAME_LIMIT, max: MAX_PRODUCT_NAME_LIMIT})
//     .withMessage(res.__('admin.user.product_title_should_be_2_to_50_characters_long'))
//     .run(req);

//   await body('seller_name')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_seller_name'))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT}) 
//     // .withMessage(res.__('admin.user.seller_name_should_be_2_to_25_characters_long'))
//     .run(req);

//   await body('category')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_category'))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
//     // .withMessage(res.__('admin.user.category_must_have_2_to_25_characters'))
//     .run(req);

    
//     await body('condition')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_condition'))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
//     // .withMessage(res.__('admin.user.condition_must_have_2_to_25_characters'))
//     .run(req);
    
//     await body('brandlist')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_brand'))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
//     // .withMessage(res.__('admin.user.brandlist_must_have_2_to_25_characters'))
//     .run(req);
    
  
//   await body('wattage')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_wattage'))
//     .run(req);
  
//   await body('hashrate')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_hashrate'))
//     .run(req);
  
//     await body('indicative_price')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_enter_indicative_price'))
//     .isLength({ min: MIN_PRICE_LIMIT, max: MAX_PRICE_LIMIT})
//     .withMessage(res.__('admin.user.indicative_price_should_be_1_to_12_characters_long'))
//     .isNumeric()
//     .withMessage(res.__("admin.user.price_should_be_valid"))
//     .run(req);
    
//     await body('availability')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_availability'))
//     .run(req);

//     await body('quantity')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_enter_quantity'))
//     .isLength({ min: MIN_PRICE_LIMIT, max: MAX_PRICE_LIMIT})
//     .withMessage(res.__('admin.user.quantity_should_be_1_to_12_characters_long'))
//     .isNumeric()
//     .withMessage(res.__("admin.user.quantity_should_be_valid"))
//     .run(req);
    
//     await body('shipment_country')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_select_country'))
//     .run(req);  
//     await body('description')
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__('admin.user.please_enter_description'))
//     .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT})
//     .withMessage(res.__('admin.user.description_should_be_2_to_500_characters_long'))
//     .matches(DESCRIPTION_REGEX)
//     .withMessage(res.__('admin.user.description_should_be_valid'))
//     .run(req)
//     await body('specifications')
//       .trim()
//       .not()
//       .isEmpty()
//       .withMessage(res.__('admin.user.please_enter_specification'))
//       .run(req);  
      
//     const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
// if(req.files && req.files.image){
//   let file = (req.files) ? req.files.image : {};
//   if (Object.keys(file).length == 0) {
//     errors.push({location : 'files',param:'image',msg:res.__("admin.team.image_is_required"), value:''})
//   }
// }else{
//   errors.push({location : 'files',param:'image',msg:res.__("admin.team.image_is_required"), value:''})
// }
//     if(errors.length !== 0){
//       return res.send({
//         status: STATUS_ERROR,
//         message: errors,
//         rediect_url: "/products",
//       });
//     } 
//     else {
//       var products = require(modulePath);
//       products.postAddProduct(req, res);
//     }
// });

/** Routing is used to view  user detail**/
app.get(modelPath + "/view/:id", isUserLogedIn, (req, res) => {
  var products = require(modulePath);
  products.viewProductDetail(req, res);
});

/** Routing is used to edit  user detail**/
app.get(modelPath + "/edit/:id", isUserLogedIn, async (req, res) => {
  var products = require(modulePath);
  products.getEditProductDetail(req, res);
});

app.post(modelPath + "/edit/:id", isUserLogedIn, async (req, res) => {
  var country=req.body.shipment_country?req.body.shipment_country:[];
  await body('product_title')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_enter_product_title'))
    .isLength({ min: MIN_PRODUCT_NAME_LIMIT, max: MAX_PRODUCT_NAME_LIMIT})
    .withMessage(res.__('admin.user.product_title_should_be_2_to_50_characters_long'))
    .run(req);

  await body('model')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_enter_product_model'))
    .isLength({ min: MIN_PRODUCT_NAME_LIMIT, max: MAX_PRODUCT_NAME_LIMIT})
    .withMessage(res.__('admin.user.product_title_should_be_2_to_50_characters_long'))
    .run(req);
    
  await body('seller_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_seller_name'))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
    // .withMessage(res.__('admin.user.seller_name_should_be_2_to_25_characters_long'))
    .run(req);

  await body('category')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_category'))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
    // .withMessage(res.__('admin.user.category_must_have_2_to_25_characters'))
    .run(req);

    
    await body('condition')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_condition'))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
    // .withMessage(res.__('admin.user.condition_must_have_2_to_25_characters'))
    .run(req);
    
    await body('brandlist')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_brandlist'))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
    // .withMessage(res.__('admin.user.brandlist_must_have_2_to_25_characters'))
    .run(req);
    

    await body('wattage')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_wattage'))
    .run(req);

    await body('hashrate')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__('admin.user.please_select_hashrate'))
      .run(req);

  // await body('shipment_country').isArray()
    await body('indicative_price')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_enter_indicative_price'))
    // .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MIN_CHARACTER_TITLE_LIMIT})
    // .withMessage(res.__('admin.user.indicative_price_should_be_1_to_12_characters_long'))
    // .isNumeric()
    // .withMessage(res.__("admin.user.price_should_be_valid"))
    .run(req);
    
    await body('availability')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_availability'))
    .run(req);
    
    await body('quantity')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_enter_quantity'))
    .isLength({ min: MIN_PRICE_LIMIT, max: MAX_PRICE_LIMIT})
    .withMessage(res.__('admin.user.quantity_should_be_1_to_12_characters_long'))
    .isNumeric()
    .withMessage(res.__("admin.user.quantity_should_be_valid"))
    .run(req);
   if(country && country.length<1){
    await body('shipment_country')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_select_country'))
    .run(req);
   }
    await body('description')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__('admin.user.please_enter_description'))
      .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT})
      .withMessage(res.__('admin.user.description_should_be_2_to_500_characters_long'))
      .matches(DESCRIPTION_REGEX)
      .withMessage(res.__('admin.user.description_should_be_valid'))
      .run(req);

      
  const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
  // if(req.files && !req.files.image){
    // let file = (req.files) ? req.files.image : {};
    // if (Object.keys(file).length == 0) {
    //   errors.push({location : 'files',param:'image',msg:res.__("admin.team.image_is_required"), value:''})
    // }
  // }

  if(errors.length !== 0){
    return res.send({
      // status: STATUS_ERROR,
      message: errors,
      rediect_url: "/products",
    });
  } 
  else {
    var products = require(modulePath);
    products.postEditProductDetail(req, res);
  }
});

/** Routing is used to delete user **/
app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var product = require(modulePath);
  product.deleteProduct(req, res);
});

/** Routing is used to update product status **/
app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, (req, res) => {
    var product = require(modulePath);
    product.updateProductStatus(req, res);
  }
);

/** Routing is used to update product status **/
app.all(modelPath + "/product_approval/:id/:status", isUserLogedIn, (req, res,next) => {
  var product = require(modulePath);
  product.productApprovalStatus(req, res, next);
}
);
