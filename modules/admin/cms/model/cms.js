const async = require("async");
const { validationResult } = require("express-validator");
function Cms() {
  /** Function to get list **/
  this.list = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
      let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;

      let commonCondition = { is_deleted: NOT_DELETED };

      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );
        const collection = db.collection("cms");
        async.parallel(
          {
            list: (callback) => {
              collection
                .find(configDataTable.search_condition, {})
                .skip(skip)
                .limit(limit)
                .sort(configDataTable.sort_condition)
                .toArray((errUser, resultUser) => {
                  callback(errUser, resultUser);
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
            /** Send error message */
            if (err) return next(err);

            res.send({
              status: STATUS_SUCCESS,
              draw: draw,
              data: response.list ? response.list : [],
              recordsTotal: response.recordsTotol ? response.recordsTotol : NOT,
              recordsFiltered: response.recordsfiltered
                ? response.recordsfiltered
                : NOT,
            });
          }
        );
      });
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/cms/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End List

  /** Function is used to add cms */
  this.getAdd = async (req, res, next) => {
    req.breadcrumbs(BREADCRUMBS["admin/cms/add"]);
    res.render("add");
    
  }; 

  this.postAdd = async (req, res, next) => {

    let name = req.body.name ? req.body.name : "";
    let title = req.body.title ? req.body.title : "";
    let description = req.body.description ? req.body.description : "";
    
    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if (errors.length === 0) {
      /** Slug options */
      let slugOptions = {
        table_name: "cms",
        title: name,
        slug_field: "name",
      };

      let slugData = await convertInToSlug(slugOptions);
      const cms = db.collection("cms");
      cms.insertOne(
        {
          name: name,
          title: title,
          description: description,
          slug: slugData.slug,
          is_active: ACTIVE,
          is_deleted: NOT_DELETED,
          created: new Date(),
        },
        function (err, result) {
          if (!err) {
            req.flash(
              STATUS_SUCCESS,
              res.__("admin.cms.cms_has_been_created_successfully")
            );
            res.send({
              status: STATUS_SUCCESS,
              message: res.__("admin.cms.cms_has_been_created_successfully"),
              rediect_url: "/admin/cms",
            });
          } else {
            req.flash(
              STATUS_ERROR,
              res.__("admin.system.something_went_wrong")
            );
            res.send({
              status: STATUS_ERROR,
              message: errors,
              rediect_url: "/cms",
            });
          }
        }
      );
    } else {
      res.send({
        status: STATUS_ERROR,
        message: errors,
        rediect_url: "/cms",
      });
    }
    
  }; //End add

  /** Function to edit user detail **/
  this.getEdit = function (req, res) {
    let cmsId = req.params.id ? req.params.id : "";
    var collection = db.collection("cms");
    collection.findOne({ _id: ObjectId(cmsId) }, function (err, result) {
      if (!err) {
        req.breadcrumbs(BREADCRUMBS["admin/cms/edit"]);
        res.render("edit", {
          result: result ? result : {},
          message: "",
        });
      } else {
        req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
        res.redirect(WEBSITE_ADMIN_URL + "cms");
      }
    });
    
  }; //End editDetail

   /** Function to edit user detail **/
   this.postEdit = function (req, res) {
    let cmsId = req.params.id ? req.params.id : "";

      let name = req.body.name ? req.body.name : "";
      let title = req.body.title ? req.body.title : "";
      let description = req.body.description ? String(req.body.description) : "";

      let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
      if (errors.length === 0) {
        const collection = db.collection("cms");
        collection.updateOne(
          { _id: ObjectId(cmsId) },
          {
            $set: {
              name: name,
              title: title,
              description: description,
              modified: new Date(),
            },
          },
          function (err, result) {
            if (!err) {
              req.flash(
                STATUS_SUCCESS,
                res.__("admin.cms.cms_has_been_updated_successfully")
              );
              res.send({
                status: STATUS_SUCCESS,
                message: res.__("admin.cms.cms_has_been_updated_successfully"),
                rediect_url: "/admin/cms",
              });
            } else {
              req.flash(
                STATUS_ERROR,
                res.__("admin.system.something_went_wrong")
              );
              res.send({
                status: STATUS_ERROR,
                message: errors,
                rediect_url: "/cms",
              });
            }
          }
        );
      } else {
        res.send({
          // status: STATUS_ERROR,
          message: errors,
          rediect_url: "/cms",
        });
      }
  }; //End editDetail

  /** Function to delete detail **/
  this.deleteDetail = function (req, res) {
    var cmsId = req.params.id ? req.params.id : "";
    const collection = db.collection("cms");
    collection.updateOne(
      { _id: ObjectId(cmsId) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
      function (err, result) {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.cms.cms_has_been_deleted_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "cms");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "cms");
        }
      }
    );
  }; //End deleteDetail

  /** Function to update status **/
  this.updateStatus = function (req, res) {
    var cmsId = req.params.id ? req.params.id : "";
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const collection = db.collection("cms");
    collection.updateOne(
      { _id: ObjectId(cmsId) },
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
            res.__("admin.cms.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "cms");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "cms");
        }
      }
    );
  }; //End updateStatus
}
module.exports = new Cms();
