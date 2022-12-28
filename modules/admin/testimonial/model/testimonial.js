const async = require("async");
function Testimonial() {
  /** Function to get list **/
  this.list = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip  = req.body.start  ? parseInt(req.body.start)  : DEFAULT_SKIP;
      let draw  = req.body.draw   ? parseInt(req.body.draw)   : DEFAULT_SKIP;
      let statusSearch = req.body.statusSearch ? req.body.statusSearch : '';

      let commonCondition = { is_deleted: NOT_DELETED };

      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(configDataTable.search_condition,commonCondition);
        if (statusSearch) {
          configDataTable.search_condition['is_active'] = Number(statusSearch);
        }
        const collection = db.collection("testimonials");
        async.parallel(
          {
            list: (callback) => {
              collection.find(configDataTable.search_condition, {}).skip(skip).limit(limit).sort(configDataTable.sort_condition).toArray((err, result) => {
                if (result.length > 0) {
                  let options = {
                    path: TESTIMONIAL_FILE_URL,
                    result: result,
                  };
                  appendFile(options).then((response) => {
                    let result = response.result ? response.result : [];
                    callback(err, result);
                  });
                } else {
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
      req.breadcrumbs(BREADCRUMBS["admin/testimonials"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End List

  /** Function is used to add cms */
  this.add = async(req, res, next) => {
    if (isPost(req)) {
      req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS);
      // req.checkBody({
      //   name: {
      //     isLength :{
      //       options    : {min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT},
      //       errorMessage:res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character")
      //     },
      //     notEmpty: true,
      //     errorMessage: res.__("admin.testimonials.please_enter_name"),
      //   },
      //   rating: {
      //     isInt : {
      //       options : {min:1, max:5},
      //       errorMessage: res.__("admin.testimonials.it_should_be_between_1_to_5"),
      //     },
      //     notEmpty: true,
      //     errorMessage: res.__("admin.testimonials.please_enter_rating"),
      //   },
      //   about: {
      //     isLength :{
      //       options    : {min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT},
      //       errorMessage:res.__("system.title_limit.this_value_should_contain_minimum_and_maximum_character")
      //     },
      //     notEmpty: true,
      //     errorMessage: res.__("admin.testimonials.please_enter_about"),
      //   },
      //   description: {
      //     isLength :{
      //       options    : {min : MIN_CHARACTER_DESCRIPTION_LIMIT, max : MAX_CHARACTER_DESCRIPTION_LIMIT},
      //       errorMessage:res.__("system.description_limit.this_value_should_contain_minimum_and_maximum_character")
      //     },
      //     notEmpty: true,
      //     errorMessage: res.__("admin.testimonials.please_enter_description"),
      //   },
      // });

      // var errors = uniqueValidations(req.validationErrors());
      // if (!errors) {
        let name        = req.body.name         ? req.body.name : "";
        let rating      = req.body.rating       ? req.body.rating : "";
        let about       = req.body.about        ? req.body.about : "";
        let description = req.body.description  ? req.body.description : "";

        let insertData = {
          name        : name,
          rating      : rating,
          about       : about,
          description : description,
          is_active   : ACTIVE,
          is_deleted  : NOT_DELETED,
          created     : new Date(),
        }
        if (req.files) {
          let file = req.files ? req.files.image : {};
          if (Object.keys(file).length == 0) {
            return res.send({
              status  : STATUS_ERROR,
              errors  : [
                {
                  param: "image",
                  msg: res.__("admin.system.please_select_an_image"),
                },
              ],
            });
          } else {
            let options = {
              file      : file,
              file_path : TESTIMONIAL_FILE_PATH,
            };

            /** Upload file */
            await moveUploadedFile(options).then((response) => {
              if (response.status == STATUS_ERROR) {
                return res.send({
                  status  : STATUS_ERROR,
                  message  : [{ param: "image", msg: response.message }],
                });
              } else {
                var newFileName = response.new_file     ? response.new_file : "";
                insertData["image"] = newFileName
                const collection = db.collection("testimonials");
                collection.insertOne(insertData,function (err, result) {
                    if (!err) {
                      req.flash(STATUS_SUCCESS, res.__("admin.testimonials.testimonial_has_been_created_successfully"));
                      return res.send({
                        status: STATUS_SUCCESS,
                        message: '',
                        rediect_url: "/admin/testimonials",
                      });
                    } else {
                      req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
                      return res.send({
                        status: STATUS_ERROR,
                        message: '',
                        rediect_url: "/testimonials",
                      });
                    }
                  }
                );
              }
            });
          }
        }else{
          const collection = db.collection("testimonials");
          collection.insertOne(insertData,function (err, result) {
              if (!err) {
                req.flash(STATUS_SUCCESS, res.__("admin.testimonials.testimonial_has_been_created_successfully"));
                return res.send({
                  status: STATUS_SUCCESS,
                  message: '',
                  rediect_url: "/admin/testimonials",
                });
              } else {
                req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
                return res.send({
                  status: STATUS_ERROR,
                  message: '',
                  rediect_url: "/testimonials",
                });
              }
            }
          );
        }
        
      // } else {
      //   res.send({
      //     status: STATUS_ERROR,
      //     message: errors,
      //     rediect_url: "/testimonial",
      //   });
      // }
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/testimonials/add"]);
      res.render("add");
    }
  }; //End add

  /** Function to edit detail **/
  this.edit = function (req, res) {
    let testimonialsId = req.params.id ? req.params.id : "";
    if (isPost(req)) {
        if (req.files) {
          let file = req.files ? req.files.image : {};
          if (Object.keys(file).length == 0) {
            res.send({
              status: STATUS_ERROR,
              errors: [
                {
                  param: "image",
                  msg: res.__("admin.slider.please_select_an_image"),
                },
              ],
            });
          } else {
            let options = {
              file      : file,
              file_path : TESTIMONIAL_FILE_PATH,
            };
            moveUploadedFile(options).then((response) => {
              if (response.status == STATUS_ERROR) {
                return res.send({
                  status  : STATUS_ERROR,
                  message  : [{ param: "image", msg: response.message }],
                });
              } else {
                var newFileName = response.new_file ? response.new_file : "";
                updateTestimonials(req, res, newFileName);
              }
            });
          }
        } else {
          let oldImage = req.body.old_image ? req.body.old_image : "";
          updateTestimonials(req, res, oldImage);
        }
      
    } else {
      var collection = db.collection("testimonials");
      collection.findOne({ _id: ObjectId(testimonialsId) }, function(err, result) {
        if(!err) {
          let options = {
            path    : TESTIMONIAL_FILE_URL,
            result  : [result],
          };
          appendFile(options).then((response) => {
            let result = response.result[0] ? response.result[0] : [];
            req.breadcrumbs(BREADCRUMBS["admin/testimonials/edit"]);
            res.render("edit", {
              result  : result ? result : {},
              message : "",
            });
          });

        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "testimonials");
        }
      });
    }
  }; //End editDetail

  /** Function is used to update testimonials */
  updateTestimonials = (req, res, fileName) =>{
    let testimonialId = req.params.id         ? req.params.id : "";
    let name          = req.body.name         ? req.body.name : "";
    let rating        = req.body.rating       ? req.body.rating : "";
    let about         = req.body.about        ? req.body.about : "";
    let description   = req.body.description  ? req.body.description : "";


    /** Update testimonial data **/
    let updateData = {
      name        : name,
      rating      : rating,
      about       : about,
      image       : fileName,
      description : description,
      modified    : new Date(),
    };


    const collection = db.collection("testimonials");
    collection.updateOne({ _id: ObjectId(testimonialId) }, { $set: updateData }, function (error, result) {
      if (!error) {
        req.flash(STATUS_SUCCESS,res.__("admin.testimonials.testimonial_has_been_updated_successfully"));
        res.send({
          status: STATUS_SUCCESS,
          message: "",
          rediect_url: "/admin/testimonials/"
        });
      } else {
        req.flash(STATUS_SUCCESS,res.__("admin.system.something_went_wrong_please_try_again_later"));
        res.send({
          status: STATUS_ERROR,
          message: "",
          rediect_url: "/admin/testimonials/edit/" + testimonialId,
        });
      }
    });
  } // End updateSlider


  /** Function to delete detail **/
  this.deleteDetail   =  (req, res) =>{
    let testimonialId = req.params.id ? req.params.id : "";
    const collection  = db.collection("testimonials");
    collection.updateOne(
      { _id: ObjectId(testimonialId) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
       (err, result)=> {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.testimonials.testimonial_has_been_deleted_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "testimonials");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "testimonials");
        }
      }
    );
  }; //End deleteDetail

  /** Function to update status **/
  this.updateStatus =  (req, res) =>{
    var testimonialId = req.params.id ? req.params.id : "";
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const collection = db.collection("testimonials");
    collection.updateOne(
      { _id: ObjectId(testimonialId) },
      {
        $set: {
          is_active: status,
          modified: new Date(),
        },
      },
       (err, result)=> {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.testimonials.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "testimonials");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "testimonials");
        }
      }
    );
  }; //End updateStatus
}
module.exports = new Testimonial();
