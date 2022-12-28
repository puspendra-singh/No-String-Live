const async = require("async");
function Block() {

  /** Function to get list **/
  this.list = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length   ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip  = req.body.start    ? parseInt(req.body.start)  : DEFAULT_SKIP;
      let draw  = req.body.draw     ? parseInt(req.body.draw)   : DEFAULT_SKIP;

      let commonCondition = { is_deleted: NOT_DELETED };
      dataTableConfig(req,res,null,function(configDataTable){
        configDataTable.search_condition = Object.assign(configDataTable.search_condition,commonCondition );
        const collection = db.collection("blocks");
        async.parallel(
          {
            list: (callback) => {
              collection.find(configDataTable.search_condition, {}).skip(skip).limit(limit).sort(configDataTable.sort_condition).toArray((errUser, resultUser) => {
                  callback(errUser, resultUser);
                });
            },
            recordsTotol: (callback) => {
              collection.countDocuments(commonCondition, {}, (err, result) => {
                callback(err, result);
              });
            },
            recordsfiltered: (callback) => {
              collection.countDocuments(configDataTable.search_condition,{},(err, result) => {
                  callback(err, result);
                }
              );
            },
          },
          (err, response) => {
            /** Send error message */
            if (err) return next(err);

            res.send({
              status          : STATUS_SUCCESS,
              draw            : draw,
              data            : response.list ? response.list : [],
              recordsTotal    : response.recordsTotol ? response.recordsTotol : 0,
              recordsFiltered : response.recordsfiltered ? response.recordsfiltered : 0,
            });
          }
        );
      });
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/block/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End List

  /** Function is used to add block */
  this.add = async (req, res, next) => {
    if (isPost(req)) {
      req.body  = sanitizeData(req.body, NOT_ALLOWED_TAGS);
      req.checkBody({
        page_name: {
          isLength :{
            options    : {min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT},
            errorMessage:res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character")
          },
          notEmpty: true,
          errorMessage: res.__("admin.block.please_enter_page_name"),
        },
        name: {
          isLength :{
            options    : {min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT},
            errorMessage:res.__("system.title_limit.this_value_should_contain_minimum_and_maximum_character")
          },
          notEmpty: true,
          errorMessage: res.__("admin.block.please_enter_name"),
        },
        description: {
          isLength :{
            options    : {min : MIN_CHARACTER_DESCRIPTION_LIMIT, max : MAX_CHARACTER_DESCRIPTION_LIMIT},
            errorMessage:res.__("system.description_limit.this_value_should_contain_minimum_and_maximum_character")
          },
          notEmpty: true,
          errorMessage: res.__("admin.block.please_enter_description"),
        },
      });

      var errors = uniqueValidations(req.validationErrors());
      if (!errors) {
        let name        = req.body.name         ? req.body.name : "";
        let title       = req.body.title        ? req.body.title : "";
        let pageName    = req.body.page_name    ? req.body.page_name : "";
        let description = req.body.description  ? req.body.description : "";

        /** Slug options */
        let slugOptions = {
          table_name  : "blocks",
          title       : name,
          slug_field  : 'name'
        };

        let slugData =  await convertInToSlug(slugOptions);
        const block = db.collection("blocks");
        block.insertOne(
          {
            name        : name,
            title       : title,
            page_name   : pageName,
            description : description,
            slug        : slugData.slug,
            is_active   : ACTIVE,
            is_deleted  : NOT_DELETED,
            created     : new Date(),
          },
          function (err, result) {
            if (!err) {
              
              req.flash(
                STATUS_SUCCESS,
                res.__("admin.block.block_has_been_created_successfully")
              );
              res.send({
                status: STATUS_SUCCESS,
                message: '',
                rediect_url: "/admin/block",
              });
            } else {
              req.flash(
                STATUS_ERROR,
                res.__("admin.system.something_went_wrong")
              );
              res.send({
                status: STATUS_ERROR,
                message: '',
                rediect_url: "/block",
              });
            }
          }
        );
      } else {
        res.send({
          status: STATUS_ERROR,
          message: errors,
          rediect_url: "/block",
        });
      }
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/block/add"]);
      res.render("add");
    }
  }; //End add

  /** Function to edit detail **/
  this.edit = function (req, res) {
    let blockId = req.params.id ? req.params.id : "";
    if (isPost(req)) {
      req.body  = sanitizeData(req.body, NOT_ALLOWED_TAGS);
      req.checkBody({
        page_name: {
          isLength :{
            options    : {min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT},
            errorMessage:res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character")
          },
          notEmpty: true,
          errorMessage: res.__("admin.block.please_enter_page_name"),
        },
        name: {
          isLength :{
            options    : {min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT},
            errorMessage:res.__("system.title_limit.this_value_should_contain_minimum_and_maximum_character")
          },
          notEmpty: true,
          errorMessage: res.__("admin.block.please_enter_name"),
        },
        description: {
          isLength :{
            options    : {min : MIN_CHARACTER_DESCRIPTION_LIMIT, max : MAX_CHARACTER_DESCRIPTION_LIMIT},
            errorMessage:res.__("system.description_limit.this_value_should_contain_minimum_and_maximum_character")
          },
          notEmpty: true,
          errorMessage: res.__("admin.block.please_enter_description"),
        },
      });
      
      let name        = req.body.name         ? req.body.name : "";
      let title       = req.body.title        ? req.body.title : "";
      let pageName    = req.body.page_name    ? req.body.page_name : "";
      let description = req.body.description  ? req.body.description : "";
      var errors = uniqueValidations(req.validationErrors());
      if (!errors) {
        const collection = db.collection("blocks");
        collection.updateOne(
          { _id: ObjectId(blockId) },
          { $set: { name: name, title : title, description : description ,page_name   : pageName, modified: new Date() } },
          function (err, result) {
            if (!err) {
              
              req.flash(
                STATUS_SUCCESS,
                res.__("admin.block.block_has_been_updated_successfully")
              );
              res.send({
                status: STATUS_SUCCESS,
                message: '',
                rediect_url: "/admin/block",
              });
            } else {
              req.flash(
                STATUS_ERROR,
                res.__("admin.system.something_went_wrong")
              );
              res.send({
                status: STATUS_ERROR,
                message: '',
                rediect_url: "/block",
              });
            }
          }
        );
      } else {
        res.send({
          status: STATUS_ERROR,
          message: errors,
          rediect_url: "/block",
        });
      }
    } else {
      var collection = db.collection("blocks");
      collection.findOne({ _id: ObjectId(blockId) }, function (err, result) {
        if (!err) {
          req.breadcrumbs(BREADCRUMBS["admin/block/edit"]);
          res.render("edit", {
            result: result ? result : {},
            message: "",
          });
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "block");
        }
      });
    }
  }; //End editDetail

  /** Function to delete detail **/
  this.deleteDetail   =  (req, res)=>{
    var blockId       = req.params.id ? req.params.id : "";
    const collection  = db.collection("blocks");
    collection.updateOne(
      { _id: ObjectId(blockId) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
      function (err, result) {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.block.block_has_been_deleted_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "block");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "block");
        }
      }
    );
  }; //End deleteDetail

  /** Function to update status **/
  this.updateStatus =  (req, res)=> {
    var blockId = req.params.id ? req.params.id : "";
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const collection = db.collection("blocks");
    collection.updateOne(
      { _id: ObjectId(blockId) },
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
            res.__("admin.block.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "block");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "block");
        }
      }
    );
  }; //End updateStatus
}
module.exports = new Block();
