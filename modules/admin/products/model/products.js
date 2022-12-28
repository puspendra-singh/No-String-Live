const async = require('async');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { validationResult } = require('express-validator');
const { sendNotification, getSocket } = require('../../../../config/socket_chat');
function Products(req, res) {

  /** Function to get user list **/
  this.getProductsList = (req, res, next) => {
    req.breadcrumbs(BREADCRUMBS['admin/products/list']);
    res.render('list', {
      breadcrumbs: req.breadcrumbs(),
    });
  }; //End userList

  /** Function to get user list **/
  this.postProductsList = (req, res, next) => {
    let limit        = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
    let skip         = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
    let draw         = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;
    let fromDate     = req.body.fromDate ? req.body.fromDate : '';
    let toDate       = req.body.toDate ? req.body.toDate : '';
    let statusSearch = req.body.statusSearch ? req.body.statusSearch : '';

    
    let commonCondition = {
      is_deleted: NOT_DELETED
    };

    dataTableConfig(req, res, null, function (configDataTable) {
      configDataTable.search_condition = Object.assign(
        configDataTable.search_condition,
        commonCondition
      );

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

      const collection = db.collection('products');
      async.parallel(
        {
          userList: (callback) => {
            collection
              .aggregate([
                { $match: configDataTable.search_condition },
                { $sort: configDataTable.sort_condition },
                { $skip: skip },
                { $limit: limit },
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
                    image             : 1,
                    product_title     : 1,
                    description       : 1,
                    indicative_price  : 1,
                    shipment_country  : 1,
                    created           : 1,
                    category_name     : {'$arrayElemAt' :['$categoryDetail.name',0]},
                    category_id       : {'$arrayElemAt' :['$categoryDetail._id',0]},
                    condition_name    : {'$arrayElemAt' :['$conditionDetail.name',0]},
                    condition_id      : {'$arrayElemAt' :['$conditionDetail._id',0]},
                    brandlist_name    : {'$arrayElemAt' :['$brandlistDetail.name',0]},
                    brandlist_id      : {'$arrayElemAt' :['$brandlistDetail._id',0]},
                    availability_name : {'$arrayElemAt' :['$availabilityDetail.name',0]},
                    availability_id   : {'$arrayElemAt' :['$availabilityDetail._id',0]},
                    user_name         : {'$arrayElemAt' :['$userDetail.full_name',0]},
                    user_id           : {'$arrayElemAt' :['$userDetail._id',0]},
                    is_active: 1,
                    is_approved: 1
                  },
                },
              ])
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
            data: response.userList ? response.userList : [],
            recordsTotal: response.recordsTotol ? response.recordsTotol : 0,
            recordsFiltered: response.recordsfiltered
              ? response.recordsfiltered
              : 0,
          });
        }
      );
    });
    
  }; //End postProductsList

  /** Function is used to add product */
  this.getAddProduct = async (req, res, next) => {
    
    let categoryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'category',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let conditionOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'conditions',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let brandListOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'brandlist',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    
    let availabilityOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'availability',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let hashrateListOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'hash_rate',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let wattageListOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'wattage',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let countryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'country',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let userOptions = {
      collection_name: 'users',
      search_condition: {
        _id:{$ne:ObjectId(res.locals.auth._id)},
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
      },
      get_condition: { full_name: 1 },
      sort: { full_name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
    };
    let categoryList     = await getDropdownList(categoryOptions);
    let conditionList    = await getDropdownList(conditionOptions);
    let brandList        = await getDropdownList(brandListOptions);
    let availabilityList = await getDropdownList(availabilityOptions);
    let wattageList      = await getDropdownList(wattageListOptions);
    let hashrateList     = await getDropdownList(hashrateListOptions);
    let countryList      = await getDropdownList(countryOptions);
    let userList         = await getDropdownNameList(userOptions);
    
    req.breadcrumbs(BREADCRUMBS['admin/products/add']);
    res.render('add', {
      category_list     : categoryList.result,
      condition_list    : conditionList.result,
      brand_list        : brandList.result,
      availability_list : availabilityList.result,
      wattage_list      : wattageList.result,
      hashrate_list     : hashrateList.result,
      country_list      : countryList.result,
      user_list         : userList.result
    });
  };

  this.postAddProduct = async (req, res, next) => {
    const product_title    = req.body.product_title         ? req.body.product_title         : '';
    const seller           = req.body.seller_name           ? ObjectId(req.body.seller_name) : ObjectId();
    const category         = req.body.category              ? ObjectId(req.body.category)    : ObjectId();
    const description      = req.body.description           ? req.body.description           : '';
    const condition        = req.body.condition             ? ObjectId(req.body.condition)   : ObjectId();
    const brandlist        = req.body.brandlist             ? ObjectId(req.body.brandlist)   : ObjectId();
    const indicative_price = req.body.indicative_price      ? Number(req.body.indicative_price)      : NOT;
    const availability     = req.body.availability          ? ObjectId(req.body.availability): ObjectId();
    const shipment_country = req.body.shipment_country      ? JSON.parse(req.body.shipment_country)     : [];
    const quantity         = req.body.quantity              ? Number(req.body.quantity)             : NOT;
    const specifications   = req.body.specifications        ? JSON.parse(req.body.specifications): [];
    const model            = req.body.model                 ? req.body.model        : '';
    const wattage          = req.body.wattage               ? ObjectId(req.body.wattage)      : ObjectId();
    const hashRate         = req.body.hashrate              ? ObjectId(req.body.hashrate)     : ObjectId();

    // const images=req.body;

    
    for(let i =0; i < shipment_country.length; i++){
      shipment_country[i] = ObjectId(shipment_country[i]);
    }

    let insertData = {
      product_title    : product_title,
      user             : seller,
      category         : category,
      description      : description,
      condition        : condition,
      brandlist        : brandlist,
      indicative_price : indicative_price,
      availability     : availability,
      quantity         : quantity,
      shipment_country : shipment_country,
      created          : new Date(),
      is_active        : ACTIVE,
      is_approved      : PRODUCT_ACCEPTED,
      is_deleted       : NOT_DELETED,
      specifications   : specifications,
      model            : model,
      wattage          : wattage,
      hash_rate        : hashRate,
      images           :[]
    };

    
    if (req.files) {
      let multipleImages=[];
      let profileImage=null;
      let images=Object.keys(req.files).map((key) => req.files[key]);
      if(images.length>1){
        images.forEach((item,i)=>{
          if(i==0){
            profileImage=item;
          }else{
            multipleImages.push(item);
          }
        })
      }else{
        profileImage=images[0];
      }
      let profilePicture = profileImage;
      // let profilePicture = req.files && req.files.image ? req.files.image : {};
      if (req.files.image && Object.keys(profilePicture).length == NOT) {
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
        // if user select multiple images
        /*-----this is pending yet-----*/
        if(req.files.upload_image){
          let multipaImages = {};
          if(req.files.upload_image.length<=5){
            // profileImage = await moveUploadedFile(optionsProfile);
          }else{
            return res.send({
              status: STATUS_ERROR,
              message: [{ param: 'image', msg: "You can upload maximum 5 images." }],
            });
          }
        }
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
          // ====upload profile image
          let newFileName = profileImage.new_file ? profileImage.new_file : '';
          if (req.files.image) insertData['image'] = newFileName;
          //upload profile image ====
          //====upload product images 
          if(multipleImages.length>0){

            async.forEachOf(multipleImages,async(item, index) => {
              let optionsProfile = {
                file: item,
                file_path: PRODUCT_FILE_PATH,
              };
              let uploadMultipleImages = await moveUploadedFile(optionsProfile);
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
                insertData['images'][index]=imagesData;
              }
              
             }, err => {    
              insertProduct(req, res, insertData);
             });
          }else{
              insertProduct(req, res, insertData);
          }
          //upload product images ====
        }

       
      }
    } 
  };

  /** Function is used to insert Product */
  insertProduct = (req, res, insertData) => {
    const products = db.collection('products');
    products.insert(insertData, (error, result) => {
      if (!error) {
        req.flash(
          STATUS_SUCCESS,
          res.__('admin.user.product_has_been_added_successfully')
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: '',
          rediect_url: WEBSITE_ADMIN_URL + 'products',
        });
      } else {
        req.flash(STATUS_SUCCESS, res.__('admin.system.something_went_wrong'));
        return res.send({
          status: STATUS_ERROR,
          message: '',
          rediect_url: WEBSITE_ADMIN_URL + 'users',
        });
      }
    });
  }; // End insertUser

  /** Function to view user detail **/
  this.viewProductDetail = function (req, res) {
    const productId = req.params.id ? req.params.id : '';
    const products  = db.collection('products');
    products.aggregate([{ $match: { _id: ObjectId(productId) }},
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
        $lookup: {
          from: 'masters',
          let: { shipmentCountryId: '$shipment_country' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$shipmentCountryId'] }],
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
          image             : 1,
          product_title     : 1,
          description       : 1,
          specification     : 1,
          indicative_price  : 1,
          quantity          : 1,
          created           : 1,
          category_name     : {'$arrayElemAt' :['$categoryDetail.name',0]},
          category_id       : {'$arrayElemAt' :['$categoryDetail._id',0]},
          condition_name    : {'$arrayElemAt' :['$conditionDetail.name',0]},
          condition_id      : {'$arrayElemAt' :['$conditionDetail._id',0]},
          brandlist_name    : {'$arrayElemAt' :['$brandlistDetail.name',0]},
          brandlist_id      : {'$arrayElemAt' :['$brandlistDetail._id',0]},
          availability_name : {'$arrayElemAt' :['$availabilityDetail.name',0]},
          availability_id   : {'$arrayElemAt' :['$availabilityDetail._id',0]},
          user_name         : {'$arrayElemAt' :['$userDetail.full_name',0]},
          user_id           : {'$arrayElemAt' :['$userDetail._id',0]},
          is_active: 1,
          specifications: 1,
          images: 1,
          is_approved: 1
        },
      },
    ])
    .toArray((err, resultProduct) => {

      
    

      if (!err && resultProduct) {  
        const products = db.collection('products');
        products.aggregate([ {$match: {_id: ObjectId(productId)}},
          { "$unwind": "$shipment_country" },
        { "$lookup": {
          "from": "masters",
          "localField": "shipment_country",
          "foreignField": "_id",
          "as": "countryObjects"
        }},
        // Unwind the result arrays ( likely one or none )
        { "$unwind": "$countryObjects" },
        // Group back to arrays
        { "$group": {
            "_id": "$_id",
            "shipment_country": { "$push": "$shipment_country" },
            "countryObjects": { "$push": "$countryObjects" }
        }},
        ]).toArray( async (err, resultCountry) => {
          if(!err && resultCountry){
            let options = {
              path: PRODUCT_FILE_URL,
              result: resultProduct,
            };
            
            appendFile(options).then((response) => {
              req.breadcrumbs(
                BREADCRUMBS['admin/products/view']
                );
                let optionsMultipleImages = {
                  path: PRODUCT_FILE_URL,
                  result: resultProduct[0].images,
                };
                appendFile(optionsMultipleImages).then((imagesData)=>{
                  res.render('view', {
                    result: response.result && response.result[0] ? { resultOne: response.result[0], resultTwo: resultCountry,productImages:imagesData.result} : {},
                    message: '',
                  });
                })
              });
            } else {
              req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
              res.redirect(WEBSITE_ADMIN_URL + 'products');
            }
          })
        }else{
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'products');
        }
    })
  }; //End viewUserDetail

  /** Function to edit user detail **/
  this.getEditProductDetail = async (req, res) => {
    const productId = req.params.id ? req.params.id : '';
    var collection  = db.collection('products');
    let categoryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'category',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    
    let conditionOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'conditions',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    
    let hashRateListOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'hash_rate',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let shipmentCountryListOptions = {
      collection_name: 'masters',
      selectedType:'multiselect',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'country',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let brandListOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'brandlist',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let wattageListOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'wattage',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let availabilityOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'availability',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    let userOptions = {
      collection_name: 'users',
      search_condition: {
        _id:{$ne:ObjectId(res.locals.auth._id)},
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
      },
      get_condition: { full_name: 1 },
      sort: { full_name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
    };

    collection.findOne({_id: ObjectId(productId)},async(err, result) => {  
     
        if (!err && result) {
          categoryOptions.selected=result.category;
          conditionOptions.selected=result.condition;
          brandListOptions.selected=result.brandlist;
          availabilityOptions.selected=result.availability;
          wattageListOptions.selected=result.wattage;
          hashRateListOptions.selected=result.hash_rate;
          shipmentCountryListOptions.selected=result.shipment_country.toString();
          userOptions.selected=result.user;
          var categoryList = await getDropdownList(categoryOptions);
          var conditionList = await getDropdownList(conditionOptions);
          var brandList = await getDropdownList(brandListOptions);
          var availabilityList = await getDropdownList(availabilityOptions);
          let userList         = await getDropdownNameList(userOptions);
          let wattageList      = await getDropdownList(wattageListOptions);
          let hashRateList     = await getDropdownList(hashRateListOptions);
          let shipmentCountry = await getDropdownList(shipmentCountryListOptions);


            const products = db.collection('products');
            products.aggregate([ {$match: {_id: ObjectId(productId)}},
              { "$unwind": "$shipment_country" },
            { "$lookup": {
              "from": "masters",
              "localField": "shipment_country",
              "foreignField": "_id",
              "as": "countryObjects"
            }},
            // Unwind the result arrays ( likely one or none )
            { "$unwind": "$countryObjects" },
            // Group back to arrays
            { "$group": {
                "_id": "$_id",
                "shipment_country": { "$push": "$shipment_country" },
                "countryObjects": { "$push": "$countryObjects" }
            }},
            ]).toArray( async (err, resultCountry) => {
              if(!err && resultCountry){
              let options = {
                path: PRODUCT_FILE_URL,
                result: [result],
              };
              let multipleImgesOptions={
                path:PRODUCT_FILE_URL,
                result:result.images
              }
              let multipleImagesUrl=await appendFile(multipleImgesOptions);
              appendFile(options).then((response) => {
                if (response.status == STATUS_ERROR) {
                  req.flash(
                    STATUS_ERROR,
                    res.__('admin.system.something_went_wrong')
                  );
                  res.redirect(WEBSITE_ADMIN_URL + 'products');
                } else {
                  let result = response.result ? response.result[0] : {};
                  req.breadcrumbs(BREADCRUMBS['admin/products/edit']);
                  res.render('edit', {
                    result           : { resultOne: result, resultTwo: resultCountry,multipleImages:multipleImagesUrl.result},
                    category_list    : categoryList.result,
                    condition_list   : conditionList.result,
                    brand_list       : brandList.result,
                    availability_list: availabilityList.result,
                    user_list       : userList.result,
                    wattage_list     :wattageList.result,
                    hash_rate_list   :hashRateList.result,
                    shipment_country_list   :shipmentCountry.result,
                  });
                }
              });
            } else {
              req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
              res.redirect(WEBSITE_ADMIN_URL + 'products');
            }
          });
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'products');
        }
      });
  }  
        //End editUserDetail

  this.postEditProductDetail = async (req, res) => {
    const productId      = req.params.id ? req.params.id : '';
    const product_title    = req.body.product_title    ? req.body.product_title    : '';
    const seller_name      = req.body.seller_name      ? ObjectId(req.body.seller_name)      : {};
    const category         = req.body.category         ? ObjectId(req.body.category)         : '';
    const description      = req.body.description      ? req.body.description    : '';
    const condition        = req.body.condition        ? ObjectId(req.body.condition)        : '';
    const brandlist        = req.body.brandlist        ? ObjectId(req.body.brandlist)        : '';
    const indicative_price = req.body.indicative_price ? Number(req.body.indicative_price) : '';
    const availability     = req.body.availability     ? ObjectId(req.body.availability)     : '';
    const quantity         = req.body.quantity         ? Number(req.body.quantity )        : '';
    const shipment_country = req.body.shipment_country ? req.body.shipment_country : '';
    const model            = req.body.model            ? req.body.model            : '';
    const wattage          = req.body.wattage          ? ObjectId(req.body.wattage)          : '';
    const hashRate         = req.body.hashrate         ? ObjectId(req.body.hashrate)         : '';
    const specifications   = req.body.specifications   ? JSON.parse(req.body.specifications): [];
    const deleteImages     = req.body.deleted_images   ? req.body.deleted_images.split(","):[];
    var country=[];
    // for(let i =0; i < country.length; i++){
    //   country[i] = ObjectId(country[i]);
    // }

    // return;
    if(Array.isArray(shipment_country)){
      country=shipment_country;
    }else{
      country.push(shipment_country);
    }
    country=getObjectIdArray(country);
    var new_multipleImages=[];
if(req.files && req.files.upload_image){
  if(Array.isArray(req.files.upload_image)){
    new_multipleImages=req.files.upload_image;
  }else{
    new_multipleImages.push(req.files.upload_image);
  }
}

  const products = db.collection('products');
  products.findOne({_id: ObjectId(productId)},  async (err, result) => {
    
    if(!err && result){
      
      var imageResult = result.images.filter(element => !(deleteImages.includes(element.id.toString())));

      
      let updateData = {
        product_title    : product_title,
        seller_name      : seller_name,
        category         : ObjectId(category),
        description      : description,
        condition        : ObjectId(condition),
        brandlist        : ObjectId(brandlist),
        indicative_price : indicative_price,
        availability     : ObjectId(availability),
        quantity         : quantity,
        shipment_country : country,
        modified         : new Date(),
        model            : model,
        specifications   : specifications,
        images           : imageResult,
        wattage          : wattage,
        hash_rate        : hashRate
      };
      if (req.files) {
        let profilePicture = req.files && req.files.image ? req.files.image : {};
        if (req.files.image && Object.keys(profilePicture).length == NOT) {
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
                updateProduct(req, res, updateData);
              }
             });
          }else{
            updateProduct(req, res, updateData);
          }
          //upload product images ====





          }
  
          
        }

      } else {
        updateProduct(req, res, updateData);
      }
    }
  });


  
  }; //End editproductdetail

  /** Function is used to update user */
  updateProduct = (req, res, updateData) => {
    let productId = req.params.id ? req.params.id : '';
    const products = db.collection('products');
    products.updateOne( { _id: ObjectId(productId) }, { $set: updateData }, (error, result) => {
      if (!error && result) {
        req.flash(
          STATUS_SUCCESS,
          res.__('admin.user.product_has_been_updated_successfully') 
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: '',
          rediect_url: WEBSITE_ADMIN_URL + 'products',
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
          rediect_url: WEBSITE_ADMIN_URL + 'products',
        });
        }
    });
  }; // End updateProduct

  /** Function to delete Product **/
  this.deleteProduct = (req, res) => {
    var productId = req.params.id ? req.params.id : '';
    const products = db.collection('products');
    products.updateOne(
      { _id: ObjectId(productId)},
      {
        $set: {
          is_deleted: DELETED,
          modified: new Date(),
        },
      },
      (err, resultProduct) => {
        if (!err && resultProduct) {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.user.product_has_been_deleted_successfully')
          );
          res.redirect(WEBSITE_ADMIN_URL + 'products');
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'products');
        }
      }
    );
  }; //End deleteProduct

  /** Function to update product status **/
  this.updateProductStatus = (req, res) => {
    var productId = req.params.id ? req.params.id : '';
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const products = db.collection('products');
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
            res.__('admin.product.status_has_been_updated_successfully')
          );
          res.redirect(WEBSITE_ADMIN_URL + 'products');
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'products');
        }
      }
    );
  }; //End updateProductStatus

  /** This function is used to update status of product approval */
  this.productApprovalStatus = (req, res, next) => {
    var productId = req.params.id ? req.params.id : '';
    var status = req.params.status ? Number(req.params.status) : "";
    if(productId && status){
      const products = db.collection('products');
      let updateData = {
        is_approved : status
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
            let socket = getSocket();
            products.findOne({_id:ObjectId(productId)},(error,data)=>{
              if(!error){
                let notificationData = {
                  user_id:[data.user],
                  message:"Your product request has been rejected",
                  is_readonly:READ_ONLY,
                  go_to:"",
                  params:{}
                };
                if(status==PRODUCT_ACCEPTED){
                  notificationData.message="Your product request has been accepted"
                }
                sendNotification(notificationData,socket);
                req.flash(
                  STATUS_SUCCESS,
                  res.__('admin.product.status_has_been_updated_successfully')
                );
                return res.redirect(WEBSITE_ADMIN_URL + 'products');
              }
            });
          } else {
            req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
            return res.redirect(WEBSITE_ADMIN_URL + 'products');
          }
        }
      );
    }else{
      req.flash(STATUS_ERROR, res.__('admin.system.invalid_request'));
      res.redirect(WEBSITE_ADMIN_URL + 'products');
    }
  } /** end productApprovalStatus */

  
}
module.exports = new Products();
