const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");
const asyncForEachOf = require("async/forEachOf");
const async = require('async');
function User(req, res) {
  /** Function is used to user login **/
  this.login = async (req, res) => {
    let email = req.body.email ? req.body.email : "";
    let password = req.body.password ? req.body.password : "";

    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
    if (errors.length === 0 && Object.keys(errors).length == 0) {
      let collection = db.collection("users");
      collection.findOne({ email: email }, async (err, result) => {
        // document_verfication:VERIFIED
        let userDetail = result && Object.keys(result).length > NOT ? result : {};
        if (err) return next(err);

        if (Object.keys(userDetail).length == NOT) {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.login.invalid_username_password"),
            result: {},
            error: '',
          });
        }
        if (userDetail.document_verfication !== VERIFIED) {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.login.your_documents_not_verified"),
            result: {},
            error: '',
          });
        }

        /** Compare password */
        bcrypt.compare(password, result.password, async (err, isMatch) => {
          if (result && Object.keys(result).length > NOT && isMatch) {
            let response = {
              status: API_STATUS_SUCCESS,
              message: res.__("front.user.login.successfully_login") + " " + result.first_name,
              result: {},
              token: "",
              error: [],
            };

            if (result.is_active == DEACTIVE) {
              response["status"] = API_STATUS_ERROR;
              response["message"] = res.__(
                "front.user.login.account_deactivate_contact_to_admin"
              );
            } else if (result.email_verified == NOT_VERIFIED) {
              response["result"] = {
                email_validate_string: result.email_validate_string,
              };
              response["status"] = API_STATUS_ERROR;
              response["message"] = res.__(
                "front.user.login.email_not_verified"
              );
            } else if (result.phone_verified == NOT_VERIFIED) {
              response["result"] = {
                phone_validate_string: result.validate_string,
              };
              response["status"] = API_STATUS_ERROR;
              response["message"] = res.__(
                "front.user.login.phone_not_verified"
              );
            } else {
              if (Object.keys(result).length == NOT) {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.login.invalid_username_password"),
                  result: {},
                  error: [],
                });
              }
              /*** End user detail */

              let data = {
                slug: result.slug,
                user_key: result._id,
                email: result.email,
                // mobile: result.mobile,
              };
              collection.updateOne(
                {
                  _id: result._id
                },
                {
                  $set: {
                    last_login: new Date()
                  }
                },
                { upsert: true },
                (errors, resp) => {
                  if (!errors) {

                  }
                }
              )
              const fullName = result.first_name + " " + result.last_name;
              let token = generateJWT(data);
              response["token"] = token;
              response["result"] = {
                fullName: fullName,
                slug: result.slug,
                user_id: result._id,
                email: result.email,
                // mobile: result.mobile,
              };
            }
            return res.send(response);
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.login.invalid_username_password"),
              result: {},
              error: [],
            });
          }
        });
      });
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: errors,
        result: {},
        error: errors,
      });
    }
  };

  /** Function is used to user signup **/
  this.signup = async (req, res, next) => {
    let firstName = req.body.firstName ? req.body.firstName : "";
    let lastName = req.body.lastName ? req.body.lastName : "";
    let email = req.body.email ? req.body.email : "";
    let acceptTerms = req.body.acceptTerms ? req.body.acceptTerms : false;
    let billingCity = req.body.billingAddress.billingCity ? req.body.billingAddress.billingCity : "";
    let billingCountry = req.body.billingAddress.billingCountry ? req.body.billingAddress.billingCountry : "";
    let billingPincode = req.body.billingAddress.billingPincode ? req.body.billingAddress.billingPincode : "";
    let billingState = req.body.billingAddress.billingState ? req.body.billingAddress.billingState : "";
    let billingStreet = req.body.billingAddress.billingStreet ? req.body.billingAddress.billingStreet : "";
    let pincode = req.body.shippingAddress.pincode ? req.body.shippingAddress.pincode : "";
    let country = req.body.shippingAddress.country ? req.body.shippingAddress.country : "";
    let city = req.body.shippingAddress.city ? req.body.shippingAddress.city : "";
    let state = req.body.shippingAddress.state ? req.body.shippingAddress.state : "";
    let street = req.body.shippingAddress.street ? req.body.shippingAddress.street : "";
    let countryCode = req.body.phone.countryCode ? req.body.phone.countryCode : "";
    let dialCode = req.body.phone.dialCode ? req.body.phone.dialCode : "";
    let e164Number = req.body.phone.e164Number ? req.body.phone.e164Number : "";
    let internationalNumber = req.body.phone.internationalNumber ? req.body.phone.internationalNumber : "";
    let nationalNumber = req.body.phone.nationalNumber ? req.body.phone.nationalNumber : "";
    let number = req.body.phone.number ? req.body.phone.number : "";
    let sameAddress = req.body.sameAddress ? req.body.sameAddress : "";
    let password = req.body.password ? req.body.password : "";
    let confirmPass = req.body.confirmPass ? req.body.confirmPass : "";
    let encryptPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
    let fullName = firstName + " " + lastName;
    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
    if (errors.length === 0 && Object.keys(errors).length == NOT) {
      /** Slug options */
      let slugOptions = {
        table_name: "users",
        title: firstName + " " + lastName,
        slug_field: "full_name",
      };

      /** get slug form database */
      getDatabaseSlug(slugOptions)
        .then((responseSlug) => {
          let slug = responseSlug.title ? responseSlug.title : "";

          /** get string */
          getRandomString(VALIDATE_STRING_ROUND)
            .then((responseString) => {
              let validateString = responseString.result ? responseString.result : "";

              let insertData = {
                first_name: firstName,/** DONE */
                last_name: lastName,/** DONE */
                full_name: fullName,/** DONE */
                billingAddress: [{ /** DONE */
                  id: ObjectId(),
                  status: true,
                  billingCountry: ObjectId(billingCountry),
                  billingState: ObjectId(billingState),
                  billingCity: ObjectId(billingCity),
                  billingStreet: billingStreet,
                  billingPincode: billingPincode,
                }],
                shippingAddress: [{/** DONE */
                  id: ObjectId(),
                  status: true,
                  country: ObjectId(country),
                  state: ObjectId(state),
                  city: ObjectId(city),
                  street: street,
                  pincode: pincode,
                }],
                slug: slug,/** DONE */
                email: email,/** DONE */
                phone: {/** DONE */
                  countryCode: countryCode,
                  dialCode: dialCode,
                  e164Number: e164Number,
                  internationalNumber: internationalNumber,
                  nationalNumber: nationalNumber,
                  number: number,
                },
                sameAddress: sameAddress,/** DONE */
                password: encryptPassword,/** DONE */
                email_verified: NOT_VERIFIED,/** DONE */
                phone_verified: NOT_VERIFIED,/** DONE */
                user_type: USER_BUYER,/** DONE */
                otp: Number(1234),/** DONE */
                is_notification_on: ACTIVE,/** DONE */
                is_active: ACTIVE,/** DONE */
                is_approved: DEACTIVE,/** DONE */
                is_profile_step: DEACTIVE,/** DONE */
                is_profile_updated: DEACTIVE,/** DONE */
                role_id: ROLE_ID_USER,/** DONE */
                is_deleted: NOT_DELETED,/** DONE */
                last_seen: getUtcDate(),/** DONE */
                created: getUtcDate(),/** DONE */
                check_otp_expire: getUtcDate(),/** DONE */
                // otp_expired: new Date(Date.now() + 3600 * 1000 * 24),
                check_link_expire: getUtcDate(),/** DONE */
                phone_validate_string: validateString,/** DONE */
                email_link_expired: new Date(Date.now() + 3600 * 1000 * 24),/** DONE */
                acceptTerms: acceptTerms ? acceptTerms : false,/** DONE */
                email_validate_string: validateString,/** DONE */
                escrow_account: ACCOUNT_NOT_CREATED,
              };
              signupUser(req, res, insertData);
            })
            .catch(next);
        })
        .catch(next);
    } else {
      res.send({
        status: API_STATUS_ERROR,
        error: errors,
        result: "",
        message: "",
      });
    }
  };

  /** Function is used to signup user */
  signupUser = async (req, res, insertData) => {
    const users = db.collection("users");
    users.insertOne(insertData, async (error, result) => {
      if (error) return next();
      let email = insertData.email;
      let fullName = insertData.first_name + " " + insertData.last_name;
      let verificationLink = WEBSITE_API_URL + "email_verification/" + insertData.email_validate_string;
      let action = "registration";
      let subject = "Thanks For Registration! Verify Your Account.";
      let emailOptions = {
        to: email,
        rep_array: [fullName, verificationLink, verificationLink],
        action: action,
        subject: subject,
      };
      /** Send Email */
      sendEmail(req, res, emailOptions);
      /*** return success */
      return res.send({
        status: API_STATUS_SUCCESS,
        message: res.__(
          "front.user.you_have_successfully_registered_on_asic_mango_please_check_email_for_verification"
        ),
        result: { validate_string: insertData.email_validate_string, phone_validate_string: insertData.phone_validate_string },
        error: {},
      });
    });
  }; // End signupUser

  /** Function is used to verify mobile **/
  this.verifyOtp = async (req, res, next) => {
    const endDate = new Date();
    let validateOtp = req.body.validate_otp ? req.body.validate_otp : "";
    let validateString = req.body.validate_string
      ? req.body.validate_string
      : "";

    /*** Invalid request */
    if (!validateOtp || !validateString) {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });
    }



    /** search condition */
    let conditionSearch = {
      phone_validate_string: validateString
    };
    // conditionSearch[""] = validateString;

    /** update condition */
    let conditionUpdate = {};
    conditionUpdate["otp"] = null;
    // conditionUpdate["phone_validate_string"] = null;

    var collection = db.collection("users");

    const differenceInTime = function () {
      return new Promise((resolve, reject) => {
        collection.findOne(
          conditionSearch,
          { projection: { check_otp_expire: 1 } },
          (err, result) => {

            if (!err) {
              if (result !== null) {
                const startDate = result.check_otp_expire;
                const diff = getDifferenceBetweenTwoDates(startDate, endDate);

                let response = {
                  result: diff,
                };
                return resolve(response);
              } else {
                let response = {
                  result: null,
                };
                return resolve(response);
              }
            }
          }
        );
      });
    };
    const time = await differenceInTime();


    if (time.result > ONE_DAY_IN_SECONDS) {

      // return res.redirect(
      //   WEBSITE_FRONT_URL +
      //     "otp-verification?status=error&&message=otp_expired"
      // );
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.otp_is_expired."),
        result: {},
        error: [],
      });
    } else {
      conditionSearch['otp'] = Number(validateOtp);
      collection = db.collection("users");
      collection.findOneAndUpdate(
        conditionSearch,
        { $set: conditionUpdate },
        { projection: { first_name: 1, last_name: 1, email: 1, otp: 1, _id: 1 } },
        (err, result) => {
          if (!err && result && result.lastErrorObject.updatedExisting == true) {
            /*** return success */
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__("front.user.otp_has_been_verified"),
              result: conditionSearch.phone_validate_string,
              error: [],
            });
          } else {
            /*** return error */
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.otp_is_invalid"),
              result: {},
              error: [],
            });
          }
        })
    }
  };

  /** Function is used to resend otp **/
  this.resendOtp = async (req, res, next) => {
    let validateString = req.body.validate_string ? req.body.validate_string : "";

    /** Invalid Request */
    if (!validateString)
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });

    /*** Generate OTP */
    // let mobileValidateOTP = generateOTP(OTP_NUMBER_ROUND);
    let mobileValidateOTP = 1234;
    /** search condition */
    let conditionSearch = {

    };
    conditionSearch["phone_validate_string"] = validateString;

    /** update condition */
    let conditionUpdate = {};
    conditionUpdate["otp"] = Number(mobileValidateOTP);
    conditionUpdate["check_otp_expire"] = new Date();
    let collection = db.collection("users");
    collection.findOneAndUpdate(
      conditionSearch,
      { $set: conditionUpdate },
      { projection: { first_name: 1, last_name: 1, email: 1 } },
      async (err, result) => {
        if (!err && result && result.lastErrorObject.updatedExisting == true) {
          /*** return success */
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.otp_has_been_sent_on_your_registered_mobile_for_verification"
            ),
            result: { validate_string: validateString },
            error: [],
          });
        } else {
          /*** return error */
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: [],
          });
        }
      }
    );
  };

  /** Function is used to resend email **/
  this.resendEmail = async (req, res, next) => {
    let string = req.params.validate_string ? req.params.validate_string : "";

    let type = req.body.type ? req.body.type : NOT;

    /** Invalid Request */
    if (!string)
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });

    /*** Get random string */
    await getRandomString(VALIDATE_STRING_ROUND)
      .then((responseString) => {
        let validateString = responseString.result ? responseString.result : "";

        /** search condition */
        let conditionSearch = { is_deleted: NOT_DELETED };
        if (type == "signup") {
          conditionSearch["email_validate_string"] = string;
        }
        if (type == "password") {
          conditionSearch["validate_string"] = string;
        }

        /** update condition */
        let conditionUpdate = {};
        if (type == "signup") {
          conditionUpdate["email_validate_string"] = validateString;
          conditionUpdate["check_link_expire"] = new Date();
        }
        if (type == "password") {
          conditionUpdate["validate_string"] = validateString;
          conditionUpdate["link_expired"] = new Date();
        }

        let collection = db.collection("users");
        collection.findOneAndUpdate(
          conditionSearch,
          { $set: conditionUpdate },
          { projection: { first_name: 1, last_name: 1, email: 1 } },
          (err, result) => {
            if (
              !err &&
              result &&
              result.lastErrorObject.updatedExisting == true
            ) {
              let emailAction =
                type == "signup" ? "email_verification" : "user/reset-password";
              let validateURL = "";
              if (type == "signup") validateURL = WEBSITE_API_URL + emailAction + "/" + validateString;

              if (type == "password") validateURL = WEBSITE_FRONT_URL + emailAction + "?validate_string=" + validateString;


              /***Send mail */
              let fullName =
                result.value.first_name + " " + result.value.last_name;
              let emailOptions = {
                action: type == "signup" ? "registration" : "forgot_password",
                to: result.value.email,
                rep_array: [fullName, validateURL, validateURL],
              };
              sendEmail(req, res, emailOptions);

              /*** return success */
              return res.send({
                status: API_STATUS_SUCCESS,
                message: res.__(
                  "front.user.link_has_been_sent_on_your_registered_email"
                ),
                result: { validateString: validateString },
                error: [],
              });
            } else {
              /*** return error */
              return res.send({
                status: API_STATUS_ERROR,
                message: res.__(
                  "front.user.email_does_not_exists_in_our_database"
                ),
                result: {},
                error: [],
              });
            }
          }
        );
      })
      .catch(next);
  };

  /** Function is used to verify email **/
  this.phoneVerification = async (req, res, next) => {
    try {
      // const endDate = new Date().toLocaleDateString();
      const endDate = new Date();

      let validateString = req.body.validate_string ? req.body.validate_string : "";
      let validateOtp = req.body.validate_otp ? Number(req.body.validate_otp) : "";
      /*** Invalid request */
      if (
        !validateString
        || !validateOtp
      ) {
        return res.send(
          {
            status: API_STATUS_ERROR,
            message: res.__(
              "front.user.invalid_request"
            ),
            result: {},
            error: [],
          }
        );
      }
      /** search condition */
      let searchCondition = {};
      searchCondition["phone_varify_string"] = validateString;
      searchCondition["otp"] = validateOtp;

      /** update condition */
      let conditionUpdate = {};
      conditionUpdate["phone_varify_string"] = null;
      conditionUpdate["phone_verified"] = VERIFIED;
      conditionUpdate["otp"] = null;

      let collection = db.collection("users");

      const differenceInTime = function () {
        return new Promise((resolve, reject) => {
          collection.findOne(
            searchCondition,
            { projection: { otp_expire_time: 1 } },
            (err, result) => {

              if (!err) {
                if (result !== null) {
                  const startDate = result.otp_expire_time;
                  const diff = getDifferenceBetweenTwoDates(startDate, endDate);

                  let response = {
                    result: diff,
                  };
                  return resolve(response);
                } else {
                  let response = {
                    result: null,
                  };
                  return resolve(response);
                }
              }
            }
          );
        });
      };
      const time = await differenceInTime();

      if (time.result > ONE_DAY_IN_SECONDS) {
        return res.send(
          {
            status: API_STATUS_ERROR,
            message: res.__(
              "front.user.otp_expire"
            ),
            result: {},
            error: [],
          }
        );
      } else {
        collection = db.collection("users");
        collection.findOneAndUpdate(
          searchCondition,
          { $set: conditionUpdate },
          {
            projection: {
              first_name: 1,
              phone: 1,
              last_name: 1,
              phone_otp_expired: 1,
              email: 1
            },
          },
          (err, result) => {

            if (
              !err &&
              result &&
              result.lastErrorObject.updatedExisting == true
            ) {
              return res.send(
                {
                  status: API_STATUS_SUCCESS,
                  message: res.__(
                    "front.user.mobile_verified_success"
                  ),
                  result: { step: 3, email: result.value.email },
                  error: [],
                }
              );
            } else {
              return res.send(
                {
                  status: API_STATUS_ERROR,
                  message: res.__(
                    "front.user.otp_not_match"
                  ),
                  result: {},
                  error: [],
                }
              );
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  /** Function is used to verify email **/
  this.emailVerification = async (req, res, next) => {
    try {
      // const endDate = new Date().toLocaleDateString();
      const endDate = new Date();

      let validateString = req.params.validate_string
        ? req.params.validate_string
        : "";

      /*** Invalid request */
      if (
        !validateString
        //  || !userRole
      ) {
        return res.redirect(
          WEBSITE_FRONT_URL +
          "email-verification?status=error&&message=invalid_request"
        );
      }
      let userEmail = "";
      let searchCondition = {};
      searchCondition["email_verify_string"] = validateString;

      /** search condition */
      let conditionSearch = {};
      conditionSearch["email_verify_string"] = validateString;

      /** update condition */
      let conditionUpdate = {};
      conditionUpdate["email_verify_string"] = null;
      conditionUpdate["email_verified"] = VERIFIED;

      let collection = db.collection("users");

      const differenceInTime = function () {
        return new Promise((resolve, reject) => {
          collection.findOne(
            searchCondition,
            { projection: { email_verify_time: 1, email: 1 } },
            (err, result) => {
              if (result == null) {
                return res.redirect(WEBSITE_FRONT_URL);
              }
              if (!err && result) {
                userEmail = result.email ? result.email : "";
                if (result !== null) {
                  const startDate = result.email_verify_time;
                  const diff = getDifferenceBetweenTwoDates(startDate, endDate);
                  let response = {
                    result: diff,
                  };
                  return resolve(response);
                } else {
                  let response = {
                    result: null,
                  };
                  return resolve(response);
                }
              }
            }
          );
        });
      };




      const time = await differenceInTime();

      if (time.result > ONE_DAY_IN_SECONDS) {

        return res.redirect(
          WEBSITE_FRONT_URL +
          "email-verification?validate_string=" + validateString + "&&status=error&&message=link_expired"
        );
      } else {
        collection = db.collection("users");
        collection.findOneAndUpdate(
          conditionSearch,
          { $set: conditionUpdate },
          {
            projection: {
              first_name: 1,
              email: 1,
              last_name: 1,
              email_link_expired: 1,
              phone_validate_string: 1
            },
          },
          (err, response) => {
            if (
              !err &&
              response &&
              response.lastErrorObject.updatedExisting == true
            ) {
              // return res.redirect(
              //   WEBSITE_FRONT_URL +
              //     "phone-verification?status=success&&message=email_verified&phone_validate_string="+response.value.phone_validate_string+""
              // );
              return res.redirect(
                WEBSITE_FRONT_URL +
                "signup?step=2&&message=email_verified&&email=" + userEmail
              );
            } else {
              // return res.redirect(
              //   WEBSITE_FRONT_URL +
              //     "email-verification?status=error&&message=already_verified"
              // );
              return res.redirect(
                WEBSITE_FRONT_URL +
                "email-verification?status=error&&message=already_verified"
              );
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  /** Function is used to verify email **/
  this.newEmailVerification = async (req, res, next) => {
    try {
      const endDate = new Date();

      let validateString = req.params.validate_string
        ? req.params.validate_string
        : "";

      /*** Invalid request */
      if (!validateString) {
        return res.redirect(
          WEBSITE_FRONT_URL +
          "email-verification?status=error&&message=invalid-request"
        );
      }

      let searchCondition = {};
      searchCondition["email_validate_string"] = validateString;
      /** search condition */
      let conditionSearch = {};
      conditionSearch["email_validate_string"] = validateString;

      /** update condition */
      let conditionUpdate = {};
      conditionUpdate["email_validate_string"] = null;
      conditionUpdate["email_verified"] = VERIFIED;

      let collection = db.collection("users");

      const differenceInTime = function () {
        return new Promise((resolve, reject) => {
          collection.findOne(
            searchCondition,
            { projection: { check_link_expire: 1 } },
            (err, result) => {

              if (!err) {
                if (result !== null) {
                  const startDate = result.check_link_expire;
                  const diff = getDifferenceBetweenTwoDates(startDate, endDate);

                  let response = {
                    result: diff,
                  };
                  return resolve(response);
                } else {
                  let response = {
                    result: null,
                  };
                  return resolve(response);
                }
              }
            }
          );
        });
      };
      const time = await differenceInTime();

      if (time.result > ONE_DAY_IN_SECONDS) {

        return res.redirect(
          WEBSITE_FRONT_URL +
          "email-verification?status=error&&message=link_expired"
        );
      } else {
        collection = db.collection("users");
        collection.findOneAndUpdate(
          conditionSearch,
          { $set: conditionUpdate },
          { projection: { first_name: 1, last_name: 1, email: 1 } },
          (err, result) => {
            if (!err && result && result.lastErrorObject.updatedExisting == true) {
              conditionUpdate["email"] = result.new_email;
              collection.findOneAndUpdate(
                conditionSearch,
                { $set: conditionUpdate },
                (err, result) => { }
              );
              return res.redirect(
                WEBSITE_FRONT_URL +
                "email-verification?status=success&&message=email_verified"
              );
            } else {
              return res.redirect(
                WEBSITE_FRONT_URL +
                "email-verification?status=error&&message=already_verified"
              );
            }
          }
        );
      };
    } catch (err) {
      console.log(err);
    }
  }

  /** Function is used to send otp or email to reset password **/
  // this.forgotPassword = async (req, res, next) => {
  //   let email = req.body.email ? req.body.email : "";
  //   let authType = req.body.type ? req.body.type : "";

  //     const errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));

  //     /** Check errors */
  //     if (Object.keys(errors).length == NOT) {
  //       /*** Get random string */
  //       // let responseString = generateOTP(OTP_NUMBER_ROUND);
  //       let responseString = 1234;
  //       let validateOtp = responseString ? responseString : null;

  //       await getRandomString(VALIDATE_STRING_ROUND)
  //         .then((responseString) => {
  //           let validateString = responseString.result
  //             ? responseString.result
  //             : "";

  //           /** search condition */
  //           let searchCondition = { is_deleted: NOT_DELETED };
  //           searchCondition["email"] = { $regex: new RegExp("^" + email, "i") };
  //           searchCondition["email_verified"] = 1;
  //           /** update condition */
  //           let conditionUpdate = {};
  //           conditionUpdate["validate_string"] = validateString;
  //           conditionUpdate["otp"] = Number(validateOtp);
  //           conditionUpdate["check_otp_expire"] = new Date();

  //           let collection = db.collection("users");
  //           collection.findOneAndUpdate(
  //             searchCondition,
  //             { $set: conditionUpdate },
  //             {
  //               projection: {
  //                 first_name: 1,
  //                 last_name: 1,
  //                 email: 1,
  //                 email_verified: 1,
  //               },
  //             },
  //             (err, result) => {

  //               if (
  //                 !err &&
  //                 result &&
  //                 result.lastErrorObject.updatedExisting == true
  //               ) {
  //                 /*** Send an email */
  //                 let validateURL =
  //                   WEBSITE_FRONT_URL +
  //                   "user/reset-password/?validate_string=" +
  //                   validateString;

  //                 let full_name =
  //                   result.value.first_name + " " + result.value.last_name;
  //                 let emailOptions = {
  //                   action: "forgot_password",
  //                   to: result.value.email,
  //                   rep_array: [full_name, validateURL, validateOtp],
  //                 };
  //                 sendEmail(req, res, emailOptions);

  //                 /*** return success */
  //                 return res.send({
  //                   status: API_STATUS_SUCCESS,
  //                   message: res.__(
  //                     "front.user.otp_is_been_sent_on_your_email_if_registered"
  //                   ),
  //                   result: { validate_string: validateString },
  //                   error: [],
  //                 });
  //               } else {
  //                 /*** return error */
  //                 return res.send({
  //                   status: API_STATUS_ERROR,
  //                   message: res.__(
  //                     "front.user.email_does_not_exists_in_our_database"
  //                   ),
  //                   result: {},
  //                   error: [],
  //                 });
  //               }
  //             }
  //           );
  //         })
  //         .catch((err) => console.log(err));
  //     } else {
  //       /*** return error */
  //       return res.send({
  //         status: API_STATUS_ERROR,
  //         message: "",
  //         result: {},
  //         error: errors,
  //       });
  //     }


  // };


  /** Function is used to reset password by email **/
  this.forgotPassword = async (req, res, next) => {
    const forgotBy = req.body.type ? req.body.type : "";
    if (forgotBy) {
      if (forgotBy == "email") {
        const email = req.body.email ? req.body.email : "";
        if (!email) {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.invalid_request"),
            result: {},
            error: [],
          });
        }
        let searchCondition = {
          email: email
        };
        let users = db.collection("users");
        users.findOne(searchCondition, async (error, result) => {
          if (!error && result) {
            /*** return result */
            let validateString = await getRandomString(VALIDATE_STRING_ROUND);
            let updateData = {
              forgot_password_link_expired: new Date(),
              validate_string: validateString.result
            }
            if (result.email_verified == 1) {
              users.findOneAndUpdate(searchCondition, { $set: updateData }, { new: true }, (err, response) => {
                if (!error) {
                  let fullName = result.full_name ? result.full_name : '';
                  let verificationLink =
                    WEBSITE_API_URL +
                    "forgot_password_email/" +
                    updateData.validate_string;
                  let action = "forgot_password";
                  let emailOptions = {
                    to: email,
                    rep_array: [fullName, verificationLink, verificationLink],
                    action: action,
                    subject: FORGOT_PASSWORD_MAIL_SUBJECT,
                  };
                  /** Send Email */
                  sendEmail(req, res, emailOptions);
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__("front.user.password_reset_link_has_been_sent_on_your_email_if_registered"),
                    result: updateData.validate_string,
                    error: [],
                  });
                } else {
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                    error: [],
                  });
                }
              });

            } else {
              return res.send({
                status: API_STATUS_ERROR,
                message: res.__(
                  "front.user.email_not_verified"
                ),
                result: {},
                error: [],
              });
            }

          } else {
            /*** return error */
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__(
                "front.user.email_does_not_exists_in_our_database"
              ),
              result: {},
              error: [],
            });
          }
        })


        //sendVerficationLink(req, res, next);
      } else if (forgotBy == "phone") {
        this.forgotPasswordByPhone(req, res, next);
      }
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });
    }

  }
  this.forgotPasswordByPhone = (req, res, next) => {
    const phone = req.body.phone ? req.body.phone : "";

    let searchCondition = {
      "phone.number": phone
    };
    let users = db.collection("users");
    users.findOne(searchCondition, async (error, result) => {
      if (!error && result) {
        /*** return result */
        // let newOtp = generateOTP(OTP_NUMBER_ROUND);
        let newOtp = 1234;
        let validateString = await getRandomString(VALIDATE_STRING_ROUND);
        let updateData = {
          check_otp_expire: new Date(),
          phone_validate_string: validateString.result,
          otp: Number(newOtp)
        }
        if (result.phone_verified == 1) {
          users.findOneAndUpdate(searchCondition, { $set: updateData }, { new: true }, (err, response) => {
            if (!error) {
              let fullName = result.full_name ? result.full_name : '';
              let message = "Hi " + fullName + "! you can reset your password using this OTP." + updateData.otp;
              return res.send({
                status: API_STATUS_SUCCESS,
                message: res.__("front.user.password_reset_otp_has_been_sent_on_your_phone_if_registered"),
                result: updateData.phone_validate_string,
                error: [],
              });
            } else {
              return res.send({
                status: API_STATUS_ERROR,
                message: res.__("front.user.something_went_wrong"),
                result: {},
                error: [],
              });
            }
          });

        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__(
              "front.user.phone_not_verified"
            ),
            result: {},
            error: [],
          });
        }

      } else {
        /*** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__(
            "front.user.phone_does_not_exists_in_our_database"
          ),
          result: {},
          error: [],
        });
      }
    })
  }
  /** This function used to verify forgot password email link expiration*/
  this.forgotPasswordEmail = async (req, res, next) => {
    try {
      const endDate = new Date();

      let validateString = req.params.validate_string
        ? req.params.validate_string
        : "";

      /*** Invalid request */
      // if (
      //   !validateString
      //   //  || !userRole
      // ) {
      //   return res.redirect(
      //     WEBSITE_FRONT_URL +
      //       "email-verification?status=error&&message=invalid_request"
      //   );
      // }

      let searchCondition = {};
      searchCondition["validate_string"] = validateString;

      /** search condition */
      let conditionSearch = {};
      conditionSearch["validate_string"] = validateString;

      /** update condition */
      let conditionUpdate = {};
      conditionUpdate["validate_string"] = validateString;

      let collection = db.collection("users");

      const differenceInTime = function () {
        return new Promise((resolve, reject) => {
          collection.findOne(
            searchCondition,
            { projection: { forgot_password_link_expired: 1 } },
            (err, result) => {

              if (!err) {
                if (result !== null) {
                  const startDate = result.forgot_password_link_expired;
                  const diff = getDifferenceBetweenTwoDates(startDate, endDate);

                  let response = {
                    result: diff,
                  };
                  return resolve(response);
                } else {
                  let response = {
                    result: null,
                  };
                  return resolve(response);
                }
              }
            }
          );
        });
      };




      const time = await differenceInTime();

      if (time.result > ONE_DAY_IN_SECONDS) {

        return res.redirect(
          WEBSITE_FRONT_URL +
          "email-verification?status=error&&message=link_expired&&forgot_password_email=false"
        );
      } else {
        collection = db.collection("users");
        collection.findOneAndUpdate(
          conditionSearch,
          { $set: conditionUpdate },
          {
            projection: {
              first_name: 1,
              email: 1,
              last_name: 1,
              email_link_expired: 1,
              validate_string: 1
            },
          },
          (err, response) => {

            if (
              !err &&
              response &&
              response.lastErrorObject.updatedExisting == true
            ) {
              return res.redirect(
                WEBSITE_FRONT_URL +
                "?forgot_password_email=true&validate_string=" + response.value.validate_string + ""
              );
            } else {
              // return res.redirect(
              //   WEBSITE_FRONT_URL +
              //     "email-verification?status=error&&message=already_verified"
              // );
              return res.redirect(
                WEBSITE_FRONT_URL +
                "?forgot_password_email=true&validate_string=" + response.value.validate_string + ""
              );
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  }/** End forgotPasswordEmail */

  /** This function is used to resend verification link on email for forgot password  */
  this.resendEmailForgotPassword = (req, res, next) => {
    const validateString = req.body.validate_string ? req.body.validate_string : "";
    if (validateString) {
      let searchCondition = {
        validate_string: validateString
      }
      let users = db.collection("users");
      users.findOne(searchCondition, async (error, result) => {
        if (!error && result) {
          const newValidateString = (await getRandomString(VALIDATE_STRING_ROUND)).result;
          let updateData = {
            forgot_password_link_expired: new Date(),
            validate_string: newValidateString
          }
          if (result.email_verified == 1) {
            users.findOneAndUpdate(searchCondition, { $set: updateData }, { new: true }, (err, response) => {
              if (!error) {
                let fullName = result.full_name ? result.full_name : '';
                let userEmail = result.email ? result.email : '';
                let verificationLink =
                  WEBSITE_API_URL +
                  "forgot_password_email/" + newValidateString;
                let action = "forgot_password";
                let emailOptions = {
                  to: userEmail,
                  rep_array: [fullName, verificationLink, verificationLink],
                  action: action,
                  subject: FORGOT_PASSWORD_MAIL_SUBJECT,
                };
                /** Send Email */
                sendEmail(req, res, emailOptions);
                return res.send({
                  status: API_STATUS_SUCCESS,
                  message: res.__("front.user.password_reset_link_has_been_sent_on_your_email_if_registered"),
                  result: { validateString: newValidateString },
                  error: [],
                });
              } else {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: {},
                  error: [],
                });
              }
            });

          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__(
                "front.user.email_not_verified"
              ),
              result: {},
              error: [],
            });
          }

        } else {
          /*** return error */
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__(
              "front.user.email_does_not_exists_in_our_database"
            ),
            result: {},
            error: [],
          });
        }
      })
    }
  }



  /** Function is used to reset password **/
  this.resetPassword = async (req, res, next) => {
    let validateString = req.body.validate_string
      ? req.body.validate_string
      : "";
    let phoneValidateString = req.body.phone_validate_string
      ? req.body.phone_validate_string
      : "";
    let password = req.body.password ? req.body.password : "";
    let confirmPassword = req.body.confirmPassword
      ? req.body.confirm_password
      : "";

    if (!validateString && !phoneValidateString) {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });
    }

    let encryptPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));

    if (errors.length === 0 && Object.keys(errors).length == 0) {
      /** search condition */
      let conditionSearch = {
        is_deleted: NOT_DELETED
        // is_active: ACTIVE
      };

      /** update condition */
      let conditionUpdate = { password: encryptPassword };

      if (validateString) {
        conditionUpdate["validate_string"] = null;
        conditionSearch["validate_string"] = validateString;
      } else if (phoneValidateString) {
        conditionUpdate["phone_validate_string"] = null;
        conditionSearch["phone_validate_string"] = phoneValidateString;
      }
      let collection = db.collection("users");
      collection.updateOne(
        conditionSearch,
        { $set: conditionUpdate },
        (err, result) => {

          if (!err && result && result.modifiedCount > NOT) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.password_reset_successfully"
              ),
              result: {},
              error: [],
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__(
                "admin.front.something_went_wrong_please_try_again_later"
              ),
              result: {},
              error: [],
            });
          }
        }
      );
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: "",
        result: {},
        error: errors,
      });
    }
  };

  /** Routing is used to get user data **/
  this.getUserDetail = async (req, res, next) => {

    let languageId = req.body.language_id ? req.body.language_id : "";
    let userId = req.body.user_id ? req.body.user_id : "";
    let slug = req.body.slug ? req.body.slug : "";

    /*** Set option to get user detail */
    let options = {
      conditions: {
        is_deleted: NOT_DELETED,
        is_active: ACTIVE,
        slug: slug,
        _id: ObjectId(userId),
      },
      fields: {
        cityDetail: 0,
        countryDetail: 0,
        password: 0,
        otp: 0,
        is_active: 0,
        is_deleted: 0,
        email_link_expired: 0,
        phone_validate_string: 0,
        email_validate_string: 0,
      },
    };

    /*** Get user detail */
    const collection = db.collection("users");
    collection
      .aggregate([
        { $match: options.conditions },
        {
          $lookup: {
            from: "masters",
            let: { countryId: "$country_name" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$countryId"] }],
                  },
                },
              },
            ],
            as: "countryDetail",
          },
        },
        {
          $lookup: {
            from: "masters",
            let: { city_name: "$city_name" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$city_name"] }],
                  },
                },
              },
            ],
            as: "cityDetail",
          },
        },
        {
          $lookup: {
            from: "masters",
            let: { nationality: "$nationality" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$nationality"] }],
                  },
                },
              },
            ],
            as: "nationalityDetail",
          },
        },
        {
          $addFields: {
            full_image_path: USERS_URL,
            country: { $arrayElemAt: ["$countryDetail.text", 0] },
            city: { $arrayElemAt: ["$cityDetail.text", 0] },
            nationality_name: { $arrayElemAt: ["$nationalityDetail.text", 0] },
          },
        },
        { $project: options.fields },
      ])
      .toArray((err, result) => {
        if (err) return next();

        /** return success */
        return res.send({
          status: API_STATUS_SUCCESS,
          message: "",
          result: result && result.length > NOT ? result[0] : {},
          error: {},
        });
      });
  };


  this.getUserInfo = (req, res, next) => {
    let userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    let slug = req.body.slug ? req.body.slug : "";

    if (userId && slug) {
      const users = db.collection('users');
      users.aggregate([
        {
          $match: {
            _id: userId,
            slug: slug
          },
        },
        {
          $lookup: {
            from: 'users',
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', userId] }],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  shippingAddress: { "$arrayElemAt": [{ $filter: { input: "$shippingAddress", as: "item", cond: { $eq: ["$$item.status", true] } } }, 0] }
                }
              },
            ],
            as: 'addressDetail',
          },
        },
        {
          $lookup: {
            from: "masters",
            let: { countryId: { "$arrayElemAt": ["$addressDetail.shippingAddress.country", 0] } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$countryId"] }],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1
                }
              }
            ],
            as: "countryDetail",
          },
        },
        {
          $lookup: {
            from: "masters",
            let: { stateId: { "$arrayElemAt": ["$addressDetail.shippingAddress.state", 0] } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$stateId"] }],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1
                }
              }
            ],
            as: "stateDetail",
          },
        },
        {
          $project: {
            full_name: 1,
            address: {
              _id: { "$arrayElemAt": ["$shippingAddress.id", 0] },
              country: { "$arrayElemAt": ["$countryDetail", 0] },
              state: { "$arrayElemAt": ["$stateDetail", 0] },
              city: { "$arrayElemAt": ["$addressDetail.shippingAddress.city", 0] },
              shipping_address_line_one: { "$arrayElemAt": ["$addressDetail.shippingAddress.shipping_address_line_one", 0] },
              shipping_address_line_two: { "$arrayElemAt": ["$addressDetail.shippingAddress.shipping_address_line_two", 0] },
              pincode: { "$arrayElemAt": ["$addressDetail.shippingAddress.pincode", 0] },
            },
            email: 1
          }
        }
      ]).toArray((error, result) => {
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: "",
            result: result,
            error: {},
          });
        }
      });
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }

  /** Function is used to get business Id **/
  this.getBusinessType = async (req, res) => {
    let collection = db.collection("masters");
    collection.find({ key: 'business_type', is_active: ACTIVE }, { projection: { name: 1 } }).sort({ 'name': 1 }).toArray(async (err, result) => {
      if (!err && result) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_business_type_list_successfully"),
          result: result,
          error: [],
        });
      } else {
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        })
      }
    })
  }

  /** Function is used to update user profile **/
  this.getProfileSetup = async (req, res, next) => {
    let userId = req.params.user_id ? req.params.user_id : "";

    let collection = db.collection("users");
    collection.aggregate([
      {
        $match: { _id: ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'masters',
          let: { countryId: { '$arrayElemAt': ['$shippingAddress.country', 0] } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$countryId'] }],
                },
              },
            },
            { $project: { _id: 1, name: 1 } },
          ],
          as: 'countryDetail',
        },
      },

    ]).toArray(async (err, result) => {
      if (err || !result) {
        if (err) {
          return next(err);
        }
        else if (!result) {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.no_user_found_with_this_id"),
            result: {},
            error: [],
          });
        }
      }
      else {
        if(result && result.length > 0){
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.profile_has_been_found_successfully"
            ),
            result: {
              first_name: result[0].first_name,
              last_name: result[0].last_name,
              email: result[0].email,
              phone: result[0].phone,
              billingAddress: result[0].billingAddress,
              shippingAddress: result[0].shippingAddress,
              user_type: result[0].user_type ? result[0].user_type : "",
              company_name: result[0].company_name ? result[0].company_name : "",
              companyAddress: result[0].companyAddress ? result[0].companyAddress : "",
              business_id: result[0].business_id ? result[0].business_id : "",
              business_type: result[0].business_type ? result[0].business_type : "",
              tax_id: result[0].tax_id ? result[0].tax_id : "",
              website: result[0].website ? result[0].website : "",
              url: result[0].image ? USER_FILE_URL + result[0].image : '',
              is_requested: result[0].is_requested ? result[0].is_requested : NOT,
              vendor_description: result[0].vendor_description ? result[0].vendor_description : '',
              languages: result[0].languages ? result[0].languages : [],
              social_accounts: result[0].social_accounts ? result[0].social_accounts : {},
              created: result[0].created ? result[0].created : '',
              country_details: result[0].countryDetail && result[0].countryDetail[0] ? result[0].countryDetail[0] : '',
              date_of_birth: result[0].date_of_birth,
              email_notifications: result[0].email_notifications,
            }
          })
        }else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.no_user_found_with_this_id"),
            result: {},
            error: [],
          });
        }
      }
    })

  }; // End profileSetup

  this.postProfileSetup = async (req, res, next) => {
    var userId = req.params.user_id ? req.params.user_id : "";
    var type = req.body.type ? req.body.type : '';
    var firstName = req.body.firstName ? req.body.firstName : '';
    var lastName = req.body.lastName ? req.body.lastName : '';
    var passwordChange = req.body.passwordChange ? req.body.passwordChange : '';
    var fullName = firstName + ' ' + lastName;
    var password = req.body.new_password ? req.body.new_password : "";
    var encryptPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
    var phone = req.body.phone && req.body.phone ? JSON.parse(req.body.phone) : '';
    var countryCode = phone.countryCode ? phone.countryCode : '';
    var dialCode = phone.dialCode ? phone.dialCode : '';
    var e164Number = phone.e164Number ? phone.e164Number : '';
    var internationalNumber = phone.internationalNumber ? phone.internationalNumber : '';
    var nationalNumber = phone.nationalNumber ? phone.nationalNumber : '';
    var number = phone.number ? phone.number : '';
    var languages = req.body.languages ? JSON.parse(req.body.languages) : [];
    const socialAccounts = req.body.social_accounts ? JSON.parse(req.body.social_accounts) : {};
    const vendorDescription = req.body.vendor_description ? req.body.vendor_description : '';
    const date_of_birth = req.body.date_of_birth ? new Date(req.body.date_of_birth) : '';

    /** Check invalid request*/
    if (!userId) {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });
    }

    if (type === 'personal_info') {
      /** Slug options */
      let slugOptions = {
        table_name: "users",
        title: fullName,
        slug_field: "full_name",
      };

      /** get slug form database */
      const responseSlug = await getDatabaseSlug(slugOptions)

      let slug = responseSlug.title ? responseSlug.title : "";
      var updateData = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        date_of_birth: date_of_birth,
        slug: slug,
        social_accounts: socialAccounts,
        languages: languages,
        vendor_description: vendorDescription,
        phone: {
          countryCode: countryCode,
          dialCode: dialCode,
          e164Number: e164Number,
          internationalNumber: internationalNumber,
          nationalNumber: nationalNumber,
          number: number
        },
        modified: new Date(),
      };

      if (passwordChange === 'true') {

        var updateData = {
          first_name: firstName,
          last_name: lastName,
          full_name: firstName + '' + lastName,
          social_accounts: socialAccounts,
          languages: languages,
          vendor_description: vendorDescription,
          phone: {
            countryCode: countryCode,
            dialCode: dialCode,
            e164Number: e164Number,
            internationalNumber: internationalNumber,
            nationalNumber: nationalNumber,
            number: number
          },
          password: encryptPassword,
          slug: slug,
          modified: new Date(),
        };
      }

      const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
      if (errors.length === NOT) {
        if (req.files) {
          let profilePicture = req.files && req.files.image ? req.files.image : {};
          if (req.files.image && Object.keys(profilePicture).length == NOT) {
            return res.send({
              status: STATUS_ERROR,
              message: [
                {
                  param: 'image',
                  msg: res.__('front.user.please_select_an_image'),
                },
              ],
            });
          } else {
            let profileImage = {};

            /** Upload profile file */
            let optionsProfile = {
              file: profilePicture,
              file_path: USER_FILE_PATH,
            };
            profileImage = await moveUploadedFile(optionsProfile);
            if (profileImage.status == STATUS_ERROR) {
              return res.send({
                status: STATUS_ERROR,
                message: [{ param: 'image', msg: profileImage.message }],
              });
            } else {
              var newFileName = profileImage.new_file ? profileImage.new_file : '';
              if (req.files.image) updateData['image'] = newFileName;
            }

            if (Object.keys(profileImage).length > NOT) {
              updateUser(req, res, updateData);
            }
          }
        } else {
          updateUser(req, res, updateData);
        }
      }
      else {
        return res.send({
          status: API_STATUS_ERROR,
          error: errors,
          message: "",
        });
      }
    }
    else if (type === 'verified_seller') {

      const companyName = req.body.companyName ? req.body.companyName : "";
      const companyCountry = req.body.companyCountry ? req.body.companyCountry : "";
      const companyState = req.body.companyState ? req.body.companyState : "";
      const companyCity = req.body.companyCity ? req.body.companyCity : "";
      const companyStreet = req.body.companyStreet ? req.body.companyStreet : "";
      const companyZipcode = req.body.companyZipcode ? req.body.companyZipcode : "";
      const businessId = req.body.businessId ? req.body.businessId : "";
      const businessType = req.body.businessType ? req.body.businessType : "";
      const taxId = req.body.taxId ? req.body.taxId : "";
      const website = req.body.website ? req.body.website : "";

      var updateData = {
        company_name: companyName,
        business_id: businessId,
        business_type: ObjectId(businessType),
        tax_id: taxId,
        website: website,
        // social_accounts : socialAccounts,
        // languages : languages,
        companyAddress: {
          companyCountry: ObjectId(companyCountry),
          companyState: ObjectId(companyState),
          companyCity: companyCity,
          companyStreet: companyStreet,
          companyZipcode: companyZipcode,
        },
        user_type: USER_BUYER,
        is_approved_seller: SELLER_APPROVAL_PENDING,
        is_requested: REQUESTED

      };

      const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
      if (errors.length === NOT) {
        insertSellerUser(req, res, updateData);
      }
      else {
        return res.send({
          status: API_STATUS_ERROR,
          error: errors,
          result: "",
          message: "",
        });
      }
    }
  }

  updateUser = (req, res, updateData) => {
    const userId = req.params.user_id ? req.params.user_id : "";
    /** set to search data */
    let conditionSearch = {
      _id: ObjectId(userId),
      is_deleted: NOT_DELETED,
    };
    let collection = db.collection("users");
    collection.findOneAndUpdate(
      conditionSearch,
      { $set: updateData },
      {},
      (err, result) => {
        if (!err && result && result.lastErrorObject.updatedExisting == true) {
          /** return success */
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.profile_has_been_updated_successfully"),
            result: {},
            error: {},
          });
        }
        else {
          /** return error */
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__(
              "front.user.something_went_wrong_please_try_again_later"
            ),
            result: {},
            error: {},
          });
        }
      }
    );
  }

  insertSellerUser = (req, res, updateData) => {
    var userId = req.params.user_id ? req.params.user_id : "";
    var type = req.body.type ? req.body.type : '';
    const users = db.collection('users');
    users.findOneAndUpdate({ _id: ObjectId(userId) }, { $set: updateData }, (error, result) => {
      if (!error && result) {
        req.flash(
          STATUS_SUCCESS,
          res.__('front.users.you_have_registered_successfully')
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: res.__('front.users.you_have_registered_successfully_please_wait_for_24_hours_to_let_us_verify_the_details'),
          result: {}
        });
      } else {
        req.flash(STATUS_SUCCESS, res.__('front.user.something_went_wrong'));
        return res.send({
          status: STATUS_ERROR,
          message: ''
        });
      }
    });
  };

  /** Function is used to resend email **/
  this.resendEmailForChangeEmail = async (req, res, next) => {
    let string = req.params.validate_string ? req.params.validate_string : "";
    let type = req.body.type ? req.body.type : NOT;
    /** Invalid Request */
    if (!string)
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });

    /*** Get random string */
    await getRandomString(VALIDATE_STRING_ROUND)
      .then((responseString) => {
        let validateString = responseString.result ? responseString.result : "";

        /** search condition */
        let conditionSearch = { is_deleted: NOT_DELETED };
        conditionSearch["new_email_validate_string"] = string;



        /** update condition */
        let conditionUpdate = {};
        conditionUpdate["new_email_validate_string"] = validateString;
        conditionUpdate["new_check_link_expire"] = new Date();



        let collection = db.collection("users");
        collection.findOneAndUpdate(
          conditionSearch,
          { $set: conditionUpdate },
          { projection: { first_name: 1, last_name: 1, email: 1 } },
          (err, result) => {
            if (
              !err &&
              result &&
              result.lastErrorObject.updatedExisting == true
            ) {
              let emailAction =
                type == "signup" ? "email_verification" : "user/reset-password";
              let validateURL = "";
              if (type == "signup") validateURL = WEBSITE_API_URL + emailAction + "/" + validateString;

              if (type == "password") validateURL = WEBSITE_FRONT_URL + emailAction + "?validate_string=" + validateString;


              /***Send mail */
              let fullName =
                result.value.first_name + " " + result.value.last_name;
              let emailOptions = {
                action: type == "signup" ? "registration" : "forgot_password",
                to: result.value.email,
                rep_array: [fullName, validateURL, validateURL],
              };
              sendEmail(req, res, emailOptions);

              /*** return success */
              return res.send({
                status: API_STATUS_SUCCESS,
                message: res.__(
                  "front.user.link_has_been_sent_on_your_registered_email"
                ),
                result: { validateString: validateString },
                error: [],
              });
            } else {
              /*** return error */
              return res.send({
                status: API_STATUS_ERROR,
                message: res.__(
                  "front.user.email_does_not_exists_in_our_database"
                ),
                result: {},
                error: [],
              });
            }
          }
        );
      })
      .catch(next);
  };

  this.newEmail = async (req, res, next) => {
    const userId = req.params.userId ? req.params.userId : '';
    var email = req.body.email ? req.body.email : '';
    var email_validate_string = await getRandomString(VALIDATE_STRING_ROUND);
    var string = email_validate_string.result

    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
    if (errors.length === 0) {
      const collection = db.collection("users");
      collection.findOneAndUpdate({ _id: ObjectId(userId) },
        {
          $set: {
            new_email: email,
            new_email_verified: NOT_VERIFIED,
            new_email_validate_string: string,
            new_check_link_expire: new Date(),
            new_email_link_expired: new Date(Date.now() + 3600 * 1000 * 24),
          }
        }, async (err, result) => {
          if (!err && result) {
            let fullName = result.value ? result.value.full_name : '';
            let verificationLink = WEBSITE_API_URL + "email_change_verification/" + string;
            let action = "registration";
            let subject = "Your email successfully changed! Verify Your Email.";
            let emailOptions = {
              to: email,
              rep_array: [fullName, verificationLink, verificationLink],
              action: action,
              subject: subject,
            };
            /** Send Email */
            sendEmail(req, res, emailOptions);
            /*** return success */
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.you_have_successfully_added_new_email_on_asic_mango_please_check_email_for_verification"
              ),
              result: { validate_string: string },
              error: {},
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.something_went_wrong"),
              error: err,
            })
          }
        })
    }
    else {
      return res.send({
        status: API_STATUS_ERROR,
        message: errors,
        result: {}
      })
    }
  }

  this.emailChangeVerification = async (req, res, next) => {
    try {
      const endDate = new Date();
      let validateString = req.params.validate_string ? req.params.validate_string : "";

      /*** Invalid request */
      if (!validateString) {
        return res.redirect(
          WEBSITE_FRONT_URL + "email-verification?status=error&&message=invalid-request"
        );
      }
      let searchCondition = {};
      searchCondition["new_email_validate_string"] = validateString;
      /** search condition */
      let conditionSearch = {};
      conditionSearch["new_email_validate_string"] = validateString;

      /** update condition */
      var conditionUpdate = {};
      conditionUpdate["new_email_validate_string"] = null;
      conditionUpdate['email_verified'] = VERIFIED;
      let conditionUpdateOne = {};
      conditionUpdateOne["new_email_verified"] = VERIFIED;

      let collection = db.collection("users");

      const differenceInTime = function () {
        return new Promise((resolve, reject) => {
          collection.findOne(
            searchCondition,
            { projection: { new_check_link_expire: 1 } },
            (err, result) => {
              if (!err) {
                if (result !== null) {
                  const startDate = result.new_check_link_expire;
                  const diff = getDifferenceBetweenTwoDates(startDate, endDate);

                  let response = {
                    result: diff,
                  };
                  return resolve(response);
                } else {
                  let response = {
                    result: null,
                  };
                  return resolve(response);
                }
              }
            }
          );
        });
      };
      const time = await differenceInTime();

      if (time.result > ONE_DAY_IN_SECONDS) {

        return res.redirect(
          WEBSITE_FRONT_URL +
          "email-verification?status=error&&message=link_expired"
        );
      } else {
        collection = db.collection("users");
        collection.findOneAndUpdate(
          conditionSearch,
          { $set: conditionUpdateOne },
          { projection: { first_name: 1, last_name: 1, email: 1, new_email: 1 } },
          (err, result) => {
            if (!err && result && result.lastErrorObject.updatedExisting == true) {
              conditionUpdate["email"] = result.value ? result.value.new_email : "";
              conditionUpdate["new_email"] = null;
              collection.findOneAndUpdate(
                conditionSearch,
                { $set: conditionUpdate },
                (err, result) => {
                  if (!err && result && result.lastErrorObject.updatedExisting == true) {
                    return res.redirect(
                      WEBSITE_FRONT_URL + "email-verification?status=success&&message=email_verified"
                    );
                  } else {
                    return res.redirect(
                      WEBSITE_FRONT_URL + "email-verification?status=error&&message=already_verified"
                    );
                  }
                }
              );
            }
            else {
              return res.redirect(
                WEBSITE_FRONT_URL + "email-verification?status=error&&message=already_verified"
              );
            }
          }
        )
      }
    } catch (err) {
      console.log(err);
    }
  }

  this.getAddresses = async (req, res, next) => {
    const userId = req.params.userId;
    const type = req.params.type ? String(req.params.type) : "";
    const collection = db.collection("users");

    if(type=="shipping_address"){
      collection.aggregate([
        { $match: { _id: ObjectId(userId) } },
        { $unwind: "$shippingAddress" },
  
        {
          $lookup: {
            from: "masters",
            let: { countryId: "$shippingAddress.country" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$countryId"] },
                    ],
                  },
                }
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: "countryDetail",
          },
        },
        {
          $lookup: {
            from: "masters",
            let: { stateId: "$shippingAddress.state" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$stateId"] },
                    ],
                  },
                }
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: "stateDetail",
          }
        },
  
        {
          $project: {
            email: 1, 
            shippingAddress:{
              id : "$shippingAddress.id",
              city : "$shippingAddress.city",
              status : "$shippingAddress.status",
              pincode : "$shippingAddress.pincode",
              shipping_address_line_one : "$shippingAddress.shipping_address_line_one",
              shipping_address_line_two : "$shippingAddress.shipping_address_line_two",
              state : {"$arrayElemAt":["$stateDetail",0]},
              country : {"$arrayElemAt":["$countryDetail",0]},
            }
          }
        }
      ]).toArray((err, result) => {
        if (!err && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_addresses_successfully"),
            result: result
          })
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: [],
            error: err,
          })
        }
      });
    }else if(type=="billing_address"){
      collection.aggregate([
        { $match: { _id: ObjectId(userId) } },
        { $unwind: "$billingAddress" },
  
        {
          $lookup: {
            from: "masters",
            let: { countryId: "$billingAddress.billingCountry" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$countryId"] },
                    ],
                  },
                }
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: "countryDetail",
          },
        },
        {
          $lookup: {
            from: "masters",
            let: { stateId: "$billingAddress.billingState" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$stateId"] },
                    ],
                  },
                }
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: "stateDetail",
          }
        },
  
        {
          $project: {
            email: 1, 
            billingAddress:{
              id : "$billingAddress.id",
              cvv : "$billingAddress.cvv",
              status : "$billingAddress.status",
              city : "$billingAddress.billingCity",
              card_type : "$billingAddress.card_type",
              pincode : "$billingAddress.billingPincode",
              card_number : "$billingAddress.card_number",
              state : {"$arrayElemAt":["$stateDetail",0]},
              country : {"$arrayElemAt":["$countryDetail",0]},
              expiration_date : "$billingAddress.expiration_date",
              card_holder_name : "$billingAddress.card_holder_name",
              billing_address_line_one : "$billingAddress.billing_address_line_one",
              billing_address_line_two : "$billingAddress.billing_address_line_two",
            }
          }
        }
      ]).toArray((err, result) => {
        if (!err && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_addresses_successfully"),
            result: result
          })
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: [],
            error: err,
          })
        }
      });
    }
    
  }
/** this fucntion is used to Add address */
  this.postAddresses = (req, res, next) => {
    const cvv = req.body.cvv ? req.body.cvv : "";
    const city = req.body.city ? req.body.city : "";
    const type = req.body.type ? req.body.type : "";
    const state = req.body.state ? req.body.state : "";
    const country = req.body.country ? req.body.country : "";
    const pincode = req.body.pincode ? req.body.pincode : "";
    const userId = req.params.userId ? req.params.userId : "";
    const card_type = req.body.card_type ? req.body.card_type : "";
    const card_number = req.body.card_number ? req.body.card_number : "";
    const status = req.body.status==true || req.body.status=='true'?true:false;
    const expiration_date = req.body.expiration_date ? req.body.expiration_date : "";
    const card_holder_name = req.body.card_holder_name ? req.body.card_holder_name : "";
    const billing_address_line_one = req.body.billing_address_line_one ? req.body.billing_address_line_one : "";
    const billing_address_line_two = req.body.billing_address_line_two ? req.body.billing_address_line_two : "";
    const shipping_address_line_one = req.body.shipping_address_line_one ? req.body.shipping_address_line_one : "";
    const shipping_address_line_two = req.body.shipping_address_line_two ? req.body.shipping_address_line_two : "";

    if (type === 'shipping_address') {
      let removeStatusActive = (addressStatus)=>{
        return new Promise((resolve)=>{
          if(addressStatus){
            const users = db.collection("users");
            users.updateOne(
              {_id:ObjectId(userId)},
              {$set:{"shippingAddress.$[].status":false}},
              (error,result)=>{
                resolve();
              }
            )
          }else{
            resolve();
          }
        });
      }
      const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
      if (errors.length === 0) {
        let addressData = {
          id: ObjectId(),
          status: status,
          pincode: pincode,
          city: city,
          state: ObjectId(state),
          country: ObjectId(country),
          shipping_address_line_one: shipping_address_line_one,
          shipping_address_line_two: shipping_address_line_two
        };
        const collection = db.collection("users");
        removeStatusActive(status).then(() => {
          collection.findOneAndUpdate({ _id: ObjectId(userId) },
            {
              $push: {
                shippingAddress: addressData
              }
            },
            (err, result) => {
              if (!err && result.value) {
                return res.send({
                  status: API_STATUS_SUCCESS,
                  message: res.__("front.user.address_added_successfully"),
                  result: result,
                })
              }
              else {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: err || result,
                })
              }
            }
          )
        })
        
      }
      else {
        return res.send({
          status: API_STATUS_ERROR,
          message: errors,
        })
      }
    }
    else if (type === 'billing_address') {
      
      let removeStatusActive = (addressStatus)=>{
        return new Promise((resolve)=>{
          if(addressStatus){
            const users = db.collection("users");
            users.updateOne(
              {_id:ObjectId(userId)},
              {$set:{"billingAddress.$[].status":false}},
              (error,result)=>{
                resolve();
              }
            )
          }else{
            resolve();
          }
        });
      }
      const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
      if (errors.length === 0) {
        const collection = db.collection("users");
        removeStatusActive(status).then(()=>{
          collection.findOneAndUpdate({ _id: ObjectId(userId) },
            {
              $push: {
                billingAddress:
                {
                  status: status,
                  id: ObjectId(),
                  billingCountry: ObjectId(country),
                  billingState: ObjectId(state),
                  billingPincode: pincode,
                  billingCity: city,
                  billing_address_line_one: billing_address_line_one,
                  billing_address_line_two: billing_address_line_two,
                  cvv : cvv,
                  card_type : card_type,
                  card_number : card_number,
                  expiration_date : expiration_date,
                  card_holder_name : card_holder_name
                }
              }
            },
            (err, result) => {
              if (!err && result.value) {
                return res.send({
                  status: API_STATUS_SUCCESS,
                  message: res.__("front.user.address_added_successfully"),
                  result: result,
                })
              }
              else {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: err || result,
                })
              }
            }
          )
        })
      }else{
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.invalid_request"),
          result: {},
          error : errors
        })
      }
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error : []
      })
    }
  }/** End postAddresses */

  

  this.postDefaultAddress = async (req, res) => {
    const userId = req.params.userId ? req.params.userId : '';
    const id = req.params.id ? req.params.id : '';
    const type = req.body.type ? req.body.type : '';

    if (type === 'shipping_address') {
      const collection = db.collection("users");
      collection.updateMany({ _id: ObjectId(userId) },
        { $set: { "shippingAddress.$[].status": false } },
        (err, resultOne) => {
          if (!err && resultOne) {
            collection.updateMany({ _id: ObjectId(userId), "shippingAddress.id": ObjectId(id) },
              { $set: { "shippingAddress.$.status": true } },
              (err, resultTwo) => {
                if (!err && resultTwo) {
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__("front.user.default_address_is_set_successfully"),
                    result: {},
                  })
                }
                else {
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                  })
                }
              })
          }
          else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.something_went_wrong"),
              result: {},
            })
          }
        }
      )
    }
    else if (type === 'billing_address') {
      const collection = db.collection("users");
      collection.updateMany({ _id: ObjectId(userId) },
        { $set: { "billingAddress.$[].status": false } },
        (err, resultOne) => {
          if (!err && resultOne) {
            collection.updateMany({ _id: ObjectId(userId), "billingAddress.id": ObjectId(id) },
              { $set: { "billingAddress.$.status": true } },
              (err, resultTwo) => {
                if (!err && resultTwo) {
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__("front.user.default_address_is_set_successfully"),
                    result: {},
                  })
                }
                else {
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                  })
                }
              })
          }
          else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.something_went_wrong"),
              result: {},
            })
          }
        }
      )
    }
  }



  // this.getEditAddress = async (req, res, next) => {
  //   const userId     = req.params.userId ? req.params.userId : '';
  //   const id         = req.params.id ? req.params.id : '';

  //   const collection = db.collection("users");
  //   collection.findOne({_id: ObjectId(userId), "shippingAddress.id" : ObjectId(id)},{projection: {shippingAddress: 1}},
  //     (err, result) => {
  //       if(!err && result){
  //         return res.send({
  //           status: API_STATUS_SUCCESS,
  //           message: res.__("front.user.fetched_address_successfully"),
  //           result: result,
  //         })
  //       } 
  //       else {
  //         return res.send({
  //           status: API_STATUS_SUCCESS,
  //           message: res.__("front.user.something_went_wrong"),
  //           result: err || result,
  //         })
  //       }
  //     }
  //   )
  // }

  this.postEditAddress = async (req, res, next) => {
    const id = req.params.id ? req.params.id : '';
    const city = req.body.city ? req.body.city : '';
    const type = req.body.type ? req.body.type : '';
    const state = req.body.state ? req.body.state : '';
    const country = req.body.country ? req.body.country : '';
    const pincode = req.body.pincode ? req.body.pincode : '';
    const userId = req.params.userId ? req.params.userId : '';
    const status = req.body.status == true || req.body.status=='true'?true:false;
    const billing_address_line_one = req.body.billing_address_line_one ? req.body.billing_address_line_one : "";
    const billing_address_line_two = req.body.billing_address_line_two ? req.body.billing_address_line_two : "";
    const shipping_address_line_one = req.body.shipping_address_line_one ? req.body.shipping_address_line_one : "";
    const shipping_address_line_two = req.body.shipping_address_line_two ? req.body.shipping_address_line_two : "";

    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
    if (errors.length !== 0) {
      return res.send({
        status: API_STATUS_ERROR,
        message: errors,
        result: {},
      })
    }
    else {
      if (type === 'shipping_address') {
        let removeStatusActive = (addressStatus)=>{
          return new Promise((resolve)=>{
            if(addressStatus){
              const users = db.collection("users");
              users.updateOne(
                {_id:ObjectId(userId)},
                {$set:{"shippingAddress.$[].status":false}},
                (error,result)=>{
                  resolve();
                }
              )
            }else{
              resolve();
            }
          });
        }
        const collection = db.collection("users");
        removeStatusActive(status).then(()=>{
          collection.updateMany({ _id: ObjectId(userId), "shippingAddress.id": ObjectId(id) },
            {
              $set:
              {
                "shippingAddress.$.country": ObjectId(country),
                "shippingAddress.$.state": ObjectId(state),
                "shippingAddress.$.status": status,
                "shippingAddress.$.city": city,
                "shippingAddress.$.pincode": pincode,
                "shippingAddress.$.shipping_address_line_one": shipping_address_line_one,
                "shippingAddress.$.shipping_address_line_two": shipping_address_line_two,
              }
            },
            (err, result) => {
              if (!err && result) {
                if (result.matchedCount) {
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__("front.user.updated_address_successfully"),
                    result: result,
                  })
                }
                else {
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                  })
                }
              }
              else {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: err || result,
                })
              }
            }
          )
        })
      }
      else if (type === 'billing_address') {
        let removeStatusActive = (addressStatus)=>{
          return new Promise((resolve)=>{
            if(addressStatus){
              const users = db.collection("users");
              users.updateOne(
                {_id:ObjectId(userId)},
                {$set:{"billingAddress.$[].status":false}},
                (error,result)=>{
                  resolve();
                }
              )
            }else{
              resolve();
            }
          });
        }
        const collection = db.collection("users");
        removeStatusActive(status).then(()=>{
          collection.updateMany({ _id: ObjectId(userId), "billingAddress.id": ObjectId(id) },
            {
              $set:
              {
                "billingAddress.$.billingCountry": ObjectId(country),
                "billingAddress.$.billingState": ObjectId(state),
                "billingAddress.$.billingCity": city,
                "billingAddress.$.billing_address_line_one": billing_address_line_one,
                "billingAddress.$.billing_address_line_two": billing_address_line_two,
                "billingAddress.$.billingPincode": pincode,
                "billingAddress.$.status": status
              }
            },
            (err, result) => {
              if (!err && result) {
                if (result.matchedCount) {
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__("front.user.updated_address_successfully"),
                    result: result,
                  })
                }
                else {
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                  })
                }
              }
              else {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: err || result,
                })
              }
            }
          );
        });
      }
    }
  }

  this.deleteAddress = async (req, res) => {
    const userId = req.params.userId ? req.params.userId : '';
    const id = req.params.id ? req.params.id : '';
    const type = req.body.type ? req.body.type : '';
    if (type === 'shipping_address') {
      const collection = db.collection("users");
    collection.findOne({ _id: ObjectId(userId) },{projection:{shippingAddress:1}},(error,result)=>{
        let defaultAddress = result.shippingAddress.filter((item)=>{
          return item.status==true && item.id==id;
        });
        if(defaultAddress.length==0){
          collection.findOne({ _id: ObjectId(userId) })
          collection.updateOne({ _id: ObjectId(userId) },
            { $pull: { shippingAddress: { id: ObjectId(id) } } },
            (err, result) => {
              if (!err && result) {

                if (result.modifiedCount) {
                  return res.send({
                    status: API_STATUS_SUCCESS,
                    message: res.__("front.user.deleted_address_successfully"),
                    result: {},
                  })
                }
                else {
                  return res.send({
                    status: API_STATUS_ERROR,
                    message: res.__("front.user.something_went_wrong"),
                    result: {},
                  })
                }

              } else {
                return res.send({
                  status: API_STATUS_ERROR,
                  message: res.__("front.user.something_went_wrong"),
                  result: {},
                })
              }
            })
        }else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.can_not_delete_default_address"),
            result: {},
          })
        }
      })
      
    }
    else if (type === 'billing_address') {
      const collection = db.collection("users");
      collection.updateOne({ _id: ObjectId(userId) },
        { $pull: { billingAddress: { id: ObjectId(id) } } },
        (err, result) => {
          if (!err && result) {

            if (result.modifiedCount) {
              return res.send({
                status: API_STATUS_SUCCESS,
                message: res.__("front.user.deleted_address_successfully"),
                result: {},
              })
            }
            else {
              return res.send({
                status: API_STATUS_ERROR,
                message: res.__("front.user.something_went_wrong"),
                result: {},
              })
            }
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.something_went_wrong"),
              result: {},
            })
          }
        })
    }

  }

  this.editVerifiedSeller = async (req, res, next) => {
    const companyName = req.body.companyName ? req.body.companyName : '';
    const businessId = req.body.businessId ? req.body.businessId : '';
    const businessType = req.body.businessType ? req.body.businessType : '';
    const companyCountry = req.body.companyCountry ? req.body.companyCountry : '';
    const companyState = req.body.companyState ? req.body.companyState : '';
    const companyCity = req.body.companyCity ? req.body.companyCity : '';
    const companyStreet = req.body.companyStreet ? req.body.companyStreet : '';
    const companyZipcode = req.body.companyZipcode ? req.body.companyZipcode : '';
    const taxId = req.body.taxId ? req.body.taxId : '';
    const website = req.body.website ? req.body.website : '';
    // const vendorDescription   = req.body.vendor_description        ? req.body.vendor_description : '';
    // const socialAccounts      = req.body.social_accounts           ? req.body.social_accounts : {};
    // const languages           = req.body.languages                 ? JSON.parse(req.body.languages) : [];
    const errors = uniqueValidations(validationResult(req).array({ onlyFirstError: true }));
    if (errors.length === 0) {
      const updateData = {
        company_name: companyName,
        business_id: businessId,
        business_type: ObjectId(businessType),
        tax_id: taxId,
        website: website,
        // vendor_description : vendorDescription,
        // social_accounts : socialAccounts,
        // languages : languages,
        companyAddress: {
          companyCountry: ObjectId(companyCountry),
          companyState: ObjectId(companyState),
          companyCity: companyCity,
          companyStreet: companyStreet,
          companyZipcode: companyZipcode,
        },

        user_type: USER_BUYER,
        is_approved_seller: SELLER_APPROVAL_PENDING,
        is_requested: REQUESTED,
        modified: new Date(),
      }

      // if (req.files) {
      //   let profilePicture = req.files && req.files.image ? req.files.image : {};
      //   if (req.files.image && Object.keys(profilePicture).length == NOT) {
      //     return res.send({
      //       status: STATUS_ERROR,
      //       message: [
      //         {
      //           param: 'image',
      //           msg: res.__('admin.user.please_select_an_image'),
      //         },
      //       ],
      //     });
      //   } else {
      //     let profileImage = {};

      //     /** Upload profile file */
      //     let optionsProfile = {
      //       file: profilePicture,
      //       file_path: USER_FILE_PATH,
      //     };
      //     profileImage = await moveUploadedFile(optionsProfile);
      //     if (profileImage.status == STATUS_ERROR) {
      //       return res.send({
      //         status: STATUS_ERROR,
      //         message: [{ param: 'image', msg: profileImage.message }],
      //       });
      //     } else {
      //       let newFileName = profileImage.new_file ? profileImage.new_file : '';
      //       if (req.files.image) updateData['image'] = newFileName;
      //     }

      //     if (Object.keys(profileImage).length > NOT) {
      //       editSellerUser(req, res, updateData);
      //     }
      //   }
      // } 
      // else {
      editSellerUser(req, res, updateData);
      // }
    }
    else {
      return res.send({
        status: API_STATUS_ERROR,
        message: errors,
        result: {}
      })
    }
  }

  editSellerUser = (req, res, updateData) => {
    var userId = req.params.userId ? req.params.userId : "";
    const users = db.collection('users');
    users.findOneAndUpdate({ _id: ObjectId(userId) }, { $set: updateData }, (error, result) => {
      if (!error && result) {
        req.flash(
          STATUS_SUCCESS,
          res.__('front.user.you_have_edited_details_successfully')
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: res.__('front.user.you_have_edited_details_successfully'),
          result: result
        });
      } else {
        req.flash(STATUS_SUCCESS, res.__('admin.system.something_went_wrong'));
        return res.send({
          status: STATUS_ERROR,
          message: '',
          rediect_url: WEBSITE_ADMIN_URL + 'users',
        });
      }
    });
  };



  /** Function is used to delete profile data */
  this.deleteProfileData = (req, res, next) => {
    // let type = req.body.type ? req.body.type : "";
    let userId = req.params.userId ? req.params.userId : "";

    if (!userId)
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });

    let condition = { _id: ObjectId(userId) };

    let collection = db.collection("users");
    collection.deleteOne(condition, (err, result) => {
      if (!err) {
        /** return success */
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.profile_has_been_deleted_successfully"),
          result: {},
        });
      } else {
        /** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong_please_try_again_later"),
          result: {},
          error: {},
        });
      }
    });
  };
  this.sellerProfile = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : {};

    let users = db.collection("users");
    if (userId) {
      users.aggregate([
        {
          $match: {
            _id: userId
          }
        },
        {
          $lookup: {
            from: 'users',
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', userId] }],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  shippingAddress: { "$arrayElemAt": [{ $filter: { input: "$shippingAddress", as: "item", cond: { $eq: ["$$item.status", true] } } }, 0] }
                }
              },
            ],
            as: 'addressDetail',
          },
        },
        {
          $lookup: {
            from: 'masters',
            let: { countryId: { '$arrayElemAt': ['$addressDetail', 0] } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$countryId.shippingAddress.country'] }],
                  },
                },
              },
              { $project: { _id: 1, name: 1 } },
            ],
            as: 'countryDetail',
          },
        },
        {
          $project: {
            created: 1,
            full_name: 1,
            phone: 1,
            email: 1,
            languages: 1,
            social_accounts: 1,
            social_accounts: 1,
            vendor_description: 1,
            website: 1,
            full_image_path: { $concat: [USER_FILE_URL, "$image"] },
            countryDetail: 1
          }
        }
      ]).toArray((error, result) => {
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.user_found_successfully"),
            result: result,
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.user_not_found"),
            result: {},
            error: {},
          });
        }
      });
    }
    else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }
  /**Function is used to change status of like */
  this.favoriteProductsStatus = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : '';
    const productId = req.body.product_id ? ObjectId(req.body.product_id) : '';
    const status = String(req.body.status) ? Number(req.body.status) : '';
    if (userId && productId && String(req.body.status)) {
      const favorites = db.collection("favorites");
      let searchCondition = {
        user_id: userId,
        product_id: productId
      }
      let updateData = {
        is_liked: status,
        modified: getUtcDate()
      }
      favorites.updateOne(
        searchCondition,
        {
          $set: updateData,
          $setOnInsert: {
            user_id: userId,
            product_id: productId,
            created: getUtcDate()
          }
        },
        { upsert: true },
        (error, result) => {
          if (error) {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.invalid_request"),
              result: {},
              error: {},
            });
          } else {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: status == IS_LIKED ? res.__("front.product_marked_as_liked") : res.__("front.product_marked_as_unliked"),
              result: {},
            });
          }
        });
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }

  }/** end favoriteProductsStatus */

  /** Function used to add product to cart*/
  this.addToCart = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : '';
    // const cartType   =     req.body.cart_type ? req.body.cart_type:'';
    const productId = req.body.product_id ? ObjectId(req.body.product_id) : '';
    const productQuantity = req.body.quantity ? Number(req.body.quantity) : '';
    const cartNegotiable = req.body.cart_negotiable;
    const agreedPrice = req.body.agreed_price ? req.body.agreed_price : "";


    // return;




    if (userId && productId && productQuantity && (cartNegotiable !== undefined)) {
      let updateData = {
        quantity: productQuantity,
        cart_negotiable: CART_NOT_NEGOTIABLE
      }
      if (cartNegotiable) {
        if (agreedPrice) {
          updateData['agreed_price'] = agreedPrice;
          updateData['expire_time'] = getUtcDate();
          updateData['cart_negotiable'] = CART_NEGOTIABLE;
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.invalid_request"),
            result: {},
            error: {},
          });
        }
      }

      const cart = db.collection("cart");
      let searchCondition = {
        user_id: userId,
        product_id: productId
      }

      cart.updateOne(
        searchCondition,
        {
          $set: updateData,
          $setOnInsert: {
            user_id: userId,
            product_id: productId,
            created: getUtcDate()
          }
        },
        { upsert: true },
        (error, result) => {
          if (error) {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.invalid_request"),
              result: {},
              error: {},
            });
          } else {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__("front.product.added_to_cart"),
              result: {},
            });
          }
        });
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end addToCart */

  this.deleteFromCart = (req, res, next) => {
    const cartId = req.body.cart_id ? ObjectId(req.body.cart_id) : "";
    if (cartId) {
      const cart = db.collection("cart");
      let searchCondition = {
        _id: cartId
      }
      cart.findOneAndDelete(searchCondition, (err, result) => {
        if (err) {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: {},
          });
        } else {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.product.removed_from_cart"),
            result: {},
          });
        }
      })
    }
  }

  /** This function used to get all products of cart */
  this.getCartProdcts = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : '';
    // const productId   =     req.body.product_id ? ObjectId(req.body.product_id):'';

    const cart = db.collection("cart");
    if (userId) {
      cart.aggregate([
        { $match: { user_id: userId } },
        {
          $lookup: {
            from: 'products',
            let: { productId: '$product_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$productId'] }],
                  },
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { brandlistId: '$brandlist' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$brandlistId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'brandlistDetail',
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { availabilityId: '$availability' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$availabilityId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'availabilityDetail',
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { hashRateId: '$hash_rate' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$hashRateId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'hashrateDetail',
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { conditionId: '$condition' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$conditionId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'conditionDetail',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  let: { userId: '$user' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $eq: ['$_id', '$$userId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, full_name: 1, email: 1 } },
                  ],
                  as: 'userDetail',
                },
              },
              {
                $lookup: {
                  from: 'masters',
                  let: { countryId: '$shipment_country' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [{ $in: ['$_id', '$$countryId'] }],
                        },
                      },
                    },
                    { $project: { _id: 1, name: 1 } },
                  ],
                  as: 'countryDetail',
                },
              },
              {
                $project: {
                  _id: 1,
                  product_title: 1,
                  category: 1,
                  indicative_price: 1,
                  image: 1,
                  brandlist_name: { '$arrayElemAt': ['$brandlistDetail.name', 0] },
                  condition_name: { '$arrayElemAt': ['$conditionDetail.name', 0] },
                  availability_name: { '$arrayElemAt': ['$availabilityDetail.name', 0] },
                  hashrate_name: { '$arrayElemAt': ['$hashrateDetail.name', 0] },
                  user_name: { '$arrayElemAt': ['$userDetail.full_name', 0] },
                  email: { '$arrayElemAt': ['$userDetail.email', 0] },
                  country_detail: '$countryDetail',
                  quantity: 1,
                  model: 1,
                  user: 1,
                  userDetail: 1
                }
              },
            ],
            as: 'productDetail',
          },

        },
        {
          $project: {
            quantity: 1,
            product_title: { '$arrayElemAt': ['$productDetail.product_title', 0] },
            category: { '$arrayElemAt': ['$productDetail.category', 0] },
            indicative_price: { '$arrayElemAt': ['$productDetail.indicative_price', 0] },
            image: { '$arrayElemAt': ['$productDetail.image', 0] },
            brandlist_name: { '$arrayElemAt': ['$productDetail.brandlist_name', 0] },
            condition_name: { '$arrayElemAt': ['$productDetail.condition_name', 0] },
            availability_name: { '$arrayElemAt': ['$productDetail.availability_name', 0] },
            user_name: { '$arrayElemAt': ['$productDetail.user_name', 0] },
            country_detail: { '$arrayElemAt': ['$productDetail.country_detail', 0] },
            max_quantity: { '$arrayElemAt': ['$productDetail.quantity', 0] },
            product_id: { '$arrayElemAt': ['$productDetail._id', 0] },
            model: { '$arrayElemAt': ['$productDetail.model', 0] },
            hashrate_name: { '$arrayElemAt': ['$productDetail.hashrate_name', 0] },
            user_id: { '$arrayElemAt': ['$productDetail.user', 0] },
            email: { '$arrayElemAt': ['$productDetail.email', 0] },
            agreed_price: 1
          }
        }
      ]).toArray(async (err, result) => {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.product.cart_product_found"),
          result: result,
        });
      });

    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }

  }/** end getCartProdcts */

  /** This function is used to upated cart */
  this.updateCart = (req, res, next) => {
    const cartId = req.body.cart_id ? ObjectId(req.body.cart_id) : "";
    const quantity = req.body.quantity ? Number(req.body.quantity) : "";
    if (cartId && quantity) {
      let conditionSearch = {
        _id: cartId
      }
      let conditionUpdate = {
        quantity: quantity
      }
      let cart = db.collection("cart");
      cart.updateOne(
        conditionSearch,
        { $set: conditionUpdate },
        (err, result) => {

          if (!err && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.cart_has_been_updated_successfully"
              ),
              result: {},
              error: [],
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__(
                "admin.front.something_went_wrong_please_try_again_later"
              ),
              result: {},
              error: [],
            });
          }
        }
      );
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** End  updateCart*/


  /**This function is used to get users notifications */
  this.getNotifications = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    const loadMore = req.body.load_more ? Number(req.body.load_more) : "";
    const limit = (loadMore * NOTIFICATION_LIMIT);

    if (userId && loadMore && limit >= NOTIFICATION_LIMIT) {
      const collection = db.collection('notifications');
      let searchCondition = {
        user_id: userId,
        is_deleted: NOT_DELETED
      }
      let sortCondition = {
        created: SORT_DESC
      }
      let skipAndLimit = [
        {
          $skip: NOT
        },
        {
          $limit: limit
        },
      ]

      async.parallel({
        data: (callback) => {
          // collection.find(searchCondition).sort(sortCondition).toArray((error,result)=>{
          //   if(!error && result){
          //     callback(error,result);
          //   }
          // });
          collection.aggregate([
            {
              $match: searchCondition
            },
            {
              $sort: sortCondition
            },
            ...skipAndLimit
          ]).toArray((error, result) => {
            if (!error && result) {
              callback(error, result);
            }
          })
        },
        recordsTotal: (callback) => {
          collection.countDocuments(searchCondition, {}, (err, result) => {
            callback(err, result);
          });
        },
        unreadNotifications: (callback) => {
          collection.countDocuments({
            ...searchCondition,
            is_read: NOT_READ
          }, { limit: limit }, (err, result) => {
            callback(err, result);
          });
        },
      },
        (error, result) => {
          if (!error) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.records_found_successfully"
              ),
              result: result,
              error: [],
            });
          }
        });


    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** End getNotifications */

  /** This function is used to mark notificaitons as read */
  this.markNotifications = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    const notificationIdArray = req.body.notifications ? req.body.notifications : [];
    if (userId && notificationIdArray.length > 0) {
      const notificationObjectIdArray = getObjectIdArray(notificationIdArray);
      const searchCondition = {
        _id: { $in: notificationObjectIdArray },

      };
      const updateData = {
        is_read: READ
      };
      const colletion = db.collection('notifications');
      colletion.updateMany(
        searchCondition,
        {
          $set: updateData
        },
        (error, result) => {
          if (!error) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.records_has_been_updated_successfully	"
              ),
              result: {},
              error: [],
            });
          }
        }
      );
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end markNotifications */

  /** This function is used to update last seen of user */
  this.updateLastseen = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    const lastSeen = req.body.last_seen ? req.body.last_seen : "";
    if (userId) {
      const collection = db.collection('users');
      collection.updateOne(
        { _id: userId },
        {
          $set: {
            last_seen: lastSeen
          }
        },
        (error, result) => {
          if (!error && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__(
                "front.user.records_has_been_updated_successfully"
              ),
              result: { last_seen: lastSeen },
              error: [],
            });
          }
        })
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end updateLastseen */

  /** This function is used to get last seen */
  this.getLastseen = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    if (userId) {
      const collection = db.collection('users');
      collection.aggregate([
        {
          $match: {
            _id: userId
          }
        },
        {
          $project: {
            last_seen: 1,
            last_login: 1
          }
        }
      ]).toArray((error, result) => {
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.records_has_been_updated_successfully"
            ),
            result: result,
            error: [],
          });
        }
      })
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end getLastseen */

  /** This function is used to get counts of reviews */
  this.userReviewCount = (req, res, next) => {
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    if (userId) {
      const collection = db.collection('ratings');
      // collection.aggregate([
      //   {
      //     $match:{product_id:productId}
      //   }
      // ]).toArray((err, result) => {

      // })
      const commonCondition = {
        seller_id: userId,
        is_active:ACTIVE,
      }
      async.parallel({
        fiveStars: (callback) => {
          let condition = {
            ...commonCondition,
            rating: 5,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        fourStars: (callback) => {
          let condition = {
            ...commonCondition,
            rating: 4,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        threeStars: (callback) => {
          let condition = {
            ...commonCondition,
            rating: 3,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        twoStars: (callback) => {
          let condition = {
            ...commonCondition,
            rating: 2,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        oneStars: (callback) => {
          let condition = {
            ...commonCondition,
            rating: 1,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },
        totalReviews: (callback) => {
          let condition = {
            ...commonCondition,
            is_deleted: NOT_DELETED
          }
          collection.countDocuments(condition, {}, (err, result) => {
            callback(err, result);
          });
        },

      }
        , (error, result) => {
          if (!error && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__('front.user.records_found_successfully'),
              result: result
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__('front.user.something_went_wrong'),
              result: {}
            })
          }
        })
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }/** end reviewCount */








  /** ================== New signup methods starts ================== */
  this.newSignup = (req, res, next) => {
    const step = req.body.step ? req.body.step : "";
    const email = req.body.email ? req.body.email : "";
    const phone = req.body.phone && req.body.phone.number ? req.body.phone.number : "";

    if (step == 1 || step == 2 || step == 3) {
      const collection = db.collection("users");
      let findCondition = { email: email };
      if (step == 2 || step == 3) findCondition = { "phone.number": phone };
      collection.findOne(findCondition, (error, result) => {
        if (result) {
          checkStepsAndStatus(req, res, result);
        } else {
          saveUserInfo(req, res);
        }
      });
    }
  }

  /** This function is used to check form steps and verification status */
  checkStepsAndStatus = (req, res, result) => {
    const step = req.body.step ? Number(req.body.step) : "";
    if(result && result.registered_steps == 3 && result.document_verfication != 1){
      return res.send({
        status: API_STATUS_SUCCESS,
        message: DOCUMENT_VERIFICATION_PENDING,
        result: { step: 3, email: result.email },
        error: [],
      });
    }
    /** checking step 1 */
    if (step == 1 && result.email_verified == VERIFIED && result.phone_verified == VERIFIED && result.registered_steps == 3) {
      // user already exists
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.email_already_exists"),
        result: {},
        error: [],
      });
    } else {
      if (result.registered_steps == 1 && step == 1) {
        /** check email is verified */
        if (result.email_verified == VERIFIED) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: EMAIL_VERIFIED,
            result: { step: 2, email: result.email },
            error: [],
          });
        } else {
          let email = result.email;
          let fullName = result.full_name;
          let emailVerifyString = result.email_verify_string;
          let verificationLink = WEBSITE_API_URL + "email_verification/" + emailVerifyString;
          let emailOptions = {
            to: email,
            rep_array: [fullName, verificationLink, verificationLink],
            action: SIGNUP_EMAIL_ACTION,
            subject: SIGNUP_EMAIL_SUBJECT,
          };
          /** Send Email */
          sendEmail(req, res, emailOptions);
          return res.send({
            status: API_STATUS_SUCCESS,
            message: VERIFY_EMAIL,
            result: { validate_string: emailVerifyString, email: email },
            error: [],
          });
        }
      }
    }
    /** checking step 2 */
    if (step == 2 && result.email_verified == VERIFIED && result.phone_verified == VERIFIED && result.registered_steps == 3) {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.phone_already_exists"),
        result: {},
        error: [],
      });
    } else {
      if (result.registered_steps == 2 && step == 2) {
        /** check phone is verified */
        if (result.phone_verified == VERIFIED) {
          return res.send({
            status: API_STATUS_ERROR,
            message: "",
            result: { incomplete_action: 3 },
            error: [],
          });
        } else {
          let email = result.email;
          let phoneVerifyString = result.phone_varify_string;
          return res.send({
            status: API_STATUS_SUCCESS,
            message: VERIFY_PHONE,
            result: { validate_string: phoneVerifyString, email: email },
            error: [],
          });
        }
      }
    }
    /** checking step 3 */
    if (step == 3 && result.email_verified == VERIFIED && result.phone_verified == VERIFIED && result.registered_steps == 3) {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.phone_already_exists"),
        result: {},
        error: [],
      });
    }
    else {
      saveUserInfo(req, res);
    }
    // else{
    //   if(result.registered_steps == 3 && step == 3){
    //     /** check phone is verified */
    //     if(result.document_verfication == VERIFIED){
    //       return res.send({
    //         status: API_STATUS_ERROR,
    //         message: "",
    //         result: {incomplete_action:3},
    //         error: [],
    //       });
    //     }else{
    //       let email = result.email;
    //       let phoneVerifyString = result.phone_varify_string;
    //       return res.send({
    //         status: API_STATUS_SUCCESS,
    //         message: VERIFY_PHONE,
    //         result: {validate_string : phoneVerifyString,email:email},
    //         error: [],
    //       });
    //     }
    //   }
    // }
  }

  saveUserInfo = async (req, res) => {
    // return;
    const step = req.body.step ? Number(req.body.step) : "";
    const collection = db.collection('users');
    const email = req.body.email ? req.body.email : "";
    /** Step 1 data */
    const firstName = req.body.first_name ? req.body.first_name : "";
    const lastName = req.body.last_name ? req.body.last_name : "";
    const fullName = firstName + " " + lastName;
    const password = req.body.password ? req.body.password : "";
    const encryptedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
    /** Step 2 data */
    const dateOfbirth = req.body.date_of_birth ? req.body.date_of_birth : "";
    const phone = req.body.phone ? req.body.phone : "";
    let shippingAddress = req.body.shippingAddress ? req.body.shippingAddress : "";
    let billingAddress = req.body.billingAddress ? req.body.billingAddress : "";
    const sameAddress = req.body.sameAddress ? req.body.sameAddress : "";
    shippingAddress['state'] = ObjectId(shippingAddress['state']);
    shippingAddress['country'] = ObjectId(shippingAddress['country']);
    billingAddress['billingState'] = ObjectId(billingAddress['billingState']);
    billingAddress['billingCountry'] = ObjectId(billingAddress['billingCountry']);
    /** Step 3 data */
    const id_proof_type = req.body.id_proof_type ? req.body.id_proof_type : "";
    const id_proof_document = req.files && req.files.id_proof_document ? req.files.id_proof_document : "";
    const same_id_and_address = req.body.same_id_and_address ? req.body.same_id_and_address : "";
    const address_proof_type = req.body.address_proof_type ? req.body.address_proof_type : "";
    const address_proof_document = req.files && req.files.address_proof_document ? req.files.address_proof_document : "";
  

    let userData = {};

    if (step == 1) {
      /** Slug options */
      let slugOptions = {
        table_name: "users",
        title: fullName,
        slug_field: "full_name",
      };
      /** get slug form database */
      getDatabaseSlug(slugOptions)
        .then(async (responseSlug) => {
          /** get string */
          let responseString = await getRandomString(VALIDATE_STRING_ROUND);
          let emailVerifyString = responseString.result ? responseString.result : "";
          let slug = responseSlug.title ? responseSlug.title : "";
          userData['slug'] = slug;
          userData['email'] = email;
          userData['role_id'] = ROLE_ID_USER;
          userData['created'] = getUtcDate();
          userData['password'] = encryptedPassword;
          userData['last_name'] = lastName;
          userData['full_name'] = fullName;
          userData['user_type'] = NOT_VERIFIED;
          userData['is_active'] = ACTIVE;
          userData['last_seen'] = getUtcDate();
          userData['first_name'] = firstName;
          userData['is_deleted'] = NOT_DELETED;
          userData['is_approved'] = DEACTIVE;
          userData['email_verified'] = NOT_VERIFIED;
          userData['is_profile_step'] = DEACTIVE;
          userData['registered_steps'] = step;
          userData['email_verify_time'] = getUtcDate();
          userData['is_notification_on'] = ACTIVE;
          userData['is_profile_updated'] = DEACTIVE;
          userData['email_notifications'] = DEACTIVE;
          userData['email_verify_string'] = emailVerifyString;
          userData['document_verfication'] = NOT_VERIFIED;
          collection.insertOne(userData, (error, result) => {
            if (!error && result) {
              let verificationLink = WEBSITE_API_URL + "email_verification/" + emailVerifyString;
              let emailOptions = {
                to: email,
                rep_array: [fullName, verificationLink, verificationLink],
                action: SIGNUP_EMAIL_ACTION,
                subject: SIGNUP_EMAIL_SUBJECT,
              };
              /** Send Email */
              sendEmail(req, res, emailOptions);
              return res.send({
                status: API_STATUS_SUCCESS,
                message: VERIFY_EMAIL,
                result: { validate_string: emailVerifyString, email: email },
                error: [],
              });
            } else {
              return res.send({
                status: API_STATUS_ERROR,
                message: res.__("front.user.something_went_wrong"),
                result: {},
                error: [],
              });
            }
          });
        });
    } else if (step == 2) {
      let responseString = await getRandomString(VALIDATE_STRING_ROUND);
      let phoneVerifyString = responseString.result ? responseString.result : "";
      userData['phone'] = phone;
      userData['date_of_birth'] = dateOfbirth;
      userData['sameAddress'] = sameAddress;
      userData['billingAddress'] = [{
        id: ObjectId(),
        status: true,
        ...billingAddress
      }];
      userData['shippingAddress'] = [{
        id: ObjectId(),
        status: true,
        ...shippingAddress
      }];
      userData['registered_steps'] = step;
      userData['otp'] = Number(1234);
      userData['phone_verified'] = NOT_VERIFIED;
      userData['otp_expire_time'] = getUtcDate();
      userData['phone_varify_string'] = phoneVerifyString;
      collection.updateOne({ email: email }, { $set: userData }, (error, result) => {
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: VERIFY_PHONE,
            result: { validate_string: phoneVerifyString, email: email },
            error: [],
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: [],
          });
        }
      });
    } else if (step == 3) {
      userData['id_proof_type'] = id_proof_type;
      userData['registered_steps'] = step;
      userData['document_verfication'] = NOT_VERIFIED;
      userData['address_proof_type'] = address_proof_type;
      userData['same_id_and_address'] = same_id_and_address;
      /**id_proof_document file upload */
      let optionsnMultipleImages = {
        file: id_proof_document,
        file_path: PRODUCT_FILE_PATH,
      };
      let uploadImages = await moveUploadedFile(optionsnMultipleImages);
      if (uploadImages.status == STATUS_ERROR) {
        return res.send({
          status: STATUS_ERROR,
          message: [{ param: 'id_proof_document', msg: uploadImages.message }],
        });
      } else {
        let idProofImgName = uploadImages.new_file ? uploadImages.new_file : '';
        userData['id_proof_document'] = idProofImgName;
      }

      /**address_proof_document file upload */
      let optionsnMultipleImages2 = {
        file: address_proof_document,
        file_path: PRODUCT_FILE_PATH,
      };
      let uploadImages2 = await moveUploadedFile(optionsnMultipleImages2);
      if (uploadImages2.status == STATUS_ERROR) {
        return res.send({
          status: STATUS_ERROR,
          message: [{ param: 'address_proof_document', msg: uploadImages2.message }],
        });
      } else {
        let documentProofImgName = uploadImages2.new_file ? uploadImages2.new_file : '';
        userData['address_proof_document'] = documentProofImgName;
      }
      collection.updateOne({ email: email }, { $set: userData }, (error, result) => {
        if (!error && result) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: REGISTRATION_SUCCESS,
            result: {},
            error: [],
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: [],
          });
        }
      });
    }
  }
  this.resendEmailForVerifyEmail = async (req, res, next) => {
    const oldValidateSring = req.params.validate_string ? req.params.validate_string : "";
    if (oldValidateSring) {
      const collection = db.collection('users');
      let responseString = await getRandomString(VALIDATE_STRING_ROUND);
      const emailVerifyString = responseString.result ? responseString.result : "";
      let updateData = {
        email_verify_time: getUtcDate(),
        email_verify_string: emailVerifyString
      };
      collection.findOneAndUpdate(
        { email_verify_string: oldValidateSring },
        { $set: updateData },
        { projection: { email: 1, full_name: 1 } },
        (error, result) => {
          if (!error && result && result.value) {
            let email = result && result.value && result.value.email ? result.value.email : "";
            let fullName = result && result.value && result.value.full_name ? result.value.full_name : "";
            let verificationLink = WEBSITE_API_URL + "email_verification/" + emailVerifyString;
            let emailOptions = {
              to: email,
              rep_array: [fullName, verificationLink, verificationLink],
              action: SIGNUP_EMAIL_ACTION,
              subject: SIGNUP_EMAIL_SUBJECT,
            };
            /** Send Email */

            sendEmail(req, res, emailOptions);

            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__("front.user.verification_email_resend_successful"),
              result: { incomplete_action: "verify_email", validate_string: emailVerifyString, email: email },
              error: [],
            });
            // return res.redirect(WEBSITE_FRONT_URL+"email-verification?validate_string="+emailVerifyString);
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__(
                "user.email_already_verified"
              ),
              result: {},
              error: [],
            });
          }
        });
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }
  /** Function is used to resend otp to phone verification **/
  this.resendOtpForPhoneVerification = async (req, res, next) => {
    let validateString = req.body.validate_string ? req.body.validate_string : "";
    let newResponseString = await getRandomString(VALIDATE_STRING_ROUND);
    let newPhoneVerifyString = newResponseString.result ? newResponseString.result : "";
    /** Invalid Request */
    if (!validateString)
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });

    /*** Generate OTP */
    // let mobileValidateOTP = generateOTP(OTP_NUMBER_ROUND);
    let mobileValidateOTP = 1234;
    /** search condition */
    let conditionSearch = {

    };
    conditionSearch["phone_varify_string"] = validateString;

    /** update condition */
    let conditionUpdate = {};
    conditionUpdate["otp"] = Number(mobileValidateOTP);
    conditionUpdate["phone_varify_string"] = newPhoneVerifyString;
    conditionUpdate["otp_expire_time"] = getUtcDate();
    let collection = db.collection("users");
    collection.findOneAndUpdate(
      conditionSearch,
      { $set: conditionUpdate },
      { projection: { first_name: 1, last_name: 1, email: 1 } },
      async (err, result) => {
        if (!err && result && result.lastErrorObject.updatedExisting == true) {
          /*** return success */
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__(
              "front.user.otp_has_been_sent_on_your_registered_mobile_for_verification"
            ),
            result: { validate_string: newPhoneVerifyString, email: result.value.email },
            error: [],
          });
        } else {
          /*** return error */
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.phone_already_verified"),
            result: {},
            error: [],
          });
        }
      }
    );
  };

  this.getStepOneData = (req, res, next) => {
    const email = req.body.email ? req.body.email : "";
    if (email) {
      const collection = db.collection('users');
      collection.findOne(
        { email: email },
        {
          projection: {
            first_name: 1,
            last_name: 1,
            email: 1,
            _id: 0
          }
        },
        (error, result) => {
          if (!error && result) {
            return res.send({
              status: API_STATUS_SUCCESS,
              message: res.__("front.user.user_found_successfully"),
              result: result,
            });
          } else {
            return res.send({
              status: API_STATUS_ERROR,
              message: res.__("front.user.user_not_found"),
              result: {},
              error: {},
            });
          }
        })
    } else {
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: {},
      });
    }
  }

  this.getSignupDocs = (req, res, next) => {
    const masters = db.collection('masters');
    masters.find({ key: "doc_preview", is_deleted: NOT_DELETED, is_active: ACTIVE }, { projection: { name: 1, image: 1 } }).toArray((error, result) => {
      if (!error) {
        /*** return success */
        let options = {
          path: PRODUCT_FILE_URL,
          result: result,
        };
        appendFile(options).then((response) => {
          let finalData = response.result ? response.result : [];
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.records_found_successfully"),
            result: finalData,
            error: [],
          });
        });
      } else {
        /*** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        });
      }
    })
  }
  /** ================== New signup methods ends ================== */

// adding cards backup
// /** This function is used to add card */
//   this.addCard = (req,res,next)=>{
//     const cvv = req.body.cvv ? req.body.cvv : "";
//     const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
//     const card_type = req.body.card_type ? req.body.card_type : "";
//     const card_number = req.body.card_number ? req.body.card_number : "";
//     const expiration_date = req.body.expiration_date ? req.body.expiration_date : "";
//     const card_holder_name = req.body.card_holder_name ? req.body.card_holder_name : "";
//     const users = db.collection('users');
//     const updateData = {
//       id : ObjectId(),
//       cvv : cvv,
//       status : false,
//       card_type : card_type,
//       card_number : card_number,
//       expiration_date : expiration_date,
//       card_holder_name : card_holder_name
//     };
//     users.updateOne({_id:userId},{$push:{cards:updateData}},(err,result)=>{
//       if(!err){
//         return res.send({
//           status: API_STATUS_SUCCESS,
//           message: res.__("front.user.card_added_successfully"),
//           result: {},
//           error: [],
//         });
//       } else {
//         /*** return error */
//         return res.send({
//           status: API_STATUS_ERROR,
//           message: res.__("front.user.something_went_wrong"),
//           result: {},
//           error: [],
//         });
//       }
//     })
//   }/** end addCard */

//   /** This function is used to edit card */
//   this.editCard = (req,res,next)=>{
//     const cvv = req.body.cvv ? req.body.cvv : "";
//     const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
//     const cardId = req.body.card_id ? ObjectId(req.body.card_id) : "";
//     const card_type = req.body.card_type ? req.body.card_type : "";
//     const card_number = req.body.card_number ? req.body.card_number : "";
//     const expiration_date = req.body.expiration_date ? req.body.expiration_date : "";
//     const card_holder_name = req.body.card_holder_name ? req.body.card_holder_name : "";
//     const users = db.collection('users');
//     const updateData = {
//       "cards.$.cvv" : cvv,
//       "cards.$.card_type" : card_type,
//       "cards.$.card_number" : card_number,
//       "cards.$.expiration_date" : expiration_date,
//       "cards.$.card_holder_name" : card_holder_name
//     };
//     users.updateOne({_id:userId,"cards.id":cardId},{$set:updateData},(err,result)=>{
//       if(!err){
//         return res.send({
//           status: API_STATUS_SUCCESS,
//           message: res.__("front.user.card_updated_successfully"),
//           result: {},
//           error: [],
//         });
//       } else {
//         /*** return error */
//         return res.send({
//           status: API_STATUS_ERROR,
//           message: res.__("front.user.something_went_wrong"),
//           result: {},
//           error: [],
//         });
//       }
//     })
//   }/**end editCard */

//   /** This function is used to edit card */
//   this.getCards = (req,res,next)=>{
//     const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
//     const users = db.collection('users');
//     users.aggregate([
//       {
//         $match: {
//           _id: userId
//         }
//       },
//       {
//         $project: {
//           "cards.id": 1,
//           "cards.cvv": 1,
//           "cards.status": 1,
//           "cards.card_type": 1,
//           "cards.card_number": 1,
//           "cards.expiration_date": 1,
//           "cards.card_holder_name": 1,
//         }
//       },
//     ]).toArray((err,result)=>{
//       if(!err && result){
//         return res.send({
//           status: API_STATUS_SUCCESS,
//           message: res.__("front.user.records_found_successfully"),
//           result: result[0],
//           error: [],
//         });
//       } else {
//         /*** return error */
//         return res.send({
//           status: API_STATUS_ERROR,
//           message: res.__("front.user.record_not_found"),
//           result: {},
//           error: [],
//         });
//       }
//     })
//   }/**end getCard */

//   /** this function is used to set default card */
//   this.setDefaultCard = (req,res,next)=>{
//     const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
//     const cardId = req.body.card_id ? ObjectId(req.body.card_id) : "";
//     const users = db.collection('users');
//     const updateData = {
//       "cards.$.status" : true
//     };
//     let removeStatusActive = (addressStatus)=>{
//       return new Promise((resolve)=>{
//           const users = db.collection("users");
//           users.updateOne(
//             {_id:ObjectId(userId)},
//             {$set:{"cards.$[].status":false}},
//             (error,result)=>{
//               resolve();
//             }
//           )
//       });
//     }
//     removeStatusActive().then(()=>{
//       users.updateOne(
//         {_id:userId,"cards.id":cardId},
//         {
//           $set:updateData
//         },(err,result)=>{
//         if(!err){
//           return res.send({
//             status: API_STATUS_SUCCESS,
//             message: res.__("front.user.card_set_as_default"),
//             result: {},
//             error: [],
//           });
//         } else {
//           /*** return error */
//           return res.send({
//             status: API_STATUS_ERROR,
//             message: res.__("front.user.something_went_wrong"),
//             result: {},
//             error: [],
//           });
//         }
//       })
//     })
//   }/**end setDefaultCard */

  /** This function is used to get notification setting */
  this.getEmailNotificationSetting = (req,res,next)=>{
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    const collection = db.collection('users');
    collection.findOne({_id:userId},{projection:{email_notifications:1}},(err,result)=>{
      if (!err) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.card_set_as_default"),
          result: result,
          error: [],
        });
      } else {
        /*** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        });
      }
    })
  }/** End getEmailNotificationSetting() */

  /** This function is used to set notification setting */  
  this.setEmailNotificationSetting = (req,res,next)=>{
    const userId = req.body.user_id ? ObjectId(req.body.user_id) : "";
    const statusReq = req.body.status;
    const status = (statusReq == true) || (statusReq == 'true') ? ACTIVE : DEACTIVE;
    const collection = db.collection('users');
    collection.updateOne({_id:userId},{$set:{email_notifications:status}},(err,result)=>{
      let message = res.__("front.user.email_notifications_disabled");
      if(status){
        message = res.__("front.user.email_notifications_enabled");
      }
      if (!err) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: message,
          result: {},
          error: [],
        });
      } else {
        /*** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        });
      }
    })
  }/** End setEmailNotificationSetting() */

  /** This function is used to delete user notification */  
  this.deleteNotification = (req,res,next)=>{
    const notificationId = req.body.id ? ObjectId(req.body.id) : "";
    const collection = db.collection('notifications');
    collection.updateOne({_id:notificationId},{$set:{is_deleted:DELETED}},(err,result)=>{
      if (!err) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.notification_deleted_success"),
          result: {},
          error: [],
        });
      } else {
        /*** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
        });
      }
    })
  }/** End deleteNotification() */

  /** This function is used to get user's earnings */
  this.getUserEarnings = (req,res,next)=>{
    const userId = req.body.user_id ? ObjectId(req.body.user_id): "";
    const collection = db.collection("orders");
    const findCondition = {
      order_status : {
        $in:[
          API_ORDER_RATED,
          API_ORDER_RETURNED,
          API_ORDER_DELIVERED,
          API_ORDER_RETURN_REQ_REJECT,
          API_ORDER_RETURN_REQ_ACCEPT]
      },
      seller_id : userId,
      is_deleted : NOT_DELETED,
    };
    async.parallel({
      data:(callback)=>{
        collection.aggregate([
          { $match: findCondition},
          {
            $lookup: {
              from: "products",
              let: { productId: "$product_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$_id", "$$productId"] }],
                    },
                  },
                },
                {
                  $project:{
                    product_title : 1,
                  }
                }
              ],
              as: "product_details",
            },
          },
          { $project: {
            order_id : 1,
            delivered_time : 1,
            product_details : {"$arrayElemAt":["$product_details",0]},
            product_price : 1,
            order_status:1
          } },
        ])
        .toArray((err, result) => {
          callback(err,result);
        });
      },
      totalEarnings:(callback)=>{
        collection.aggregate(
          [
            { $match: {
              order_status:{
                $in:[
                  API_ORDER_RATED,
                  API_ORDER_DELIVERED,
                ]
              },
              seller_id : userId,
              is_deleted : NOT_DELETED,
            }},
            {
              $group:
                {
                  _id: { },
                  total_amount: { $sum: "$product_price" }
                }
            }
          ]
       ).toArray((err,result)=>{
          callback(err,result);
       })
      }
    },
    (err, result) => {
      if (!err) {
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.notification_deleted_success"),
          result: result,
          error: [],
        });
      } else {
        /*** return error */
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.record_not_found"),
          result: {},
          error: [],
        });
      }
    }
    )
    
  };/** End getUserEarnings() */
}


module.exports = new User();