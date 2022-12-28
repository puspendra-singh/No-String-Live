const bcrypt = require("bcryptjs");
const async = require('async');
const fs = require('fs');
const request = require('request');
const { validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");
const asyncForEachOf = require("async/forEachOf");

function Product(req, res) {
  /**  Function is used to get product list*/
  this.getProductsList = async (req, res) => {
    let page = req.body.page ? req.body.page : ACTIVE;
    let limit = DEFAULT_API_LIMIT;
    let skip = page * limit - limit;
    let userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    let keyword = req.body.keyword ? req.body.keyword : '';
    let hashRate = req.body.hashrate ? getObjectIdArray(req.body.hashrate) : [];
    let wattage = req.body.wattage ? getObjectIdArray(req.body.wattage) : [];
    let condition = req.body.condition ? getObjectIdArray(req.body.condition) : [];
    let categories = req.body.categories ? getObjectIdArray(req.body.categories) : [];
    let searchType = req.body.search_type ? req.body.search_type : '';
    let manufacturer = req.body.manufacturer ? getObjectIdArray(req.body.manufacturer) : [];
    let country = req.body.country ? getObjectIdArray(req.body.country) : [];
    let priceRange = req.body.price ? req.body.price : {};
    let finalMatchCondition = {};
    let matchCondition = { is_active: ACTIVE, is_deleted: NOT_DELETED };
    let sortCondition = { created: SORT_DESC };

    /* setting parameter to matchCondition and sortCondition if */
    if (userId && (searchType=="my_products")) matchCondition['user'] = userId;
    if((searchType!="my_products")){
      matchCondition['is_approved']=APPROVED;
    }
    /** To get favorite products */
    if (userId && (searchType=="favorites")) {
      finalMatchCondition['is_liked'] = IS_LIKED;
    }else{
      finalMatchCondition={
        $or:[
          { is_liked : IS_LIKED  },
          { is_liked : IS_UNLIKED },
          { is_liked : NOT  }
        ]
      }
    }
    

    // if(searchType=="popular") matchCondition['product']=SORT_ASC;
    if (categories.length > NOT) matchCondition['category'] = { $in: categories };
    if (manufacturer.length > NOT) matchCondition['brandlist'] = { $in: manufacturer };
    if (condition.length > NOT) matchCondition['condition'] = { $in: condition };
    if (keyword) matchCondition['product_title'] = { $regex: keyword, $options: 'i' };
    if (searchType=="latest") sortCondition['created']=SORT_DESC;
    if (searchType=="liked") sortCondition['created']=SORT_DESC;
    if (wattage.length > 0) matchCondition['wattage'] = { $in: wattage };
    if (hashRate.length > 0) matchCondition['hash_rate'] = { $in: hashRate };
    if (country.length > 0) matchCondition['shipment_country'] = { $in: country };
    if(Object.keys(priceRange).length>0) matchCondition['indicative_price']={$gte:priceRange.minValue,$lte:priceRange.maxValue};
    // if(Object.keys(priceRange).length>0) matchCondition['indicative_price']={$and:[
    //   {$gte:priceRange.minValue},
    //   {$lte:priceRange.maxValue}
    // ]};
    
    productsList(req, res, matchCondition, sortCondition, limit, skip,finalMatchCondition,searchType,userId).then((data)=>{
      res.send(data);
    })
  }/* end getProductsList*/

  /** This function used to get all masters list with their products count */
  this.getAllMastersListWithCount=(req, res, next)=>{
    let masterDropdown=['category','conditions','brandlist','wattage','hash_rate'];

    let collection = db.collection("masters");
    collection.aggregate([
      {$match : {is_active: ACTIVE, key : {$in : masterDropdown}}},
      {
        $lookup: {
          from: 'products',
          let: { masterId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                      { $eq: ['$is_deleted', NOT_DELETED] },
                      { $eq: ['$is_active', ACTIVE] },
                      {$or: [
                      { $eq: ['$category', '$$masterId'] },
                      { $eq: ['$condition', '$$masterId'] },
                      { $eq: ['$brandlist', '$$masterId'] },
                      { $eq: ['$wattage', '$$masterId'] },
                      { $eq: ['$hash_rate', '$$masterId'] }
                    ]}
                  ],
                },
              },
            }
          ],
          as: 'productDetail',
        },
      },
      { $project: { _id:1, name:1, key:1, productCount:{$size: "$productDetail"} } },
      {
        $group : {
          _id : "$key",
          name: {$push: {_id : "$_id", name : "$name",productCount: "$productCount"}},
          
        }
      },
      {
        $sort:{_id:1}
      }
    ]).toArray((err,result)=>{
      if (!err && result) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_category_list_successfully"),
          result: result,
          error: [],
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        })
      }
    })
  }/** end getAllMastersListWithCount */

  /**  Function is used to get category list*/
  this.getCategoriesList = (req, res, next) => {
    let collection = db.collection("masters");
    collection.find({ key: 'category', is_active: ACTIVE, is_deleted: NOT_DELETED }, { projection: { name: 1 } }).sort({ 'name': 1 }).toArray(async (err, result) => {
      if (!err && result) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_category_list_successfully"),
          result: result,
          error: [],
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        })
      }
    })


  }/** end getCategoriesList */

  this.getConditionsList = (req, res, next) => {
    let collection = db.collection("masters");
    collection.find({ key: 'conditions', is_active: ACTIVE }, { projection: { name: 1 } }).sort({ 'name': 1 }).toArray(async (err, result) => {
      if (!err && result) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_condition_list_successfully"),
          result: result,
          error: [],
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        })
      }
    })
  }

  this.getBrandsList = (req, res, next) => {
    let collection = db.collection("masters");
    collection.find({ key: 'brandlist', is_active: ACTIVE }, { projection: { name: 1,image: 1 } }).sort({ 'name': 1 }).toArray(async (err, result) => {
      if (!err && result) {
        let options = {
          path    : PRODUCT_FILE_URL,
          result  : result,
        };
        appendFile(options).then((response) => {
          let finalData = response.result ? response.result : [];
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_brand_list_successfully"),
            result: finalData,
            error: [],
          });
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        })
      }
    })
  }

  this.getAvailabilityList = (req, res, next) => {
    let collection = db.collection("masters");
    collection.find({ key: 'availability', is_active: ACTIVE }, { projection: { name: 1 } }).sort({ 'name': 1 }).toArray(async (err, result) => {
      if (!err && result) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_availability_list_successfully"),
          result: result,
          error: [],
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        })
      }
    })
  }


  this.addProduct = async (req, res, next) => {
    const userId = req.params.userId ? req.params.userId : '';
    const type = req.body.type ? req.body.type : '';
    const productName = req.body.productName ? req.body.productName : '';
    const category = req.body.category ? req.body.category : '';
    const productDes = req.body.productDes ? req.body.productDes : '';
    const condition = req.body.condition ? req.body.condition : '';
    const brand = req.body.brand ? req.body.brand : '';
    const price = req.body.price ? Number(req.body.price) : NOT;
    const availability = req.body.availability ? req.body.availability : '';
    const shipmentCountry = req.body.shipmentCountry ? req.body.shipmentCountry : '';
    const quantity = req.body.quantity ? Number(req.body.quantity) : '';
    const image = req.body.image ? req.body.image : '';
    const images = req.body.images ? req.body.images : '';
    const model = req.body.model ? req.body.model : '';
    const specifications = req.body.specifications ? req.body.specifications : '';
    const wattage = req.body.wattage ? ObjectId(req.body.wattage) : '';
    const hashRate = req.body.hashrate ? ObjectId(req.body.hashrate) : '';
    const newSpecification = JSON.parse(specifications);
    const countryName = req.body.country_name ? req.body.country_name : '';

    const newShipmentCountry = JSON.parse(shipmentCountry);
    var country = [];
    for (let i = 0; i < newShipmentCountry.length; i++) {
      country[i] = ObjectId(newShipmentCountry[i]);
    }
    if (type === 'add_product') {
      const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
      if (errors.length === 0) {
        let insertData = {
          user: ObjectId(userId),
          product_title: productName,
          category: ObjectId(category),
          model: model,
          description: productDes,
          condition: ObjectId(condition),
          brandlist: ObjectId(brand),
          quantity: quantity,
          indicative_price: price,
          availability: ObjectId(availability),
          shipment_country: country,
          specifications: newSpecification,
          created: new Date(),
          is_active: ACTIVE,
          is_approved: PRODUCT_REQUESTED,
          is_deleted: NOT_DELETED,
          wattage: wattage,
          hash_rate: hashRate,
          country_name:countryName
        };

        if (req.files) {

          let productImage = req.files && req.files.image ? req.files.image : {};
          if (req.files.image && Object.keys(productImage).length == NOT) {
            return res.send({
              status: STATUS_ERROR,
              message: [
                {
                  param: 'image',
                  msg: res.__('admin.user.please_select_an_image'),
                },
              ],
            });
          } else {
            let profileImage = {};

            /* Upload profile file */
            let optionsProfile = {
              file: productImage,
              file_path: PRODUCT_FILE_PATH,
            };
            profileImage = await moveUploadedFile(optionsProfile);
            if (profileImage.status == STATUS_ERROR) {
              return res.send({
                status: STATUS_ERROR,
                message: [{ param: 'image', msg: profileImage.message }],
              });
            } else {
              var newFileName = profileImage.new_file ? profileImage.new_file : '';
              if (req.files.image) insertData.image = newFileName;
            }
          }

          insertData.images = [];
          if (Array.isArray(req.files.images)) {
            for (let key in req.files.images) {
              let productImage = req.files.images[key];
              if (Object.keys(productImage).length == NOT) {
                return res.send({
                  status: STATUS_ERROR,
                  message: [
                    {
                      param: key,
                      msg: res.__('admin.user.please_select_an_image'),
                    },
                  ],
                });
              } else {
                let profileImage = {};

                /* Upload profile file */
                let optionsProfile = {
                  file: productImage,
                  file_path: PRODUCT_FILE_PATH,
                };
                profileImage = await moveUploadedFile(optionsProfile);
                if (profileImage.status == STATUS_ERROR) {
                  return res.send({
                    status: STATUS_ERROR,
                    message: [{ param: key, msg: profileImage.message }],
                  });
                } else {
                  var newFileName = profileImage.new_file ? profileImage.new_file : '';
                  if (req.files.images) {
                    var obj = {};
                    obj.id = ObjectId();
                    obj.image = newFileName
                    insertData.images.push(obj);
                  }
                }
              }

            }
            insertProduct(req, res, insertData);
          } else {
            let productImage = req.files.images;
            if (Object.keys(productImage).length == NOT) {
              return res.send({
                status: STATUS_ERROR,
                message: [
                  {
                    param: key,
                    msg: res.__('admin.user.please_select_an_image'),
                  },
                ],
              });
            } else {
              let profileImage = {};

              /* Upload profile file */
              let optionsProfile = {
                file: productImage,
                file_path: PRODUCT_FILE_PATH,
              };
              profileImage = await moveUploadedFile(optionsProfile);
              if (profileImage.status == STATUS_ERROR) {
                return res.send({
                  status: STATUS_ERROR,
                  message: [{ param: key, msg: profileImage.message }],
                });
              } else {
                var newFileName = profileImage.new_file ? profileImage.new_file : '';
                if (req.files.images) {
                  var obj = {};
                  obj.id = ObjectId();
                  obj.image = newFileName
                  insertData.images.push(obj);
                }
              }
            }

            insertProduct(req, res, insertData);
          }
        }
        else {
          insertProduct(req, res, insertData);
        }
      }
      else {
        return res.send({
          status: API_STATUS_ERROR,
          message: errors,
        });
      }
    }
    else if (type === 'edit_product') {
      const errors = uniqueValidations(validationResult(req).errors);
      if (errors.length === 0) {
        const userId = req.params.userId ? req.params.userId : '';
        const productId = req.body.productId ? req.body.productId : '';
        let userData = {
          user_id :userId,
          product_id:productId
        }
        const removedImages = req.body.removedImages ? req.body.removedImages : '';
        const deleteImages = JSON.parse(removedImages);

        const products = db.collection('products');
        products.findOne({ _id: ObjectId(productId), user: ObjectId(userId) }, async (err, result) => {

          if (!err && result) {

            var imageResult = result.images.filter(element => !(deleteImages.includes(element.id.toString())));
            


            var updateData = {
              product_title: productName,
              category: ObjectId(category),
              model: model,
              description: productDes,
              condition: ObjectId(condition),
              brandlist: ObjectId(brand),
              quantity: quantity,
              indicative_price: price,
              availability: ObjectId(availability),
              shipment_country: country,
              wattage: wattage,
              hash_rate: hashRate,
              specifications: newSpecification,
              images: imageResult,
              is_approved:NOT,
              modified: new Date(),
              country_name:countryName
            }
            
            var new_multipleImages=[];
            if(req.files && req.files.images){
              if(Array.isArray(req.files.images)){
                new_multipleImages=req.files.images;
              }else{
                new_multipleImages.push(req.files.images);
              }
            }
            if (req.files) {
              let profilePicture = req.files && req.files.image ? req.files.image : {};
              if (req.files.image && Object.keys(profilePicture).length == NOT) {
                return res.send({
                  status: STATUS_ERROR,
                  message: [
                    {
                      param: 'image',
                      msg: res.__('front.user.please_select_an_image'),
                    },
                  ],
                });
              } else {
                let profileImage = {};
        
                /** Upload profile file */
                let optionsProfile = {
                  file: profilePicture,
                  file_path: PRODUCT_FILE_PATH,
                };
                profileImage = await moveUploadedFile(optionsProfile);
                if (profileImage.status == STATUS_ERROR) {
                  return res.send({
                    status: STATUS_ERROR,
                    message: [{ param: 'image', msg: profileImage.message }],
                  });
                } else {
                  var newFileName = profileImage.new_file ? profileImage.new_file : '';
                  if (req.files.image) updateData['image'] = newFileName;
      
                  //====upload product images 
                if(new_multipleImages.length>0){
      
                  async.forEachOf(new_multipleImages,async(item, index) => {
                    let optionsnMultipleImages = {
                      file: item,
                      file_path: PRODUCT_FILE_PATH,
                    };
                    let uploadMultipleImages = await moveUploadedFile(optionsnMultipleImages);
                    if(uploadMultipleImages.status == STATUS_ERROR){
                      return res.send({
                        status: STATUS_ERROR,
                        message: [{ param: 'images', msg: uploadMultipleImages.message }],
                      });
                    }else{
                      let newProdImgName = uploadMultipleImages.new_file ? uploadMultipleImages.new_file : '';
                      let imagesData={
                        image:newProdImgName,
                        id:ObjectId()
                      }
                      updateData['images'].push(imagesData);
                    }
                    
                   }, err => {    
                    if (Object.keys(profileImage).length > NOT) {
                      updateProduct(req, res, updateData,userData);
                    }
                   });
                }else{
                  updateProduct(req, res, updateData,userData);
                }
                //upload product images ====
      
                
      
      
      
                }
        
                
              }
      
            }
            else {
              updateProduct(req, res, updateData,userData);
            }
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.something_went_wrong"),
            });
          }
        })

      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: errors,
        });
      }
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.something_went_wrong"),
      });
    }

  }

  /** Function is used to insert product */
  insertProduct = (req, res, insertData) => {
    const products = db.collection('products');
    products.insert(insertData, (error, result) => {
      if (!error && result) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__('front.user.product_has_been_added_successfully'),
          result: result
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__('front.user.something_went_wrong'),
        });
      }
    });
  } // End insertUser
  /** Function is used to update product */
  let updateProduct = (req, res, updateData,userData) => {
    const userId = userData.user_id ? userData.user_id : '';
    const productId = userData.product_id ? userData.product_id : '';
    const products = db.collection('products');

    products.findOneAndUpdate({ _id: ObjectId(productId), user: ObjectId(userId) }, { $set: updateData }, { new: true }, (error, result) => {

      
      if (!error && result && result.lastErrorObject.updatedExisting == true) {
        if (result && result.value && result.value.image) {
          result.value.full_image_path = PRODUCT_FILE_URL + result.value.image;
        }
        result.value.url = [];
        if (result && result.value.images && result.value.images.length) {
          for (let i = 0; i < result.value.images.length; i++) {
            result.value.url[i] = PRODUCT_FILE_URL + result.value.images[i];
          }
        }
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__('front.user.product_has_been_updated_successfully'),
          result: result
        });
      }
      else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__('front.user.something_went_wrong'),
        });
      }
    });
  }; // End updateUser

  this.getEditProduct = async (req, res) => {
    const userId = req.params.userId ? req.params.userId : '';
    const productId = req.params.productId ? req.params.productId : '';
    const products = db.collection('products');
    products.aggregate([{ $match: { _id: ObjectId(productId), user: ObjectId(userId) } },
    {
      $lookup: {
        from: 'masters',
        let: { categoryId: '$category' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$categoryId'] }],
              },
            },
          },
          { $project: { _id: 1, name: 1 } },
        ],
        as: 'categoryDetail',
      },
    },
    {
      $lookup: {
        from: 'masters',
        let: { conditionId: '$condition' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$conditionId'] }],
              },
            },
          },
          { $project: { _id: 1, name: 1 } },
        ],
        as: 'conditionDetail',
      },
    },
    {
      $lookup: {
        from: 'masters',
        let: { brandlistId: '$brandlist' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$brandlistId'] }],
              },
            },
          },
          { $project: { _id: 1, name: 1 } },
        ],
        as: 'brandlistDetail',
      },
    },

    {
      $lookup: {
        from: 'masters',
        let: { availabilityId: '$availability' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$availabilityId'] }],
              },
            },
          },
          { $project: { _id: 1, name: 1 } },
        ],
        as: 'availabilityDetail',
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$user' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$_id', '$$userId'] }],
              },
            },
          },
          { $project: { _id: 1, full_name: 1 } },
        ],
        as: 'userDetail',
      },
    },
    {
      $project: {
        image: 1,
        images: 1,
        model: 1,
        product_title: 1,
        seller_name: 1,
        description: 1,
        indicative_price: 1,
        shipment_country: 1,
        specifications: 1,
        quantity: 1,
        created: 1,
        category_name: { '$arrayElemAt': ['$categoryDetail.name', 0] },
        category_id: { '$arrayElemAt': ['$categoryDetail._id', 0] },
        condition_name: { '$arrayElemAt': ['$conditionDetail.name', 0] },
        condition_id: { '$arrayElemAt': ['$conditionDetail._id', 0] },
        brandlist_name: { '$arrayElemAt': ['$brandlistDetail.name', 0] },
        brandlist_id: { '$arrayElemAt': ['$brandlistDetail._id', 0] },
        availability_name: { '$arrayElemAt': ['$availabilityDetail.name', 0] },
        availability_id: { '$arrayElemAt': ['$availabilityDetail._id', 0] },
        user_name: { '$arrayElemAt': ['$userDetail.full_name', 0] },
        user_id: { '$arrayElemAt': ['$userDetail._id', 0] },
        wattage: 1,
        hash_rate: 1,
        country_name: 1
      }
    }
    ]).toArray(async (err, result) => {
      if (!err && result.length !== 0) {
        if (result && result[0] && result[0].image) {
          result[0].full_image_path = PRODUCT_FILE_URL + result[0].image;
        }
        result[0].url = [];
        if (result[0] && result[0].images && result[0].images.length) {
          for (let i = 0; i < result[0].images.length; i++) {

            result[0].url[i] = {
              id: result[0].images[i].id,
              full_image: PRODUCT_FILE_URL + result[0].images[i].image
            }
          }
        }
        const products = db.collection('products');
        products.aggregate([{ $match: { _id: ObjectId(productId) } },
        { $unwind: '$shipment_country' },
        {
          $lookup: {
            from: 'masters',
            let: { countryId: '$shipment_country' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$countryId'] }],
                  },
                },
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: 'countryDetail',
          },
        },
        {
          $project: {
            country_name: { '$arrayElemAt': ['$countryDetail.name', 0] },
            country_id: { '$arrayElemAt': ['$countryDetail._id', 0] },
          }
        }
        ]).toArray((err, resultTwo) => {
          if (!err && resultTwo) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.product_has_been_fetched_successfully'),
              result: { resultOne: result, resultTwo: resultTwo }
            });
          } else {
            return res.send({
              status: STATUS_ERROR,
              message: res.__('front.user.product_not_found'),
              result: {}
            })
          }
        })
      } else {
        return res.send({
          status: STATUS_ERROR,
          message: res.__('front.user.product_not_found'),
          result: {}
        })
      }
    })
  }

  this.getMyProducts = async (req, res) => {
    const userId = req.params.userId ? req.params.userId : '';
    const productId = req.params.productId ? req.params.productId : '';

    const products = db.collection('products');
    products.aggregate([{ $match: { user: ObjectId(userId) } },
    {
      $lookup: {
        from: 'users',
        localField: "user",
        foreignField: "_id",
        as: 'User'
      }
    },
    ]).toArray(async (err, result) => {
      if (!err && result.length !== 0) {
        for (let i = 0; i < result.length; i++) {
          result[i].full_image_path = PRODUCT_FILE_URL + result[i].image;
        }

        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__('front.user.products_has_been_fetched_successfully'),
          result: result
        });
      }

      else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__('front.user.no_product_found'),
          result: {}
        })
      }
    })
  }

  this.viewProductDetails = async (req, res) => {
    const productId = req.body.product_id ? ObjectId(req.body.product_id) : '';
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : '';
    if (productId) {
      const products = db.collection('products');
      products.aggregate([{ $match: { _id: productId } },
      {
        $lookup: {
          from: 'masters',
          let: { categoryId: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$categoryId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'categoryDetail',
        },
      },
      {
        $lookup: {
          from: 'masters',
          let: { conditionId: '$condition' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$conditionId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'conditionDetail',
        },
      },
      {
        $lookup: {
          from: 'masters',
          let: { brandlistId: '$brandlist' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$brandlistId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'brandlistDetail',
        },
      },

      {
        $lookup: {
          from: 'masters',
          let: { availabilityId: '$availability' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$availabilityId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'availabilityDetail',
        },
      },
      {
        $lookup: {
          from: 'masters',
          let: { wattageId: '$wattage' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$wattageId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'wattageDetail',
        },
      },
      {
        $lookup: {
          from: 'masters',
          let: { hashrateId: '$hash_rate' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$hashrateId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'hashrateDetail',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$userId'] }],
                },
              },
            },
            { $project: { _id: 1, full_name: 1, vendor_description: 1, email: 1 } },
          ],
          as: 'userDetail',
        },
      },
      {
        $lookup: {
          from: 'masters',
          let: { countryId: '$shipment_country' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $in: ['$_id', '$$countryId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'countryDetail',
        },
      },
      {
        $lookup: {
          from: 'cart',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product_id', '$$productId'] },
                    { $eq: ['$user_id', userId] },
                  ],
                },
              },
            }
          ],
          as: 'productCartDetail',
        },
      },
      {
        $lookup: {
          from: 'ratings',
          let: { ratingProductId: productId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product_id', '$$ratingProductId'] },
                    { $eq: ['$is_active', ACTIVE] },
                    { $eq: ['$is_deleted', NOT_DELETED] }
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'users',
                let: { ratingUserId: '$buyer_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$_id', '$$ratingUserId'] }],
                      },
                    },
                  },
                  {
                    $project: {
                      full_name: 1,
                      full_image_path: { $concat: [USER_FILE_URL, '$image'] }
                    }
                  },
                ],
                as: 'ratingUserDetails',
              },
            },
            {
              $project: {
                rating: 1,
                review_description: 1,
                ratingUserDetails: { '$arrayElemAt': ['$ratingUserDetails', 0] }
              }
            },
          ],
          as: 'ratingDetails',
        },
      },
      {
        $project: {
          image: 1,
          images: 1,
          model: 1,
          product_title: 1,
          seller_name: 1,
          description: 1,
          indicative_price: 1,
          shipment_country: 1,
          specification: 1,
          quantity: 1,
          created: 1,
          category_name: { '$arrayElemAt': ['$categoryDetail.name', 0] },
          category_id: { '$arrayElemAt': ['$categoryDetail._id', 0] },
          condition_name: { '$arrayElemAt': ['$conditionDetail.name', 0] },
          condition_id: { '$arrayElemAt': ['$conditionDetail._id', 0] },
          brandlist_name: { '$arrayElemAt': ['$brandlistDetail.name', 0] },
          brandlist_id: { '$arrayElemAt': ['$brandlistDetail._id', 0] },
          availability_name: { '$arrayElemAt': ['$availabilityDetail.name', 0] },
          availability_id: { '$arrayElemAt': ['$availabilityDetail._id', 0] },
          user_name: { '$arrayElemAt': ['$userDetail.full_name', 0] },
          wattage_name: { '$arrayElemAt': ['$wattageDetail.name', 0] },
          user_id: { '$arrayElemAt': ['$userDetail._id', 0] },
          hash_rate_name: { '$arrayElemAt': ['$hashrateDetail.name', 0] },
          vendor_description: { '$arrayElemAt': ['$userDetail.vendor_description', 0] },
          user_email: { '$arrayElemAt': ['$userDetail.email', 0] },
          country_detail: "$countryDetail",
          specifications: 1,
          wattage: 1,
          hash_rate: 1,
          product_in_cart: { $size: "$productCartDetail" },
          cart_id: "$productCartDetail._id",
          agreed_price: { '$arrayElemAt': ['$productCartDetail.agreed_price', 0] },
          vendor_description: 1,
          ratingDetails: 1
        }
      }
      ]).toArray(async (err, result) => {
        if (!err && result.length !== 0) {
          if (result && result[0] && result[0].image) {
            result[0].full_image_path = PRODUCT_FILE_URL + result[0].image;
          }
          result[0].url = [];
          if (result[0] && result[0].images && result[0].images.length) {
            for (let i = 0; i < result[0].images.length; i++) {
              result[0].url[i] = {
                id: result[0].images[i].id,
                full_image: PRODUCT_FILE_URL + result[0].images[i].image
              }
            }
          }

          let page = req.body.page ? req.body.page : ACTIVE;
          let userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
          let searchType = req.body.search_type ? req.body.search_type : 'similar_products';
          let limit = DEFAULT_API_LIMIT;
          let skip = page * limit - limit;
          let finalMatchCondition = {};
          let sortCondition = { created: SORT_DESC };
          let hash_rate = result && result[0] && result[0].hash_rate ? result[0].hash_rate : ObjectId();
          let wattage = result && result[0] && result[0].wattage ? result[0].wattage : ObjectId();
          let condition = result && result[0] && result[0].condition ? result[0].condition : ObjectId();
          let brandlist = result && result[0] && result[0].brandlist ? result[0].brandlist : ObjectId();
          let model = result && result[0] && result[0].model ? result[0].model : "";
          let category = result && result[0] && result[0].category ? result[0].category : "";
          let matchCondition = {
            is_active: ACTIVE, is_deleted: NOT_DELETED, _id: { $ne: productId },
            $or: [
              { hash_rate: hash_rate },
              { condition: condition },
              { brandlist: brandlist },
              { model: model },
              { category: category },
              { wattage: wattage },
            ]
          };
          productsList(req, res, matchCondition, sortCondition, limit, skip, finalMatchCondition, searchType, userId).then((data) => {

            let finalResult = result[0]
            finalResult['similarProducts'] = data.result;
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.product_has_been_fetched_successfully'),
              result: finalResult
            });
          })
        } else {
          return res.send({
            status: STATUS_ERROR,
            message: res.__('front.user.product_not_found'),
            result: {}
          })
        }
      })
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }

  /** This function is used to delete product */
  this.deleteProduct = async (req, res) => {
    const userId = req.body.user_id ? req.body.user_id : '';
    const productId = req.body.product_id ? req.body.product_id : '';
    const products = db.collection('products');
    products.updateOne(
      { _id: ObjectId(productId), user: ObjectId(userId) },
      {
        $set: {
          is_deleted: DELETED,
          modified: new Date(),
        },
      },
      (err, resultProduct) => {
        if (!err && resultProduct) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__('front.user.product_has_been_deleted_successfully'),
            result: resultProduct
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__('front.user.product_not_found'),
            result: {}
          })
        }
      }
    );
  }/** end deleteProduct() */


  this.getWattageAndHashrate = (req, res, next) => {
    let collection = db.collection("masters");
    const type = req.body.type ? req.body.type : '';
    collection.find({ key: type, is_active: ACTIVE }, { projection: { name: 1 } }).sort({ 'name': 1 }).toArray(async (err, result) => {
      if (!err && result) {
        if (type === 'wattage') {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_wattage_successfully"),
            result: result,
            error: [],
          });
        } else if (type === 'hash_rate') {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_hash_rate_successfully"),
            result: result,
            error: [],
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: [],
          })
        }
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: err,
        })
      }
    })
  }

  // ======filter product
  let productsList = (req, res, matchCondition, sortCondition, limit, skip, finalMatchCondition,searchType,userId) => {
    return new Promise((resolve)=>{
      const collection = db.collection("products");
    
      let user_id = req.body.user_id  ? ObjectId(req.body.user_id)  : {};
      async.parallel(
        {
          productList: (callback) => {
            collection.aggregate([
              { $match: matchCondition },
              { $sort: sortCondition },
              {
                $lookup: {
                  from: 'users',
                  localField: "user",
                  foreignField: "_id",
                  as: 'User'
                }
              },
              {
                $lookup: {
                  from: "favorites",
                  let: { userId: "$user" ,productId:"$_id"},
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                           { $eq: ["$user_id", user_id]},
                            {$eq:["$product_id", "$$productId"]}
                          ],
                        },
  
                      },
                    },
                  ],
                  as: "favoritesProductDetail",
                },
              },
              {
                $lookup: {
                  from: "ratings",
                  let: { productId:"$_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {$eq:["$product_id", "$$productId"]}
                          ],
                        },
  
                      },
                    },
                    {
                      $group:{
                        _id:"$product_id",
                        rating: {$push:'$rating'}
                      }
                    },
                    {
                      $project:{
                        avgRating:{ $avg: "$rating"}
                      }
                    }
                  ],
                  as: "avgRating",
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { brandId: "$brandlist"},
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$brandId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'brandDetail',
                },
              },
              { $skip: skip },
              { $limit: limit },
              // { $group : {max: { $max : "$indicative_price" }}},
               {$addFields:{
              //   is_liked:{'$arrayElemAt':['$favoritesProductDetail.is_liked',0]}
                is_liked: {$cond: { if: {$gt: [{$size: "$favoritesProductDetail"}, 0]}, then: {'$arrayElemAt':['$favoritesProductDetail.is_liked',0]}, else : 0}},
                average_rating: {'$arrayElemAt':['$avgRating.avgRating',0]},
                brandDetail: {'$arrayElemAt':['$brandDetail',0]}
                
               }},
               {$match:finalMatchCondition}
            ]).toArray((err, result) => {
              callback(err, result);
            })
          },
          recordsTotol: (callback) => {
            if(searchType=="favorites"){
              const favorites = db.collection("favorites");
              let condition={
                user_id:userId,
                is_liked:IS_LIKED,
                // is_deleted:NOT_DELETED
              }
              favorites.countDocuments(condition, {}, (err, result) => {
              callback(err, result);
            });
            }else{
              collection.countDocuments(matchCondition, {}, (err, result) => {
                callback(err, result);
              });
            }
          },
          maxPrice: (callback) => {
              collection.aggregate([
                {
                    $group: {
                        _id: null,
                        maxPrice: {$max: "$indicative_price"}
                    }
                }
            ]).toArray((error,result)=>{
              let maxPrice = result && result[0] && result[0].maxPrice ? result[0].maxPrice : NOT;
              callback(error, maxPrice);
            })
          },
        }, (err, response) => {
          resolve({
            status: STATUS_SUCCESS,
            result: response.productList ? response.productList : [],
            recordsTotal : response.recordsTotol ? response.recordsTotol : NOT,
            maxPrice  : response.maxPrice ? response.maxPrice : NOT,
            imageUrl: PRODUCT_FILE_URL
          });

        });
    });
    
  }
  // filter product======

  /** This function is used to get chat information of user and it's product*/
  this.getChatDetails=(req,res,next)=>{
    const senderId  = req.body.sender_id  ? ObjectId(req.body.sender_id)  : "";
    const productId  = req.body.product_id  ? ObjectId(req.body.product_id)  : "";
    const receiverId  = req.body.receiver_id  ? ObjectId(req.body.receiver_id)  : "";
    const limit  = req.body.limit  ? Number(req.body.limit)  : "";
    if(senderId && productId && receiverId && limit){
      const collection = db.collection("users");
      collection.aggregate([
        { $match : { _id : receiverId, is_deleted : NOT_DELETED, is_active : ACTIVE} },
        {
          $lookup: {
            from: "products",
            let: { productId: productId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$productId"] },{ $eq: ["$is_deleted", NOT_DELETED] }]
                  },
                },
              },
            ],
            as: "productDetails",
          },
        },
        {
          $lookup: {
            from: "chats",
            let: { productId : productId, senderId : senderId, receiverId : receiverId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and:[
                          { $eq: ["$product_id", "$$productId"] },
                          { $eq: ["$is_deleted", NOT_DELETED] },
                          { $eq: ["$sender_id", "$$senderId"] },
                          { $eq: ["$receiver_id", "$$receiverId"] },
                        ]
                      },
                      {
                        $and:[
                          { $eq: ["$product_id", "$$productId"] },
                          { $eq: ["$is_deleted", NOT_DELETED] },
                          { $eq: ["$sender_id", "$$receiverId"] },
                          { $eq: ["$receiver_id", "$$senderId"] },
                        ]
                      },
                    ]
                  },
                },
              },
            ],
            as: "chatDetails",
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { senderId : senderId, receiverId : receiverId },
            pipeline: [
              {
                $match: { 
                  $expr: {
                    $or: [
                      {
                        $and:[
                          { $eq: ["$is_deleted", NOT_DELETED] },
                          { $eq: ["$sender_id", "$$senderId"] },
                          { $eq: ["$receiver_id", "$$receiverId"] },
                        ]
                      },
                      {
                        $and:[
                          { $eq: ["$is_deleted", NOT_DELETED] },
                          { $eq: ["$sender_id", "$$receiverId"] },
                          { $eq: ["$receiver_id", "$$senderId"] },
                        ]
                      },
                    ]
                  },
                },
              },
              {
                $lookup: {
                  from: "users",
                  let: {msenderId : "$sender_id", mreceiverId : "$receiver_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $or: [
                            {
                              $and:[
                                { $eq: ["$is_deleted", NOT_DELETED] },
                                { $eq: ["$_id", "$$msenderId"] },
                                { $ne: ["$_id", "$$mreceiverId"] }
                              ]
                            }
                          ]
                        },
                      },
                    },
                    {
                      $project : {
                        _id : 0,
                        full_name : 1
                      }
                    }
                  ],
                  as: "chatUserDetails",
                },
              },
              {
                $lookup: {
                  from: "products",
                  let: {messageProductId : "$product_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $or: [
                            {
                              $and:[
                                { $eq: ["$is_deleted", NOT_DELETED] },
                                { $eq: ["$_id", "$$messageProductId"] }
                              ]
                            }
                          ]
                        },
                      },
                    },
                    {
                      $project : {
                        _id : 1,
                        product_title : 1,
                        indicative_price: 1
                      }
                    }
                  ],
                  as: "productDetails",
                },
              },
              {
                $sort:{created:SORT_DESC}
              },
              {
                $skip: NO_SKIP
              },
              {
                $limit: limit
              },
              {
                $sort:{created:SORT_ASC}
              },
            ],
            as: "messageDetails",
          },
        },
        {
          $lookup: {
            from: 'masters',
            let: { countryId: { '$arrayElemAt': ['$shippingAddress.country', 0] }},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$countryId'] }],
                  },
                },
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: 'countryDetail',
          },
        },
      ]).toArray((error,result)=>{
        const data={
          user_id : result[0]._id ? result[0]._id : "",
          first_name : result[0].first_name ? result[0].first_name : "",
          last_name : result[0].last_name ? result[0].last_name : "",
          profile_image : result[0].image ? USER_FILE_URL+result[0].image : "",
          last_seen : result[0].last_seen ? result[0].last_seen : "",
          product_details : {
            product_name : result[0] && result[0].productDetails && result[0].productDetails[0] && result[0].productDetails[0].product_title ? result[0].productDetails[0].product_title : "",
            indicative_price : result[0] && result[0].productDetails && result[0].productDetails[0] && result[0].productDetails[0].indicative_price ? result[0].productDetails[0].indicative_price : "",
            image : result[0].productDetails && result[0].productDetails[0].image ? result[0].productDetails[0].image : "",
            indicative_price : result[0].productDetails && result[0].productDetails[0].indicative_price ? result[0].productDetails[0].indicative_price : "",
            model : result[0].productDetails && result[0].productDetails[0].model ? result[0].productDetails[0].model : ""
          },
          conversation_id : result[0].chatDetails && result[0].chatDetails[0] ? result[0].chatDetails[0].conversation_id : "",
          messages : result[0] && result[0].messageDetails ? result[0].messageDetails : [],
          is_owner : String(result[0].productDetails[0].user) == String(senderId) ? ACTIVE : INACTIVE,
          country_detail : result[0] && result[0].countryDetail && result[0].countryDetail[0] ? result[0].countryDetail[0] : "" 
        }
        if(!error && result){
          return res.send(
            {
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.user_found_successfully"
              ),
              result: data,
              error: [],
            }
          );
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
  }/** End getChatDetails */

  /**This function is used to setup conversation id and if it is find then send as response */
  this.configConversation=(req,res,next)=>{
    const senderId  = req.body.sender_id  ? ObjectId(req.body.sender_id)  : "";
    const productId  = req.body.product_id  ? ObjectId(req.body.product_id)  : "";
    const receiverId  = req.body.receiver_id  ? ObjectId(req.body.receiver_id)  : "";
    
    if(senderId && productId && receiverId && (senderId !== receiverId)){
      const chats = db.collection("chats");
        chats.findOneAndUpdate(
        {
          $or:[
            {
              sender_id: senderId,
              receiver_id: receiverId ,
              // product_id: productId ,
              is_deleted: NOT_DELETED
            },
            {
              sender_id: receiverId,
              receiver_id: senderId ,
              // product_id: productId ,
              is_deleted: NOT_DELETED
            }
          ]
        },
        {
          $set : {
            last_seen: getUtcDate()
          },
          $setOnInsert: {
            conversation_id: ObjectId(),
            sender_id  : senderId,
            receiver_id : receiverId,
            product_id : productId,
            created: getUtcDate(),
            is_active: DEACTIVE,
            is_deleted: NOT_DELETED
          },
        },
        { upsert: true },
        function(error,result){
          if(!error && result){
            if(!result.lastErrorObject.updatedExisting){
              chats.findOne(
                {_id:result.lastErrorObject.upserted},
                (err,response)=>{
                  if(!err && response){
                    return res.send(
                      {
                        status: API_STATUS_SUCCESS,
                        message: res.__(
                          "front.user.records_found_successfully"
                        ),
                        result: {
                          conversation_id : response.conversation_id
                        },
                        error: [],
                      }
                    );
                  }
                }
              )
            }else{
              return res.send(
                {
                  status: API_STATUS_SUCCESS,
                  message: res.__(
                    "front.user.records_found_successfully"
                  ),
                  result: {
                    conversation_id : result.value.conversation_id
                  },
                  error: [],
                }
              );
            }
          }
        }
      );
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
  }/** End configConversation */

  /** This function is used to get history of chats */
  this.getChatsHistory = (req,res,next)=>{
    const userId  = req.body.user_id  ? ObjectId(req.body.user_id)  : "";
    if(userId){
      const searchCondition = {
        $or : [
          { sender_id : userId, is_deleted : NOT_DELETED },
          { receiver_id : userId, is_deleted : NOT_DELETED  }
        ]
      };
      const chats = db.collection('chats');
      chats.aggregate([
        { $match : searchCondition },
        {
          $lookup: {
            from: "users",
            let: { senderId : "$sender_id", receiverId : "$receiver_id"},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and:[
                          { $eq: ["$is_deleted", NOT_DELETED] },
                          { $eq: ["$_id", "$$senderId"] },
                          { $ne: ["$_id", userId] },
                        ]
                      },
                      {
                        $and:[
                          { $eq: ["$is_deleted", NOT_DELETED] },
                          { $eq: ["$_id", "$$receiverId"] },
                          { $ne: ["$_id", userId] },
                        ]
                      },
                    ]
                  },
                },
              },
              {
                $project:{
                  full_name : 1,
                  image : 1
                }
              }
            ],
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { conversationId : "$conversation_id"},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and:[
                      { $eq: ["$is_deleted", NOT_DELETED] },
                      { $eq: ["$conversation_id", "$$conversationId"] }
                    ]
                  },
                },
              },
              {
                $sort:{created:SORT_DESC}
              },
              {
                $project:{
                  message : 1,
                  created : 1
                }
              }
            ],
            as: "messageDetails",
          },
        },
        {
          $project:{
            _id:1,
            conversation_id:1,
            created:1,
            last_seen:1,
            receiver_id:1,
            user_details: { '$arrayElemAt': ['$userDetails', 0] },
            last_message: { '$arrayElemAt': ['$messageDetails.message', 0] },
            last_created_message: { '$arrayElemAt': ['$messageDetails.created', 0] },
            product_id:1
          }
        },
        {
          $sort:{
            last_created_message: SORT_DESC
          }
        }

      ]).toArray((error,result)=>{
        const dataToSend = {
          data:result,
          receiver_image_path:USER_FILE_URL,
        }
        if(!error && result){
          return res.send(
            {
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.records_found_successfully"
              ),
              result: dataToSend,
              error: [],
            }
          );
        }
      });
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
  }/** end getChatsHistory */

  /** This function is used to update action of offer */
  this.updateOfferAction=(req, res, next)=>{
    const action = req.body.action ? Number(req.body.action) : "";
    const messageId = req.body.message_id ? ObjectId(req.body.message_id) : "";
    if(messageId && action){
      const messages = db.collection('messages');
      messages.updateOne(
        { _id: messageId },
        {
          $set: {
            action: action,
          },
        },
        (err, resultProduct) => {
          if (!err && resultProduct) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.records_has_been_updated_successfully'),
              result: {}
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__('front.user.record_not_found'),
              result: {}
            })
          }
        }
      );
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
  }/** end updateOfferAction */

  /** This function is used to mark notificaitons as read */
  this.updateSeenMessages = (req,res,next)=>{
    const messageIdArray = req.body.message_id_list ? req.body.message_id_list  : [];
    if(messageIdArray.length > 0){
      const messageObjectIdArray = getObjectIdArray(messageIdArray);
      const searchCondition = {
        _id : {$in:messageObjectIdArray},

      };
      const updateData = {
        is_seen : SEEN
      };
      const colletion = db.collection('messages');
      colletion.updateMany(
        searchCondition,
        {
          $set : updateData
        },
        (error,result)=>{
          if(!error){
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.records_has_been_updated_successfully	"
              ),
              result: {},
              error: [],
            });
          }
        }
      );
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end updateSeenMessages */

  // /** This function is used to place order */
  this.placeOrder = (req,res,next)=>{
    const orders  = req.body.order_products ? req.body.order_products : [];
    // console.log("ordersconsole",orders);
    // return;
    if(orders.length > 0){
      let checkoutByCart = false;
      let cartUserId = null;
      const collection  = db.collection('orders');
      const orderId = ObjectId();
      /** This function is used to put order id in all ordered products and convert id string to Object id*/
      const putOrderId = new Promise(resolve=>{
        let orderData=orders;
        let allFormatedOrders=[];
        orderData.forEach((order,i)=>{
          let formatedOrder = {};
          formatedOrder['created']              = getUtcDate();
          formatedOrder['order_id']             = orderId;
          formatedOrder['buyer_id']             = ObjectId(order.buyer_id);
          formatedOrder['quantity']             = Number(order.quantity);
          formatedOrder['modified']             = getUtcDate();
          formatedOrder['check_by']             = order.check_by;
          formatedOrder['seller_id']            = ObjectId(order.seller_id);
          formatedOrder['product_id']           = ObjectId(order.product_id);
          formatedOrder['is_deleted']           = NOT_DELETED;
          formatedOrder['total_price']          = order.total_price;
          formatedOrder['accept_time']          = "";
          formatedOrder['grand_total']          = order.grand_total;
          formatedOrder['reject_time']          = "";
          formatedOrder['order_status']         = API_ORDER_REQUESTED;
          formatedOrder['shipped_time']         = "";
          formatedOrder['product_price']        = order.product_price;
          formatedOrder['dispatch_time']        = "";
          formatedOrder['returned_time']        = "";
          formatedOrder['delivered_time']       = "";
          formatedOrder['cancelled_time']       = "";
          formatedOrder['return_request_time']  = "";
          allFormatedOrders.push(formatedOrder);
          if(order.check_by=='cart'){
            checkoutByCart = true;
            cartUserId = order.buyer_id?ObjectId(order.buyer_id):"";
          }else{
            checkoutByCart = false;
            cartUserId = null;
          }
          if(i==orderData.length-1){
            resolve(allFormatedOrders);
          }
        });
      });
      putOrderId.then((finalOrderData)=>{
        
        if(checkoutByCart && cartUserId){
          /** If user checkout by cart then remove products from cart then place the order */
          const cartCollection = db.collection('cart');
          
          cartCollection.deleteMany(
          {
            user_id : cartUserId
          },
          (errCart,resultCart)=>{
            if(!errCart){
              /** Placing order */
              finalOrderData.forEach((item,i)=>{
                const productsCollection = db.collection('products');
                productsCollection.updateOne(
                  {_id : ObjectId(item.product_id)},
                  {
                    $inc:{
                      quantity:((Number(item.quantity))*-1)
                    }
                  },
                  (err,response)=>{
                    if(!err && response){
                      collection.insertOne(
                        item,
                        (error,result)=>{
                          if (!error) {
                            if(i==(finalOrderData.length-1)){
                              return res.send({
                                status: API_STATUS_SUCCESS,
                                message: res.__("front.user.order_has_been_placed_successfully"),
                                result: {},
                                error: [],
                              });
                            }
                          } else {
                            return res.send({
                              status: API_STATUS_ERROR,
                              message: res.__("front.user.something_went_wrong"),
                              result: {},
                              error: {},
                            });
                          }
                        }
                      );
                    }else{
                      return res.send({
                        status: API_STATUS_ERROR,
                        message: res.__("front.user.something_went_wrong"),
                        result: {},
                        error: {},
                      });
                    }
                  }
                );
              });
            }else{
              return res.send({
                status : API_STATUS_ERROR,
                message : res.__("front.user.something_went_wrong"),
                result : {},
                error : {},
              });
            }
          })
        }else{
          finalOrderData.forEach((item,i)=>{
            const productsCollection = db.collection('products');
            productsCollection.updateOne(
              {_id : ObjectId(item.product_id)},
              {
                $inc:{
                  quantity:((Number(item.quantity))*-1)
                }
              },
              (err,response)=>{
                if(!err && response){
                  collection.insertOne(
                    item,
                    (error,result)=>{
                      if (!error) {
                        if(i==(finalOrderData.length-1)){
                          return res.send({
                            status: API_STATUS_SUCCESS,
                            message: res.__("front.user.order_has_been_placed_successfully"),
                            result: {},
                            error: [],
                          });
                        }
                      } else {
                        return res.send({
                          status: API_STATUS_ERROR,
                          message: res.__("front.user.something_went_wrong"),
                          result: {},
                          error: {},
                        });
                      }
                    }
                  );
                }else{
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                    error: {},
                  });
                }
              }
            );
          });
        }
      });
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end placeOrder */




  /** This function is used to place order */
  // this.placeOrder = (req, res, next) => {
  //   const orders = req.body.order_products ? req.body.order_products : [];
  //   if (orders.length > 0) {
  //     let checkoutByCart = false;
  //     let cartUserId = null;
  //     const collection = db.collection('orders');
  //     const orderId = ObjectId();
  //     /** This function is used to put order id in all ordered products and convert id string to Object id*/
  //     const putOrderId = new Promise(resolve => {
  //       let orderData = orders;
  //       let allFormatedOrders = [];
  //       orderData.forEach((order, i) => {
  //         let formatedOrder = {};
  //         formatedOrder['created'] = getUtcDate();
  //         formatedOrder['order_id'] = orderId;
  //         formatedOrder['buyer_id'] = ObjectId(order.buyer_id);
  //         formatedOrder['quantity'] = Number(order.quantity);
  //         formatedOrder['modified'] = getUtcDate();
  //         formatedOrder['check_by'] = order.check_by;
  //         formatedOrder['seller_id'] = ObjectId(order.seller_id);
  //         formatedOrder['product_id'] = ObjectId(order.product_id);
  //         formatedOrder['is_deleted'] = NOT_DELETED;
  //         formatedOrder['total_price'] = order.total_price;
  //         formatedOrder['accept_time'] = "";
  //         formatedOrder['grand_total'] = order.grand_total;
  //         formatedOrder['reject_time'] = "";
  //         formatedOrder['order_status'] = API_ORDER_REQUESTED;
  //         formatedOrder['shipped_time'] = "";
  //         formatedOrder['product_price'] = order.product_price;
  //         formatedOrder['dispatch_time'] = "";
  //         formatedOrder['returned_time'] = "";
  //         formatedOrder['delivered_time'] = "";
  //         formatedOrder['cancelled_time'] = "";
  //         formatedOrder['return_request_time'] = "";
  //         allFormatedOrders.push(formatedOrder);
  //         if (order.check_by == 'cart') {
  //           checkoutByCart = true;
  //           cartUserId = order.buyer_id ? ObjectId(order.buyer_id) : "";
  //         } else {
  //           checkoutByCart = false;
  //           cartUserId = null;
  //         }
  //         if (i == orderData.length - 1) {
  //           resolve(allFormatedOrders);
  //         }
  //       });
  //     });
  //     putOrderId.then((finalOrderData) => {
  //       // return;
  //       if (checkoutByCart && cartUserId) {
  //         return res.send({
  //           status: API_STATUS_ERROR,
  //           message: res.__("Cart feature is under development now."),
  //           result: {},
  //           error: {},
  //         });
  //         /** If user checkout by cart then remove products from cart then place the order */
  //         const cartCollection = db.collection('cart');

  //         cartCollection.deleteMany(
  //           {
  //             user_id: cartUserId
  //           },
  //           (errCart, resultCart) => {
  //             if (!errCart) {
  //               /** Placing order */
  //               finalOrderData.forEach((item, i) => {
  //                 const productsCollection = db.collection('products');
  //                 productsCollection.updateOne(
  //                   { _id: ObjectId(item.product_id) },
  //                   {
  //                     $inc: {
  //                       quantity: ((Number(item.quantity)) * -1)
  //                     }
  //                   },
  //                   (err, response) => {
  //                     if (!err && response) {
  //                       collection.insertOne(
  //                         item,
  //                         (error, result) => {
  //                           if (!error) {
  //                             if (i == (finalOrderData.length - 1)) {
  //                               return res.send({
  //                                 status: API_STATUS_SUCCESS,
  //                                 message: res.__("front.user.order_has_been_placed_successfully"),
  //                                 result: {},
  //                                 error: [],
  //                               });
  //                             }
  //                           } else {
  //                             return res.send({
  //                               status: API_STATUS_ERROR,
  //                               message: res.__("front.user.something_went_wrong"),
  //                               result: {},
  //                               error: {},
  //                             });
  //                           }
  //                         }
  //                       );
  //                     } else {
  //                       return res.send({
  //                         status: API_STATUS_ERROR,
  //                         message: res.__("front.user.something_went_wrong"),
  //                         result: {},
  //                         error: {},
  //                       });
  //                     }
  //                   }
  //                 );
  //               });
  //             } else {
  //               return res.send({
  //                 status: API_STATUS_ERROR,
  //                 message: res.__("front.user.something_went_wrong"),
  //                 result: {},
  //                 error: {},
  //               });
  //             }
  //           })
  //       } else {
  //         finalOrderData.forEach((item, i) => {
  //           createEscrowTransaction(res,orders[i]).then((escrowData)=>{
  //             if (escrowData.id) {
  //               /** Setting the trasaction id to this order */
  //               item['transaction_id'] = escrowData.id;
  //               item['seller_agree'] = NOT_AGREE;
  //               item['payment_status'] = UNPAID;
  //               item['escrow_response'] = JSON.stringify(escrowData);
  //               const productsCollection = db.collection('products');
  //               productsCollection.updateOne(
  //                 { _id: ObjectId(item.product_id) },
  //                 {
  //                   $inc: {
  //                     quantity: ((Number(item.quantity)) * -1)
  //                   }
  //                 },
  //                 (err, response) => {
  //                   if (!err && response) {
  //                     collection.insertOne(
  //                       item,
  //                       (error, result) => {
  //                         if (!error) {
  //                           if (i == (finalOrderData.length - 1)) {
  //                             return res.send({
  //                               status: API_STATUS_SUCCESS,
  //                               message: res.__("front.user.order_has_been_placed_successfully"),
  //                               result: {},
  //                               error: [],
  //                             });
  //                           }
  //                         } else {
  //                           return res.send({
  //                             status: API_STATUS_ERROR,
  //                             message: res.__("front.user.something_went_wrong"),
  //                             result: {},
  //                             error: {},
  //                           });
  //                         }
  //                       }
  //                     );
  //                   } else {
  //                     return res.send({
  //                       status: API_STATUS_ERROR,
  //                       message: res.__("front.user.something_went_wrong"),
  //                       result: {},
  //                       error: {},
  //                     });
  //                   }
  //                 }
  //               );
  //             }
  //             // return;
  //           }).catch((escrowError)=>{
  //             res.send(escrowError);
  //           })
  //         });
  //       }
  //     });
  //   } else {
  //     return res.send({
  //       status: API_STATUS_ERROR,
  //       message: res.__("front.user.invalid_request"),
  //       result: {},
  //       error: {},
  //     });
  //   }
  // }/** end placeOrder */







  /** This function is used to get Orders list */
  this.getOrdersList = (req,res,next)=>{
    const page  =  req.body.page ? Number(req.body.page) : "";
    const limit  =  DEFAULT_API_LIMIT;
    const skip  =  page * limit - limit;
    const userId  =  req.body.user_id ? ObjectId(req.body.user_id) : "";
    let orderType  =  req.body.order_status ? req.body.order_status : "";
    const ordersOf  =  req.body.orders_of ? req.body.orders_of : "";
    const dateRange = req.body.date_range ? req.body.date_range : "";
    if(!Array.isArray(orderType)){
      
      orderType = Array(orderType).map(function (x) { 
        return Number(x); 
      })
    }

    const collection = db.collection('orders');
    if(userId && page !== "",orderType.length > 0){
      const searchCondition={
        order_status : { $in : orderType } ,
        is_deleted : NOT_DELETED
      };
      if(dateRange && Object.keys(dateRange).length>0){
        const endDate = new Date(dateRange.end);
        const startDate = new Date(dateRange.start);
        searchCondition['created'] = {
            $gte:startDate,
            $lte:endDate
        }
      }
      if(ordersOf=="seller") searchCondition['seller_id'] = userId;
      if(ordersOf=="buyer") searchCondition['buyer_id'] = userId;
      async.parallel({
        products: (callback) => {
            collection.aggregate([
              {
                $match:searchCondition
              },
              {
                $lookup: {
                  from: 'products',
                  let: { productId: '$product_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {$eq: ['$_id', '$$productId'] },
                          ],
                        },
                      },
                    },
                    {
                      $project:{
                        product_title: 1,
                        indicative_price: 1,
                        image: 1
                      }
                    }
                  ],
                  as: 'productDetails',
                }
              },
              {
                $lookup: {
                  from: 'users',
                  let: { buyerId: '$buyer_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {$eq: ['$_id', '$$buyerId'] }
                          ],
                        },
                      },
                    },
                    {
                      $project:{
                        full_name:1
                      }
                    }
                  ],
                  as: 'buyerDetails',
                }
              },
              {
                $lookup: {
                  from: 'users',
                  let: { sellerId: '$seller_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {$eq: ['$_id', '$$sellerId'] }
                          ],
                        },
                      },
                    },
                    {
                      $project:{
                        full_name:1
                      }
                    }
                  ],
                  as: 'sellerDetails',
                }
              },
              {
                $lookup: {
                  from: 'ratings',
                  let: { ratingOrderId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            {$eq: ['$order_id', '$$ratingOrderId'] },
                            { $eq: ['$is_deleted', NOT_DELETED] }
                          ],
                        },
                      },
                    },
                    {
                      $project:{
                        rating: 1
                      }
                    }
                  ],
                  as: 'ratingDetails',
                }
              },
              {
                $sort : {
                  modified : SORT_DESC
                }
              },
              {
                $skip : skip
              },
              {
                $limit : limit
              },
              {
                $project:{
                  _id: 1,
                  order_status: 1,
                  total_price:1,
                  order_id:1,
                  buyerDetails: { "$arrayElemAt":[ "$buyerDetails",0 ] },
                  sellerDetails: { "$arrayElemAt":[ "$sellerDetails",0 ] },
                  productDetails: { "$arrayElemAt":[ "$productDetails",0 ] },
                  ratingDetails: { "$arrayElemAt":[ "$ratingDetails",0 ] }
                }
              },
              {
                $addFields:{
                  file_path: PRODUCT_FILE_URL
                }
              }
            ]).toArray((error,result)=>{
              callback(error, result);
            });
        },
        recordsTotal: (callback) => {
            collection.countDocuments(searchCondition, {}, (err, result) => {
            callback(err, result);
          });
        },
      },
      (err,response)=>{
        if(!err){
          // const finalResult={
          //   products:
          // };
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.records_found_successfully"
            ),
            result: response,
            error: [],
          });
        }else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: {},
          });
        }
      }
    );
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end getOrdersList */

  /** This function is used to manage order status */
  this.manageOrderRequest = (req,res,next)=>{
    const requestId   =   req.body.request_id   ?   ObjectId(req.body.request_id)   : "";
    const orderStatus   =   req.body.order_status   ?   Number(req.body.order_status)   : "";
    
    if(requestId && orderStatus!==""){
      const findCondition = {
        _id : requestId
      };
      let updateData = {
        order_status : orderStatus,
        modified : getUtcDate()
      };
      switch(orderStatus){
        case 1: updateData['accept_time'] = getUtcDate();break;
        case 2: updateData['reject_time'] = getUtcDate();break;
        case 3: updateData['dispatch_time'] = getUtcDate();break;
        case 4: updateData['shipped_time'] = getUtcDate();break;
        case 5: updateData['delivered_time'] = getUtcDate();break;
        case 6: updateData['return_request_time'] = getUtcDate();break;
        case 7: updateData['returned_time'] = getUtcDate();break;
        case 8: updateData['cancelled_time'] = getUtcDate();break;
      }
      const collection = db.collection('orders');
      collection.updateOne(
        findCondition,
        {
          $set : updateData
        },
        (error,result)=>{
          if(!error){
            let sendResponse = {
              status: API_STATUS_SUCCESS,
              result: {},
              error: [],
            };
            switch(orderStatus){
              case 1: sendResponse['message'] = res.__("front.user.marked_as_accepted_successfully");break;
              case 2: sendResponse['message'] = res.__("front.user.marked_as_rejected_successfully");break;
              case 3: sendResponse['message'] = res.__("front.user.marked_as_dispatched_successfully");break;
              case 4: sendResponse['message'] = res.__("front.user.marked_as_shipped_successfully");break;
              case 5: sendResponse['message'] = res.__("front.user.marked_as_delivered_successfully");break;
              case 6: sendResponse['message'] = res.__("front.user.marked_as_return_request_successfully");break;
              case 7: sendResponse['message'] = res.__("front.user.marked_as_return_successfully");break;
              case 8: sendResponse['message'] = res.__("front.user.marked_as_order_cancelled_successfully");break;
              case 9: sendResponse['message'] = res.__("front.user.marked_as_rated_successfully");break;
              case 10: sendResponse['message'] = res.__("front.user.marked_as_return_req_accepted_successfully");break;
              case 11: sendResponse['message'] = res.__("front.user.marked_as_return_req_rejected_successfully");break;
            }
            return res.send(sendResponse);
          }else{
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.something_went_wrong"),
              result: {},
              error: {},
            });
          }
        }
      );
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end manageOrderRequest */
  
  /** This function is used to track order */
  this.trackOrder = (req,res,next)=>{
    const orderId = req.body.order_id ? ObjectId(req.body.order_id) : "";
    if(orderId){
      const collection = db.collection('orders');
      collection.aggregate([
        {
          $match:{
            _id: orderId,
            is_deleted: NOT_DELETED
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { buyerId: '$buyer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {$eq: ['$_id', '$$buyerId'] },
                      { $eq: ['$is_deleted', NOT_DELETED] }
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { countryId: { '$arrayElemAt': ['$shippingAddress.country', 0] } },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$countryId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'countryDetail',
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { stateId: { '$arrayElemAt': ['$shippingAddress.state', 0] } },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$stateId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'stateDetail',
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { cityId: { '$arrayElemAt': ['$shippingAddress.city', 0] } },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$cityId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'cityDetail',
                },
              },
              {
                $project:{
                  full_name: 1,
                  email: 1,
                  address: {
                    country: { '$arrayElemAt': ['$countryDetail', 0] },
                    state: { '$arrayElemAt': ['$stateDetail', 0] },
                    city: { '$arrayElemAt': ['$shippingAddress.city', 0] },
                    pincode: { '$arrayElemAt': ['$shippingAddress.pincode', 0] },
                    shipping_address_line_one: { '$arrayElemAt': ['$shippingAddress.shipping_address_line_one', 0] },
                    shipping_address_line_two: { '$arrayElemAt': ['$shippingAddress.shipping_address_line_two', 0] },
                  },
                  phone:'$phone.number'
                }
              }
            ],
            as: 'buyerDetails',
          }
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
                  _id: 1, 
                  full_name: 1  
                } 
              },
            ],
            as: 'sellerDetail',
          },
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
              { 
                $project: { 
                  _id: 1, 
                  product_title: 1 ,
                  image: "$image",
                  image_path: PRODUCT_FILE_URL,  
                } 
              },
            ],
            as: 'productDetail',
          },
        },
        {
          $project:{
            _id: 1,
            created: 1,
            quantity: 1,
            total_price: 1,
            accept_time: 1,
            reject_time: 1,
            buyerDetails: 1,
            order_status: 1,
            shipped_time: 1,
            sellerDetail: 1,
            productDetail: 1,
            returned_time: 1,
            dispatch_time: 1,
            delivered_time: 1,
            cancelled_time: 1,
            return_request_time: 1,
          }
        }
      ]).toArray((error,result)=>{
        if(!error){
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.records_found_successfully"
            ),
            result: result,
            error: [],
          });
        }else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: {},
          });
        }
      })
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end trackOrder */

  /** This function is used to rate a product */
  this.rateProduct = (req,res,next)=>{
    const rating               =    req.body.rating              ?   Number(req.body.rating) : "";
    const orderId              =   req.body.order_id             ?   ObjectId(req.body.order_id) : "";
    const buyerId              =   req.body.buyer_id             ?   ObjectId(req.body.buyer_id) : "";
    const sellerId             =   req.body.seller_id            ?   ObjectId(req.body.seller_id) : "";
    const productId            =   req.body.product_id           ?   ObjectId(req.body.product_id) : "";
    const reviewTitle          =   req.body.review_title         ?   req.body.review_title : "";
    const reviewDescription    =   req.body.review_description   ?   req.body.review_description : "";
    if(orderId && buyerId && sellerId && productId && rating && reviewTitle && reviewDescription){
      const insertData = {
        order_id : orderId,
        seller_id : sellerId,
        buyer_id : buyerId,
        product_id : productId,
        rating : rating,
        review_title : reviewTitle,
        review_description : reviewDescription,
        modified : getUtcDate(),
        created : getUtcDate(),
        is_active : ACTIVE,
        is_deleted : NOT_DELETED,
      };
      const ratings = db.collection('ratings');
      ratings.insertOne(
        insertData,
        (error,result)=>{
          if(!error && result){
            const findCondition = {
              _id : orderId
            };
            const updateData = {
              order_status : API_ORDER_RATED,
              modified : getUtcDate()
            };
            const orders  = db.collection('orders');
            orders.updateOne(
              findCondition,
              {
                $set : updateData
              },
              (err,response)=>{
                if(!err && response){
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__(
                      "front.user.marked_as_rated_successfully"
                    ),
                    result: {},
                    error: [],
                  });
                }else{
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                    error: {},
                  });
                }
              }
            );
          }
        }
      );
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end rateProduct */

   /** This function is used to get list of user reivews */
   this.getReviews = (req,res,next)=>{
    const userId    =   req.body.user_id   ?   ObjectId(req.body.user_id) : "";
    if(userId){
      const findCondition = {
        $expr:{
          $or: [
            { 
              $and:[
                { $eq: ['$seller_id', userId] },
                { $eq: ['$is_active', ACTIVE] },
                { $eq: ['$is_deleted', NOT_DELETED] },
              ]
            },
            { 
              $and:[
                { $eq: ['$buyer_id', userId] },
                { $eq: ['$is_active', ACTIVE] },
                { $eq: ['$is_deleted', NOT_DELETED] },
              ]
            },
          ]
        }
      };
      const ratings = db.collection('ratings');
      ratings.aggregate([
        {
          $match : findCondition
        },
        {
          $lookup: {
            from: 'users',
            let: { sellerId: '$seller_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and:[
                      {$eq: ['$_id', '$$sellerId'] },
                      { $eq: ['$is_deleted', NOT_DELETED] }
                    ]
                  },
                },
              },
              {
                $project:{
                  full_name: 1,
                  image: 1
                }
              }
            ],
            as: 'sellerDetails',
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { buyerId: '$buyer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and:[
                      {$eq: ['$_id', '$$buyerId'] },
                      { $eq: ['$is_deleted', NOT_DELETED] }
                    ]
                  },
                },
              },
              {
                $project:{
                  full_name: 1,
                  image: {$concat:[USER_FILE_URL,"$image"]}
                }
              }
            ],
            as: 'buyerDetails',
          }
        },
        {
          $project:{
            rating:1,
            created:1,
            order_id: 1,
            product_id: 1,
            review_title:1,
            buyerDetails: {'$arrayElemAt':['$buyerDetails',0]},
            sellerDetails:{'$arrayElemAt':['$sellerDetails',0]},
            review_description:1,
          }
        }
      ]).toArray((error,result)=>{
        if(!error){
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.records_found_successfully"
            ),
            result: result,
            error: [],
          });
        }else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: {},
          });
        }
      });
        
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end getReviews */

  /** This function is used to delete review */
  this.deleteReview = async (req, res) => {
    const reviewId = req.body.review_id ? ObjectId(req.body.review_id) : '';
    if(reviewId){
      const products = db.collection('ratings');
      products.updateOne(
        { _id: reviewId},
        {
          $set: {
            is_deleted: DELETED,
            modified: getUtcDate(),
          },
        },
        (err, result) => {
          if (!err && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.review_has_been_deleted_successfully'),
              result: {}
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__('front.user.something_went_wrong'),
              result: {}
            })
          }
        }
      );
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end deleteReview */

  /** This function is used to update review */
  this.updateReview = async (req, res) => {
    const reviewId = req.body.review_id ? ObjectId(req.body.review_id) : '';
    const reviewTitle = req.body.review_title ? req.body.review_title : '';
    const reviewDescription = req.body.review_description ? req.body.review_description : '';
    const rating = req.body.rating ? req.body.rating : '';
    if(reviewId && reviewTitle && reviewDescription && rating){
      const products = db.collection('ratings');
      products.updateOne(
        { _id: reviewId},
        {
          $set: {
            rating: rating,
            review_title: reviewTitle,
            review_description: reviewDescription,
            modified: getUtcDate(),
          },
        },
        (err, result) => {
          if (!err && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.review_has_been_updated_successfully'),
              result: {}
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__('front.user.something_went_wrong'),
              result: {}
            })
          }
        }
      );
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end updateReview */

  /** This function is used to get counts of reviews */
  this.reviewCount = (req,res,next)=>{
    const productId = req.body.product_id ? ObjectId(req.body.product_id) : "";
    if(productId){
      const collection = db.collection('ratings');
      async.parallel({
        fiveStars: (callback) => {
            let condition={
              product_id:productId,
              rating:5,
              is_deleted:NOT_DELETED
            }
            collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        fourStars: (callback) => {
          let condition = {
            product_id: productId,
            rating: 4,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        threeStars: (callback) => {
          let condition = {
            product_id: productId,
            rating: 3,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        twoStars: (callback) => {
          let condition = {
            product_id: productId,
            rating: 2,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        oneStars: (callback) => {
          let condition = {
            product_id: productId,
            rating: 1,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        totalReviews: (callback) => {
          let condition = {
            product_id: productId,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        
      }
      ,(error,result)=>{
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__('front.user.records_found_successfully'),
            result: result
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__('front.user.something_went_wrong'),
            result: {}
          })
        }
      })
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end reviewCount */

  /** This function is used to insert agreed price */
  this.setAgreedPrice = (req,res,next)=>{
    const cartId  = req.body.cart_id  ? ObjectId(req.body.cart_id) : "";
    const buyerId  = req.body.buyer_id  ? ObjectId(req.body.buyer_id) : "";
    const sellerId  = req.body.seller_id  ? ObjectId(req.body.seller_id) : "";
    const productId  = req.body.product_id  ? ObjectId(req.body.product_id) : "";
    const agreedPrice  = req.body.agreed_price  ? Number(req.body.agreed_price) : "";
    
    if(sellerId && buyerId && cartId && agreedPrice && productId){
    
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end setAgreedPrice */


  /** ============ ESCROW PAYMENT GETWAY =========== */
  /** This function is used to create customer in escrow */
  this.createCustomer = (req,res,next)=>{
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
    
    const sendData = {
      "email": email,
      "first_name": firstName,
      "middle_name": middleName,
      "last_name": lastName,
      "address": {
        "line1": line1,
        "line2": line2,
        "city": city,
        "state": state,
        "country": country,
        "post_code": postCode
      },
      "phone_number": phoneNumber
    }
 
    // return;
    const options = {
      'method': 'POST',
      'url': ESCROW_API_URL+'customer',
      'headers': {
        'Authorization': ESCROW_AUTH,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendData)
    };
  
    request(options, function (error, response) {
      if (error){
        return res.send({
          status: STATUS_ERROR,
          message: res.__('front.user.something_went_wrong'),
          result: {},
          error:error
        })
      }else{
        let escrowResult = JSON.parse(response.body);
        if(escrowResult.id && !escrowResult.error){
          const collection = db.collection('users');
          collection.updateOne(
            {
              _id: userId
            },
            {
              $set:{
                escrow_customer_id : escrowResult.id,
                escrow_account : ACCOUNT_CREATED
              }
            },
            (err,result)=>{
              if(!err){
                return res.send({
                  status: API_STATUS_SUCCESS,
                  message: res.__("Customer created"),
                  result: {},
                  error: [],
                });
              }else{
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: {},
                  error: escrowResult.error,
                });
              }
            }
          );
        } else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: escrowResult.error,
          });
        }
      }
    });
  }/** end createCustomer */

  /** This function is used to get user info to create account */
  this.getUserForCreateAccount = (req,res,next)=>{
    const userId = req.body.user_id  ?  ObjectId(req.body.user_id) : "";
    if(userId){
      const collection = db.collection('users');
      collection.aggregate([
        {
          $match:{
            _id: userId,
            is_deleted: NOT_DELETED,
            is_active: ACTIVE
          }
        },
        {
          $lookup: {
            from: 'users',
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', userId] }],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  shippingAddress: {"$arrayElemAt":[{ $filter : { input: "$shippingAddress",as:"item",cond: { $eq: [ "$$item.status", true ] }}},0]}
                }
              },
            ],
            as: 'addressDetail',
          },
        },
        {
          $lookup: {
            from: 'masters',
            let: { countryId: {"$arrayElemAt":["$addressDetail.shippingAddress.country",0]} },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$countryId'] }],
                  },
                },
              },
              { $project: { _id: 1, name: 1, country_code: 1 } },
            ],
            as: 'countryDetail',
          },
        },
        {
          $lookup: {
            from: 'masters',
            let: { stateId: {"$arrayElemAt":["$addressDetail.shippingAddress.state",0]} },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$stateId'] }],
                  },
                },
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: 'stateDetail',
          },
        },
        {
          $lookup: {
            from: 'masters',
            let: { cityId: {"$arrayElemAt":["$addressDetail.shippingAddress.city",0]} },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$cityId'] }],
                  },
                },
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: 'cityDetail',
          },
        },
        {
          $project:{
            first_name:1,
            last_name:1,
            email:1,
            phone:1,
            countryDetail:{"$arrayElemAt":["$countryDetail",0]},
            stateDetail:{"$arrayElemAt":["$stateDetail",0]},
            cityDetail:{"$arrayElemAt":["$cityDetail",0]},
            pincode:{"$arrayElemAt":["$addressDetail.shippingAddress.pincode",0]},
            street:{"$arrayElemAt":["$addressDetail.shippingAddress.street",0]}
          }
        }
      ]).toArray((error,result)=>{
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.records_found_successfully"),
            result: result,
            error: [],
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: {},
          });
        }
      });
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
  }/** end createCustomer */

  /** This function is used to create a transation */
  function createEscrowTransaction(res,orderData){
    return new Promise((resolve,reject)=>{
      const sellerEmail = orderData.seller_email ? orderData.seller_email : "";
      const buyerEmail = orderData.buyer_email ? orderData.buyer_email : "";
      const quantity = orderData.quantity ? orderData.quantity : "";
      const price = orderData.product_price ? Number(orderData.product_price) : "";
      const productImage = orderData.product_image ? orderData.product_image : "";
      const productName= orderData.product_name? orderData.product_name: "";
      if (sellerEmail && buyerEmail && quantity && productImage && productName) {
        const sendData = {
          "parties": [
            {
              "role": "buyer",
              "customer": buyerEmail,
              "initiator": 1
            },
            {
              "role": "seller",
              "customer": sellerEmail
            },
            {
              "role": "partner",
              "customer": ESCROW_EMAIL
            }
          ],
          "currency": "usd",
          "description": productName,
          "items": [
            {
              "title": "johnwick.com",
              "description": "johnwick.com",
              "type": "domain_name",
              "inspection_period": ESCROW_INSPECTION_PERIOD,
              "quantity": quantity,
              "schedule": [
                {
                  "amount": price,
                  "payer_customer": buyerEmail,
                  "beneficiary_customer": sellerEmail
                }
              ],
              "extra_attributes": {
                "image_url": productImage
              }
            }
          ]
        };
        const options = {
          'method': 'POST',
          'url': ESCROW_API_URL + 'transaction',
          'headers': {
            'Authorization': ESCROW_AUTH,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sendData)
        };

        request(options, function (error, response) {
          if (error) {
            reject({
              status: STATUS_ERROR,
              message: res.__('front.user.something_went_wrong'),
              result: {},
              error: error
            })
          } else {
            let escrowResult = JSON.parse(response.body);
            if (escrowResult.id && !escrowResult.error) {
              resolve(escrowResult);
            } else {
              reject({
                status: API_STATUS_ERROR,
                message: res.__("front.user.something_went_wrong"),
                result: {},
                error: escrowResult.error,
              });
            }
          }
        });
      }else{
        reject(
          {
            status: API_STATUS_ERROR,
            message: res.__("front.user.invalid_request"),
            result: {},
            error: {},
          }
        );
      }
    });
  }/** end createEscrowTransaction */
  /** ============ ESCROW PAYMENT GETWAY END =========== */

  this.reportProduct = (req, res, next)=>{
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : '';
    const productId = req.body.product_id ? ObjectId(req.body.product_id) : '';
    const userName = req.body.user_name ? req.body.user_name : '';
    const description = req.body.description ? req.body.description : '';
    if(userId && productId && description && userName){
      const insertData = {
        user_id : userId,
        product_id : productId,
        user_name : userName,
        description : description,
        is_deleted : NOT_DELETED,
        created : getUtcDate(),
        modified : getUtcDate()
      };
      const collection = db.collection('reported_products');
      collection.insertOne(
        insertData,
        (error,result)=>{
          if (!error && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.poduct_reported_successfully'),
              result: result
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__('front.user.something_went_wrong'),
              result: {}
            })
          }
        }
      )
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }
}


module.exports = new Product();

