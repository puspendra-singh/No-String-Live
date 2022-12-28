const { validationResult } = require('express-validator');
const fs = require("fs");

function Text_settings(req, res) {
  /** Function to get list **/
  this.list = function (req, res, next) {
    var type = req.params.type ? req.params.type : "";
    if (isPost(req)) {
      if (type) {
        let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
        let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
        let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;

        /** config datatable **/
        dataTableConfig(req, res, null, function (configDataTable) {
          configDataTable.search_condition["type"] = type;
          const collection = db.collection("text_settings");
          var async = require("async");
          async.parallel(
            {
              recordsList: function (callback) {
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
                collection.countDocuments({ type: type }, {}, function (
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
                data: response.recordsList ? response.recordsList : [],
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
      req.breadcrumbs(BREADCRUMBS["admin/text_settings/list"]);
      res.render("list", {
        type: type,
        dynamic_variable: type,
      });
    }
  }; //End List

  /** Function is used to add text-setting
   * key as params
   * return response
   * */
  this.add = function (req, res, next) {
    let type = req.params.type ? req.params.type : "";
    if (isPost(req)) {
      if (!type) {
        return res.send({
          status: STATUS_ERROR,
          message: res.__("admin.system.something_went_wrong"),
          rediect_url: WEBSITE_ADMIN_URL,
        });
      }
      // req.checkBody({
      //   key: {
      //     notEmpty: true,
      //     errorMessage: res.__("admin.text_setting.please_enter_key"),
      //   },
      //   value: {
      //     notEmpty: true,
      //     errorMessage: res.__("admin.text_setting.please_enter_value"),
      //   },
      // });

      const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
      if (errors.length !== 0) {
        return res.send({
          status: STATUS_ERROR,
          message: errors,
          rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
        });
      }

      let key = req.body.key ? req.body.key : "";
      let value = req.body.value ? req.body.value : "";
      const collection = db.collection("text_settings");

      /**  Check text-setting name does exist or not **/
      collection.findOne(
        { is_deleted: NOT_DELETED, key: key },
        { _id: 1 },
        function (error, results) {
          if (!error) {
            if (results == null) {
              /**  If text setting doesn't exist **/
              let data = {
                value: value,
                key: key,
                type: type,
                created: new Date(),
              };
              collection.insert(data, function (error, result) {
                if (!error) {
                  var jsonData = {};
                  collection
                    .find({})
                    .toArray(function (errorText, resultsText) {
                      resultsText.map((records) => {
                        jsonData[records.key] = records.value;
                      });

                      fs.writeFile(
                        WEBSITE_ROOT_PATH + "/locales/en.json",
                        JSON.stringify(jsonData),
                        (err) => {}
                      );
                      req.flash(
                        STATUS_SUCCESS,
                        res.__(
                          "admin.text_settings.text_setting_has_been_added_successfully"
                        )
                      );
                      res.send({
                        status: STATUS_SUCCESS,
                        message: res.__(
                          "admin.text_settings.text_setting_has_been_added_successfully"
                        ),
                        rediect_url:
                          WEBSITE_ADMIN_URL + "text_settings/" + type,
                      });
                    });
                } else {
                  req.flash(
                    STATUS_ERROR,
                    res.__("admin.system.something_went_wrong")
                  );
                  res.send({
                    status: STATUS_ERROR,
                    message: res.__("admin.system.something_went_wrong"),
                    rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
                  });
                }
              });
            } else {
              /** If key does exist**/
              res.send({
                status: STATUS_ERROR,
                message: [
                  {
                    param: "key",
                    msg: res.__(
                      "admin.text_settings.this_name_already_exist_please_chooose_another"
                    ),
                  },
                ],
                rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
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
              rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
            });
          }
        }
      ); /** End Check text setting key does exist or not**/
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/text_settings/add"]);
      res.render("add", {
        key: type,
        dynamic_url: type,
        dynamic_variable: type,
      });
    }
  };

  /** Function is used to edit text setting
   * key as params
   * return response
   * */
  this.edit = function (req, res, next) {
    let type = req.params.type ? req.params.type : "";
    let id = req.params.id ? req.params.id : "";
    if (isPost(req)) {
      if (type && id) {
        // req.checkBody({
        //   key: {
        //     notEmpty: true,
        //     errorMessage: res.__("admin.text_settings.please_enter_key"),
        //   },
        //   value: {
        //     notEmpty: true,
        //     errorMessage: res.__("admin.text_settings.please_enter_value"),
        //   },
        // });

        const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
        if (errors.length === 0) {
          let key = req.body.key ? req.body.key : "";
          let value = req.body.value ? req.body.value : "";
          const collection = db.collection("text_settings");
          /**  Check master name does exist or not **/
          collection.findOne(
            {
              value: { $regex: new RegExp("^" + value, "i") },
              key: key,
              type: type,
              _id: { $ne: ObjectId(id) },
            },
            {
              _id: 1,
            },
            function (error, results) {
              if (!error) {
                if (!results) {
                  /**  If master name doesn't exist **/
                  let data = {
                    type: type,
                    key: key,
                    value: value,
                    modified: new Date(),
                  };
                  collection.updateOne(
                    { _id: ObjectId(id) },
                    { $set: data },
                    function (error, result) {
                      if (!error) {
                        var jsonData = {};
                      collection.find({}).toArray(function (errorText, resultsText) {
                          resultsText.map((records) => {
                            jsonData[records.key] = records.value;
                          });

                          fs.writeFile(
                            WEBSITE_ROOT_PATH + "/locales/en.json",
                            JSON.stringify(jsonData),
                            (err) => {}
                          );
                          req.flash(
                            STATUS_SUCCESS,
                            res.__(
                              "admin.text_settings.text_settings_has_been_updated_successfully"
                            )
                          );
                        });





                        // req.flash(
                        //   STATUS_SUCCESS,
                        //   res.__(
                        //     "admin.text_settings.text_settings_has_been_updated_successfully"
                        //   )
                        // );
                        res.send({
                          status: STATUS_SUCCESS,
                          message: res.__(
                            "admin.text_settings.text_settings_has_been_updated_successfully"
                          ),
                          rediect_url:
                            WEBSITE_ADMIN_URL + "text_settings/" + type,
                        });
                      } else {
                        req.flash(
                          STATUS_ERROR,
                          TEXT_SETTINGS["admin.system.something_went_wrong"]
                        );
                        res.send({
                          status: STATUS_ERROR,
                          message:
                            TEXT_SETTINGS["admin.system.something_went_wrong"],
                          rediect_url:
                            WEBSITE_ADMIN_URL + "text_settings/" + type,
                        });
                      }
                    }
                  );
                } else {
                  /** If master name does exist**/
                  res.send({
                    status: STATUS_ERROR,
                    message: [
                      {
                        param: "key",
                        msg:
                          TEXT_SETTINGS[
                            "admin.text_settings.this_name_already_exist_please_chooose_another"
                          ],
                      },
                    ],
                    rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
                  });
                }
              } else {
                req.flash(
                  STATUS_ERROR,
                  TEXT_SETTINGS["admin.system.something_went_wrong"]
                );
                res.send({
                  status: STATUS_ERROR,
                  message: TEXT_SETTINGS["admin.system.something_went_wrong"],
                  rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
                });
              }
            }
          ); /** End Check master name does exist or not**/
        } else {
          res.send({
            status: STATUS_ERROR,
            message: errors,
            rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
          });
        }
      } else {
        res.send({
          status: STATUS_ERROR,
          message: TEXT_SETTINGS["admin.system.something_went_wrong"],
          rediect_url: WEBSITE_ADMIN_URL + "text_settings/" + type,
        });
      }
    } else {
      getDetail(req, res).then(function (response) {
        if (response && response.status == STATUS_ERROR) {
          req.flash(
            STATUS_ERROR,
            TEXT_SETTINGS["admin.system.something_went_wrong"]
          );
          res.redirect(WEBSITE_ADMIN_URL + "text_settings/" + type);
        } else {
          req.breadcrumbs(BREADCRUMBS["admin/text_settings/edit"]);
          res.render("edit", {
            key: type,
            result: response.result,
            dynamic_url: type,
            dynamic_variable: type,
          });
        }
      });
    }
  };

  let getDetail = (req, res) => {
    return new Promise(function (resolve) {
      var id = req.params.id ? req.params.id : "";
      let key = req.params.type ? req.params.type : "";
      if (!id) {
        let response = {
          status: STATUS_ERROR,
          result: {},
        };
        return resolve(response);
      } else {
        var collection = db.collection("text_settings");
        collection.findOne({ _id: ObjectId(id), type: key }, function (
          err,
          result
        ) {
          if (!err) {
            let response = {
              status: STATUS_SUCCESS,
              result: result,
            };
            resolve(response);
          } else {
            let response = {
              status: STATUS_ERROR,
              result: {},
            };
            resolve(response);
          }
        });
      }
    });
  };
}
module.exports = new Text_settings();
