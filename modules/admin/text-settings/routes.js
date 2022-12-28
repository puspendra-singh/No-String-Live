const { body } = require('express-validator');

var modulePath = __dirname + "/model/text-settings";
var modelPath = "/admin/text_settings";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/
app.all(modelPath + "/:type", isUserLogedIn, function (req, res, next) {
  
  var master = require(modulePath);
  master.list(req, res, next);
});

/** Routing is used to add seeting **/
app.all(modelPath + "/:type/add", isUserLogedIn, async (req, res, next) => {
  await body('key').not().isEmpty().withMessage(res.__('admin.text_setting.please_enter_key')),
  await body('value').not().isEmpty().withMessage(res.__('admin.text_setting.please_enter_value'))

  var master = require(modulePath);
  master.add(req, res, next);
});

/** Routing is used to edit detail **/
app.all(modelPath + "/:type/edit/:id", async (req, res, next) => {
  
  await body('key').not().isEmpty().withMessage(res.__('admin.text_setting.please_enter_key')),
  await body('value').not().isEmpty().withMessage(res.__('admin.text_setting.please_enter_value'))
   
  var master = require(modulePath);
  master.edit(req, res, next);
});
