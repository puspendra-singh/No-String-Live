const async = require('async');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { validationResult } = require('express-validator');
function Orders(req, res) {

  /** This function is used to get all orders list */
  this.getOdersList = (req,res,next)=>{
    const collection = db.collection('masters');
    collection.find({
      key:"country"
    }).sort({name:1}).toArray((err,result)=>{
      if(!err){
        req.breadcrumbs(BREADCRUMBS['admin/orders']);
        res.render('list', {
          breadcrumbs: req.breadcrumbs(),countries:result
        });
      }
    })
  }/** end getOdersList */
  
    /** Function to get user list **/
    this.postOrdersList = (req, res, next) => {
      let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
      let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let toDate = req.body.toDate ? req.body.toDate : '';
      let location = req.body.location ? req.body.location : '';
      let fromDate = req.body.fromDate ? req.body.fromDate : '';
      let sellerName = req.body.seller_name ? req.body.seller_name : '';
      let statusSearch = req.body.order_status ? req.body.order_status : '';
      let commonCondition = {
        is_deleted: NOT_DELETED
      };
    
      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );
        let projectionCondition={
          order_id: 1,
          total_price: 1,
          order_status: 1,
          quantity: 1,
          buyerDetails : {'$arrayElemAt' :['$buyerDetails',0]},
          sellerDetails : {'$arrayElemAt' :['$sellerDetails',0]},
          productDetails : {'$arrayElemAt' :['$productDetails',0]},
          image : {'$arrayElemAt' :['$productDetails.image',0]},
          product_title:{'$arrayElemAt' :['$productDetails.product_title',0]},
          seller_name:{'$arrayElemAt' :['$sellerDetails.full_name',0]},
          buyer_name:{'$arrayElemAt' :['$buyerDetails.full_name',0]},
        }
        let locationAddField = {
          $match:{}
        };
        let locationMatchCondition = {};
        if (location) {
          projectionCondition['shippingAddress'] = {
            $filter: {
              input: { '$arrayElemAt': ['$buyerDetails.shippingAddress', 0] },
              as: "item",
              cond: {
                $and: [
                  { $eq: ["$$item.country", ObjectId(location)] },
                  { $eq: ["$$item.status", true] }
                ]
              }
            }
          };

          locationAddField={
            $addFields:{
              shippingAddressSize:{$size:"$shippingAddress"}
            }
          };
          locationMatchCondition={
            shippingAddressSize : {$gt:0}
          }
        }
        /** Search by seller name */
        let sellerNameFilter = {};
        if(sellerName){
          sellerNameFilter = {
            seller_name:{ $regex: sellerName, $options: 'i' }
          };
        }

        /** Search by buyer name */
        let buyerNameFilter = {};
        if(req.body.buyer_name){
          buyerNameFilter = {
            buyer_name:{ $regex: req.body.buyer_name, $options: 'i' }
          };
        }
        let findCondition=[
          { $match: configDataTable.search_condition },
          { $sort: configDataTable.sort_condition },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'products',
              let: { productId: '$product_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$productId'] }],
                    },
                  },
                },
                { $project: { _id: 1, product_title: 1, image: 1 } },
              ],
              as: 'productDetails',
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { sellerId: '$seller_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$sellerId'] }],
                    },
                  },
                },
                { $project: { _id: 1, full_name: 1 } },
              ],
              as: 'sellerDetails',
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { buyerId: '$buyer_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$buyerId'] }],
                    },
                  },
                },
                { $project: { _id: 1, full_name: 1,shippingAddress:1 } },
              ],
              as: 'buyerDetails',
            },
          },
          {
            $project:projectionCondition
          },
          locationAddField,
          {
            $match:sellerNameFilter
          },
          {
            $match:buyerNameFilter
          },
          {
            $match:locationMatchCondition
          },
        ];
        /**  Date filter */
        if (fromDate && toDate) {
          configDataTable.search_condition['created'] = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          };
        }
  
        if (statusSearch) {
          configDataTable.search_condition['order_status'] = Number(statusSearch); 
        }
  
        const collection = db.collection('orders');
        async.parallel(
          {
            orderList: (callback) => {
              collection
                .aggregate(findCondition)
                .toArray((err, resultProduct) => {
                  if(resultProduct && resultProduct.length>0){
                    let options = {
                      path    : PRODUCT_FILE_URL,
                      result  : resultProduct,
                    };
                    appendFile(options).then((response) => {
                      let result = response.result ? response.result : [];
                      callback(err, result);
                    });
                  }else{
                    callback(err, resultProduct);
                  }
                });
            },
            recordsTotol: (callback) => {
              collection.countDocuments(commonCondition, {}, (err, result) => {
                callback(err, result);
              });
            },
            recordsfiltered: (callback) => {
              collection.countDocuments(
                configDataTable.search_condition,
                {},
                (err, result) => {
                  callback(err, result);
                }
              );
            },
          },
          (err, response) => {
            /** Send error message*/
            if (err) {
              return next(err);
            }
            
            return res.send({
              status: STATUS_SUCCESS,
              draw: draw,
              data: response.orderList ? response.orderList : [],
              recordsTotal: response.recordsTotol ? response.recordsTotol : 0,
              recordsFiltered: response.recordsfiltered ? response.recordsfiltered : 0,
            });
          }
        );
      });
    }; //End postOrdersList



    /** Function to view order detail **/
  this.viewOrderDetails = function (req, res) {
    const orderId = req.params.id ? req.params.id : '';
    // console.log
    const orders  = db.collection('orders');
    orders.aggregate([
      { 
        $match: { order_id: ObjectId(orderId) }
      },
      {
        $lookup: {
          from: 'products',
          let: { productId: '$product_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$productId'] }],
                },
              },
            },
            { $project: { product_title: 1, image: 1 } },
          ],
          as: 'productDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { sellerId: '$seller_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$sellerId'] }],
                },
              },
            },
            { $project: { full_name: 1} },
          ],
          as: 'sellerDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { buyerId: '$buyer_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$buyerId'] }],
                },
              },
            },
            { $project: { full_name: 1} },
          ],
          as: 'buyerDetails',
        },
      },
      {
        $project: {
          productDetails: { "$arrayElemAt" : [ "$productDetails",0 ] },
          sellerDetails: { "$arrayElemAt" : [ "$sellerDetails",0 ] },
          buyerDetails: { "$arrayElemAt" : [ "$buyerDetails",0 ] },
          image: { "$arrayElemAt" : [ "$productDetails.image",0 ] },
          order_status: 1,
          quantity: 1,
          total_price: 1,
          order_id: 1,
          grand_total: 1
        },
      },
    ])
    .toArray((err, resultProduct) => {
      
      
    

      if (!err && resultProduct) {  
          let options = {
            path: PRODUCT_FILE_URL,
            result: resultProduct,
          };
          
          
          appendFile(options).then((imagesData)=>{
            req.breadcrumbs(
              BREADCRUMBS['admin/orders/view']
              );
            res.render('view', {
              result: imagesData.result && imagesData.result.length > 0 ? imagesData.result : [],
              message: '',
            });
          })
        }else{
          // req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          // res.redirect(WEBSITE_ADMIN_URL + 'orders');624c1fc9b42a3bc5f24b2fdf
        }
    })
  }; //End viewOrderDetails
}
module.exports = new Orders();
