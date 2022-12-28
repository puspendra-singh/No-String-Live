const async = require("async");
function Slider() {
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
        const collection = db.collection("sliders");
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
                      path    : SLIDER_FILE_URL,
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
      req.breadcrumbs(BREADCRUMBS["admin/slider/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End List

  /** Function is used to add block */
  this.getAdd = (req, res, next) => {
      req.breadcrumbs(BREADCRUMBS["admin/slider/add"]);
      res.render("add");
    
  }; //End add

  this.validatePostAdd = (req, res, next, file)=>{
    const visibility = Number(req.body.slide_visibility);
    const collection = db.collection("sliders");
    let findCondition = {
      visibility : AFTER_LOGIN_SLIDE,
      is_deleted : NOT_DELETED,
      is_active  : ACTIVE
    }
    if(visibility==BEFORE_LOGIN_SLIDE){
      findCondition['visibility'] = BEFORE_LOGIN_SLIDE;
    }
    collection.find(findCondition).toArray((err,result)=>{
      if(!err){
        if(visibility==BEFORE_LOGIN_SLIDE){
          if(result && result.length >= 1){
            req.flash(
              STATUS_ERROR,
              res.__("admin.system.can_not_add_more_than_one")
            );
            return res.send({
              status: STATUS_ERROR,
              message: res.__("admin.system.can_not_add_more_than_three"),
              rediect_url: "/admin/slider/",
            });
          }else{
            postAdd(req, res, next, file);
          }
        }else{
          if(result && result.length >= 3){
            req.flash(
              STATUS_ERROR,
              res.__("admin.system.can_not_add_more_than_three")
            );
            return res.send({
              status: STATUS_ERROR,
              message: res.__("admin.system.can_not_add_more_than_three"),
              rediect_url: "/admin/slider/",
            });
          }else{
            postAdd(req, res, next, file);
          }
        }
      }
    })
  }

  let postAdd = (req, res, next, file) => {
 
    // if (isPost(req)) {

      let link        = (req.body.link_page)  ? req.body.link_page :'';
      let slideType   = (req.body.slide_type) ? req.body.slide_type :'';
      let subtitle    = (req.body.subtitle)   ? req.body.subtitle :'';
      let errors 	    = [];

      
      // if (!errors) {
          let options = {
            file              : file,
            file_path         : SLIDER_FILE_PATH,
          };

          if(slideType == 'video'){
            options['allowedExtensions']  = ALLOWED_VIDEO_EXTENSIONS
            options['allowedImageError']  = ALLOWED_VIDEO_ERROR_MESSAGE
            options['allowedMimeTypes']   = ALLOWED_VIDEO_MIME_EXTENSIONS
            options['allowedMimeError']   = ALLOWED_VIDEO_MIME_ERROR_MESSAGE
          }

        /** Upload file */
        moveUploadedFile(options).then((response) => {
          if (response.status == STATUS_ERROR) {
            return res.send({
              status  : STATUS_ERROR,
              message : [{ param: "image", msg: response.message }],
            });
          } else {
            var newFileName = response.new_file ? response.new_file : "";
            let title       = req.body.title        ? req.body.title :"";
            let subtitle    = req.body.subtitle     ? req.body.subtitle :"";
            let link_page   = req.body.link_page    ? req.body.link_page :"#";
            let slide_type   = req.body.slide_type    ? req.body.slide_type :"";
            let description = req.body.description  ? req.body.description :"";
            let slideVisibility    = req.body.slide_visibility     ? Number(req.body.slide_visibility) : "";
            const slider = db.collection("sliders");
            slider.insertOne(
              {
                title       : title,
                subtitle    : subtitle,
                link_page   : link_page,
                slide_type  : slide_type,
                image       : newFileName,
                description : description,
                visibility  : slideVisibility,
                is_active   : ACTIVE,
                is_deleted  : NOT_DELETED,
                created     : new Date(),
              },
              function (err, result) {
                if (!err) {
                  req.flash(
                    STATUS_SUCCESS,
                    res.__("admin.slider.slider_has_been_created_successfully")
                  );
                  return res.send({
                    status      : STATUS_SUCCESS,
                    message     : '',
                    rediect_url : "/admin/slider",
                  });
                } else {
                  req.flash(STATUS_ERROR,res.__("admin.system.something_went_wrong"));
                  return res.send({
                    status      : STATUS_ERROR,
                    message     : '',
                    rediect_url : "/slider",
                  });
                }
              }
            );
          }
        });
      
      // } else {
      //   res.send({
      //     status: STATUS_ERROR,
      //     message: errors,
      //     rediect_url: "/slider",
      //   });
      // }
    // } else {
    //   req.breadcrumbs(BREADCRUMBS["admin/slider/add"]);
    //   res.render("add");
    // }
  }; //End add

  /** Function to edit detail **/
  this.getEdit = function (req, res) {
    let sliderId = req.params.id ? req.params.id : "";
      var collection = db.collection("sliders");
      collection.findOne({ _id: ObjectId(sliderId) }, function (err, result) {
        if (!err) {
          let options = {
            path    : SLIDER_FILE_URL,
            result  : [result],
          };
          appendFile(options).then((response) => {
            let result = response.result[0] ? response.result[0] : [];
            req.breadcrumbs(BREADCRUMBS["admin/slider/edit"]);
            res.render("edit", {
              result: result ? result : {},
              message: "",
            });
          });
         
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "slider");
        }
      });
    
  }; 

  this.postEdit = function (req, res, next, file) {
    let sliderId = req.params.id ? req.params.id : "";
    // if (isPost(req)) {

      let link        = (req.body.link_page) ? req.body.link_page :'';
      let slideType   = (req.body.slide_type) ? req.body.slide_type :'';
      let subtitle    = req.body.subtitle     ? req.body.subtitle : "";
      let errors 	= [];

      /** link(URL) validation */
      // if(link){
      //   req.checkBody({
      //     link_page: {
      //       isURL:{
      //         errorMessage: res.__("admin.slider.please_enter_valid_link")
      //       }
      //     }
      //   });

      //   let isLink = link.includes("http","https");
      //   if(isLink == false || isLink == 'false'){
      //     errors.push({param : 'link_page', msg : res.__("admin.slider.please_enter_valid_link"), value:link, location:'body'})
      //   }
      // }

      let fileNameOld   = req.body.old_image     ? req.body.old_image : "";
      let extension     = (fileNameOld)       ? fileNameOld.split('.') :'';
      extension         = extension.pop().toLowerCase();

      if(slideType == 'image' && !req.files){
        if(IMAGE_EXTENSIONS.indexOf(extension) == -1){
          return res.send({
            status: STATUS_ERROR,
            message: [
              {
                param: "image",
                msg: res.__("admin.slider.please_select_an_image"),
              },
            ],
          });
        }
      }

      if(slideType == 'video' && !req.files){
        if(ALLOWED_VIDEO_EXTENSIONS.indexOf(extension) == -1){
          return res.send({
            status: STATUS_ERROR,
            message: [
              {
                param: "image",
                msg: res.__("admin.slider.please_select_an_image"),
              },
            ],
          });
        }
      }

      // errors = (errors.length>0) ? errors :  uniqueValidations(req.validationErrors());
      // if (!errors) {
        if (req.files) {
          // let file = req.files ? req.files.image : {};
          // if (Object.keys(file).length == 0) {
          //   return res.send({
          //     status: STATUS_ERROR,
          //     errors: [
          //       {
          //         param: "image",
          //         msg: res.__("admin.slider.please_select_an_image"),
          //       },
          //     ],
          //   });
          // } else {
            let options = {
              file              : file,
              file_path         : SLIDER_FILE_PATH,
            };


            if(slideType == 'video'){
              options['allowedExtensions']  = ALLOWED_VIDEO_EXTENSIONS
              options['allowedImageError']  = ALLOWED_VIDEO_ERROR_MESSAGE
              options['allowedMimeTypes']   = ALLOWED_VIDEO_MIME_EXTENSIONS
              options['allowedMimeError']   = ALLOWED_VIDEO_MIME_ERROR_MESSAGE
            }

            moveUploadedFile(options).then((response) => {
              if (response.status == STATUS_ERROR) {
                return res.send({
                  status: STATUS_ERROR,
                  message: [{ param: "image", msg: response.message }],
                });
              } else {
                var newFileName = response.new_file ? response.new_file : "";
                updateSlider(req, res, newFileName);
              }
            });
          } else {
          let oldImage = req.body.old_image ? req.body.old_image : "";
          updateSlider(req, res, oldImage);
        } 
      // } else {
      //   res.send({
      //     status: STATUS_ERROR,
      //     message: errors,
      //     rediect_url: "/slider",
      //   });
      // }
  }; //End editDetail

  /** Function is used to update slider */
  function updateSlider(req, res, fileName) {
    let sliderId      = req.params.id         ? req.params.id : "";
    let title         = req.body.title        ? req.body.title : "";
    let subtitle      = req.body.subtitle     ? req.body.subtitle : "";
    let linkPage      = req.body.link_page    ? req.body.link_page : "#";
    let slideType     = req.body.slide_type    ? req.body.slide_type : "";
    let description   = req.body.description  ? req.body.description : "";
    let slideVisibility    = req.body.slide_visibility     ? Number(req.body.slide_visibility) : "";


    /** Update slider data **/
    let updateData = {
      title       : title,
      subtitle    : subtitle,
      link_page   : linkPage,
      slide_type  : slideType,
      image       : fileName,
      description : description,
      visibility  : slideVisibility,
      modified    : new Date(),
    };


    const collection = db.collection("sliders");
    collection.updateOne({ _id: ObjectId(sliderId) }, { $set: updateData }, function (error,result) {
      if (!error) {
        req.flash(
          STATUS_SUCCESS,
          res.__("admin.slider.slider_has_been_updated_successfully")
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: "",
          rediect_url: "/admin/slider/edit/" + sliderId,
        });
      } else {
        req.flash(
          STATUS_ERROR,
          res.__("admin.system.something_went_wrong_please_try_again_later")
        );
        return res.send({
          status: STATUS_ERROR,
          message: "",
          rediect_url: "/admin/slider/edit/" + sliderId,
        });
      }
    });
  } // End updateSlider


  /** Function to delete detail **/
  this.deleteDetail = function (req, res) {
    var sliderId      = req.params.id ? req.params.id : "";
    const collection  = db.collection("sliders");
    collection.updateOne(
      { _id: ObjectId(sliderId) },
      { $set: { is_deleted: DELETED, modified: new Date() } },
      function (err, result) {
        if (!err) {
          req.flash(
            STATUS_SUCCESS,
            res.__("admin.slider.slider_has_been_deleted_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "slider");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "slider");
        }
      }
    );
  }; //End deleteDetail

  /** Function to update status **/
  this.updateStatus = function (req, res) {
    var sliderId  = req.params.id ? req.params.id : "";
    var status    = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const collection = db.collection("sliders");
    collection.updateOne(
      { _id: ObjectId(sliderId) },
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
            res.__("admin.slider.status_has_been_updated_successfully")
          );
          res.redirect(WEBSITE_ADMIN_URL + "slider");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "slider");
        }
      }
    );
  }; //End updateStatus
}
module.exports = new Slider();
