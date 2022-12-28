const { ObjectId } = require("mongodb");

function Master(req, res) {
  /** Function to get list **/
  this.masterList = function (req, res, next) {
    var key = req.params.key ? req.params.key : "";
    if (isPost(req)) {
      if (key) {
        let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
        let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
        let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;

        let commonCondition = {
          is_deleted: NOT_DELETED,
          key: key,
        };

        dataTableConfig(req, res, null, function (configDataTable) {
          configDataTable.search_condition = Object.assign(
            configDataTable.search_condition,
            commonCondition
          );
          const collection = db.collection("masters");
          var async = require("async");
          async.parallel(
            {
              masterList: function (callback) {
                collection
                  .find(configDataTable.search_condition)
                  .sort(configDataTable.sort_condition)
                  .skip(skip)
                  .limit(limit)
                  .toArray(function (err, result) {
                    callback(err, result);
                  });
              },
              recordsTotol: function (callback) {
                collection.countDocuments(commonCondition, {}, function (
                  err,
                  result
                ) {
                  callback(err, result);
                });
              },
              recordsfiltered: function (callback) {
                collection.countDocuments(
                  configDataTable.search_condition,
                  {},
                  function (err, result) {
                    callback(err, result);
                  }
                );
              },
            },
            function (err, response) {
              /** Send error message*/
              if (err) return next(err);
              res.send({
                status: STATUS_SUCCESS,
                draw: draw,
                data: response.masterList ? response.masterList : [],
                recordsTotal: response.recordsTotol ? response.recordsTotol : 0,
                recordsFiltered: response.recordsfiltered
                  ? response.recordsfiltered
                  : 0,
              });
            }
          );
        });
      } else {
        req.flash(
          STATUS_ERROR,
          TEXT_SETTINGS["admin.system.something_went_wrong"]
        );
      }
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/masters/list"]);
      res.render("list", {
        key: key,
        dynamic_variable: _string(key),
      });
    }
  }; //End masterList
  
  /** Function is used to add master
   * key as params
   * return response
   * */
  this.getAddMaster = async function (req, res, next) {
    var key   = req.params.key ? req.params.key : "";

    let dropdownOptions = {
      collection_name 	: 'masters',
      search_condition  : {is_active : ACTIVE, is_deleted : NOT_DELETED, key : 'country'},
      get_condition  		: {name : 1},
      sort  				    : {name : 1},
      skip  				    : NO_SKIP,
      limit  				    : NO_LIMIT,
      selected			    : ''
    }

    let stateOptions = {
      collection_name: "masters",
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: "state",
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: "",
    };
    let stateList = await getDropdownList(stateOptions);

    let dropdownData = await getDropdownList(dropdownOptions);
    req.breadcrumbs(BREADCRUMBS["admin/masters/add"]);
    res.render("add", {
      key: key,
      dynamic_variable: key,
      dynamic_url: key,
      country_list : dropdownData.result,
      state_list: stateList.result
    });
    
  };

  this.postAddMaster = async function (req, res, next) {
    // req.body  = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    var key   = req.params.key ? req.params.key : "";
    // if (isPost(req)) {
      if (key != "") {
        
          var name          = req.body.name ? req.body.name : "";
          var country       = req.body.country ? req.body.country : "";
          var countryCode   = req.body.country_code ? req.body.country_code : "";
          var city       = req.body.city ? req.body.city : "";
          var state       = req.body.state ? req.body.state : "";
          var brandImage  = req.files && req.files.brand_image ? req.files.brand_image : "";
          var idDocumentImage  = req.files && req.files.id_document_image ? req.files.id_document_image : "";
          const collection  = db.collection("masters");
          /**  Check master name does exist or not **/
          collection.findOne(
            {
              is_deleted  : NOT_DELETED,
              name        : {$regex : '^'+cleanRegex(name)+'$',$options : 'i'},
              key         : key,
            },
            {
              _id: 1,
            },
            async function (error, results) {
              if (!error) {
                if (results == null) {
                  /**  If master name doesn't exist **/
                if(key === 'city'){
                  var data = {
                    name      : name,
                    country   : country,
                    state     : state,
                    key       : key,
                    is_active : ACTIVE,
                    is_deleted: NOT_DELETED,
                    created: new Date(),
                  };
                }else if(key === 'state'){
                  var data = {
                    name      : name,
                    country   : country,
                    key       : key,
                    is_active : ACTIVE,
                    is_deleted: NOT_DELETED,
                    created: new Date(),
                  };
                }else if(key === 'brandlist'){
                  var data = {
                    name      : name,
                    key       : key,
                    is_active : ACTIVE,
                    is_deleted: NOT_DELETED,
                    created: new Date(),
                  };
                }else{
                  var data = {
                    name      : name,
                    key       : key,
                    is_active : ACTIVE,
                    is_deleted: NOT_DELETED,
                    created: new Date(),
                  };
                }
                  if(key === 'city'){
                    data['country'] = ObjectId(country)
                    data['state'] = ObjectId(state)
                  } 
                  if(key === 'state'){
                    data['country'] = ObjectId(country)
                  }
                  if(key === 'country') {
                    data['country_code'] = countryCode
                  }
                  if(key === 'brandlist'){
                    let optionsnMultipleImages = {
                      file: brandImage,
                      file_path: PRODUCT_FILE_PATH,
                    };
                    let uploadImages = await moveUploadedFile(optionsnMultipleImages);
                    if(uploadImages.status == STATUS_ERROR){
                      return res.send({
                        status: STATUS_ERROR,
                        message: [{ param: 'brand_image', msg: uploadImages.message }],
                      });
                    }else{
                      let brandImgName = uploadImages.new_file ? uploadImages.new_file : '';
                      data['image'] = brandImgName;
                    }
                  }

                  if(key === 'doc_preview'){
                    let optionsnMultipleImages = {
                      file: idDocumentImage,
                      file_path: PRODUCT_FILE_PATH,
                    };
                    let uploadImages = await moveUploadedFile(optionsnMultipleImages);
                    if(uploadImages.status == STATUS_ERROR){
                      return res.send({
                        status: STATUS_ERROR,
                        message: [{ param: 'id_document_image', msg: uploadImages.message }],
                      });
                    }else{
                      let idDocumentImageName = uploadImages.new_file ? uploadImages.new_file : '';
                      data['image'] = idDocumentImageName;
                    }
                  }

                  collection.insert(data, function (error, result) {
                    if (!error) {
                      req.flash(STATUS_SUCCESS, res.__("admin.master.added_successfully"
                      // , key
                      ));
                      res.send({
                        status: STATUS_SUCCESS,
                        message: res.__("admin.master.added_successfully"
                        // ,key
                        ),
                        rediect_url: "/admin/masters/" + key,
                      });
                    } else {
                      req.flash(
                        STATUS_ERROR,
                        TEXT_SETTINGS["admin.system.something_went_wrong"]
                      );
                      res.send({
                        status: STATUS_ERROR,
                        message: res.__("admin.system.something_went_wrong"),
                        rediect_url: "/admin/masters/" + key,
                      });
                    }
                  });
                } else {
                  /** If master name does exist**/
                  res.send({
                    status: STATUS_ERROR,
                    message: [
                      {
                        param: "name",
                        msg: res.__(
                          "admin.master.this_name_already_exist_please_chooose_another"
                        ),
                      },
                    ],
                    rediect_url: "/admin/masters/" + key,
                  });
                }
              } else {
                req.flash(
                  STATUS_ERROR,
                  res.__("admin.system.something_went_wrong")
                );
                res.send({
                  status: STATUS_ERROR,
                  message: res.__("admin.system.something_went_wrong"),
                  rediect_url: "/admin/masters/" + key,
                });
              }
            }
          ); /** End Check master name does exist or not**/
      
      } else {
        res.send({
          status: STATUS_ERROR,
          message: res.__("admin.system.something_went_wrong"),
          rediect_url: "/admin/masters/" + key,
        });
      }
    
      
  };
  /** Function is used to edit master
   * key as params
   * return response
   * */
  this.getEditMaster = function (req, res, next) {
    var key   = (req.params.key) ? req.params.key : "";
    var id    = (req.params.id) ? req.params.id : "";
    getMasterDetail(req, res).then(async function (response) {
      if (response && response.status == STATUS_ERROR) {
        req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
        res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
      } else {
        let countryList = '';
        let stateList = '';
        if(key == 'city'){
          let dropdownOptions = {
            collection_name 	: 'masters',
            search_condition  : {is_active : ACTIVE, is_deleted : NOT_DELETED, key : 'country'},
            get_condition  		: {name : 1},
            sort  				    : {name : 1},
            skip  				    : NO_SKIP,
            limit  				    : NO_LIMIT,
            selected			    : response.result.country,
          }
    
          let dropdownData = await getDropdownList(dropdownOptions);
          
          countryList   = dropdownData.result

          let stateOptions = {
            collection_name: "masters",
            search_condition: {
              is_active: ACTIVE,
              is_deleted: NOT_DELETED,
              key: "state",
              country: dropdownOptions.selected
            },
            get_condition: { name: 1 },
            sort: { name: 1 },
            skip: NO_SKIP,
            limit: NO_LIMIT,
            selected: response.result.state,
          };
          let stateListData = await getDropdownList(stateOptions);
          stateList = stateListData.result;
        }
        req.breadcrumbs(BREADCRUMBS["admin/masters/edit"]);
        res.render("edit", {
          key: key,
          result: response.result,
          dynamic_variable: key,
          dynamic_url: key,
          country_list : countryList,
          state_list: stateList
        });
      }
    });
  };

  this.postEditMaster = function (req, res, next) {
    
    var key   = (req.params.key) ? req.params.key : "";
    var id    = (req.params.id) ? req.params.id : "";
    
      if (key && id) {
        
          var name          = (req.body.name) ? req.body.name : "";
          var country       = req.body.country ? req.body.country : "";
          var countryCode   = req.body.country_code ? req.body.country_code : "";
          var brandImage  = req.files && req.files.brand_image ? req.files.brand_image : "";
          var idDocumentImage  = req.files && req.files.id_document_image ? req.files.id_document_image : "";
          const collection = db.collection("masters");
          /**  Check master name does exist or not **/


          collection.findOne(
            {
              is_deleted  : NOT_DELETED,
              name        : {$regex : '^'+cleanRegex(name)+'$',$options : 'i'},
              key         : key,
              _id         : { $ne: ObjectId(id) },
            },
            {
              _id: 1,
            },
            async function (error, results) {
              if (!error) {
                if (!results) {
                  let data = {
                    name      : name,
                    modified  : new Date(),
                  };

                  if(key === 'city'){
                    data['country'] = ObjectId(country)
                    data['state'] = ObjectId(state)
                  } 
                  if(key === 'state'){
                    data['country'] = ObjectId(country)
                  }
                  if(key === 'country') {
                    data['country_code'] = countryCode
                  }
                  if(key === 'brandlist'){
                    if(req.files && req.files.brand_image){
                      let optionsnMultipleImages = {
                        file: brandImage,
                        file_path: PRODUCT_FILE_PATH,
                      };
                      let uploadImages = await moveUploadedFile(optionsnMultipleImages);
                      if(uploadImages.status == STATUS_ERROR){
                        return res.send({
                          status: STATUS_ERROR,
                          message: [{ param: 'brand_image', msg: uploadImages.message }],
                        });
                      }else{
                        let brandImgName = uploadImages.new_file ? uploadImages.new_file : '';
                        data['image'] = brandImgName;
                      }
                    }
                  }
                  if(key === 'doc_preview'){
                    if(req.files && req.files.id_document_image){
                      let optionsnMultipleImages = {
                        file: idDocumentImage,
                        file_path: PRODUCT_FILE_PATH,
                      };
                      let uploadImages = await moveUploadedFile(optionsnMultipleImages);
                      if(uploadImages.status == STATUS_ERROR){
                        return res.send({
                          status: STATUS_ERROR,
                          message: [{ param: 'id_document_image', msg: uploadImages.message }],
                        });
                      }else{
                        let idDocumentImageName = uploadImages.new_file ? uploadImages.new_file : '';
                        data['image'] = idDocumentImageName;
                      }
                    }
                  }
                  updateMaster(req, res, data);
                } else {
                  /** If master name does exist**/
                  res.send({
                    status: STATUS_ERROR,
                    message: [
                      {
                        param: "name",
                        msg: res.__(
                          "admin.master.this_name_already_exist_please_chooose_another"
                        ),
                      },
                    ],
                    rediect_url: "/admin/masters/" + key,
                  });
                }
              } else {
                req.flash(
                  STATUS_ERROR,
                  res.__("admin.system.something_went_wrong")
                );
                res.send({
                  status: STATUS_ERROR,
                  message: res.__("admin.system.something_went_wrong"),
                  rediect_url: "/admin/masters/" + key,
                });
              }
            }
          ); /** End Check master name does exist or not**/
        // } else {
        //   res.send({
        //     status: STATUS_ERROR,
        //     message: errors,
        //     rediect_url: "/admin/masters/" + key,
        //   });
        // }
      } else {
        res.send({
          status: STATUS_ERROR,
          message: res.__("admin.system.something_went_wrong"),
          rediect_url: "/admin/masters/" + key,
        });
      }
    // } else {
      
    // }
  };


  /** Function is used to update masters */
  updateMaster = (req, res, data) =>{
    var key   = (req.params.key) ? req.params.key : "";
    var id    = (req.params.id) ? req.params.id : "";
    const collection = db.collection("masters");
    collection.updateOne(
      { _id: ObjectId(id) },
      { $set: data },
      function (error, result) {
        if (!error) {
          req.flash(
            STATUS_SUCCESS,
            res.__(
              "admin.master.updated_successfully",
              // key
            )
          );
          res.send({
            status: STATUS_SUCCESS,
            message: res.__(
              "admin.master.updated_successfully",
              // key
            ),
            rediect_url: "/admin/masters/" + key,
          });
        } else {
          req.flash(
            STATUS_ERROR,
            res.__("admin.system.something_went_wrong")
          );
          res.send({
            status: STATUS_ERROR,
            message: res.__("admin.system.something_went_wrong"),
            rediect_url: "/admin/masters/" + key,
          });
        }
      }
    );
  }

  let getMasterDetail = (req, res) => {
    return new Promise(function (resolve) {
      let id  = (req.params.id)   ? req.params.id : "";
      let key = (req.params.key)  ? req.params.key : "";
      if (!id) {
        let response = {
          status: STATUS_ERROR,
          result: {},
        };
        return resolve(response);
      } else {
        var collection = db.collection("masters");
        collection.findOne(
          { _id: ObjectId(id), is_deleted: NOT_DELETED },
          function (err, result) {
            if (!err) {
              if(key == 'vehicle'){
                let options = {
                  path    : VEHICLE_FILE_URL,
                  result  : [result],
                };
                appendFile(options).then((response) => {
                  let newResult = response.result[0] ? response.result[0] : {};
                  let finalResponse = {
                    status: STATUS_SUCCESS,
                    result: newResult,
                  };
                  resolve(finalResponse);
                });
              }else{
                let response = {
                  status: STATUS_SUCCESS,
                  result: result,
                };
                resolve(response);
              }
            } else {
              let response = {
                status: STATUS_ERROR,
                result: {},
              };
              resolve(response);
            }
          }
        );
      }
    });
  };

  /** Function to view detail **/
  this.viewDetail = function (req, res, next) {
    var id = req.params.id ? req.params.id : "";
    let key = req.params.key ? req.params.key : "";
    if (!id) {
      req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
      res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
    }

    getMasterDetail(req, res).then(function (response) {
      if (response && response.status == STATUS_ERROR) {
        req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
        res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
      } else {
        req.breadcrumbs(BREADCRUMBS["admin/masters/view"]);
        res.render("view", {
          result            : (response.result) ? response.result : {},
          key               : key,
          dynamic_variable  : key,
          dynamic_url       : key,
        });
      }
    })
  }; //End viewDetail

  /** Function to update status **/
  this.updateStatus = function (req, res, next) {
    let id = req.params.id ? req.params.id : "";
    let key = req.params.key ? req.params.key : "";
    let status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    if (!id && !key) {
      req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
      res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
    }
    const collection = db.collection("masters");
    collection.updateOne(
      { _id: ObjectId(id) },
      {
        $set: {
          is_active: status,
          modified: new Date(),
        },
      },
      function (err, result) {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.masters.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
        }
      }
    );
  }; //End updateStatus

  /** Function to remove **/
  this.remove = function (req, res, next) {
    var id = req.params.id ? req.params.id : "";
    let key = req.params.key ? req.params.key : "";
    if (!id && !key) {
      req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
      res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
      return;
    }
    var collection = db.collection("masters");
    collection.updateOne(
      { _id: ObjectId(id) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
      function (err, result) {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.master.deleted_successfully", key)
          );
          res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
        } else {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.system.something_went_wrong")
          );
          res.redirect(WEBSITE_ADMIN_URL + "masters/" + key);
        }
      }
    );
  }; //End remove

  /** Function to get state list **/
  this.getStateList = async (req, res, next) => {
    let countryId = req.body.country_id ? req.body.country_id : "";
    
    let countryOptions = {
      collection_name: "masters",
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: "state",
        country: ObjectId(countryId),
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: "",
    };
    let stateList = await getDropdownList(countryOptions);
    
    res.send(stateList.result);
  }; //End getStateList
}


module.exports = new Master();
