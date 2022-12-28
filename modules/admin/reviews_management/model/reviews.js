const async = require('async');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { validationResult } = require('express-validator');
function Reviews(req, res) {

  /** This function is used to get all rating list */
  this.getRatingList = (req,res,next)=>{
    req.breadcrumbs(BREADCRUMBS['admin/reviews']);
    res.render('list', {
      breadcrumbs: req.breadcrumbs(),
    });
  }/** end getOdersList */
  
    /** Function to get user list **/
    this.postRatingList = (req, res, next) => {
      let limit        = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip         = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
      let draw         = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;
      let fromDate     = req.body.fromDate ? req.body.fromDate : '';
      let toDate       = req.body.toDate ? req.body.toDate : '';
      let statusSearch = req.body.order_status ? req.body.order_status : '';
      let commonCondition = {
        is_deleted: NOT_DELETED
      };
      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );
        let findCondition;
        if(req.body.search && req.body.search.value!==""){
          findCondition=[
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
                        $and: [{ $eq: ['$product_title', '$$productId'] }],
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
                  { $project: { _id: 1, full_name: 1 } },
                ],
                as: 'buyerDetails',
              },
            },
            {
              $project:{
                order_id: 1,
                total_price: 1,
                order_status: 1,
                quantity: 1,
                buyerDetails : {'$arrayElemAt' :['$buyerDetails',0]},
                sellerDetails : {'$arrayElemAt' :['$sellerDetails',0]},
                productDetails : {'$arrayElemAt' :['$productDetails',0]},
                image : {'$arrayElemAt' :['$productDetails.image',0]},
                product_title:{'$arrayElemAt' :['$productDetails.product_title',0]}
              }
            }
          ];
        }else{
          findCondition=[
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
                  { $project: { _id: 1, full_name: 1 } },
                ],
                as: 'buyerDetails',
              },
            },
            {
              $project:{
                rating: 1,
                created: 1,
                is_active: 1,
                review_title: 1,
                is_active:1,
                buyerDetails: {'$arrayElemAt':['$buyerDetails',0]},
                sellerDetails: {'$arrayElemAt':['$sellerDetails',0]},
                productDetails: {'$arrayElemAt':['$productDetails',0]},
                review_description: 1,
              }
            }
          ];
        }
        /**  Date filter */
        if (fromDate && toDate) {
          configDataTable.search_condition['created'] = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          };
        }
  
        if (statusSearch) {
          configDataTable.search_condition['is_active'] = Number(statusSearch); 
        }
  
        const collection = db.collection('ratings');
        async.parallel(
          {
            reviewList: (callback) => {
              collection
                .aggregate(findCondition)
                .toArray((err, resultProduct) => {
                  if(resultProduct.length>0){
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
              data: response.reviewList ? response.reviewList : [],
              recordsTotal: response.recordsTotol ? response.recordsTotol : 0,
              recordsFiltered: response.recordsfiltered
                ? response.recordsfiltered
                : 0,
            });
          }
        );
      });
    }; //End postRatingList



    /** Function to view order detail **/
  this.viewReviewDetails = function (req, res) {
    const reviewId = req.params.id ? req.params.id : '';
    const ratings  = db.collection('ratings');
    ratings.aggregate([
      { 
        $match: { _id: ObjectId(reviewId) }
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
            { $project: { product_title: 1, image: 1 ,image_path:PRODUCT_FILE_URL} },
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
            { 
              $project: { 
                image: 1,
                email: 1,
                full_name: 1,
                image_path:USER_FILE_URL
              } 
            },
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
            { 
              $project: { 
                image: 1,
                email: 1,
                full_name: 1,
                image_path:USER_FILE_URL
              } 
            },
            
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
          rating: 1,
          review_title: 1,
          review_description: 1,
        },
      },
    ])
    .toArray((err, resultProduct) => {
      if (!err && resultProduct) {  
          req.breadcrumbs(
            BREADCRUMBS['admin/reviews/view']
            );
          res.render('view', {
            result: resultProduct[0],
            message: '',
          });
        }else{
          // req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          // res.redirect(WEBSITE_ADMIN_URL + 'rating');624c1fc9b42a3bc5f24b2fdf
        }
    })
  }; //End viewOrderDetails

  /** Function to edit review detail **/
  this.getEditReview = async (req, res) => {
    const reviewId = req.params.id ? ObjectId(req.params.id) : '';
    var collection  = db.collection('ratings');
    collection.aggregate([
      {
        $match:{
          _id:reviewId
        }
      },
      {
        $project:{
          rating: 1,
          review_title: 1,
          review_description: 1
        }
      }
    ]).toArray((error,result)=>{
      if(!error && result){
        req.breadcrumbs(BREADCRUMBS['admin/reviews/edit']);
        res.render('edit', {
          result : result[0]
        });
      }else{
        req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
        res.redirect(WEBSITE_ADMIN_URL + 'reviews');
      }
    });

  }/** end getEditReview */  



  /** This function is used to update review */
  this.postEditReview = async (req, res) => {
    const rating   = req.body.rating  ? req.body.rating  : {};
    const reviewId  = req.params.id ? ObjectId(req.params.id) : '';
    const reviewTitle  = req.body.review_title  ? req.body.review_title    : '';
    const reviewDescription  = req.body.review_description ? req.body.review_description  : '';
    const updateData ={
      rating:rating,
      review_title:reviewTitle,
      review_description:reviewDescription,
      modified: getUtcDate()
    };
    const collection = db.collection('ratings');
    collection.updateOne(
      {
        _id:reviewId
      },
      {
        $set:updateData
      },
      (error,result)=>{
        if (!error && result) {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.review.review_has_been_updated_successfully') 
          );
          return res.send({
            status: STATUS_SUCCESS,
            message: '',
            rediect_url: WEBSITE_ADMIN_URL + 'reviews',
          });
        } 
        else {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.system.something_went_wrong_please_try_again_later')
          );
          return res.send({
            status: STATUS_ERROR,
            message: '',
            rediect_url: WEBSITE_ADMIN_URL + 'reviews',
          });
        }
      }
    );

    
  }; //End postEditReview

    /** Function to update review status **/
    this.updateReviewStatus = (req, res) => {
      var productId = req.params.id ? req.params.id : '';
      var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
      const products = db.collection('ratings');
      let updateData = {
        is_active : status
      };
      
      products.updateOne(
        { _id: ObjectId(productId) },
        {
          $set: {
            ...updateData,
            modified: new Date(),
          },
        },
        (err, resultProduct) => {
          if (!err) {
            req.flash(
              STATUS_SUCCESS,
              res.__('admin.reviews.status_has_been_updated_successfully')
            );
            res.redirect(WEBSITE_ADMIN_URL + 'reviews');
          } else {
            req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
            res.redirect(WEBSITE_ADMIN_URL + 'reviews');
          }
        }
      );
    }; //End updateReviewStatus

    /** Function to delete review **/
  this.deleteReview = (req, res) => {
    var reviewId = req.params.id ? req.params.id : '';
    const reviews = db.collection('ratings');
    reviews.updateOne(
      { _id: ObjectId(reviewId)},
      {
        $set: {
          is_deleted: DELETED,
          modified: new Date(),
        },
      },
      (err, resultreview) => {
        if (!err && resultreview) {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.user.review_has_been_deleted_successfully')
          );
          res.redirect(WEBSITE_ADMIN_URL + 'reviews');
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'reviews');
        }
      }
    );
  }; //End deleteReview
}
module.exports = new Reviews();
