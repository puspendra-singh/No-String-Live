const { ObjectId } = require("bson");
const { body, validationResult, param } = require("express-validator");
const bcrypt = require('bcryptjs');

/** Model file path for current plugin **/
const modelPath = __dirname + "/model/user";
const user = require(modelPath);

/** Routing is used to user signup **/
// routes.post(API_URL + "signup", async (req, res, next) => {
//   await body("firstName")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_first_name"))
//     .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
//     .withMessage(res.__("front.user.first_name_should_be_2_to_20_characters_long"))
//     .matches(NAME_REGEX)
//     .withMessage(res.__("front.user.first_name_should_be_valid"))
//     .run(req);

//   await body("lastName")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_last_name"))
//     .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
//     .withMessage(res.__("front.user.last_name_should_be_2_to_20_characters_long"))
//     .matches(NAME_REGEX)
//     .withMessage(res.__("front.user.last_name_should_be_valid"))
//     .run(req);

//   await body("email")
//     .matches(EMAIL_REGEX)
//     .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
//     .isEmail()
//     .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
//     .normalizeEmail()
//     .custom((value, { req }) => {
//       const collection = db.collection("users");
//       return collection.findOne({ email: value }).then((userDoc) => {
//         if (userDoc) {
//           return Promise.reject(res.__("front.user.email_already_exists"));
//         }
//       });
//     })
//     .run(req);

//   await body("phone.countryCode")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_country_code"))
//     .isLength({ min: MIN_COUNTRY_CODE_LIMIT, max: MAX_COUNTRY_CODE_LIMIT })
//     .withMessage(res.__("front.user.country_code_should_be_2_to_6_characters_long"))
//     .run(req);

//   await body("phone.dialCode")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_dialcode"))
//     .isLength({ min: MIN_DIAL_CODE_LIMIT, max: MAX_DIAL_CODE_LIMIT })
//     .withMessage(res.__("front.user.dialcode_should_be_1_to_5_characters_long"))
//     .run(req);

//   await body("phone.e164Number")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_e164number"))
//     .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
//     .withMessage(res.__("front.user.e164number_should_be_6_to_16_characters_long"))
//     .run(req);

//   await body("phone.internationalNumber")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please enter_international_number"))
//     .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
//     .withMessage(res.__("front.user.international_number_should_be_6_to_16_characters_long"))
//     .run(req);

//   await body("phone.nationalNumber")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_national_number"))
//     .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
//     .withMessage(res.__("front.user.national_number_should_be_6_to_16_characters_long"))
//     .run(req);

//   await body("phone.number")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_number"))
//     .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
//     .withMessage(res.__("front.user.number_should_be_6_to_16_characters_long"))
//     .custom((value, { req }) => {
//       const collection = db.collection("users");
//       return collection.findOne({ "phone.number": value }).then((userDoc) => {
//         if (userDoc) {
//           return Promise.reject(res.__("front.user.phone_already_exists"));
//         }
//       });
//     })
//     .run(req);
//   await body("password")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_password"))
//     .matches(PASSWORD_REGEX)
//     .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
//     .run(req);

//   await body("confirmPassword")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_confirm_password"))
//     .matches(PASSWORD_REGEX)
//     .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
//     .custom((value, { req }) => {
//       if (value !== req.body.password) {
//         throw new Error(res.__("front.user.passwords_does_not_match"));
//       }
//       return true;
//     })
//     .run(req);

//   await body("shippingAddress.country")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_country"))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
//     // .withMessage(res.__("front.user.country_should_be_2_to_25_characters_long"))
//     .run(req);

//   await body("shippingAddress.state")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_state"))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
//     // .withMessage(res.__("front.user.state_should_be_between_2_to_25_characters_long"))
//     .run(req);

//   await body("shippingAddress.city")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_city"))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
//     // .withMessage(res.__("front.user.city_should_be_between_2_to_25_characters_long"))
//     .run(req);

//   await body("shippingAddress.street")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_street"))
//     .isLength({ min: MIN_STREET_LIMIT, max: MAX_STREET_LIMIT })
//     .withMessage(res.__("front.user.street_should_be_2_to_50_characters_long"))
//     .matches(STREET_REGEX)
//     .withMessage(res.__("front.user.street_should_be_valid"))
//     .run(req);

//   await body("shippingAddress.pincode")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_pincode"))
//     .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
//     .withMessage(res.__("front.user.pincode_should_be_2_to_20_characters_long"))
//     .matches(ZIPCODE_REGEX)
//     .withMessage(res.__('front.user.pincode_should_be_valid'))
//     .run(req);
//   await body("sameAddress")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.same_address_is_required"))
//     .run(req);
//   await body("billingAddress.billingCountry")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_country"))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
//     // .withMessage(res.__("front.user.billing_country_should_be_between_2_to_25_characters_long"))
//     .run(req);

//   await body("billingAddress.billingState")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_state"))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
//     // .withMessage(res.__("front.user.billing_state_should_be_between_2_to_25_characters_long"))
//     .run(req);
//   await body("billingAddress.billingCity")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_city"))
//     // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
//     // .withMessage(res.__("front.user.billing_city_should_be_between_2_to_25_characters_long"))
//     .run(req);
//   await body("billingAddress.billingStreet")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_street"))
//     .isLength({ min: MIN_STREET_LIMIT, max: MAX_STREET_LIMIT })
//     .withMessage(res.__("front.user.street_should_be_2_to_50_characters_long"))
//     .matches(STREET_REGEX)
//     .withMessage(res.__("front.user.street_should_be_valid"))
//     .run(req);

//   await body("billingAddress.billingPincode")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.please_enter_pincode"))
//     .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
//     .withMessage(res.__("front.user.billing_pincode_should_be_between_2_to_20_characters_long"))
//     .matches(ZIPCODE_REGEX)
//     .withMessage(res.__('front.user.pincode_should_be_valid'))
//     .run(req);

//   await body("acceptTerms")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage(res.__("front.user.accept_terms_is_required"))
//     .run(req);

//   user.signup(req, res, next);
// });

/** Routing is used to email verificaton **/
routes.get(API_URL + "email_verification/:validate_string", (req, res, next) => {
  user.emailVerification(req, res, next);
});

/** Routing is used to new email verificaton **/
routes.get(API_URL + "new_email_verification/:validate_string", (req, res, next) => {
  user.newEmailVerification(req, res, next);
});

/** Routing is used to new email verificaton **/
routes.get(API_URL + "forgot_password_email/:validate_string", (req, res, next) => {
  user.forgotPasswordEmail(req, res, next);
});

/** Routing is used to new email verificaton **/
routes.post(API_URL + "resend_email_forgot_password_email/", (req, res, next) => {
  user.resendEmailForgotPassword(req, res, next);
});

/** Routing is used to resend email **/
routes.post(API_URL + "resend_email/:validate_string", (req, res, next) => {
  if (req.body.type == "resend_change_email") {
    user.resendEmailForChangeEmail(req, res, next);
  } else {
    user.resendEmailForVerifyEmail(req, res, next);
  }
});

/** Routing is used to forgot password **/
routes.post(API_URL + "forgot_password", async (req, res, next) => {
  if (req.type == "email") {
    await body("email")
      .matches(EMAIL_REGEX)
      .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
      .isEmail()
      .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
      .normalizeEmail()
      .run(req);
  }

  user.forgotPassword(req, res, next);
}
);

/** Routing is used to verify otp **/
routes.post(API_URL + "verify_otp", async (req, res, next) => {

  await body("validate_otp")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.otp.please_enter_a_valid_4_digit_otp"))
    .isNumeric()
    .withMessage(res.__("front.user.otp.please_enter_a_valid_numeric_4_digit_otp"))
    .isLength({ min: OTP_NUMBER_ROUND, max: OTP_NUMBER_ROUND })
    .withMessage(res.__("front.user.otp.please_enter_a_valid_numeric_4_digit_otp"))
    .run(req);

  user.verifyOtp(req, res, next);
}
);

/** Routing is used to resend otp **/
routes.post(API_URL + "resend_otp", (req, res, next) => {
  user.resendOtp(req, res, next);
});

/** Routing is used to reset_password **/
routes.post(API_URL + "reset_password", async (req, res, next) => {

  await body("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_password"))
    .matches(PASSWORD_REGEX)
    .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
    .custom(async (value, { req }) => {
      const validate_string = req.body.validate_string
      const collection = db.collection("users");
      const user = await collection.findOne({ validate_string: validate_string })
      if (user) {
        const doMatch = await bcrypt.compare(value, user.password)
        if (doMatch) {
          return Promise.reject(res.__('front.user.new_password_should_not_be_equal_to_old_password'));
        } else {
          return true;
        }
      } else {
        return Promise.reject(res.__('front.user.no_user_found_with_this_id'));
      }
    })
    .run(req);

  await body("confirmPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_confirm_password"))
    .matches(PASSWORD_REGEX)
    .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(res.__("front.user.passwords_does_not_match"));
      }
      return true;
    })
    .run(req);

  user.resetPassword(req, res, next);
}
);

/** Routing is used to get user login **/
routes.post(API_URL + "login", async (req, res, next) => {

  await body("email")
    .matches(EMAIL_REGEX)
    .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
    .isEmail()
    .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
    .normalizeEmail()
    .run(req);

  await body("password")
    .trim()
    .matches(PASSWORD_REGEX)
    .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
    .run(req);

  user.login(req, res, next);
}
);

/** Routing is used to get user data **/
routes.post(API_URL + "user_data", (req, res, next) => {
  user.getUserDetail(req, res, next);
});

/** Routing is used to get user data **/
routes.post(API_URL + "user_info", (req, res, next) => {
  user.getUserInfo(req, res, next);
});

/** Routing is used to get business type **/
routes.get(API_URL + "business_type", (req, res, next) => {
  user.getBusinessType(req, res, next);
});
/** Routing is used to user profile setup**/
routes.get(API_URL + "profile_setup/:user_id", (req, res, next) => {
  user.getProfileSetup(req, res, next);
});
routes.post(API_URL + "mobile_verification", (req, res, next) => {
  user.phoneVerification(req, res, next);
});
routes.post(API_URL + "resend_mobile_verification_otp", (req, res, next) => {
  user.resendOtpForPhoneVerification(req, res, next);
});

routes.post(API_URL + "profile_setup/:user_id", async (req, res, next) => {
  const userId = req.params.user_id ? req.params.user_id : '';
  if (req.body.type === 'personal_info') {
    await body("firstName")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_first_name"))
      .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
      .withMessage(res.__("front.user.first_name_should_be_2_to_20_characters_long"))
      .matches(NAME_REGEX)
      .withMessage(res.__("front.user.first_name_should_be_valid"))
      .run(req);
    await body("lastName")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_last_name"))
      .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
      .withMessage(res.__("front.user.last_name_should_be_2_to_20_characters_long"))
      .matches(NAME_REGEX)
      .withMessage(res.__("front.user.last_name_should_be_valid"))
      .run(req);
    await body("date_of_birth")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_date_of_birth"))
      .run(req);
    // await body("phone.countryCode")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.country_code_is_required"))
    //   .isLength({ min: MIN_COUNTRY_CODE_LIMIT, max: MAX_COUNTRY_CODE_LIMIT })
    //   .withMessage(res.__("front.user.country_code_should_be_between_2_to_6_characters_long"))
    //   .run(req);
    // await body("phone.dialCode")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.dialcode_is_required"))
    //   .isLength({ min: MIN_DIAL_CODE_LIMIT, max: MAX_DIAL_CODE_LIMIT })
    //   .withMessage(res.__("front.user.dialcode_should_be_between_1_to_5_characters_long"))
    //   .run(req);
    // await body("phone.e164Number")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.e164number_is_required"))
    //   .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
    //   .withMessage(res.__("front.user.e164number_should_be_between_6_to_16_characters_long"))
    //   .run(req);
    // await body("phone.internationalNumber")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.international_number_is_required"))
    //   .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
    //   .withMessage(res.__("front.user.international_number_should_be_between_6_to_16_characters_long"))
    //   .run(req);
    // await body("phone.nationalNumber")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.national_number_is_required"))
    //   .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
    //   .withMessage(res.__("front.user.national_number_should_be_between_6_to_16_characters_long"))
    //   .run(req);
    // await body("phone.number")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.number_is_required"))
    //   .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
    //   .withMessage(res.__("front.user.number_should_be_between_6_to_16_characters_long"))
    //   .run(req);

    await body("passwordChange")
      .not()
      .isEmpty()
      .withMessage(res.__('front.user.password_change_is_required'))
      .isBoolean()
      .withMessage(res.__('front.user.password_change_must_be_true_or_false'))
      .run(req);
    if (req.body.passwordChange === 'true') {
      await body("old_password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_old_password"))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
        .custom(async (value, { req }) => {
          const collection = db.collection("users");
          const user = await collection.findOne({ _id: ObjectId(userId) })
          if (user) {
            const doMatch = await bcrypt.compare(value, user.password)
            if (doMatch) {
              return true;
            } else {
              return Promise.reject(res.__('front.user.old_password_is_wrong'));
            }
            // })
          } else {
            return Promise.reject(res.__('front.user.no_user_found_with_this_id'));
          }
        })
        .run(req);
      await body("new_password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_new_password"))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
        .custom(async (value, { req }) => {
          const collection = db.collection("users");
          const user = await collection.findOne({ _id: ObjectId(userId) })
          if (user) {
            const doMatch = await bcrypt.compare(value, user.password)
            if (doMatch) {
              return Promise.reject(res.__('front.user.new_password_should_not_be_equal_to_old_password'));
            } else {
              return true;
            }
          } else {
            return Promise.reject(res.__('front.user.no_user_found_with_this_id'));
          }
        })
        .run(req);
      await body("new_confirm_password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_confirm_password"))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__("front.user.password_should_contain_letters_atleast_1_capital_letter_and_1_special_character_among_#?!@$%^&*-_and_6_to_10_characters_long"))
        .custom((value, { req }) => {
          if (value !== req.body.new_password) {
            throw new Error(res.__("front.user.passwords_does_not_match"));
          }
          return true;
        })
        .run(req);
      await body("languages")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_language"))
        .run(req);
    }
  }
  else if (req.body.type === 'verified_seller') {
    await body("companyCountry")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_country"))
      // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
      // .withMessage(res.__("front.user.country_should_be_between_2_to_25_characters_long" ))
      .run(req),
      await body("companyState")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_state"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.state_should_be_between_2_to_25_characters_long"))
        .run(req);
    await body("companyCity")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_city"))
      // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
      // .withMessage(res.__("front.user.city_should_be_between_2_to_25_characters_long"))
      .run(req);
    await body("companyStreet")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_street"))
      .isLength({ min: MIN_STREET_LIMIT, max: MAX_STREET_LIMIT })
      .withMessage(res.__("front.user.street_should_be_2_to_50_characters_long"))
      .matches(STREET_REGEX)
      .withMessage(res.__('admin.user.street_should_be_valid'))
      .run(req);

    await body("companyZipcode")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_pincode"))
      .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
      .withMessage(res.__("front.user.pincode_should_be_2_to_20_characters_long"))
      .matches(ZIPCODE_REGEX)
      .withMessage(res.__('admin.user.pincode_should_be_valid'))
      .run(req);
    await body("companyName")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_company_name"))
      .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
      .withMessage(res.__("front.user.company_name_should_be_2_to_20_characters_long"))
      .matches(NAME_REGEX)
      .withMessage(res.__("front.user.company_name_should_be_valid"))
      .run(req);
    await body("businessId")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_business_id"))
      .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
      .withMessage(res.__("front.user.business_id_should_be_2_to_25_characters_long"))
      .matches(BUSINESSID_REGEX)
      .withMessage(res.__("front.user.business_id_should_be_valid"))
      .run(req);
    await body("businessType")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_select_business_type"))
      // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
      // .withMessage(res.__("front.user.business_id_should_be_between_2_to_25_characters_long"))
      .run(req);
    // await body("taxId")
    //   .trim()
    //   .not()
    //   .isEmpty()
    //   .withMessage(res.__("front.user.please_enter_tax_id"))
    //   .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    //   .withMessage(res.__("front.user.tax_id_should_be_2_to_25_characters_long"))
    //   .matches(TAXID_REGEX)
    //   .withMessage(res.__("front.user.tax_id_should_be_valid"))
    //   .run(req);
    await body("website")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_website"))
      .isURL()
      .withMessage(res.__("front.user.website_should_be_a_valid_url"))
      .matches(WEBSITE_REGEX)
      .withMessage(res.__("front.user.website_should_be_a_valid_url"))
      .run(req);
  }
  user.postProfileSetup(req, res, next);
});

/** Routing is used to get user addresses **/
routes.get(API_URL + "Addresses/:userId/:type", async (req, res, next) => {
  await param("type")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.address_type_required"))
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.getAddresses(req, res, next);
  }

});

/** Routing is used to edit user addresses **/
routes.post(API_URL + "Addresses/:userId", async (req, res, next) => {
  const type = req.body.type ? req.body.type : "";
  await body("pincode")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_pincode"))
    .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
    .withMessage(res.__("front.user.pincode_should_be_2_to_20_characters_long"))
    .matches(ZIPCODE_REGEX)
    .withMessage(res.__('admin.user.pincode_should_be_valid'))
    .run(req);
  await body("city")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_city"))
    .run(req);
  await body("state")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_state"))
    .run(req);
  await body("country")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_country"))
    .run(req);
  await body("status")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_status"))
    .run(req);
  if (type == "shipping_address") {
    await body("shipping_address_line_one")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_line_one"))
      .run(req);
  } else if (type == "billing_address") {
    await body("billing_address_line_one")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_line_one"))
      .run(req);
  }

  user.postAddresses(req, res, next);
});

/** Routing is used to set new Email address **/
routes.post(API_URL + "new_email/:userId", async (req, res, next) => {
  await body('email')
    .matches(EMAIL_REGEX)
    .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
    .isEmail()
    .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
    .normalizeEmail()
    .custom((value, { req }) => {
      const collection = db.collection("users");
      return collection.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject(res.__("front.user.email_already_exists"));
        }
      });
    })
    .run(req)

  user.newEmail(req, res, next);
});

routes.get(API_URL + 'email_change_verification/:validate_string', async (req, res, next) => {
  user.emailChangeVerification(req, res, next);
})
/** Routing is used to set default address **/
routes.post(API_URL + "default_address/:userId/:id", (req, res, next) => {
  user.postDefaultAddress(req, res, next);
});

/** Routing is used to get edit user address **/
routes.get(API_URL + "edit_address/:userId/:id", (req, res, next) => {
  user.getEditAddress(req, res, next);
});
routes.post(API_URL + "edit_address/:userId/:id", async (req, res, next) => {
  const type = req.body.type ? req.body.type : "";
  await body("pincode")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_pincode"))
    .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
    .withMessage(res.__("front.user.pincode_should_be_2_to_20_characters_long"))
    .matches(ZIPCODE_REGEX)
    .withMessage(res.__('admin.user.pincode_should_be_valid'))
    .run(req);
  await body("city")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_city"))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    // .withMessage(res.__("front.user.city_should_be_between_2_to_25_characters_long"))
    .run(req);
  await body("state")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_state"))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    // .withMessage(res.__("front.user.state_should_be_between_2_to_25_characters_long"))
    .run(req);
  await body("country")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_country"))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    // .withMessage(res.__("front.user.country_should_be_between_2_to_25_characters_long"))
    .run(req);
  await body("status")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_status"))
    .run(req);
  if (type == "shipping_address") {
    await body("shipping_address_line_one")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_line_one"))
      .run(req);
  } else if (type == "billing_address") {
    await body("billing_address_line_one")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_line_one"))
      .run(req);
  }
  user.postEditAddress(req, res, next);
});

/** Routing is used to delete address **/
routes.post(API_URL + "delete_address/:userId/:id", (req, res, next) => {
  user.deleteAddress(req, res, next);
});

/** Routing is used to edit user data **/
routes.post(API_URL + "edit_profile", (req, res, next) => {
  user.updateProfile(req, res, next);
});

/** Routing is used to delete user data **/
routes.post(API_URL + "delete_profile_data/:userId", (req, res, next) => {
  user.deleteProfileData(req, res, next);
});

routes.post(API_URL + "edit_verified_seller/:userId", isUserLogedInApi, async (req, res, next) => {
  await body("companyCountry")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_country"))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    // .withMessage(res.__("front.user.country_should_be_between_2_to_25_characters_long"))
    .run(req),
    await body("companyState")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("front.user.please_enter_state"))
      // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
      // .withMessage(res.__("front.user.state_should_be_between_2_to_25_characters_long"))
      .run(req);
  await body("companyCity")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_city"))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    // .withMessage(res.__("front.user.city_should_be_between_2_to_25_characters_long"))
    .run(req);
  await body("companyStreet")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_street"))
    .isLength({ min: MIN_STREET_LIMIT, max: MAX_STREET_LIMIT })
    .withMessage(res.__("front.user.street_should_be_2_to_50_characters_long"))
    .matches(STREET_REGEX)
    .withMessage(res.__("front.user.street_should_be_valid"))
    .run(req);
  await body("companyZipcode")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_pincode"))
    .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
    .withMessage(res.__("front.user.pincode_should_be_2_to_20_characters_long"))
    .matches(ZIPCODE_REGEX)
    .withMessage(res.__('front.user.pincode_should_be_valid'))
    .run(req);

  await body("companyName")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_company_name"))
    .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
    .withMessage(res.__("front.user.company_name_should_be_2_to_20_characters_long"))
    .matches(NAME_REGEX)
    .withMessage(res.__("front.user.company_name_should_be_valid"))
    .run(req);
  await body("businessId")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_business_id"))
    .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
    .withMessage(res.__("front.user.business_id_should_be_2_to_25_characters_long"))
    .matches(BUSINESSID_REGEX)
    .withMessage(res.__("front.user.business_id_should_be_valid"))
    .run(req);
  await body("businessType")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_select_business_type"))
    // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
    // .withMessage(res.__("front.user.business_type_should_be_between_2_to_25_characters_long"))
    .run(req);
  // await body("taxId")
  //   .trim()
  //   .not()
  //   .isEmpty()
  //   .withMessage(res.__("front.user.please_enter_tax_id"))
  //   .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
  //   .withMessage(res.__("front.user.tax_id_should_be_2_to_25_characters_long"))
  //   .matches(TAXID_REGEX)
  //   .withMessage(res.__("front.user.tax_id_should_be_valid"))
  //   .run(req);
  await body("website")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_website"))
    .isURL()
    .withMessage(res.__("front.user.website_should_be_a_valid_url"))
    .matches(WEBSITE_REGEX)
    .withMessage(res.__("front.user.website_should_be_a_valid_url"))
    .run(req);
  // await body("languages")
  //   .trim()
  //   .not()
  //   .isEmpty()
  //   .withMessage(res.__("front.user.please_enter_language"))
  //   .run(req);

  user.editVerifiedSeller(req, res, next);
});

/** Routing is used to set default address **/
routes.post(API_URL + "seller_profile", (req, res, next) => {
  user.sellerProfile(req, res, next);
});

/** Routing is used to set status on favorites produts address **/
routes.post(API_URL + "favorite_products",isUserLogedInApi, (req, res, next) => {
  user.favoriteProductsStatus(req, res, next);
});

/** Routing is used to set add products to user's cart **/
routes.post(API_URL + "add_to_cart",isUserLogedInApi, (req, res, next) => {
  const productId = req.body.product_id ? ObjectId(req.body.product_id) : "";
  const quantity = req.body.quantity ? Number(req.body.quantity) : "";
  const collection = db.collection("products");
  if (productId) {
    collection.findOne(
      {
        _id: productId,
        is_active: ACTIVE,
        is_deleted: NOT_DELETED
      },
      (error, result) => {
        if (!error && result) {
          if (Number(result.quantity) >= quantity) {
            /** Update cart if products is available in stock */
            user.addToCart(req, res, next);
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.product.product_out_of_stock"),
              result: {},
              error: {},
            });
          }
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.product.product_not_found"),
            result: {},
            error: {},
          });
        }
      }
    )
  } else {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: {},
    });
  }
});

/** Routing is used to remove products from cart **/
routes.post(API_URL + "remove_from_cart",isUserLogedInApi, (req, res, next) => {
  user.deleteFromCart(req, res, next);
});

/** Routing is used to set get all products of user's cart **/
routes.post(API_URL + "get_cart",isUserLogedInApi, (req, res, next) => {
  user.getCartProdcts(req, res, next);
});

/** Routing is used to update cart products **/
routes.post(API_URL + "update_cart",isUserLogedInApi, (req, res, next) => {
  const productId = req.body.product_id ? ObjectId(req.body.product_id) : "";
  const quantity = req.body.quantity ? Number(req.body.quantity) : "";
  const collection = db.collection("products");
  if (productId) {
    collection.findOne(
      {
        _id: productId,
        is_active: ACTIVE,
        is_deleted: NOT_DELETED
      },
      (error, result) => {
        if (!error && result) {
          if (Number(result.quantity) >= quantity) {
            /** Update cart if products is available in stock */
            user.updateCart(req, res, next);
          } else if (Number(result.quantity) == NOT) {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.product.product_out_of_stock"),
              result: {},
              error: {},
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.product.product_quantity_not_available"),
              result: {},
              error: {},
            });
          }
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.product.product_not_found"),
            result: {},
            error: {},
          });
        }
      }
    )
  } else {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: {},
    });
  }
});

/** Routing is used to get user notifications **/
routes.post(API_URL + "get_notifications",isUserLogedInApi, (req, res, next) => {
  user.getNotifications(req, res, next);
});

/** Routing is used to update user notifications **/
routes.post(API_URL + "mark_notifications_as_read",isUserLogedInApi, (req, res, next) => {
  user.markNotifications(req, res, next);
});

/** Routing is used to delete user notifications **/
routes.post(API_URL + "delete_notification",isUserLogedInApi, (req, res, next) => {
  user.deleteNotification(req, res, next);
});

/** Routing is used to update user lastseen **/
routes.post(API_URL + "upate_lastseen", (req, res, next) => {
  user.updateLastseen(req, res, next);
});

/** Routing is used to update user lastseen **/
routes.post(API_URL + "get_lastseen", (req, res, next) => {
  user.getLastseen(req, res, next);
});

/** Routing is used to update user lastseen **/
routes.post(API_URL + "user_review_count", (req, res, next) => {
  user.userReviewCount(req, res, next);
});

/** Routing is used to update user lastseen **/
routes.post(API_URL + "signup", async (req, res, next) => {
  const step = req.body.step ? Number(req.body.step) : "";
  const email = req.body.email ? req.body.email : "";
  if (step && SIGNUP_STEPS.indexOf(step) !== -1 && email) {
    /** validate step 1 */
    if (step == 1) {
      await body("first_name")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_first_name"))
        .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
        .withMessage(res.__("front.user.please_enter_first_name"))
        .matches(NAME_REGEX)
        .withMessage(res.__("front.user.first_name_should_be_valid"))
        .run(req);

      await body("last_name")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_last_name"))
        .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
        .withMessage(res.__("front.user.please_enter_last_name"))
        .matches(NAME_REGEX)
        .withMessage(res.__("front.user.last_name_should_be_valid"))
        .run(req);

      await body("email")
        .trim()
        .matches(EMAIL_REGEX)
        .withMessage(res.__("front.user.please_enter_a_valid_email_address"))
        .run(req);

      await body("password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.invalid_password_error"))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__("front.user.invalid_password_error"))
        .run(req);

      await body("confirm_password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.invalid_password_error"))
        .matches(PASSWORD_REGEX)
        .withMessage(res.__("front.user.invalid_password_error"))
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(res.__("front.user.passwords_does_not_match"));
          }
          return true;
        })
        .run(req);
    } else if (step == 2) {
      await body("date_of_birth")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_date_of_birth"))
        .run(req);

      await body("phone.countryCode")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_country_code"))
        .isLength({ min: MIN_COUNTRY_CODE_LIMIT, max: MAX_COUNTRY_CODE_LIMIT })
        .withMessage(res.__("front.user.country_code_should_be_2_to_6_characters_long"))
        .run(req);

      await body("phone.dialCode")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_dialcode"))
        .isLength({ min: MIN_DIAL_CODE_LIMIT, max: MAX_DIAL_CODE_LIMIT })
        .withMessage(res.__("front.user.dialcode_should_be_1_to_5_characters_long"))
        .run(req);

      await body("phone.e164Number")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_e164number"))
        .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
        .withMessage(res.__("front.user.e164number_should_be_6_to_16_characters_long"))
        .run(req);

      await body("phone.internationalNumber")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please enter_international_number"))
        .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
        .withMessage(res.__("front.user.international_number_should_be_6_to_16_characters_long"))
        .run(req);

      await body("phone.nationalNumber")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_national_number"))
        .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
        .withMessage(res.__("front.user.national_number_should_be_6_to_16_characters_long"))
        .run(req);

      await body("phone.number")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_number"))
        .isLength({ min: MIN_PHONE_NUMBER_LIMIT, max: MAX_PHONE_NUMBER_LIMIT })
        .withMessage(res.__("front.user.number_should_be_6_to_16_characters_long"))
        // .custom((value, { req }) => {
        //   const collection = db.collection("users");
        //   return collection.findOne({ "phone.number": value }).then((userDoc) => {
        //     if (userDoc) {
        //       return Promise.reject(res.__("front.user.phone_already_exists"));
        //     }
        //   });
        // })
        .run(req);

      await body("shippingAddress.country")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_country"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.country_should_be_2_to_25_characters_long"))
        .run(req);

      await body("shippingAddress.state")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_state"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.state_should_be_between_2_to_25_characters_long"))
        .run(req);

      await body("shippingAddress.city")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_city"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.city_should_be_between_2_to_25_characters_long"))
        .run(req);

      await body("shippingAddress.shipping_address_line_one")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_address"))
        .matches(ADDRESS_REGEX)
        .withMessage(res.__("front.user.address_should_be_valid"))
        .run(req);

      await body("shippingAddress.pincode")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_pincode"))
        .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
        .withMessage(res.__("front.user.pincode_should_be_2_to_20_characters_long"))
        .matches(ZIPCODE_REGEX)
        .withMessage(res.__('front.user.pincode_should_be_valid'))
        .run(req);
      await body("sameAddress")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.same_address_is_required"))
        .run(req);
      await body("billingAddress.billingCountry")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_country"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.billing_country_should_be_between_2_to_25_characters_long"))
        .run(req);

      await body("billingAddress.billingState")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_state"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.billing_state_should_be_between_2_to_25_characters_long"))
        .run(req);
      await body("billingAddress.billingCity")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_city"))
        // .isLength({ min: MIN_ID_LIMIT, max: MAX_ID_LIMIT })
        // .withMessage(res.__("front.user.billing_city_should_be_between_2_to_25_characters_long"))
        .run(req);
      await body("billingAddress.billing_address_line_one")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_address"))
        .matches(ADDRESS_REGEX)
        .withMessage(res.__("front.user.address_should_be_valid"))
        .run(req);

      await body("billingAddress.billingPincode")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_pincode"))
        .isLength({ min: MIN_NAME_LIMIT, max: MAX_NAME_LIMIT })
        .withMessage(res.__("front.user.billing_pincode_should_be_between_2_to_20_characters_long"))
        .matches(ZIPCODE_REGEX)
        .withMessage(res.__('front.user.pincode_should_be_valid'))
        .run(req);

    } else if (step == 3) {

      await body("id_proof_type")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_id_proof_type"))
        .run(req);

      await body("same_id_and_address")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_same_id_and_address"))
        .run(req);

      await body("address_proof_type")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("front.user.please_enter_address_proof_type"))
        .run(req);

    }

    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
    /** creating errors for files */
    if (step == 3) {
      if (req.files && req.files.id_proof_document) {
        let file = (req.files) ? req.files.id_proof_document : {};
        if (Object.keys(file).length == 0) {
          errors.push({ location: 'files', param: 'id_proof_document', msg: res.__("admin.user.id_proof_document_is_required"), value: '' })
        }
      } else {
        errors.push({ location: 'files', param: 'id_proof_document', msg: res.__("admin.user.id_proof_document_is_required"), value: '' })
      }

      if (req.files && req.files.address_proof_document) {
        let file = (req.files) ? req.files.address_proof_document : {};
        if (Object.keys(file).length == 0) {
          errors.push({ location: 'files', param: 'address_proof_document', msg: res.__("admin.user.address_proof_document_is_required"), value: '' })
        }
      } else {
        errors.push({ location: 'files', param: 'address_proof_document', msg: res.__("admin.user.address_proof_document_is_required"), value: '' })
      }
    }
    if (errors.length > 0) {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: errors,
      });
    } else {
      user.newSignup(req, res, next);
    }
  } else {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: [],
    });
  }
});
/** Routing is used to resend mail for verify email **/
// routes.get(API_URL + "resend_verify_email_signup/:validate_string", (req, res, next) => {
//   user.resendEmailForVerifyEmail(req, res, next);
// });

/** Routing is used to get step1 data */
routes.post(API_URL + "get_step1", (req, res, next) => {
  user.getStepOneData(req, res, next);
});

routes.post(API_URL + "get_signup_docs", (req, res, next) => {
  user.getSignupDocs(req, res, next);
});

routes.post(API_URL + "add_card",async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function(value){
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);
  await body("card_type")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_type"))
    .run(req);
  await body("card_holder_name")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_holder_name"))
    .run(req);
  await body("card_number")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_number"))
    .run(req);
  await body("expiration_date")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_expiration_date"))
    .run(req);
  await body("cvv")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_cvv"))
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.addCard(req, res, next);
  }
});

routes.post(API_URL + "edit_card",async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function(value){
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);
  await body("card_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_id"))
    .custom(function(value){
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_card_id")
    .run(req);
  await body("card_type")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_type"))
    .run(req);
  await body("card_holder_name")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_holder_name"))
    .run(req);
  await body("card_number")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_number"))
    .run(req);
  await body("expiration_date")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_expiration_date"))
    .run(req);
  await body("cvv")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_cvv"))
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.editCard(req, res, next);
  }
});

routes.post(API_URL + "get_cards",async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function(value){
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.getCards(req, res, next);
  }
});

routes.post(API_URL + "set_default_card",async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function (value) {
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);
  await body("card_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_card_id"))
    .custom(function (value) {
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_card_id")
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.setDefaultCard(req, res, next);
  }
});

routes.post(API_URL + "get_email_notification",async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function (value) {
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.getEmailNotificationSetting(req, res, next);
  }
});

routes.post(API_URL + "set_email_notification",async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function (value) {
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);

  await body("status")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_status"))
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.setEmailNotificationSetting(req, res, next);
  }
});

/** Routing is used to get user earnings **/
routes.post(API_URL + "get_user_earnings", async (req, res, next) => {
  await body("user_id")
    .trim()
    .not()
    .isEmpty()
    .withMessage(res.__("front.user.please_enter_user_id"))
    .custom(function (value) {
      return Boolean(ObjectId.isValid(value));
    })
    .withMessage("front.user.invalid_user_id")
    .run(req);
  const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
  if (errors.length > 0) {
    return res.send({
      status: API_STATUS_ERROR,
      message: res.__("front.user.invalid_request"),
      result: {},
      error: errors,
    });
  } else {
    user.getUserEarnings(req, res, next);
  }
});