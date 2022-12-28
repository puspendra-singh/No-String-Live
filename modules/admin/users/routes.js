var modulePath = __dirname + "/model/users";
var modelPath = "/admin/users";
var { body, check, validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");

/** Routing is used to login **/
app.get(["/admin", "/admin/login"], (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  req.rendering.layout = WEBSITE_ADMIN_MODULE_PATH + "layouts/blank_layout";
  res.render("login");
});

app.post(
  ["/admin", "/admin/login"],
  [
    body("username")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: PASSWORD_MIN_LENGTH })
      .trim(),
  ],
  (req, res, next) => {
    let errors = uniqueValidations(validationResult(req).errors);
    if (errors.length !== 0) {
      res.send({
        status: STATUS_ERROR,
        message: errors,
        result: "",
        rediect_url: "",
      });
    } else {
      var user = require(modulePath);
      user.userLogin(req, res, next);
    }
  }
);

/** Routing is used to forgot password **/
app.get("/admin/forgot_password", (req, res, next) => {
  if (typeof req.session.user !== "undefined" && req.session.user.email != "") {
    res.redirect("/" + WEBSITE_ADMIN_NAME + "/dashboard");
  } else {
    req.rendering.views = __dirname + "/views";
    req.rendering.layout = WEBSITE_ADMIN_MODULE_PATH + "layouts/blank_layout";
    var user = require(modulePath);
    res.render("recover-password");
  }
});

app.post("/admin/forgot_password", async (req, res, next) => {
  await body("email")
    .isEmail()
    .withMessage(res.__("admin.user.please_enter_a_valid_email_address."))
    .normalizeEmail()
    .run(req);

    if (
      typeof req.session.user !== "undefined" &&
      req.session.user.email != ""
    ) {
      res.redirect("/" + WEBSITE_ADMIN_NAME + "/dashboard");
    } else {
      let errors = uniqueValidations(validationResult(req).errors);
      if (errors.length !== 0) {
        res.send({
          // status: STATUS_ERROR,
          message: errors,
          result: "",
          rediect_url: "",
        });
      } else {
        req.rendering.views = __dirname + "/views";
        req.rendering.layout =
          WEBSITE_ADMIN_MODULE_PATH + "layouts/blank_layout";
        var user = require(modulePath);
        user.forgotPassword(req, res, next);
      }
    }
  }
);

/** Routing is used to confirm mail **/
app.get("/admin/confirm-mail", function (req, res) {
  if (typeof req.session.user !== "undefined" && req.session.user.email != "") {
    res.redirect("/" + WEBSITE_ADMIN_NAME + "/dashboard");
  } else {
    req.rendering.views = __dirname + "/views";
    req.rendering.layout = WEBSITE_ADMIN_MODULE_PATH + "layouts/blank_layout";
    res.render("confirm-mail");
  }
});

/** Routing is used to reset password **/
app.all("/admin/reset_password/:validate_string", function (req, res, next) {
  if (typeof req.session.user !== "undefined" && req.session.user.email != "") {
    res.redirect("/" + WEBSITE_ADMIN_NAME + "/dashboard");
  } else {
    req.rendering.views = __dirname + "/views";
    req.rendering.layout = WEBSITE_ADMIN_MODULE_PATH + "layouts/blank_layout";
    var user = require(modulePath);
    user.resetPassword(req, res, next);
  }
});

/** Routing is used to reset link **/
app.all("/admin/resend_link/:email", function (req, res, next) {
  if (typeof req.session.user !== "undefined" && req.session.user.email != "") {
    res.redirect("/" + WEBSITE_ADMIN_NAME + "/dashboard");
  } else {
    req.rendering.views = __dirname + "/views";
    req.rendering.layout = WEBSITE_ADMIN_MODULE_PATH + "layouts/blank_layout";
    var user = require(modulePath);
    user.resendLink(req, res, next);
  }
});

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to render on dashboard **/
app.all(WEBSITE_FRONT_NAME + WEBSITE_ADMIN_NAME + "/dashboard",isUserLogedIn, (req, res, next)=> {
    req.rendering.views = __dirname + "/views";
    var user = require(modulePath);
    user.dashboard(req, res, next);
  }
);


app.all(modelPath, isUserLogedIn,(req, res, next)=> {
  var user = require(modulePath);
  user.getUserList(req, res, next);
});


/** Routing is used to add user **/
app.all(modelPath + "/add", isUserLogedIn, async (req, res) => {
  if(isPost(req)){
    await body('full_name')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__('admin.user.please_enter_full_name'))
      .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT})
      .withMessage(res.__('admin.user.full_name_should_be_min_to_max_characters_long'))
      .matches(NAME_REGEX)
      .withMessage(res.__('admin.user.full_name_should_be_valid'))
      .run(req);

    await body("phone")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("admin.user.please_enter_phone"))
    .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
    .withMessage(res.__("admin.user.phone_should_be_6_to_16_characters_long"))
    .custom((value, { req }) => {
      const collection = db.collection("users");
      return collection.findOne({ "phone.number": value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject(res.__("admin.user.phone_is_already_in_use_please_try_something_different"));
        }
      });
    })
    .run(req);

    await body("dial_code")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_dial_code"))
      .isLength({ min: MIN_DIAL_CODE_LIMIT, max: MAX_DIAL_CODE_LIMIT })
      .withMessage(res.__("admin.user.dial_code_should_be_1_to_5_characters_long"))
      .run(req);

    await body('country_code')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_country_code"))
      .isLength({ min: MIN_COUNTRY_CODE_LIMIT, max: MAX_COUNTRY_CODE_LIMIT })
      .withMessage(res.__("admin.user.country_code_should_be_2_to_6_characters_long"))
      .run(req);  

    await body('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__('admin.user.please_enter_password'))
    .matches(  PASSWORD_REGEX )
    .withMessage(res.__('admin.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_and_6_to_10_characters_long'))
    .run(req);

    await body('confirm_password')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__('admin.user.please_enter_confirm_password'))
      .matches( PASSWORD_REGEX )
      .withMessage(res.__('admin.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long'))
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error(res.__("admin.user.passwords_does_not_match"));
        }
        return true;
      })
      .run(req);
  

    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if (errors && errors.length !== NOT) {
        return res.send({
          status: STATUS_ERROR,
          message: errors,
          rediect_url: "/users",
        });
    } else {
      var user = require(modulePath);
      user.addUser(req, res);
    }
  }else{
    req.breadcrumbs(BREADCRUMBS['admin/users/add']);
    res.render('add');
  }
});

/** Routing is used to view user detail**/
app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.viewUserDetail(req, res);
});

app.all(modelPath + "/edit/:id/:userType", isUserLogedIn,async (req, res, next) => {
  if(isPost(req)){
    await body('full_name')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__('admin.user.please_enter_full_name'))
      .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT})
      .withMessage(res.__('admin.user.first_name_must_be_min_to_max_characters_long'))
      .matches(NAME_REGEX)
      .withMessage(res.__('admin.user.full_name_should_be_valid'))
      .run(req);
    await body("phone")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_phone"))
      .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
      .withMessage(res.__("admin.user.phone_should_be_6_to_16_characters_long"))
      .custom((value, { req }) => {
        const collection = db.collection("users");
        return collection.findOne({ "phone.number": value, _id :{$ne:ObjectId(req.params.id)} }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(res.__("admin.user.phone_is_already_in_use_please_try_something_different"));
          }
        });
      })
      .run(req);
    
    await body("dial_code")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_dial_code"))
      .isLength({ min: MIN_DIAL_CODE_LIMIT, max: MAX_DIAL_CODE_LIMIT })
      .withMessage(res.__("admin.user.dial_code_should_be_1_to_5_characters_long"))
      .run(req);  

    await body('country_code')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_country_code"))
      .isLength({ min: MIN_COUNTRY_CODE_LIMIT, max: MAX_COUNTRY_CODE_LIMIT })
      .withMessage(res.__("admin.user.country_code_should_be_2_to_6_characters_long"))
      .run(req);
    

    if(req.body.password){
      await body('password')
        .not()
        .isEmpty()
        .withMessage(res.__('admin.user.please_enter_password'))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__('admin.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long'))
        .trim()
        .run(req);
      await body('confirm_password')
        .not()
        .isEmpty()
        .withMessage(res.__('admin.user.please_enter_confirm_password'))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__('admin.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long'))
        .trim()
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(res.__("admin.user.passwords_does_not_match"));
          }
          return true;
        })
        .run(req);
    }
    
    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    console.log(errors, "errors");
    if (errors.length !== NOT) {
      return res.send({
        status: STATUS_ERROR,
        message: errors,
        rediect_url: "/",
      });
    }
  }
  let user = require(modulePath);
  user.editUser(req, res, next);
});

/** Routing is used to delete user **/
app.all(modelPath + "/delete/:id", isUserLogedIn, (req, res)=> {
  var user = require(modulePath);
  user.deleteUserDetail(req, res);
});

/** Routing is used to update  user status**/
app.all(modelPath + "/update_status/:id/:status",isUserLogedIn, (req, res)=> {
    var user = require(modulePath);
    user.updateUserStatus(req, res);
  }
);

/** Routing is used to verify  user email or phone **/
app.all(modelPath + "/verify/:id/:status", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.verifyUser(req, res);
});

/** Routing is used to edit  user detail l**/
// app.all(modelPath + "/edit_profile/:id", isUserLogedIn, function (req, res) {

//   var user = require(modulePath);
//   user.editAdminDetail(req, res);
// });


app.all(modelPath + "/edit_profile/:id",isUserLogedIn,async(req,res,next)=>{
  var user = require(modulePath);
    if(isPost(req)){
      await body('first_name')
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__('admin.user.please_enter_first_name'))
      .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT})
      .withMessage(res.__('admin.user.first_name_must_be_2_to_20_characters_long'))
      .matches(NAME_REGEX)
      .withMessage(res.__('admin.user.first_name_should_be_valid'))
      .run(req)

      await body('last_name')
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__('admin.user.please_enter_last_name'))
        .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT})
        .withMessage(res.__('admin.user.first_name_must_be_2_to_20_characters_long'))
        .matches(NAME_REGEX)
        .withMessage(res.__('admin.user.first_name_should_be_valid'))
        .run(req)

      await body("mobile")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_phone"))
      .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
      .withMessage(res.__("admin.user.phone_should_be_6_to_16_characters_long"))
      .run(req);
  
      await body("dial_code")
        .trim()
        .not()
        .isLength({ min: MIN_DIAL_CODE_LIMIT, max: MAX_DIAL_CODE_LIMIT })
        .withMessage(res.__("admin.user.dial_code_should_be_1_to_5_characters_long"))
        .run(req);

      await body('address')
      .trim()
      .not()
      .isEmpty()
      .matches(ADDRESS_REGEX)
      .withMessage(res.__('admin.user.address_name_should_be_valid'))
      .run(req)

      await body('password')
      .trim()
      .not()
      .matches(  PASSWORD_REGEX )
      .withMessage(res.__('admin.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long'))
      .run(req);

      await body('confirm_password')
      .trim()
      .not()
      .matches( PASSWORD_REGEX )
      .withMessage(res.__('admin.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long'))
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error(res.__("admin.user.passwords_does_not_match"));
        }
        return true;
      })
      .run(req);
      let errors = uniqueValidations(validationResult(req).errors);
      if (errors.length !== 0) {
        res.send({
          message: errors,
          result: "",
          rediect_url: "",
        });
      }else{
        user.editAdminDetail(req, res, next);
      }
    }else{
      user.editAdminDetail(req, res, next);
    }
  }
);




/** Routing is used to get cities **/
app.post(modelPath + "/get_cities", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.getCityList(req, res);
});
/** Routing is used to get states **/
app.post(modelPath + "/get_states", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.getStateList(req, res);
});

/** Routing is used to get billing country **/
app.post(modelPath + "/get_billing_countries", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.getCountryList(req, res);
});

/** Routing is used to get billing cities **/
app.post(modelPath + "/get_billing_cities", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.getCityList(req, res);
});
/** Routing is used to get billing states **/
app.post(modelPath + "/get_billing_states", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.getStateList(req, res);
});

app.get(modelPath + "/request_accept/:userId", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.requestAccept(req, res);
});
app.get(modelPath + "/request_reject/:userId", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.requestReject(req, res);
});

app.get(modelPath + "/approve_user/:userId/:status", isUserLogedIn, function (req, res) {
  var user = require(modulePath);
  user.approveUser(req, res);
});

/** Routing is used to get user log out(session destroy) **/
app.all(
  WEBSITE_FRONT_NAME + WEBSITE_ADMIN_NAME + "/user_logout",
  function (req, res) {
    var user = require(modulePath);
    user.userLogout(req, res);
  }
);
