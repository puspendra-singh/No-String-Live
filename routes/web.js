/**
 * Export a function to pass app,session etc. from  app.js
 * param app as express object
 * **/

require("./../config/global_constant");
require("./../custom_helper");
require("./../breadcrumbs");
const async = require('async');
const {readFile}	= require("fs");
const path = require('path');
var mongoDb = require("./../config/connection");
module.exports = {
  configure:  (routes) =>{
    mongoDb.connectTOServer((err) =>{
      db        = mongoDb.getDb();
      ObjectId  = require("mongodb").ObjectID;
      app       = routes;

      app.use( (req, res, next) =>{
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );

        /** To get uri **/
        res.locals.first_uri = req.path.split("/")[1];

        /** To get active module **/
        res.locals.active_path = req.path.split("/")[2];

        /** To get sub active module **/
        res.locals.sub_active_path = req.path.split("/")[3];

        /** To use rendering on view page*/
        req.rendering = {};

        /** To use session globally **/
        res.locals.auth = "";
        if (req.session.user !== "undefined") {
          /** To use session globally**/
          res.locals.auth = req.session.user;
          res.locals.master_name = req.path.split("/")[3];

          /** Set active list url */
          res.locals.active_list_url =
            WEBSITE_ADMIN_URL + req.path.split("/")[2];

          delete req.session.password;
        }

        /** To use flash message globally**/
        const flashMessage = res.locals.getMessages();
        res.locals.flash_status = "";
        res.locals.flash_error_message = "";
        res.locals.flash_success_message = "";

        /** set default views folder **/
        app.set("views", __dirname + "/views");

        /* Read/write Basic settings from/in Cache */
        let settings    = myCache.get( "settings" );
        if ( settings == undefined ){
          readFile(path.join(WEBSITE_ROOT_PATH ,"config/settings.json"), "utf8", function readFileCallback(err, data){
            settings    		=    JSON.parse(data);
            myCache.set( "settings", settings, 0 );
            res.locals.settings =   settings;
          });
        }else{
          res.locals.settings =   settings;
        }


        /** To use flash message globally**/
        if (flashMessage !== "undefined") {
          if (flashMessage != "") {
            if (Object.keys(flashMessage) == STATUS_SUCCESS) {
              res.locals.flash_status = STATUS_SUCCESS;
              res.locals.flash_success_message = flashMessage.success;
            }
            if (Object.keys(flashMessage) == STATUS_ERROR) {
              res.locals.flash_status = STATUS_ERROR;
              res.locals.flash_error_message = flashMessage.error;
            }
          }
        }
        next();
      });

      userPermission = [];
      /** This function is used to check user login or not **/
      isUserLogedIn =  (req, res, next)=> {
        
        if (typeof req.session.user !== "undefined" &&req.session.user.email != "") {
          if (req.session.user.role_id == ROLE_ID_ADMIN) {
            const units = db.collection("units");
            units
              .aggregate([
                {
                  $match: {
                    is_active: ACTIVE,
                    parent_id: INACTIVE,
                    is_deleted: NOT_DELETED,
                  },
                },
                {
                  $lookup: {
                    from: "units",
                    let: { unitId: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$parent_id", "$$unitId"] },
                              { $eq: ["$is_active", ACTIVE] },
                              { $eq: ["$is_deleted", NOT_DELETED] },
                            ],
                          },
                        },
                      },
                      {
                        $sort: {
                          order: SORT_ASC,
                        },
                      },
                    ],
                    as: "unitDetail",
                  },
                },
              ])
              .sort({ order: SORT_ASC })
              .toArray((err, result) => {
                if (!err && result && result.length > 0) {
                  userPermission = result;
                  return next();
                } else {
                  res.redirect("/" + WEBSITE_ADMIN_NAME);
                }
              });
          } else if (req.session.user.role_id != ROLE_ID_ADMIN) {
            let assignedUnits = req.session.user.assigned_units
              ? req.session.user.assigned_units
              : [];
            let allowed = false;
            assignedUnits.map((records) => {
              if (records.group_path == req.path.split("/")[2]) {
                allowed = true;
                return;
              }
            });
            if (allowed) {
              getAssignedUnits(req, res).then((response) => {
                if (response && response.status == STATUS_SUCCESS) {
                  userPermission = response.result ? response.result : [];
                  return next();
                }
              });
            } else {
              req.flash(STATUS_ERROR, res.__("admin.system.invalid_access"));
              res.redirect("/" + WEBSITE_ADMIN_NAME + "/dashboard");
            }
          }
        } else {
          res.redirect("/" + WEBSITE_ADMIN_NAME);
        }
      };

      allNotifications=[];
      app.use("/admin/*", (req, res, next) =>{
         /**This function is used to get users notifications */
            
        /** To use breadcrumbs**/
        res.locals.breadcrumbs = req.breadcrumbs();

        req.rendering.layout = WEBSITE_ADMIN_MODULE_PATH + "layouts/default";
        next();
      });


      
      /** APIs Routing*/

      /** Admin Routing */
      require(WEBSITE_ADMIN_FILE_PATH + "reported/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "masters/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "products/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "text-settings/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "units/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "cms/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "email_templates/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "settings/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "faq/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "contact-us/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "notifications/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "reports_users/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "reports_products/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "reports_orders/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "reports_earnings/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "slider/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "team/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "users/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "testimonial/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "order_management/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "reviews_management/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "adminnotification/routes");
      require(WEBSITE_ADMIN_FILE_PATH + "reported_products/routes");
      /** if err then redirect to dashboard */
      // app.use((err, req, res, next) =>{
      //   if(err){
      //     req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
			// 	  res.redirect(WEBSITE_ADMIN_URL+'dashboard');	
      //   }
      //   next()
      // })
      // app.get('*', function(req, res){
      //   res.render('/page-404');
      // });
    });
  },
};
