const { body,validationResult } = require("express-validator");
var modulePath = __dirname + "/model/testimonial";
var modelPath = "/admin/testimonials";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  var testimonial = require(modulePath);
  testimonial.list(req, res);
});

/** Routing is used to add  **/

app.all(modelPath + "/add", isUserLogedIn, async function (req, res) {
  if(isPost(req)){
    await body("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_name"))
    .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
    .withMessage(res.__("admin.testimonials.name_should_be_2_and_20_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.testimonials.name_should_be_valid"))
    .run(req),
  await body("about")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_title"))
    .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT })
    .withMessage(res.__("admin.testimonials.title_should_be_2_to_50_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.testimonials.title_should_be_valid"))
    .run(req),
  await body("rating")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_rating"))
    .isInt({ min: MIN_RATING_LIMIT , max: MAX_RATING_LIMIT })
    .withMessage(res.__("admin.testimonials.rating_should_be_valid"))
    .run(req),
    await body("description")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_description"))
    .isLength({ min: MIN_CHARACTER_DESCRIPTION_LIMIT, max: MAX_CHARACTER_DESCRIPTION_LIMIT })
    .withMessage(res.__("admin.testimonials.description_should_be_2_and_20000_characters_long"))
    .run(req)
    const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if(req.files && req.files.image){
      let file = (req.files) ? req.files.image : {};
      if (Object.keys(file).length == 0) {
        errors.push({location : 'files',param:'image',msg:res.__("admin.testimonials.image_is_required"), value:''})
      }
    }else{
      errors.push({location : 'files',param:'image',msg:res.__("admin.testimonials.image_is_required"), value:''})
    }
    if(errors.length !==0){
      return res.send({
        // status: STATUS_ERROR,
        message: errors,
        result: {},
      })
    }else{
      var testimonial = require(modulePath);
      testimonial.add(req, res);
    }
  
  }else{
    req.breadcrumbs(BREADCRUMBS["admin/testimonials/add"]);
      res.render("add");
  }
});

/** Routing is used to view detail**/

app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var testimonial = require(modulePath);
  testimonial.view(req, res);
});

/** Routing is used to edit detail**/

app.all(modelPath + "/edit/:id", isUserLogedIn,async function (req, res) {
  var testimonial = require(modulePath);
  if(isPost(req)){
    await body("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_name"))
    .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
    .withMessage(res.__("admin.testimonials.name_should_be_2_and_20_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.testimonials.name_should_be_valid"))
    .run(req),
  await body("about")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_title"))
    .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT })
    .withMessage(res.__("admin.testimonials.title_should_be_2_to_50_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.testimonials.title_should_be_valid"))
    .run(req),
  await body("rating")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_rating"))
    .isInt({ min: MIN_RATING_LIMIT , max: MAX_RATING_LIMIT })
    .withMessage(res.__("admin.testimonials.rating_should_be_valid"))
    .run(req),
    await body("description")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.testimonials.please_enter_description"))
    .isLength({ min: MIN_CHARACTER_DESCRIPTION_LIMIT, max: MAX_CHARACTER_DESCRIPTION_LIMIT })
    .withMessage(res.__("admin.testimonials.description_should_be_2_and_20000_characters_long"))
    .run(req)
    const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if((req.files && req.files.image) || req.body.old_image.length>0){
      let file = (req.files) ? req.files.image : {};
      if (Object.keys(file).length == 0 && req.body.old_image.length==0) {
        errors.push({location : 'files',param:'image',msg:res.__("admin.testimonials.image_is_required"), value:''})
      }
    }else{
      errors.push({location : 'files',param:'image',msg:res.__("admin.testimonials.image_is_required"), value:''})
    }
    if(errors.length !==0){
      return res.send({
        // status: STATUS_ERROR,
        message: errors,
        result: {},
      })
    }else{
      testimonial.edit(req, res);
    }
  
  }else{
    req.breadcrumbs(BREADCRUMBS["admin/testimonials/edit"]);
    testimonial.edit(req, res);
  }
 
});

/** Routing is used to delete  **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var testimonial = require(modulePath);
  testimonial.deleteDetail(req, res);
});

/** Routing is used to update status**/

app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, function (
  req,
  res
) {
  var testimonial = require(modulePath);
  testimonial.updateStatus(req, res);
});
