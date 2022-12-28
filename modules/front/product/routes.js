const { ObjectId } = require("bson");
const { body } = require("express-validator");
const bcrypt = require('bcryptjs');

/** Model file path for current plugin **/
const modelPath = __dirname + "/model/product";
const product = require(modelPath);

/** Routing is used to user signup **/
routes.post(API_URL + "products", (req, res, next) => {
  product.getProductsList(req, res, next);
})

/** Routing is used to user signup **/
routes.get(API_URL + "categories", (req, res, next) => {
  product.getCategoriesList(req, res, next);
})

/** Routing is used get all master's list with product count **/
routes.get(API_URL + "get_all_masters_list_with_count", (req, res, next) => {
  product.getAllMastersListWithCount(req, res, next);
})

/** Routing is used to user signup **/
routes.get(API_URL + "conditions", (req, res, next) => {
  product.getConditionsList(req, res, next);
})

/** Routing is used to user signup **/
routes.get(API_URL + "brandlist", (req, res, next) => {
  product.getBrandsList(req, res, next);
})

/** Routing is used to user signup **/
routes.get(API_URL + "availability", (req, res, next) => {
  product.getAvailabilityList(req, res, next);
})

routes.post(API_URL + "wattage_hashrate", (req, res, next) => {
  product.getWattageAndHashrate(req, res, next);
})
/** Routing is used to user signup **/
routes.post(API_URL + "add_product/:userId",isUserLogedInApi, async (req, res, next) => {
  await body('productName')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.product_name_cannot_be_empty"))
    .run(req);
  await body('category')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.category_cannot_be_empty"))
    .run(req);
  await body('brand')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.brand_cannot_be_empty"))
    .run(req);
  await body('condition')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.condition_cannot_be_empty"))
    .run(req);
  await body('quantity')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__("front.user.quantity_cannot_be_empty"))
  .isNumeric()
  .withMessage(res.__("front.user.quantity_should_be_valid"))
  .run(req)
  await body('price')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.price_cannot_be_empty"))
    .matches(PRICE_REGEX)
    .withMessage(res.__("front.user.price_should_be_valid"))
    .run(req);
  await body('availability')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.availabilty_cannot_be_empty"))
      .run(req);
      
  await body('shipmentCountry').isArray()
   
  await body('shipmentCountry.*')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.shipment_country_cannot_be_empty"))
    .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT})
    .withMessage(res.__("front.user.shipment_country_should_be_valid"))
    .run(req);
  await body('productDes')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.description_cannot_be_empty"))
    .run(req);
  product.addProduct(req, res, next);
})

/** Routing is used to get edit product **/
routes.get(API_URL + "get_edit_product/:userId/:productId", async (req, res, next) => {
  product.getEditProduct(req, res, next);
})
/** Routing is used to get my products **/
routes.get(API_URL + "get_my_products/:userId", async (req, res, next) => {
  product.getMyProducts(req, res, next);
})
/** Routing is used to get view product detail**/
routes.post(API_URL + "view_product_details", (req, res, next) => {
  product.viewProductDetails(req, res, next);
})
/** Routing is used to delete product **/
routes.post(API_URL + "delete_product",isUserLogedInApi, (req, res, next) => {
  product.deleteProduct(req, res, next);
})

/** Routing is used to get all messages and info about user and product **/
routes.post(API_URL + "get_chat_details",isUserLogedInApi, (req, res, next) => {
  product.getChatDetails(req, res, next);
})

/** Routing is used to config the conversation id **/
routes.post(API_URL + "config_conversation",isUserLogedInApi, (req, res, next) => {
  product.configConversation(req, res, next);
})

/** Routing is used to get all chats **/
routes.post(API_URL + "get_chat_history", isUserLogedInApi, (req, res, next) => {
  product.getChatsHistory(req, res, next);  
})

/** Routing is used to update action of offer **/
routes.post(API_URL + "mark_offer_as", (req, res, next) => {
  product.updateOfferAction(req, res, next);  
})

/** Routing is used to update action of offer **/
routes.post(API_URL + "update_seen_messages", (req, res, next) => {
  product.updateSeenMessages(req, res, next);  
})

/** Routing is used to place order **/
routes.post(API_URL + "place_order", isUserLogedInApi, (req, res, next) => {
  const orders  = req.body.order_products ? req.body.order_products : [];
  const collection = db.collection("products");
  orders.forEach((order,i)=>{
    collection.aggregate([
      {$match:{
          _id : ObjectId(order.product_id),
          is_active : ACTIVE,
          is_deleted : NOT_DELETED
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: "$user"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$userId'] }],
                },
              },
            },
            { $project: { user_type: 1 } },
          ],
          as: 'userDetail',
        },
      },
      {
        $project:{
          quantity: 1,
          userDetail: {"$arrayElemAt":["$userDetail",0]}
        }
      }
    ]).toArray((error,data)=>{
      let result=data[0];
        if(!error && result){
          if(Number(result.quantity) >= Number(order.quantity)){
            /** Place order if all products are available in stock */
            if(result.userDetail.user_type==0){
              let date = new Date();
              let startDate = new Date(date.getFullYear(), date.getMonth(), 1);
              let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
              db.collection("orders").aggregate([
                {
                  $match:{
                    seller_id:result.userDetail._id,
                    $and:[
                      {created:{$gt:startDate}},
                      {created:{$lt:endDate}}
                    ]
                  }
                }
              ]).toArray((errorPrivateSeller,resultPrivateSeller)=>{
                if(!errorPrivateSeller){
                  if(resultPrivateSeller.length<PRIVATE_SELLER_SELLING_LIMIT){
                    if(i==(orders.length-1)){
                      product.placeOrder(req, res, next);  
                    }
                  }else{
                    return res.send({
                      status: API_STATUS_ERROR,
                      message: res.__("front.product.private_seller_limit_reached"),
                      result: {},
                      error: {},
                    });
                  }
                }
              })
            }else{
              if(i==(orders.length-1)){
                product.placeOrder(req, res, next);  
              }
            }
          }else if(Number(result.quantity) == NOT){
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.product.product_out_of_stock"),
              result: {},
              error: {},
            });
          }else{
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.product.product_quantity_not_available"),
              result: {},
              error: {},
            });
          }
        }else{
          return res.send({ 
            status: API_STATUS_ERROR,
            message: res.__("front.product.product_not_found"),
            result: {},
            error: {},
          });
        }
      }
    )
  });
});

/** Routing is used to place order **/
routes.post(API_URL + "get_orders_list", isUserLogedInApi, (req, res, next) => {
  product.getOrdersList(req, res, next);  
})

/** Routing is used to place order **/
routes.post(API_URL + "manage_order_request", isUserLogedInApi, (req, res, next) => {
  product.manageOrderRequest(req, res, next);  
})

/** Routing is used to place order **/
routes.post(API_URL + "track_order",isUserLogedInApi, (req, res, next) => {
  product.trackOrder(req, res, next);  
})

/** Routing is used to rate a product **/
routes.post(API_URL + "rate_product",isUserLogedInApi, (req, res, next) => {
  product.rateProduct(req, res, next);  
})

/** Routing is used to rate a product **/
routes.post(API_URL + "get_reviews",isUserLogedInApi, (req, res, next) => {
  product.getReviews(req, res, next);  
})

/** Routing is used to delete review **/
routes.post(API_URL + "delete_review",isUserLogedInApi, (req, res, next) => {
  product.deleteReview(req, res, next);  
})

/** Routing is used to update review **/
routes.post(API_URL + "update_review",isUserLogedInApi, (req, res, next) => {
  product.updateReview(req, res, next);  
})

/** Routing is used to review count **/
routes.post(API_URL + "review_count", (req, res, next) => {
  product.reviewCount(req, res, next);  
})

 /** This function is used to insert agreed price */  
routes.post(API_URL + "agreed_price", (req, res, next) => {
  product.setAgreedPrice(req, res, next);  
})



/** Routing is used to create customer **/
routes.post(API_URL + "escrow/create_customer", (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    const firstName = req.body.first_name ? req.body.first_name : "";
    const lastName = req.body.last_name ? req.body.last_name : "";
    const middleName = req.body.middle_name ? req.body.middle_name : "";
    const postCode = req.body.post_code ? req.body.post_code : "";
    const country = req.body.country ? req.body.country : "";
    const state = req.body.state ? req.body.state : "";
    const city = req.body.city ? req.body.city : "";
    const email = req.body.email ? req.body.email : "";
    const phoneNumber = req.body.phone_number ? req.body.phone_number : "";
    const line1 = req.body.line1 ? req.body.line1 : "";
    const line2 = req.body.line2 ? req.body.line2 : "";
    if(userId && firstName && lastName && middleName && postCode && country && state && city && email && phoneNumber && (line1 || line2)){
      product.createCustomer(req, res, next);
    }else{
      return res.send(
        {
          status: API_STATUS_ERROR,
          message: res.__(
            "front.user.invalid_request"
          ),
          result: {},
          error: errors,
        }
      );
    }
  
});

/** Routing is used to get user info to create account **/
routes.post(API_URL + "escrow_info", (req, res, next) => {
  const userId = req.body.user_id  ?  ObjectId(req.body.user_id) : "";
  if(userId){
    product.getUserForCreateAccount(req, res, next);
  }else{
    return res.send(
      {
        status: API_STATUS_ERROR,
        message: res.__(
          "front.user.invalid_request"
        ),
        result: {},
        error: [],
      }
    );
  }
});


/** This function is used to report a product */  
routes.post(API_URL + "report_product", (req, res, next) => {
  product.reportProduct(req, res, next);
})

