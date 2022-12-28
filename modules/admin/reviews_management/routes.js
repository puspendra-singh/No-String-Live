var modulePath = __dirname + "/model/reviews";
var modelPath = "/admin/reviews";
var { body, check, validationResult } = require("express-validator");

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to render reivews listing view **/
app.get(modelPath, isUserLogedIn, async (req, res, next) => {
  var reivews = require(modulePath);
  reivews.getRatingList(req, res, next);
});
/** Routing is used to get reivews listing **/
app.post(modelPath, isUserLogedIn, async (req, res, next) => {
  var reivews = require(modulePath);
  reivews.postRatingList(req, res, next);
});

/** Routing is used to view reivews detail**/
app.get(modelPath + "/view/:id", isUserLogedIn, (req, res) => {
  var reivews = require(modulePath);
  reivews.viewReviewDetails(req, res);
});

/** Routing is used to edit reivews detail**/
app.get(modelPath + "/edit/:id", isUserLogedIn, (req, res) => {
  var reivews = require(modulePath);
  reivews.getEditReview(req, res);
});

/** Routing is used to update review status **/
app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, (req, res) => {
  var product = require(modulePath);
  product.updateReviewStatus(req, res);
}
);

/** Routing is used to delete review **/
app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var product = require(modulePath);
  product.deleteReview(req, res);
});

/** Routing is used to edit reivews detail**/
app.post(modelPath + "/edit/:id", isUserLogedIn, async (req, res) => {
  const reviewId = req.params.id ? req.params.id : "";
  var reivews = require(modulePath);
  await body('rating')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.review.please_enter_rating'))
  .run(req);

  await body('review_title')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.review.please_enter_review_title'))
  .isLength({ min: MIN_REVIEW_TITLE_LIMIT, max: MAX_REVIEW_TITLE_LIMIT })
  .withMessage(res.__('admin.review.title_should_be_max_100_chars'))
  .run(req);

  await body('review_description')
  .trim()
  .not()
  .isEmpty()
  .withMessage(res.__('admin.review.please_enter_review_description'))
  .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT})
  .withMessage(res.__('admin.review.description_should_be_2_to_500_characters_long'))
  .run(req);


  const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));

  if(errors.length !== 0){
    return res.send({
      message: errors,
      result: "",
      rediect_url: "",
    });
  } 
  else {
    reivews.postEditReview(req,res);
  }
  
});

