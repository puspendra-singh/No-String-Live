const { body } = require("express-validator");

var modulePath = __dirname + "/model/cms";
var modelPath = "/admin/cms";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  var cms = require(modulePath);
  cms.list(req, res);
});

/** Routing is used to add  details**/
app.get(modelPath + "/add", isUserLogedIn,
  (req, res) => {
  var cms = require(modulePath);
  cms.getAdd(req, res);
})

app.post(modelPath + "/add", isUserLogedIn, async (req, res) => {
  await body("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_name"))
    .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
    .withMessage(res.__("admin.user.name_should_be_2_and_20_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.user.name_should_be_valid"))
    .run(req),
  await body("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_title"))
    .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT })
    .withMessage(res.__("admin.user.title_should_be_2_to_50_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.user.title_should_be_valid"))
    .run(req),
  await body("description")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_description"))
    .isLength({ min: MIN_CHARACTER_DESCRIPTION_LIMIT, max: MAX_CHARACTER_DESCRIPTION_LIMIT })
    .withMessage(res.__("admin.user.description_should_be_2_and_20000_characters_long"))
    .run(req)

  
    var cms = require(modulePath);
    cms.postAdd(req, res);
  }
);

/** Routing is used to view detail**/

app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var cms = require(modulePath);
  cms.view(req, res);
});

/** Routing is used to edit detail**/
app.get(modelPath + "/edit/:id", isUserLogedIn,
  function (req, res) {
    var cms = require(modulePath);
    cms.getEdit(req, res);
  }
);

app.post( modelPath + "/edit/:id", async (req, res) => {
  await body("name")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_name"))
    .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
    .withMessage(res.__("admin.user.name_should_be_2_and_20_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.user.name_should_be_valid"))
    .run(req),
  await body("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_title"))
    .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT })
    .withMessage(res.__("admin.user.title_should_be_2_to_50_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("admin.user.title_should_be_valid"))
    .run(req),
  await body("description")
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_description"))
    .isLength({ min: MIN_CHARACTER_DESCRIPTION_LIMIT, max: MAX_CHARACTER_DESCRIPTION_LIMIT })
    .withMessage(res.__("admin.user.description_should_be_2_and_20000_characters_long"))
    .run(req);
    var cms = require(modulePath);
    cms.postEdit(req, res);
  }
);

/** Routing is used to delete  **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var cms = require(modulePath);
  cms.deleteDetail(req, res);
});

/** Routing is used to update status**/

app.all(
  modelPath + "/update_status/:id/:status",
  isUserLogedIn,
  function (req, res) {
    var cms = require(modulePath);
    cms.updateStatus(req, res);
  }
);
