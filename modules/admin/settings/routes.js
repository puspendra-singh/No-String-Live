/** Model file path for current plugin **/
const modelPath 	= __dirname+"/model/setting";
const modulePath	= "/admin/settings/";
const adminSettings = require(modelPath);
const { body, validationResult }      = require('express-validator');

/** Set current view folder **/
app.use(modulePath,(req, res, next) => {
  req.rendering.views	=	__dirname + "/views";
  next();
});

/** Routing is used to get setting list **/
app.all(modulePath,isUserLogedIn,function(req, res) {
  adminSettings.getSettingList(req, res);
});

/** Routing is used to add setting **/
app.get(modulePath+"add",isUserLogedIn,(req, res) => {
  req.breadcrumbs(BREADCRUMBS["admin/setting/add"]);
  res.render('add');

//   adminSettings.addSetting(req, res);
});
app.post(modulePath+"add",isUserLogedIn, async (req, res) => {
  await body('title')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_enter_title"))
    .run(req);
  await body('value')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.settings.please_enter_value"))
    .run(req);
  await body('key_value')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_enter_key_value"))
    .run(req);
  await body('input_type')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_select_input_type"))
    .run(req);
  await body('order')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_select_input_type"))
    // .matches('/^[0-9]+$/')
    // .withMessage(res.__("admin.setting.please_enter_valid_order"))
    .run(req);

    var errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if(errors.length !== 0){
        res.send({
            status	: STATUS_ERROR,
            message	: errors,
        });
    }else{
        adminSettings.postAddSetting(req, res);
    }
});

/** Routing is used to delete setting **/
app.all(modulePath+"delete/:id",isUserLogedIn,(req, res) => {
	adminSettings.deleteSetting(req, res);
});

/** Routing is used to edit setting **/
/** Routing is used to add setting **/
app.get(modulePath+"edit/:id",isUserLogedIn,(req, res) => {
  
    adminSettings.getEditSetting(req, res);
  });
app.all(modulePath+"edit/:id",isUserLogedIn, async (req, res) => {
    await body('title')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_enter_title"))
    .run(req);
  await body('value')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.settings.please_enter_value"))
    .run(req);
  await body('key_value')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_enter_key_value"))
    .run(req);
  await body('input_type')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_select_input_type"))
    .run(req);
  await body('order')
    .not()
    .isEmpty()
    .withMessage(res.__("admin.setting.please_select_input_type"))
    // .matches('/^[0-9]+$/')
    // .withMessage(res.__("admin.setting.please_enter_valid_order"))
    .run(req);
    var errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if(errors.length !== 0){
        res.send({
            status	: STATUS_ERROR,
            message	: errors,
        });
    }else{
        adminSettings.postEditSetting(req, res);
    }
    
});

/** Routing is used to get setting listing with edit page **/
app.all(modulePath+"prefix/:type",isUserLogedIn,function(req, res) {
    adminSettings.prefix(req, res);
});
