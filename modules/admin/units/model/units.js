const async = require("async");
function Units(req, res) {
  /** Function to get unit listing **/
  this.unitList = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
      let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;

      let commonCondition = {
        is_deleted: NOT_DELETED,
      };

      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );
        const collection = db.collection("units");
        async.parallel(
          {
            userList: (callback) => {
              collection
                .aggregate([
                  { $match: configDataTable.search_condition },
                  {
                    $lookup: {
                      from: "units",
                      localField: "parent_id",
                      foreignField: "_id",
                      as: "parent_detail",
                    },
                  },
                  {
                    $project: {
                      is_active: 1,
                      parent_id: 1,
                      unit_name: 1,
                      created: 1,
                      parent_name: {
                        $arrayElemAt: ["$parent_detail.unit_name", 0],
                      },
                    },
                  },
                ])
                .sort(configDataTable.sort_condition)
                .skip(skip)
                .limit(limit)
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
      req.breadcrumbs(BREADCRUMBS["admin/units/list"]);
      res.render("list");
    }
  }; //End unitList

  /** Function is used to add unit */
  this.getAddUnit = (req, res, next) => {
  
    const units = db.collection("units");
    units.find({parent_id: DEACTIVE,is_active: ACTIVE,is_deleted: NOT_DELETED}).toArray((err, result) => {
      if (err) {
        req.flash(
          STATUS_ERROR,
          res.__("admin.system.something_went_wrong")
        );
        res.redirect(WEBSITE_ADMIN_URL + "units");
      } else {
        req.breadcrumbs(BREADCRUMBS["admin/units/add"]);
        res.render("add", {
          parent_list: result ? result : [],
        });
      }
    });
  }
    
  this.postAddUnit = (req, res, next) => {

    let parentId = req.body.parent_id ? req.body.parent_id : DEACTIVE;
    let unitName = req.body.unit_name ? req.body.unit_name : "";
    let path = req.body.path ? req.body.path : "";
    let groupPath = req.body.group_path ? req.body.group_path : "";
    let icon = req.body.icon ? req.body.icon : "";
    let order = req.body.order ? req.body.order : DEACTIVE;
    const units = db.collection("units");
    units.insert({
      parent_id: parentId != DEACTIVE ? ObjectId(parentId) : parentId,
      unit_name: unitName,
      path: path,
      group_path: groupPath,
      icon: icon,
      order: Number(order),
      is_active: ACTIVE,
      is_deleted: NOT_DELETED,
      created: new Date(),
      },
      function (error, result) {
        if (!error) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.units.unit_has_been_added_successfully")
          );
          res.send({
            status: STATUS_SUCCESS,
            message: res.__("admin.units.unit_has_been_added_successfully"),
            rediect_url: "/admin/units",
          });
        } else {
          req.flash(
            STATUS_SUCCESS,
            res.__(
              "admin.system.something_went_wrong_please_try_again_later"
            )
          );
          res.send({
            status: STATUS_ERROR,
            message: res.__(
              "admin.system.something_went_wrong_please_try_again_later"
            ),
            rediect_url: "/admin/units",
          });
        }
      }
    );
  };

  /** Function to edit unit detail **/
  this.getEditUnitDetail = function (req, res) {
    let unitId = req.params.id ? req.params.id : "";
    const units = db.collection("units");
      units
        .find({
          parent_id: DEACTIVE,
          is_active: ACTIVE,
          is_deleted: NOT_DELETED,
        })
        .toArray((errUnit, resultUnit) => {
          if (errUnit) {
            req.flash(
              STATUS_ERROR,
              res.__("admin.system.something_went_wrong")
            );
            res.redirect(WEBSITE_ADMIN_URL + "units");
          } else {
            var collection = db.collection("units");
            collection.findOne({ _id: ObjectId(unitId) }, (err, result) => {
              if (!err) {
                req.breadcrumbs(BREADCRUMBS["admin/units/edit"]);
                res.render("edit", {
                  unit_result: result,
                  parent_list: resultUnit,
                  message: "",
                });
              } else {
                req.flash(
                  STATUS_ERROR,
                  res.__("admin.system.something_went_wrong")
                );
                res.redirect(WEBSITE_ADMIN_URL + "units");
              }
            });
          }
        });
  }; //End editUnitDetail

  this.postEditUnitDetail = function (req, res) {
    let unitId = req.params.id ? req.params.id : "";
    // if (isPost(req)) {
      // req.checkBody({
      //   unit_name: {
      //     notEmpty: true,
      //     errorMessage: res.__("admin.units.please_enter_unit_name"),
      //   },
      //   path: {
      //     notEmpty: true,
      //     errorMessage: res.__("admin.units.please_enter_path"),
      //   },
      //   group_path: {
      //     notEmpty: true,
      //     errorMessage: res.__("admin.units.please_enter_group_path"),
      //   },
      //   order: {
      //     notEmpty: true,
      //     errorMessage: res.__("admin.units.please_enter_order"),
      //   },
      // });

      // var errors = uniqueValidations(req.validationErrors());
      // if (!errors) {
        let parentId = req.body.parent_id ? req.body.parent_id : DEACTIVE;
        let unitName = req.body.unit_name ? req.body.unit_name : "";
        let path = req.body.path ? req.body.path : "";
        let groupPath = req.body.group_path ? req.body.group_path : "";
        let icon = req.body.icon ? req.body.icon : "";
        let order = req.body.order ? req.body.order : DEACTIVE;
        const units = db.collection("units");
        units.updateOne(
          { _id: ObjectId(unitId) },
          {
            $set: {
              parent_id: parentId != DEACTIVE ? ObjectId(parentId) : parentId,
              unit_name: unitName,
              path: path,
              group_path: groupPath,
              icon: icon,
              order: Number(order),
              modified: new Date(),
            },
          },
          function (error, result) {
            if (!error) {
              req.flash(
                STATUS_SUCCESS,
                res.__("admin.units.unit_has_been_updated_successfully")
              );
              res.send({
                status: STATUS_SUCCESS,
                message: res.__(
                  "admin.units.unit_has_been_updated_successfully"
                ),
                rediect_url: "/admin/units",
              });
            } else {
              req.flash(
                STATUS_SUCCESS,
                res.__(
                  "admin.system.something_went_wrong_please_try_again_later"
                )
              );
              res.send({
                status: STATUS_ERROR,
                message: res.__(
                  "admin.system.something_went_wrong_please_try_again_later"
                ),
                rediect_url: "/admin/units",
              });
            }
          }
        );
      // } else {
        
      // }
    // } else {
      
    // }
  }; //End editUnitDetail

  /** Function to delete unit **/
  this.deleteUnit = function (req, res) {
    var unitId = req.params.id ? req.params.id : "";
    const units = db.collection("units");
    units.updateOne(
      { _id: ObjectId(unitId) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
      function (errUnit, resultUnit) {
        if (!errUnit) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.units.unit_has_been_deleted_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "units");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "units");
        }
      }
    );
  }; //End deleteUnit

  /** Function to update user status **/
  this.updateUnitStatus = function (req, res) {
    var unitId = req.params.id ? req.params.id : "";
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const units = db.collection("units");
    units.updateOne(
      { _id: ObjectId(unitId) },
      {
        $set: {
          is_active: status,
          modified: new Date(),
        },
      },
      function (errUnit, resultUnit) {
        if (!errUnit) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.units.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "units");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "units");
        }
      }
    );
  }; //End updateUnitStatus
}
module.exports = new Units();
