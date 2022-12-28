const {body, validationResult } = require('express-validator');
var modulePath = __dirname + "/model/team";
var modelPath = "/admin/team";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  var team = require(modulePath);
  team.list(req, res);
});

/** Routing is used to add  **/

app.get(modelPath + "/add", isUserLogedIn, function (req, res) {
  var team = require(modulePath);
  team.getAdd(req, res);
});

app.post(modelPath + "/add", isUserLogedIn, async (req, res, next)  => {
  await body('first_name')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.team.please_enter_first_name'))
  .isLength({min : MIN_NAME_LIMIT, max : MAX_NAME_LIMIT})
  .withMessage(res.__('admin.team.first_name_should_be_2_to_20_characters_long'))
  .matches(NAME_REGEX)
  .withMessage(res.__('admin.team.first_name_should_be_valid'))
  .run(req);
  
  await body('description')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.team.please_enter_description'))
  .isLength({min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT})
  .withMessage(res.__('admin.team.description_should_be_2_and_500_characters_long'))
  // .matches(DESCRIPTION_REGEX)
  // .withMessage(res.__('admin.team.description_should_be_valid'))
  .run(req);
  
  await body('last_name')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.team.please_enter_last_name'))
  .isLength({min : MIN_NAME_LIMIT, max : MAX_NAME_LIMIT})
  .withMessage(res.__('admin.team.last_name_should_be_2_to_20_characters_long'))
  .matches(NAME_REGEX)
  .withMessage(res.__('admin.team.last_name_should_be_valid'))
  .run(req);
  
    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));

    let file = (req.files) ? req.files.image : {};
    if (Object.keys(file).length == 0) {
      errors.push({location : 'files',param:'image',msg:res.__("admin.team.image_is_required"), value:''})
    }
    if (errors.length !== 0) {
      res.send({
        // status: STATUS_ERROR,
        message: errors,
        result: "",
        rediect_url: "/team",
      });
    } 
    else {
  var team = require(modulePath);
  team.postAdd(req, res, next, file);
    }
});

/** Routing is used to view detail**/

app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var team = require(modulePath);
  team.view(req, res);
});

/** Routing is used to edit detail**/

app.get(modelPath + "/edit/:id", isUserLogedIn, function (req, res) {
  var team = require(modulePath);
  team.getEdit(req, res);


});

app.post(modelPath + "/edit/:id", isUserLogedIn, async (req, res, next) => {
  await body('first_name')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.team.please_enter_first_name'))
  .isLength({min : MIN_NAME_LIMIT, max : MAX_NAME_LIMIT})
  .withMessage(res.__('admin.team.first_name_should_be_2_to_20_characters_long'))
  .matches(NAME_REGEX)
  .withMessage(res.__('admin.team.first_name_should_be_valid'))
  .run(req);
  
  await body('description')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.team.please_enter_description'))
  .isLength({min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT})
  .withMessage(res.__('admin.team.description_should_be_2_and_500_characters_long'))
  // .matches(DESCRIPTION_REGEX)
  // .withMessage(res.__('admin.team.description_should_be_valid'))
  .run(req);

  await body('last_name')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.team.please_enter_last_name'))
  .isLength({min : MIN_NAME_LIMIT, max : MAX_NAME_LIMIT})
  .withMessage(res.__('admin.team.last_name_should_be_2_to_20_characters_long'))
  .matches(NAME_REGEX)
  .withMessage(res.__('admin.team.last_name_should_be_valid'))
  .run(req);
 
    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    
    let file = (req.files) ? req.files.image : {};
    // if (Object.keys(file).length == 0) {
    //   errors.push({location : 'files',param:'image',msg:res.__("admin.team.image_is_required"), value:''})
    // }
    if (errors.length !== 0) {
      res.send({
        // status: STATUS_ERROR,
        message: errors,
        result: "",
        rediect_url: "/team",
      });
    } 
    else {
      var team = require(modulePath);
      team.postEdit(req, res, next, file);
    }
});

/** Routing is used to delete  **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var team = require(modulePath);
  team.deleteDetail(req, res);
});

/** Routing is used to update status**/

app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, function ( req, res) {
  var team = require(modulePath);
  team.updateStatus(req, res);
});
