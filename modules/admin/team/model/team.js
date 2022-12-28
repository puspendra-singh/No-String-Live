const async = require("async");
function Team() {
  /** Function to get list **/
  this.list = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip  = req.body.start  ? parseInt(req.body.start)  : DEFAULT_SKIP;
      let draw  = req.body.draw   ? parseInt(req.body.draw)   : DEFAULT_SKIP;

      let commonCondition = { is_deleted: NOT_DELETED };

      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );
        const collection = db.collection("our_team");
        async.parallel(
          {
            list: (callback) => {
              collection
                .find(configDataTable.search_condition, {})
                .skip(skip)
                .limit(limit)
                .sort(configDataTable.sort_condition)
                .toArray((err, result) => {
                  if(result.length>0){
                    let options = {
                      path    : TEAM_FILE_URL,
                      result  : result,
                    };
                    appendFile(options).then((response) => {
                      let result = response.result ? response.result : [];
                      callback(err, result);
                    });
                  }else{
                    callback(err, result);
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
            /** Send error message */
            if (err) return next(err);
            res.send({
              status: STATUS_SUCCESS,
              draw: draw,
              data: response.list ? response.list : [],
              recordsTotal: response.recordsTotol ? response.recordsTotol : 0,
              recordsFiltered: response.recordsfiltered
                ? response.recordsfiltered
                : 0,
            });
          }
        );
      });
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/team/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End List

  /** Function is used to add team member */
  this.getAdd = (req, res, next) => {
      req.breadcrumbs(BREADCRUMBS["admin/team/add"]);
      res.render("add");
    
  }; //End add

  this.postAdd = (req, res, next, file) => {
    
    let firstName   = req.body.first_name ? req.body.first_name: '' ;
    let lastName    = req.body.last_name ? req.body.last_name : '';
    let description = req.body.description  ? req.body.description : "";
    let errors 	    = [];

    let options = {
      file              : file,
      file_path         : TEAM_FILE_PATH,
    };

      /** Upload file */
      
    moveUploadedFile(options).then((response) => {
      if (response.status == STATUS_ERROR) {
        
        return res.send({
          status  : STATUS_ERROR,
          message : [{ param: "image", msg: response.message }],
        });
      } else {
        var newFileName = response.new_file     ? response.new_file : "";
        
        let firstName   = req.body.first_name    ? req.body.first_name : "";
        let lastName    = req.body.last_name     ? req.body.last_name:"";
        let description = req.body.description  ? req.body.description :"";
        let fullName    = firstName + ' ' + lastName;
        const team = db.collection("our_team");
        team.insertOne(
          {
            first_name  : firstName,
            last_name   : lastName,
            full_name   : fullName,
            image       : newFileName,
            description : description,
            is_active   : ACTIVE,
            is_deleted  : NOT_DELETED,
            created     : new Date(),
          },
          function (err, result) {
            if (!err) {
              req.flash(
                STATUS_SUCCESS,
                res.__("admin.team.team_member_has_been_added_successfully")
              );
              return res.send({
                status      : STATUS_SUCCESS,
                message     : '',
                rediect_url : "/admin/team",
              });
            } else {
              req.flash(STATUS_ERROR,res.__("admin.system.something_went_wrong"));
              return res.send({
                status      : STATUS_ERROR,
                message     : '',
                rediect_url : "/team",
              });
            }
          }
        );
      }
    });
  }; //End add

  /** Function to edit detail **/
  this.getEdit = function (req, res) {
    let teamId = req.params.id ? req.params.id : "";
    var collection = db.collection("our_team");
    collection.findOne({ _id: ObjectId(teamId) }, function (err, result) {
      if (!err) {
        let options = {
          path    : TEAM_FILE_URL,
          result  : [result],
        };
        appendFile(options).then((response) => {
          let result = response.result[0] ? response.result[0] : [];
          req.breadcrumbs(BREADCRUMBS["admin/team/edit"]);
          res.render("edit", {
            result: result ? result : {},
            message: "",
          });
        });
        
      } else {
        req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
        res.redirect(WEBSITE_ADMIN_URL + "team");
      }
    });
    
  }; 

  this.postEdit = function (req, res, next, file) {
    let teamId = req.params.id ? req.params.id : "";

    let firstName   = (req.body.first_name) ? req.body.first_name : '';
    let lastName    = (req.body.last_name) ? req.body.last_name : '';
    let description = (req.body.description) ? req.body.description : "";
    let errors 	= [];

    let fileNameOld   = req.body.old_image     ? req.body.old_image : "";
    let extension     = (fileNameOld)       ? fileNameOld.split('.') :'';
    extension         = extension.pop().toLowerCase();

    if( !req.files){
      if(IMAGE_EXTENSIONS.indexOf(extension) == -1){
        return res.send({
          status: STATUS_ERROR,
          message: [
            {
              param: "image",
              msg: res.__("admin.team.please_select_an_image"),
            },
          ],
        });
      }
    }

    if (req.files) {
      
        let options = {
          file              : file,
          file_path         : TEAM_FILE_PATH,
        };

        moveUploadedFile(options).then((response) => {
          if (response.status == STATUS_ERROR) {
            return res.send({
              status: STATUS_ERROR,
              message: [{ param: "image", msg: response.message }],
            });
          } else {
            var newFileName = response.new_file ? response.new_file : "";
            updateTeam(req, res, newFileName);
          }
        });
      } else {
      let oldImage = req.body.old_image ? req.body.old_image : "";
      updateTeam(req, res, oldImage);
    } 
  }; //End editDetail

  /** Function is used to update team */
  function updateTeam(req, res, fileName) {
    let teamId        = req.params.id         ? req.params.id : "";
    let firstName     = req.body.first_name    ? req.body.first_name : "";
    let lastName      = req.body.last_name     ? req.body.last_name : "";
    let description   = req.body.description  ? req.body.description : "";
    let fullName      = firstName + ' ' + lastName;


    /** Update team data **/
    let updateData = {
      first_name  : firstName,
      last_name   : lastName,
      full_name   : fullName,
      image       : fileName,
      description : description,
      modified    : new Date(),
    };


    const collection = db.collection("our_team");
    collection.updateOne({ _id: ObjectId(teamId) }, { $set: updateData }, function (error,result) {
      if (!error) {
        req.flash(
          STATUS_SUCCESS,
          res.__("admin.team.team_member_has_been_updated_successfully")
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: "",
          rediect_url: "/admin/team",
        });
      } else {
        req.flash(
          STATUS_SUCCESS,
          res.__("admin.system.something_went_wrong_please_try_again_later")
        );
        return res.send({
          status: STATUS_ERROR,
          message: "",
          rediect_url: "/admin/team",
        });
      }
    });
  } // End update team


  /** Function to delete detail **/
  this.deleteDetail = function (req, res) {
    var teamId        = req.params.id ? req.params.id : "";
    const collection  = db.collection("our_team");
    collection.updateOne(
      { _id: ObjectId(teamId) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
      function (err, result) {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.team.team_member_has_been_deleted_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "team");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "team");
        }
      }
    );
  }; //End deleteDetail

  /** Function to update status **/
  this.updateStatus = function (req, res) {
    var teamId  = req.params.id ? req.params.id : "";
    var status    = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const collection = db.collection("our_team");
    collection.updateOne(
      { _id: ObjectId(teamId) },
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
            res.__("admin.team.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "team");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "team");
        }
      }
    );
  }; //End updateStatus
}
module.exports = new Team();
