const {body, validationResult } = require('express-validator');
var modulePath = __dirname + "/model/slider";
var modelPath = "/admin/slider";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  var slider = require(modulePath);
  slider.list(req, res);
});

/** Routing is used to add  **/

app.get(modelPath + "/add", isUserLogedIn, function (req, res) {
  var slider = require(modulePath);
  slider.getAdd(req, res);
});

app.post(modelPath + "/add", isUserLogedIn, async (req, res, next) => {
  await body('title')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.slider.please_enter_title'))
  .isLength({min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT})
  .withMessage(res.__('admin.slider.title_should_be_2_and_20_characters_long'))
  // .matches(TITLE_REGEX)
  // .withMessage(res.__("admin.slider.title_should_be_valid"))
  .run(req);

  await body('slide_type')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.slider.please_select_slide_type'))
    .run(req);

  await body('slide_visibility')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.slider.please_select_slide_visibility'))
    .run(req);

  await body('description')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.slider.please_enter_description'))
    .isLength({min : MIN_CHARACTER_DESCRIPTION_LIMIT, max : MAX_CHARACTER_DESCRIPTION_LIMIT})
    .withMessage(res.__('admin.slider.description_should_be_2_and_20000_characters_long'))
    .run(req);

  if(req.body.subtitle){
    await body('subtitle')
    .trim()
    .not()
    .isEmpty()
    .withMessage('admin.slider.please_enter_subtitle')
    .isLength({min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT})
    .withMessage('admin.slider.subtitle_should_be_2_and_50_characters_long')
    // .matches(TITLE_REGEX)
    // .withMessage(res.__("admin.slider.subtitle_should_be_valid"))
    .run(req);

  }
  if(req.body.link_page){
    await body('link_page')
    .trim()
    .not()
    .isEmpty()
    .withMessage('admin.slider.please_enter_link')
    .isURL()
    .withMessage('admin.slider.please_enter_valid_link')
    .run(req);

    let link   = (req.body.link_page) ? req.body.link_page :'';
    let isLink = link.includes("http","https");
    if(isLink == false || isLink == 'false'){
      errors.push({param : 'link_page', msg : res.__("admin.slider.please_enter_valid_link"), value:link, location:'body'})
    }
  }
    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    
    let file = (req.files) ? req.files.image : {};
    if (Object.keys(file).length == 0) {
      errors.push({location : 'files',param:'image',msg:res.__("admin.slider.image_is_required"), value:''})
    }
    if (errors.length !== 0) {
      res.send({
        // status: STATUS_ERROR,
        message: errors,
        result: "",
        rediect_url: "/slider",
      });
    } 
    else {
      var slider = require(modulePath);
      slider.validatePostAdd(req, res, next, file);
    }
});

/** Routing is used to view detail**/

app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var slider = require(modulePath);
  slider.view(req, res);
});

/** Routing is used to edit detail**/

app.get(modelPath + "/edit/:id", isUserLogedIn, function (req, res) {
  var slider = require(modulePath);
  slider.getEdit(req, res);


});

app.post(modelPath + "/edit/:id", isUserLogedIn, async (req, res, next) => {
  await body('title')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.slider.please_enter_title'))
  .isLength({min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT})
  .withMessage(res.__('admin.slider.title_should_be_2_and_20_characters_long'))
  // .matches(TITLE_REGEX)
  // .withMessage(res.__("admin.slider.title_should_be_valid"))
  .run(req);

  await body('slide_type')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.slider.please_select_slide_type'))
    .run(req),

  await body('description')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.slider.please_enter_description'))
    .isLength({min : MIN_CHARACTER_DESCRIPTION_LIMIT, max : MAX_CHARACTER_DESCRIPTION_LIMIT})
    .withMessage(res.__('admin.slider.description_should_be_2_and_20000_characters_long'))
    .run(req),

  await body('subtitle')
    .trim()
    .not()
    .isEmpty()
    .withMessage('admin.slider.please_enter_subtitle')
    .isLength({min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT})
    .withMessage('admin.slider.subtitle_should_be_2_and_50_characters_long')
    // .matches(TITLE_REGEX)
    // .withMessage(res.__("admin.slider.subtitle_should_be_valid"))
    .run(req),

  await body('link_page')
    .trim()
    .not()
    .isEmpty()
    .withMessage('admin.slider.please_enter_link')
    .isURL()
    .withMessage('admin.slider.please_enter_valid_link')
    .run(req);

    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    let link   = (req.body.link_page) ? req.body.link_page :'';
    let isLink = link.includes("http","https");
    if(isLink == false || isLink == 'false'){
      errors.push({param : 'link_page', msg : res.__("admin.slider.please_enter_valid_link"), value:link, location:'body'})
    }
    let file = (req.files) ? req.files.image : {};
    // if (Object.keys(file).length == 0) {
    //   errors.push({location : 'files',param:'image',msg:res.__("admin.slider.image_is_required"), value:''})
    // }
    if (errors.length !== 0) {
      res.send({
        // status: STATUS_ERROR,
        message: errors,
        result: "",
        rediect_url: "/slider",
      });
    } 
    else {
      var slider = require(modulePath);
      slider.postEdit(req, res, next, file);
    }
});

/** Routing is used to delete  **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var slider = require(modulePath);
  slider.deleteDetail(req, res);
});

/** Routing is used to update status**/

app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, function (
  req,
  res
) {
  var slider = require(modulePath);
  slider.updateStatus(req, res);
});
