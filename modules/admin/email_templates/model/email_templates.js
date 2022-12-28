const async = require("async");
const { validationResult } = require("express-validator");
function EmailTemplates(req, res) {
  /** Function to get list **/
  this.list = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
      let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;

      let commonCondition = {};

      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );
        const collection = db.collection("email_templates");
        async.parallel(
          {
            userList: (callback) => {
              collection
                .find(configDataTable.search_condition, {})
                .sort(configDataTable.sort_condition)
                .skip(skip)
                .limit(limit)
                .toArray((err, result) => {
                  callback(err, result);
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
            if (err) return next(err);

            res.send({
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
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/email_templates/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End list

  /** Function to edit detail **/
  this.editDetail = (req, res) => {
    let id = req.params.id ? req.params.id : "";
    const collection = db.collection("email_templates");

    var errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if (errors.length === 0) {
      let name = req.body.name ? req.body.name : "";
      let subject = req.body.subject ? req.body.subject : "";
      let description = req.body.description ? req.body.description : "";

      collection.updateOne(
        { _id: ObjectId(id) },
        {
          $set: {
            name: name,
            subject: subject,
            description: description,
            modified: new Date(),
          },
        },
        (err, result) => {
          if (!err) {
            req.flash(
              STATUS_SUCCESS,
              res.__(
                "admin.email_templates.email_templates_has_been_updated_successfully"
              )
            );
            res.send({
              status: STATUS_SUCCESS,
              message: "",
              rediect_url: "/admin/email_templates",
            });
          } else {
            req.flash(
              STATUS_ERROR,
              res.__("admin.system.something_went_wrong")
            );
            res.send({
              status: STATUS_ERROR,
              message: "",
              rediect_url: "",
            });
          }
        }
      );
    } else {
      res.send({
        status: STATUS_ERROR,
        message: errors,
        rediect_url: "",
      });
    }
  }; //End editDetail
}
module.exports = new EmailTemplates();
