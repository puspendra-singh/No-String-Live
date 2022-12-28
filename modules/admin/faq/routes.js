const { body, validationResult } = require("express-validator");
var modulePath = __dirname + "/model/faq";
var modelPath = "/admin/faq";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.list(req, res);
});

/** Routing is used to add  **/

app.get(modelPath + "/add", isUserLogedIn, (req, res) => {
  var block = require(modulePath);
  block.getAdd(req, res);
});

app.post(modelPath + "/add", isUserLogedIn, async (req, res) => {
  await body("question")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.faq.please_enter_question"))
    .isLength({  min: MIN_CHARACTER_TITLE_LIMIT,   max: MAX_CHARACTER_TITLE_LIMIT, })
    .withMessage(res.__("admin.user.question_should_be_2_to_50_characters_long"))
    .run(req);

    await body("category")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.faq.please_select_category"))
    .run(req);

  await body("answer")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.faq.please_enter_answer"))
    .isLength({  min: MIN_CHARACTER_DESCRIPTION_LIMIT,  max: MAX_CHARACTER_DESCRIPTION_LIMIT,  })
    .withMessage(res.__("admin.user.answer_should_be_2_to_20000_characters_long"))
    .run(req);

  let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
  if (errors.length !== 0) {
    res.send({
      message: errors,
      rediect_url: "/admin/faq",
    });
  } else {
    var block = require(modulePath);
    block.postAdd(req, res);
  }
});

/** Routing is used to view detail**/

app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.view(req, res);
});

/** Routing is used to edit detail**/

app.get(modelPath + "/edit/:id", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.getEdit(req, res);
});

app.post(modelPath + "/edit/:id", isUserLogedIn, async (req, res) => {

  await body("question")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.faq.please_enter_question"))
    .isLength({  min: MIN_CHARACTER_TITLE_LIMIT,   max: MAX_CHARACTER_TITLE_LIMIT, })
    .withMessage(res.__("admin.user.question_should_be_2_to_50_characters_long"))
    .run(req);

    await body("category")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.faq.please_select_category"))
    .run(req);

  await body("description")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.faq.please_enter_answer"))
    .isLength({  min: MIN_CHARACTER_DESCRIPTION_LIMIT,  max: MAX_CHARACTER_DESCRIPTION_LIMIT,  })
    .withMessage(res.__("admin.user.answer_should_be_2_to_20000_characters_long"))
    .run(req);

  let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
  if (errors.length !== 0) {
    res.send({
      status      : STATUS_ERROR,
      message     : errors,
      rediect_url : "/admin/faq",
    });
  }else{
  var block = require(modulePath);
  block.postEdit(req, res);
  }
});

/** Routing is used to delete  **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.deleteDetail(req, res);
});

/** Routing is used to update status**/

app.all(
  modelPath + "/update_status/:id/:status",
  isUserLogedIn,
  function (req, res) {
    var block = require(modulePath);
    block.updateStatus(req, res);
  }
);
