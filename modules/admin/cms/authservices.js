const router = require("express").Router();
const { check, validationResult } = require("express-validator/check");
const { matchedData, sanitize } = require("express-validator/filter");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AppGuide = require("../models/appguides");
const Blog = require("../models/blogs");
const cms = require("../models/cms");
const Emailtemplates = require("../models/emailtemplates");
const checkJWT = require("../middlewares/check-jwt");
const urlSlug = require("url-slug");
const crypto = require("crypto");
const multer = require("multer");
const formidable = require("formidable");
const LearningLanguage = require("../models/learninglanguages");
const Languages = require("../models/languages");
const Setting = require("../models/settings");
const terms = require("../models/terms");
const Method = require("../models/methods");
const MethodImage = require("../models/methodimage");
const Home = require("../models/home");
const HomeImage = require("../models/homeimage");
const mongoose = require("mongoose");
const moment = require("moment");
const ObjectId = mongoose.Types.ObjectId;
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const config = require('../config/configdb');
const appfunctions = require("./AppFunctions/app_functions");
const bcrypt = require("bcryptjs");
const webhooks = require('../models/webhooks')
const webhookApple = require('../models/webhookapple')
const Ratings = require('../models/ratings')
const UserSubs = require("../models/user_subscription")
const Transaction = require("../models/transactions")
const Testimonials = require("../models/testimonials")
const BaseSusb = require("../models/basesubscription");
const Price = require("../models/price");
const PriceImage = require("../models/priceimage");
//var logger = require('winston')
// for google in app
const {google} = require('googleapis');
const account = require('./googleInAppFile.json');


const JWTClient = new google.auth.JWT(
  account.client_email,
  null,
  account.private_key,
  ["https://www.googleapis.com/auth/androidpublisher"]
);

const playDeveloperApiClient = google.androidpublisher({
  version: 'v3',
  auth: JWTClient
});

router.post('/login', function (req, res, next) {

  passport.authenticate('front', { session: false }, async function (err, user, info) {

    // console.log("userrrr: ", user);
    if (err) { res.json(appfunctions.failResponse("msg_something_wrong", err)); }
    if (!user) {
      res.json(appfunctions.failResponse(info.message, err));
    } else {

      if (user && user.token != '') {
        user.token = '';
      }

      if (user.status == 1 && user.block == 0) {

        const jwttoken = jwt.sign(JSON.stringify(user), config.secret);
        user.first_time = 0
        user.login_with_social = 2
        user.version = req.body.version ? req.body.version = '1.0' : ""
        user.token = jwttoken
        user.save(
          async (errs, resultnew) => {
            if (errs) {
              res.json(appfunctions.failResponse("msg_something_wrong", errs));
            } else {
              let demoLesson = await appfunctions.getLessonData(user.learning_language_id, user.language_id)
              if (!user.username || user.username == "" || user.username == null) user['username'] = user.name + " " + user.surname;
              user = JSON.stringify(resultnew);
              user = JSON.parse(user);
              user.token = jwttoken;
              user.login_with_social = 2;
              user.lesson_id = demoLesson.data[0] != undefined ? demoLesson.data[0]._id : "";
              res.json(appfunctions.successResponse("msg_login_successfully", user));
            }
          });
      } else if (user.status == 1 && user.block == 1) {
        res.json(appfunctions.failResponse('msg_account_block_by_admin'));
      } else {
        var otp = Math.floor(1000 + Math.random() * 9000);
        user.otp = otp;
        user.version = req.body.version ? req.body.version : '1.0';
        login_with_social = 2;
        user.save((errs, user) => {
          Emailtemplates.findOne(
            {
              slug: "verification_otp",
              language_id: ObjectId(user.language_id)
            },
            async (err, template) => {

              if (err) {
                res.json(appfunctions.failResponse("msg_something_wrong"));
              }
              else {
                if (template) {
                  // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname)
                  var templatereplace = user.username && user.username != "" ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                  var issEmailSent = appfunctions.sendEmail(
                    template.subject,
                    user.email,
                    res.locals.app_title + ' <' + config.emailFrom + '>',
                    templatereplace
                  );
                  if (issEmailSent == false) {
                    res.json(appfunctions.failResponse("msg_email_not_send"));
                  } else {
                    if (user.lead_id) {
                      let datas = await appfunctions.updateUserByColumn(user._id, "lastemailreceived", moment(), user)
                    }
                    res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                  }
                }
                else {
                  Emailtemplates.findOne(
                    {
                      slug: "verification_otp",
                      language_id: ObjectId(config.defaultLanguageId)
                    },
                    (err, template) => {

                      if (err) {
                        res.json(appfunctions.failResponse("msg_something_wrong"));
                      } else {
                        //console.log(res.locals.app_title+'res.locals.app_title')
                        // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                        var templatereplace = user.username && user.username != "" ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                        var issEmailSent = appfunctions.sendEmail(template.subject, user.email, res.locals.app_title + ' <' + config.emailFrom + '>', templatereplace);
                        if (issEmailSent == false) {
                          res.json(appfunctions.failResponse("msg_email_not_send"));
                        } else {
                          res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user,));
                        }
                      }
                    })
                }
              }
            });

        });
      }
    }
  })(req, res, next);
});

//For login with facebook
router.post("/loginwithfacebook", (req, res, next) => {
  name = req.body.name;
  facebook_id = req.body.facebook_id;
  email = req.body.email ? req.body.email : "";
  User.findOne(
    {
      facebook_id: req.body.facebook_id,
      role_id: 2
    },
    (err, existingUser) => {
      if (existingUser) {
        if (existingUser.token != '') {
          existingUser.token = '';
        }
        const jwttoken = jwt.sign(JSON.stringify(existingUser), config.secret);
        existingUser.token = jwttoken;
        existingUser.login_with_social = 1;
        existingUser.device_type = req.body.device_type ? req.body.device_type : "";
        existingUser.language_id = req.body.language_id;
        // existingUser.first_time = 0;
        existingUser.save(async (errs, existingUser) => {
          if (errs) {
            res.json(appfunctions.failResponse("msg_something_wrong", errs));
          } else {
            if (
              existingUser.surname == "" ||
              existingUser.name == "" ||
              existingUser.email == ""
            ) {
              var data = JSON.stringify(existingUser);
              data = JSON.parse(data);
              data.isCompleted = 0;
              res.status(200).json({
                success: true,
                data: data,
                message: "msg_login"
              });
            }

            else {
              if (existingUser.status == 1 && existingUser.block == 0) {
                const jwttoken = jwt.sign(JSON.stringify(existingUser), config.secret);
                existingUser.token = jwttoken;
                existingUser.first_time = 0;
                let demoLesson = await appfunctions.getLessonData(existingUser.learning_language_id, existingUser.language_id)
                existingUser.save((errs, userlogin) => {
                  var data = JSON.stringify(userlogin);
                  data = JSON.parse(data);
                  data.isCompleted = 1;
                  data.lesson_id = demoLesson.data[0]._id;
                  data.login_with_social = 1;
                  res.json(appfunctions.successResponse("msg_login_successfully", data));
                })
              } else if (existingUser.status == 1 && existingUser.block == 1) {
                res.json(appfunctions.failResponse('msg_account_block_by_admin'));
              } else {
                var otp = Math.floor(1000 + Math.random() * 9000);
                existingUser.otp = otp;
                existingUser.login_with_social = 1;
                existingUser.save((errs, user) => {
                  Emailtemplates.findOne(
                    {
                      slug: "verification_otp",
                      language_id: ObjectId(user.language_id)
                    },
                    (err, template) => {

                      if (err) {
                        res.json(appfunctions.failResponse("msg_something_wrong"));
                      }
                      else {
                        if (template) {

                          // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                          var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                          var issEmailSent = appfunctions.sendEmail(
                            template.subject,
                            user.email,
                            //config.emailFrom,
                            res.locals.app_title + ' <' + config.emailFrom + '>',
                            templatereplace
                          );
                          if (issEmailSent == false) {
                            res.json(appfunctions.failResponse("msg_email_not_send"));
                          } else {
                            user.isCompleted = 1;
                            res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                          }
                        }
                        else {
                          Emailtemplates.findOne(
                            {
                              slug: "verification_otp",
                              language_id: ObjectId(config.defaultLanguageId)
                            },
                            (err, template) => {

                              if (err) {
                                res.json(appfunctions.failResponse("msg_something_wrong"));
                              }
                              else {

                                // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                var issEmailSent = appfunctions.sendEmail(
                                  template.subject,
                                  user.email,
                                  //config.emailFrom,
                                  res.locals.app_title + ' <' + config.emailFrom + '>',
                                  templatereplace
                                );
                                if (issEmailSent == false) {
                                  res.json(appfunctions.failResponse("msg_email_not_send"));
                                } else {
                                  user.isCompleted = 1;
                                  res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                }
                              }
                            })
                        }

                      }
                    });

                });
              }
            }
          }
        });
      } else {
        let data = new Object();
        data['email'] = req.body.email;
        data['name'] = req.body.name;
        data['facebook_id'] = req.body.facebook_id;
        data['isCompleted'] = 0;
        res.json(appfunctions.successResponse("msg_complete_profile", data));
      }
    }
  );
});

//For login with Google
router.post("/loginwithgoogle", (req, res, next) => {

  name = req.body.name;
  google_id = req.body.google_id;
  email = req.body.email;
  User.findOne(
    {
      google_id: req.body.google_id,
      role_id: 2,
    },
    (err, existingUser) => {
      if (existingUser) {
        if (existingUser.token != '') {
          existingUser.token = '';
        }
        existingUser.device_type = req.body.device_type
          ? req.body.device_type
          : "";
        existingUser.language_id = req.body.language_id;

        existingUser.save((errs, existingUser) => {

          if (errs) {
            res.json(appfunctions.failResponse("msg_something_wrong", errs));
          } else {
            if (existingUser.email == "" || !existingUser.email) {
              var data = JSON.stringify(existingUser);
              data = JSON.parse(data);
              data.isCompleted = 0;

              res.status(200).json({
                success: true,
                data: data,
                message: "msg_success"
              });
            } else {
              if (existingUser.status == 1 && existingUser.block == 0) {
                const jwttoken = jwt.sign(JSON.stringify(existingUser), config.secret);
                existingUser.token = jwttoken;
                existingUser.first_time = 0;
                existingUser.save((errs, userlogin) => {
                  var data = JSON.stringify(userlogin);
                  data = JSON.parse(data);
                  data.isCompleted = 1;
                  data.login_with_social = 1;
                  res.json(appfunctions.successResponse("msg_login_successfully", data));
                })
              } else if (existingUser.status == 1 && existingUser.block != undefined && existingUser.block == 1) {
                res.json(appfunctions.failResponse('msg_account_block_by_admin'));
              } else {
                var otp = Math.floor(1000 + Math.random() * 9000);
                existingUser.otp = otp;
                existingUser.version = req.body.version ? req.body.version : '1.0';
                existingUser.save((errs, user) => {
                  var user = user;
                  Emailtemplates.findOne(
                    {
                      slug: "verification_otp",
                      language_id: ObjectId(user.language_id)
                    },
                    (err, template) => {
                      if (err) {
                        res.json(appfunctions.failResponse("msg_something_wrong"));
                      }
                      else {

                        if (template) {
                          // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                          var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                          var issEmailSent = appfunctions.sendEmail(
                            template.subject,
                            user.email,
                            //config.emailFrom,
                            res.locals.app_title + ' <' + config.emailFrom + '>',
                            templatereplace
                          );
                          if (issEmailSent == false) {
                            res.json(appfunctions.failResponse("msg_email_not_send"));
                          } else {
                            res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                          }
                        }
                        else {
                          Emailtemplates.findOne(
                            {
                              slug: "verification_otp",
                              language_id: ObjectId(config.defaultLanguageId)
                            },
                            (err, template) => {

                              if (err) {
                                res.json(appfunctions.failResponse("msg_something_wrong"));
                              }
                              else {
                                // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                var issEmailSent = appfunctions.sendEmail(
                                  template.subject,
                                  user.email,
                                  //config.emailFrom,
                                  res.locals.app_title + ' <' + config.emailFrom + '>',
                                  templatereplace
                                );
                                if (issEmailSent == false) {
                                  res.json(appfunctions.failResponse("msg_email_not_send"));
                                } else {
                                  let usernew = JSON.stringify(user);
                                  //console.log(user.__proto__)
                                  usernew = JSON.parse(usernew);
                                  usernew.isCompleted = 1;
                                  res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", usernew));
                                }
                              }
                            })
                        }

                      }
                    });

                });
              }
            }
          }
        });
      } else {
        var data = new Object();
        data.google_id = req.body.google_id
        data.email = req.body.email
        data.name = req.body.name ? req.body.name : "";
        data.isCompleted = 0;
        res.json(appfunctions.successResponse("msg_complete_profile", data, req.user));
      }
    }
  );
});

//For getting list of all terms according to language
router.post("/terms", (req, res, next) => {
  //console.log(req.body);
  var language_id = req.body.language_id;
  var eng_language_id = config.defaultLanguageId;
  //console.log(language_id)
  var query = terms
    .find({ language_id: eng_language_id })
    .select(["term", "text"]);
  query.exec(function (err, result) {
    if (err)
      res.status(500).json({
        success: false,
        message: "msg_something_wrong"
      });
    // __logger.error("result", JSON.stringify(result));
    var query1 = terms
      .find({ language_id: language_id })
      .select(["term", "text"]);
    query1.exec(function (err1, result1) {
      // __logger.error("result1", JSON.stringify(result1));
      if (err1) {
        res.json(appfunctions.failResponse("msg_something_wrong"));
      }
      var trm = {};
      for (var i = 0; i < result.length; i++) {
        trm[result[i].term] = result[i].text;
      }

      for (var i = 0; i < result1.length; i++) {
        if (result1[i].text != null && result1[i].text != '') {
          trm[result1[i].term] = result1[i].text;
        }

      }
      if (language_id) {
        // __logger.error("language_id result  " + result1 + "terms err1" + trm);
        res.json(appfunctions.successResponse("msg_provide_language", trm, req.user, 200, language_id));
      } else {
        res.json(appfunctions.successResponse("msg_provide_language", "", req.user, '', language_id));
      }
    });
  });
});

//For getting last inserted term date for updating currently running terms in the app
router.post("/getLastInsertedTermDate", (req, res, next) => {
  var language_id = ObjectId(req.body.language_id);
  let d1 = '';
  Languages.findOne({ _id: language_id }).exec(function (err, result) {
    if (err)
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    if (result) {
      d1 = result.last_updated_date;
    } else {
      Languages.findOne({ _id: ObjectId(config.defaultLanguageId) }).exec(function (err, result) {
        if (err)
          res.json(appfunctions.failResponse("msg_something_wrong", err));
        d1 = result.last_updated_date;
      })
    }
    let dattime = d1;
    Setting.findOne({}, (err1, sett) => {
      let userInfo = {};
      userInfo.earliest_permitted_version = sett.earliest_permitted_version;
      userInfo.earliest_permitted_warning_version = sett.earliest_permitted_warning_version;
      userInfo.is_system_suspended = sett.is_system_suspended;
      console.log("getLastInsertedTermDate ----> ", { date: dattime, system_info: userInfo });
      res.json(appfunctions.successResponse("msg_success", { date: dattime, system_info: userInfo }, req.user));
    });
  });
});

//For checking user's last approve terms and conditions
router.post("/checkTermsConditions", (req, res, next) => {
  User.findOne(
    {
      _id: ObjectId(req.body.user_id)
    },
    (err, uInst) => {
      if (err) {
        res.json(failResponse("msg_something_wrong"));
      } else {
        if (uInst) {
          termsConditions.findOne({}, (err, result) => {
            if (err) {
              res.status(500).json({
                success: false,
                message: "msg_something_wrong"
              });
            } else {
              var d1 = new Date(
                moment(uInst.last_confirm_terms).format("MM-DD-YYYY")
              );
              var d2 = new Date(moment(result.terms_date).format("MM-DD-YYYY"));
              if (
                uInst.last_confirm_terms != null &&
                d1.getTime() >= d2.getTime()
              ) {
                /* res.status(200).json({
                   success: true,
                   data: 1,
                   message: "msg_success"
                 });*/
                res.json(appfunctions.successResponse("msg_success", 1, req.user));
              } else {
                res.json(appfunctions.successResponse("msg_success", 0, req.user));
                /* res.status(200).json({
                   success: true,
                   data: 0,
                   message: "msg_success"
                 });*/
              }
            }
          });
        }
      }
    }
  );
});

//For getting list of languages
router.get("/languages", (req, res, next) => {
  let language_id = config.defaultLanguageId;
  Languages
    .aggregate([{
      $lookup: {
        from: "terms",
        let: {
          slug: "$term",         ///$term form language table column               
        },
        pipeline: [{
          $match: {
            $expr: {
              $and: [{
                $eq: [{
                  $arrayElemAt: ["$language_id", 0]
                }, ObjectId(language_id)]
              },
              {
                $eq: ["$term", '$$slug']  //$term from term table column
              },
              ]
            }
          }
        }],
        as: "terms"
      }
    },
    {
      $unwind: {
        path: "$terms",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: "$_id",
        term: "$term",
        label: { $cond: { if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ''] }, then: "$language", else: "$terms.text" } },
        "casesensitivetext": { "$toLower": { $cond: { if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ''] }, then: "$language", else: "$terms.text" } } },
        value: "$_id",

      }
    },
    {
      $sort: {
        "casesensitivetext": 1
      }
    },
    ])
    .exec(function (err, result) {
      //console.log(JSON.stringify(result)+'languages');
      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong", err));
      } else {
        res.json(appfunctions.successResponse("msg_success", result));
      }
    });
});

//GET ALL LEARNING LANGUAGES
router.get("/learningLanguages/:lang_id", async (req, res, next) => {
  //let language_id = (req.user && req.user.language_id._id) ? req.user.language_id._id : config.defaultLanguageId; //ObjectId("5bebcde54974e2dc675a39f1");
  let language_id = ObjectId(req.params.lang_id);
  let languages = await appfunctions.getLanguageDetailsById(language_id);
  LearningLanguage.aggregate([{
    $lookup: {
      from: "terms",
      let: {
        slug: "$term"
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: [{
                $arrayElemAt: ["$language_id", 0]
              }, ObjectId(language_id)]
            },
            {
              $eq: ["$term", '$$slug']
            },
            ]
          }
        }
      }],
      as: "terms"
    }
  },
  { $match: { term_english: { $ne: languages.language } } },
  {
    $unwind: {
      path: "$terms",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $project: {
      _id: "$_id",
      term: "$term",
      termtext: { $cond: { if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ''] }, then: "$term_english", else: "$terms.text" } },
      "casesensitivetext": { "$toLower": { $cond: { if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ''] }, then: "$term_english", else: "$terms.text" } } },
      language_id: {
        $arrayElemAt: ["$terms.language_id", 0]
      },
      order: '$order'

    }
  },
  {
    $sort: {
      "order": 1
    }
  },
  ])
    .exec(function (err, result) {
      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong", err));
      } else {
        res.json(appfunctions.successResponse("msg_success", result));
      }
    });
});

//set the directory for the uploads to the uploaded to
const DIR = "./public/uploads";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {

    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage: storage }).single("photo");

//For uploading image to server
router.post("/uploadPic", (req, res, next) => {

  upload(req, res, function (err) {
    var path = "";
    if (err) {
      // console.log(err);
      res.json({
        success: false,
        message: "msg_profile_not_updated_server_issue"
      });
    }

    if (req.file) path = req.file.path;
    if (path) {
      path = path.replace("public/", "");
      res.json({
        success: true,
        message: "msg_success",
        data: path
      });
    }
  });
});

//For user registration
router.post("/registration", (req, res, next) => {
  console.log("req.bodyfromsignup",req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(500).json({
      success: false,
      message: errors.mapped()
    });
  } else {
    //console.log(JSON.stringify(req.body)+'req.body');
    if (req.body.isFacebook == 1) {
      User.findOne({ facebook_id: req.body.facebook_id }, (err, user) => {
        if (err) {
          res.json(appfunctions.failResponse("msg_not_valid_user"));
        } else {
          if (user != null && user.status == 1) {
            user.facebook_id = req.body.facebook_id;
            user.login_with_social = 1;
            user.save((errs, loginuser) => {
              if (errs) {
                res.json(appfunctions.failResponse("msg_something_wrong", errs));
              } else {
                var data = JSON.stringify(user);
                data = JSON.parse(data);
                data.isCompleted = 1;
                res.status(200).json({
                  success: true,
                  data: data,
                  message: "msg_login_successfully"
                });
              }
            })
          } else if (user != null && user.status == 0) {
            if (req.body.username) user.username = req.body.username;
            if (req.body.surname) user.surname = req.body.surname;
            if (req.body.gender) user.gender = req.body.gender;
            if (req.body.name) user.name = req.body.name;
            if (req.body.email) user.email = req.body.email;
            if (req.body.language_id) user.language_id = req.body.language_id;
            if (req.body.facebook_id) user.facebook_id = req.body.facebook_id;
            user.role_id = 2;
            user.version = req.body.version ? req.body.version : '1.0';
            user.status = 0; //req.body.status;
            user.learning_language_id = req.body.learning_language_id ? req.body.learning_language_id : req.body.learning_language_id;
            User.findOne({ email: req.body.email }, (err, existingUser) => {
              if (existingUser) {
                res.json(appfunctions.failResponse("msg_email_already_exist"));
              } else {
                var otp = Math.floor(1000 + Math.random() * 9000);
                user.otp = otp;
                user.login_with_social = 1;
                user.save((errs, user) => {
                  if (errs) {
                    res.json(appfunctions.failResponse("msg_something_wrong", errs));
                  } else {
                    Emailtemplates.findOne(
                      {
                        slug: "verification_otp",
                        language_id: ObjectId(user.language_id)
                      },
                      (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        }
                        else {
                          if (template) {
                            // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          }
                          else {
                            Emailtemplates.findOne(
                              {
                                slug: "verification_otp",
                                language_id: ObjectId(config.defaultLanguageId)
                              },
                              (err, template) => {

                                if (err) {
                                  res.json(appfunctions.failResponse("msg_something_wrong"));
                                }
                                else {
                                  // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                  var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                  var issEmailSent = appfunctions.sendEmail(
                                    template.subject,
                                    user.email,
                                    //config.emailFrom,
                                    res.locals.app_title + ' <' + config.emailFrom + '>',
                                    templatereplace
                                  );
                                  if (issEmailSent == false) {
                                    res.json(appfunctions.failResponse("msg_email_not_send"));
                                  } else {
                                    res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                  }
                                }
                              })
                          }
                        }
                      });
                  }
                });
              }
            });
          } else {
            User.findOne({ email: req.body.email }, (err, existingUser) => {
              if (existingUser) {
                if (existingUser.status == 1) {
                  existingUser.facebook_id = req.body.facebook_id;
                  existingUser.login_with_social = 1;
                  existingUser.save((errs, loginuser) => {
                    if (errs) {
                      res.json(appfunctions.failResponse("msg_something_wrong", errs));
                    } else {
                      var data = JSON.stringify(existingUser);
                      data = JSON.parse(data);
                      data.isCompleted = 1;
                      res.status(200).json({
                        success: true,
                        data: data,
                        message: "msg_login_successfully"
                      });
                    }
                  })
                } else if (existingUser.status == 0) {
                  var otp = Math.floor(1000 + Math.random() * 9000);
                  existingUser.otp = otp;
                  existingUser.facebook_id = req.body.facebook_id;
                  existingUser.save((error, user) => {
                    if (error) {
                      json(appfunctions.failResponse("msg_something_wrong", errs));
                    } else {
                      Emailtemplates.findOne({ slug: "verification_otp", language_id: ObjectId(user.language_id) }, (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        } else {
                          if (template) {
                            // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          } else {
                            Emailtemplates.findOne({ slug: 'verification_otp', language_id: ObjectId(config.defaultLanguageId) }, (err, template) => {
                              if (err) {
                                res.json(appfunctions.failResponse("msg_something_wrong"));
                              }
                              else {
                                // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                var issEmailSent = appfunctions.sendEmail(
                                  template.subject,
                                  user.email,
                                  //config.emailFrom,
                                  res.locals.app_title + ' <' + config.emailFrom + '>',
                                  templatereplace
                                );
                                if (issEmailSent == false) {
                                  res.json(appfunctions.failResponse("msg_email_not_send"));
                                } else {
                                  res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                }
                              }
                            })
                          }
                        }
                      })
                    }
                  })
                } else {
                  res.json(appfunctions.failResponse("msg_email_already_exist"));
                }
              } else {
                let user = new User();
                if (req.body.username) user.username = req.body.username;
                if (req.body.gender) user.gender = req.body.gender;
                if (req.body.name) user.name = req.body.name;
                if (req.body.email) user.email = req.body.email;
                if (req.body.surname) user.surname = req.body.surname;
                if (req.body.language_id) user.language_id = req.body.language_id;
                if (req.body.facebook_id) user.facebook_id = req.body.facebook_id;
                user.role_id = 2;
                user.version = req.body.version ? req.body.version : '1.0';
                user.status = 0; //req.body.status;
                user.learning_language_id = req.body.learning_language_id;
                var otp = Math.floor(1000 + Math.random() * 9000);
                user.otp = otp;
                user.login_with_social = 1;
                user.save(async (errs, user) => {
                  if (errs) {
                    res.json(appfunctions.failResponse("msg_something_wrong", errs));
                  } else {
                    if (user && user.lead_id == "") {
                      let sharpuser = await appfunctions.sharpSpring(user._id, 'createLeads', user, '');
                      if (sharpuser.data && sharpuser.data.success && sharpuser.data.id) {
                        let userData = await appfunctions.updateUserByColumn(user._id, "lead_id", sharpuser.data.id, user)
                      } else {
                        //res.json(appfunctions.successResponse("msg_success", sharpuser));
                      }
                    }
                    Emailtemplates.findOne(
                      {
                        slug: "verification_otp",
                        language_id: ObjectId(user.language_id)
                      },
                      (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        }
                        else {
                          if (template) {
                            // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          }
                          else {
                            Emailtemplates.findOne(
                              {
                                slug: "verification_otp",
                                language_id: ObjectId(config.defaultLanguageId)
                              },
                              (err, template) => {

                                if (err) {
                                  res.json(appfunctions.failResponse("msg_something_wrong"));
                                }
                                else {
                                  // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                  var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                  var issEmailSent = appfunctions.sendEmail(
                                    template.subject,
                                    user.email,
                                    //config.emailFrom,
                                    res.locals.app_title + ' <' + config.emailFrom + '>',
                                    templatereplace
                                  );
                                  if (issEmailSent == false) {
                                    res.json(appfunctions.failResponse("msg_email_not_send"));
                                  } else {
                                    res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                  }
                                }
                              })
                          }
                        }
                      });
                  }
                });
              }
            });
          }
        }
      });
    } else if (req.body.isGoogle == 1) {
      User.findOne({ google_id: req.body.google_id }, (err, user) => {
        if (err) {
          res.json(appfunctions.failResponse("msg_not_valid_user"));
        } else {
          if (user != null && user.status == 1) {
            user.google_id = req.body.google_id;
            user.login_with_social = 1;
            user.save((errs, loginuser) => {
              if (errs) {
                res.json(appfunctions.failResponse("msg_something_wrong", errs));
              } else {
                var data = JSON.stringify(user);
                data = JSON.parse(data);
                data.isCompleted = 1;
                res.json(appfunctions.successResponse("msg_login_successfully", data));
              }
            })
          } else if (user != null && user.status == 0 && user.email == null) {
            if (req.body.username) user.username = req.body.username;
            if (req.body.surname) user.surname = req.body.surname;
            if (req.body.gender) user.gender = req.body.gender;
            if (req.body.name) user.name = req.body.name;
            if (req.body.email) user.email = req.body.email;
            if (req.body.language_id) user.language_id = req.body.language_id;
            user.role_id = 2;
            user.version = req.body.version ? req.body.version : '1.0';
            user.status = 0;
            user.learning_language_id = req.body.learning_language_id ? req.body.learning_language_id : req.body.language_id;
            user.login_with_social = 1;
            User.findOne({ email: req.body.email }, (err, existingUser) => {
              if (existingUser) {
                res.json(appfunctions.failResponse("msg_email_already_exist"));
              } else {
                var otp = Math.floor(1000 + Math.random() * 9000);
                user.otp = otp;
                user.save((errs, user) => {
                  if (errs) {
                    res.json(appfunctions.failResponse("msg_something_wrong", errs));
                  } else {
                    Emailtemplates.findOne(
                      {
                        slug: "verification_otp",
                        language_id: ObjectId(user.language_id)
                      },
                      (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        }
                        else {
                          if (template) {
                            // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          }
                          else {
                            Emailtemplates.findOne(
                              {
                                slug: "verification_otp",
                                language_id: ObjectId(config.defaultLanguageId)
                              },
                              (err, template) => {

                                if (err) {
                                  res.json(appfunctions.failResponse("msg_something_wrong"));
                                }
                                else {
                                  // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                  var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                  var issEmailSent = appfunctions.sendEmail(
                                    template.subject,
                                    user.email,
                                    //config.emailFrom,
                                    res.locals.app_title + ' <' + config.emailFrom + '>',
                                    templatereplace
                                  );
                                  if (issEmailSent == false) {
                                    res.json(appfunctions.failResponse("msg_email_not_send"));
                                  } else {
                                    res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                  }
                                }
                              })
                          }
                        }
                      });
                  }
                });
              }
            });
          } else if (user != null && user.status == 0 && user.email != null) {
            var otp = Math.floor(1000 + Math.random() * 9000);
            user.otp = otp;
            user.login_with_social = 1;
            user.save((errs, user) => {
              if (errs) {
                res.json(appfunctions.failResponse("msg_something_wrong", errs));
              } else {
                Emailtemplates.findOne(
                  {
                    slug: "verification_otp",
                    language_id: ObjectId(user.language_id)
                  },
                  (err, template) => {
                    if (err) {
                      res.json(appfunctions.failResponse("msg_something_wrong"));
                    }
                    else {
                      if (template) {
                        // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                        var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                        var issEmailSent = appfunctions.sendEmail(
                          template.subject,
                          user.email,
                          //config.emailFrom,
                          res.locals.app_title + ' <' + config.emailFrom + '>',
                          templatereplace
                        );
                        if (issEmailSent == false) {
                          res.json(appfunctions.failResponse("msg_email_not_send"));
                        } else {
                          res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                        }
                      }
                      else {
                        Emailtemplates.findOne(
                          {
                            slug: "verification_otp",
                            language_id: ObjectId(config.defaultLanguageId)
                          },
                          (err, template) => {

                            if (err) {
                              res.json(appfunctions.failResponse("msg_something_wrong"));
                            }
                            else {
                              // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                              var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                              var issEmailSent = appfunctions.sendEmail(
                                template.subject,
                                user.email,
                                //config.emailFrom,
                                res.locals.app_title + ' <' + config.emailFrom + '>',
                                templatereplace
                              );
                              if (issEmailSent == false) {
                                res.json(appfunctions.failResponse("msg_email_not_send"));
                              } else {
                                res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                              }
                            }
                          })
                      }
                    }
                  });
              }
            });
          } else {

            User.findOne({ email: req.body.email }, (err, existingUser) => {
              if (existingUser) {
                if (existingUser.status == 1) {
                  existingUser.google_id = req.body.google_id;
                  existingUser.login_with_social = 1;
                  existingUser.save((errs, loginuser) => {
                    if (errs) {
                      res.json(appfunctions.failResponse("msg_something_wrong", errs));
                    } else {
                      var data = JSON.stringify(existingUser);
                      data = JSON.parse(data);
                      data.isCompleted = 1;
                      res.status(200).json({
                        success: true,
                        data: data,
                        message: "msg_success"
                      });
                    }
                  })
                } else if (existingUser.status == 0) {
                  existingUser.google_id = req.body.google_id;
                  var otp = Math.floor(1000 + Math.random() * 9000);
                  existingUser.otp = otp;
                  existingUser.login_with_social = 1;
                  existingUser.save((error, user) => {
                    if (error) {
                      json(appfunctions.failResponse("msg_something_wrong", errs));
                    } else {
                      Emailtemplates.findOne({ slug: "verification_otp", language_id: ObjectId(user.language_id) }, (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        } else {
                          if (template) {
                            // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          } else {
                            Emailtemplates.findOne({ slug: 'verification_otp', language_id: ObjectId(config.defaultLanguageId) }, (err, template) => {
                              if (err) {
                                res.json(appfunctions.failResponse("msg_something_wrong"));
                              }
                              else {
                                // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                var issEmailSent = appfunctions.sendEmail(
                                  template.subject,
                                  user.email,
                                  //config.emailFrom,
                                  res.locals.app_title + ' <' + config.emailFrom + '>',
                                  templatereplace
                                );
                                if (issEmailSent == false) {
                                  res.json(appfunctions.failResponse("msg_email_not_send"));
                                } else {
                                  res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                }
                              }
                            })
                          }
                        }
                      })
                    }
                  })
                } else {
                  res.json(appfunctions.failResponse("msg_email_already_exist"));
                }
              } else {
                let user = new User();
                if (req.body.gender) user.gender = req.body.gender;
                if (req.body.name) user.name = req.body.name;
                if (req.body.email) user.email = req.body.email;
                if (req.body.language_id) user.language_id = req.body.language_id;
                if (req.body.google_id) user.google_id = req.body.google_id;
                user.role_id = 2;
                user.version = req.body.version ? req.body.version : '1.0';
                user.status = 0; //req.body.status;
                user.login_with_social = 1;
                user.learning_language_id = req.body.learning_language_id;
                var otp = Math.floor(1000 + Math.random() * 9000);
                user.otp = otp;
                user.save(async (errs, user) => {
                  if (errs) {
                    res.json(appfunctions.failResponse("msg_something_wrong", errs));
                  } else {
                    if (user && user.lead_id == "") {
                      let sharpuser = await appfunctions.sharpSpring(user._id, 'createLeads', user, '');
                      if (sharpuser.data && sharpuser.data.success && sharpuser.data.id) {
                        let userData = await appfunctions.updateUserByColumn(user._id, "lead_id", sharpuser.data.id, user)
                      } else {
                        //res.json(appfunctions.successResponse("msg_success", sharpuser));
                      }
                    }
                    Emailtemplates.findOne(
                      {
                        slug: "verification_otp",
                        language_id: ObjectId(user.language_id)
                      },
                      (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        }
                        else {
                          if (template) {
                            // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          }
                          else {
                            Emailtemplates.findOne(
                              {
                                slug: "verification_otp",
                                language_id: ObjectId(config.defaultLanguageId)
                              },
                              (err, template) => {

                                if (err) {
                                  res.json(appfunctions.failResponse("msg_something_wrong"));
                                }
                                else {
                                  // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                                  var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                  var issEmailSent = appfunctions.sendEmail(
                                    template.subject,
                                    user.email,
                                    //config.emailFrom,
                                    res.locals.app_title + ' <' + config.emailFrom + '>',
                                    templatereplace
                                  );
                                  if (issEmailSent == false) {
                                    res.json(appfunctions.failResponse("msg_email_not_send"));
                                  } else {
                                    res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                  }
                                }
                              })
                          }
                        }
                      });
                  }
                });
              }
            });
          }
        }
      });
    } else {
      User.findOne({ email: req.body.email }, (err, existingUser) => {
        if (err) {
          res.json(appfunctions.failResponse("msg_email_already_exist"));
        } else {
          if (existingUser) {
            res.json(appfunctions.failResponse("msg_email_already_exist"));
          } else {
            let user = new User();
            if (req.body.username) user.username = req.body.username;
            if (req.body.surname) user.surname = req.body.surname;
            if (req.body.gender) user.gender = req.body.gender;
            if (req.body.name) user.name = req.body.name;
            if (req.body.email) user.email = req.body.email;
            if (req.body.password) user.password = req.body.password;
            if (req.body.language_id) user.language_id = req.body.language_id;
            if (req.body.learning_language_id) user.learning_language_id = req.body.learning_language_id;
            user.role_id = 2;
            user.version = req.body.version ? req.body.version : '1.0';
            user.status = 0; //req.body.status;              
            user.login_with_social = 2;
            user.isWeclomeProceed = 0;
            User.findOne({ email: req.body.email }, (err, existingUser) => {
              if (existingUser && existingUser.status == 1) {
                res.json(appfunctions.failResponse("msg_email_already_exist"));
              } else {
                var otp = Math.floor(1000 + Math.random() * 9000);
                user.otp = otp;

                user.save(async (errs, user) => {
                  if (errs) {
                    res.json(appfunctions.failResponse("msg_something_wrong", errs));
                  } else {
                    if (user && user.lead_id == "") {
                      let sharpuser = await appfunctions.sharpSpring(user._id, 'createLeads', user, '');
                      if (sharpuser.data && sharpuser.data.success && sharpuser.data.id) {
                        let userData = await appfunctions.updateUserByColumn(user._id, "lead_id", sharpuser.data.id, user)
                      } else {
                        // res.json(appfunctions.successResponse("msg_success", sharpuser)); 
                      }
                    }
                    Emailtemplates.findOne(
                      {
                        slug: "verification_otp",
                        language_id: ObjectId(user.language_id)
                      },
                      (err, template) => {
                        if (err) {
                          res.json(appfunctions.failResponse("msg_something_wrong"));
                        } else {
                          if (template) {
                            var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              //config.emailFrom,
                              res.locals.app_title + ' <' + config.emailFrom + '>',
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              res.json(appfunctions.failResponse("msg_email_not_send"));
                            } else {
                              res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                            }
                          }
                          else {
                            Emailtemplates.findOne(
                              {
                                slug: "verification_otp",
                                language_id: ObjectId(config.defaultLanguageId)
                              },
                              (err, template) => {

                                if (err) {
                                  res.json(appfunctions.failResponse("msg_something_wrong"));
                                }
                                else {
                                  var templatereplace = user.username && user.username != '' ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                                  var issEmailSent = appfunctions.sendEmail(
                                    template.subject,
                                    user.email,
                                    //config.emailFrom,
                                    res.locals.app_title + ' <' + config.emailFrom + '>',
                                    templatereplace
                                  );
                                  if (issEmailSent == false) {
                                    res.json(appfunctions.failResponse("msg_email_not_send"));
                                  } else {
                                    res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                                  }
                                }
                              })
                          }
                        }
                      });
                  }
                });
              }
            });
          }
        }
      })

    }
  }
});

// router.post("/registration", (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     res.status(500).json({
//       success: false,
//       message: errors.mapped()
//     });
//   } else 
//   { 
//     //console.log(JSON.stringify(req.body)+'req.body');
//     if(req.body.isFacebook == 1)
//     {
//       User.findOne({ facebook_id: req.body.facebook_id }, (err, user) => {
//           if (err) 
//           {
//             res.json(appfunctions.failResponse("msg_not_valid_user"));
//           }
//           else
//           { 
//             if(user != null  && user.status == 1){
//               user.facebook_id = req.body.facebook_id;
//               user.login_with_social = 1;
//               user.save((errs, loginuser)=>{
//                 if(errs){
//                   res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                 }else{
//                   var data = JSON.stringify(user);
//                   data = JSON.parse(data);
//                   data.isCompleted = 1;
//                   res.status(200).json({
//                     success: true,
//                     data: data,
//                     message: "msg_login_successfully"
//                   });     
//                 }
//               })
//             }else if(user != null  && user.status == 0){               
//               if (req.body.surname) user.surname = req.body.surname;
//               if (req.body.gender) user.gender = req.body.gender;
//               if (req.body.name) user.name = req.body.name;
//               if (req.body.email) user.email = req.body.email;
//               if (req.body.language_id) user.language_id = req.body.language_id;
//               if (req.body.facebook_id) user.facebook_id = req.body.facebook_id;      
//               user.role_id = 2;
//               user.version = req.body.version?req.body.version:'1.0';
//               user.status = 0; //req.body.status;
//               user.learning_language_id = req.body.learning_language_id?req.body.learning_language_id:req.body.learning_language_id;
//               User.findOne({ email: req.body.email }, (err, existingUser) => {
//                     if (existingUser) {
//                       res.json(appfunctions.failResponse("msg_email_already_exist"));
//                     } else {                      
//                       var otp = Math.floor(1000 + Math.random() * 9000);
//                       user.otp = otp;
//                       user.login_with_social = 1;
//                       user.save((errs, user) => {
//                       if (errs) {
//                         res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                       } else {
//                         Emailtemplates.findOne(
//                             {
//                               slug: "verification_otp",
//                               language_id:ObjectId(user.language_id)
//                             },
//                             (err, template) => {
//                               if(err)
//                               {
//                                 res.json(appfunctions.failResponse("msg_something_wrong"));
//                               }
//                               else
//                               {
//                                   if(template)
//                                   {
//                                       var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                       var issEmailSent = appfunctions.sendEmail(
//                                         template.subject,
//                                         user.email,
//                                         //config.emailFrom,
//                                         res.locals.app_title+' <'+config.emailFrom+'>',
//                                         templatereplace
//                                       );
//                                       if (issEmailSent == false) {
//                                         res.json(appfunctions.failResponse("msg_email_not_send"));
//                                       } else {
//                                         res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                       }
//                                   }
//                                   else
//                                   {
//                                       Emailtemplates.findOne(
//                                       {
//                                         slug: "verification_otp",
//                                         language_id:ObjectId(config.defaultLanguageId)
//                                       },
//                                       (err, template) => {

//                                         if(err)
//                                         {
//                                           res.json(appfunctions.failResponse("msg_something_wrong"));
//                                         }
//                                         else
//                                         {
//                                           var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                           var issEmailSent = appfunctions.sendEmail(
//                                             template.subject,
//                                             user.email,
//                                             //config.emailFrom,
//                                             res.locals.app_title+' <'+config.emailFrom+'>',
//                                             templatereplace
//                                           );
//                                           if (issEmailSent == false) {
//                                             res.json(appfunctions.failResponse("msg_email_not_send"));
//                                           } else {
//                                             res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                           }
//                                         }
//                                       })
//                                   }                          
//                               }
//                             });
//                           }
//                         });
//                       }
//               });
//             }else{   

//               User.findOne({ email: req.body.email }, (err, existingUser) => {
//                 if (existingUser) {
//                   if(existingUser.status == 1){
//                     existingUser.facebook_id = req.body.facebook_id;
//                     existingUser.login_with_social = 1;                    
//                     existingUser.save((errs, loginuser)=>{
//                       if(errs){
//                         res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                       }else{
//                         var data = JSON.stringify(existingUser);
//                         data = JSON.parse(data);
//                         data.isCompleted = 1;
//                         res.status(200).json({
//                           success: true,
//                           data: data,
//                           message: "msg_login_successfully"
//                         });     
//                       }
//                     })
//                   }else if(existingUser.status == 0){
//                     var otp = Math.floor(1000 + Math.random() * 9000);
//                     existingUser.otp = otp;
//                     existingUser.facebook_id = req.body.facebook_id;
//                     existingUser.save((error, user)=>{
//                       if(error){
//                         json(appfunctions.failResponse("msg_something_wrong", errs));
//                       }else{
//                         Emailtemplates.findOne({slug:"verification_otp",language_id:ObjectId(user.language_id)},(err, template)=>{
//                             if(err){
//                               res.json(appfunctions.failResponse("msg_something_wrong"));
//                             }else{
//                               if(template){
//                                 var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                 var issEmailSent = appfunctions.sendEmail(
//                                   template.subject,
//                                   user.email,
//                                   //config.emailFrom,
//                                   res.locals.app_title+' <'+config.emailFrom+'>',
//                                   templatereplace
//                                 );
//                                 if (issEmailSent == false) {
//                                   res.json(appfunctions.failResponse("msg_email_not_send"));
//                                 } else {
//                                   res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                 }
//                               }else{
//                                 Emailtemplates.findOne({slug:'verification_otp',language_id:ObjectId(config.defaultLanguageId)},(err,template)=>{
//                                     if(err)
//                                     {
//                                       res.json(appfunctions.failResponse("msg_something_wrong"));
//                                     }
//                                     else
//                                     {
//                                       var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                       var issEmailSent = appfunctions.sendEmail(
//                                         template.subject,
//                                         user.email,
//                                         //config.emailFrom,
//                                         res.locals.app_title+' <'+config.emailFrom+'>',
//                                         templatereplace
//                                       );
//                                       if (issEmailSent == false) {
//                                         res.json(appfunctions.failResponse("msg_email_not_send"));
//                                       } else {
//                                         res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                       }
//                                     }
//                                 })
//                               }
//                             }
//                         })
//                       }
//                     })
//                   }else{
//                     res.json(appfunctions.failResponse("msg_email_already_exist"));
//                   }
//                 }else{
//                   let user = new User();
//                   if (req.body.gender) user.gender = req.body.gender;
//                   if (req.body.name) user.name = req.body.name;
//                   if (req.body.email) user.email = req.body.email;
//                   if (req.body.surname) user.surname = req.body.surname;
//                   if (req.body.language_id) user.language_id = req.body.language_id;  
//                   if (req.body.facebook_id) user.facebook_id = req.body.facebook_id;      
//                   user.role_id = 2;
//                   user.version = req.body.version?req.body.version:'1.0';
//                   user.status = 0; //req.body.status;
//                   user.learning_language_id = req.body.learning_language_id;                     
//                   var otp = Math.floor(1000 + Math.random() * 9000);
//                   user.otp = otp;
//                   user.login_with_social = 1;
//                   user.save(async(errs, user) => {
//                   if (errs) {
//                     res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                   } else {
//                     if(user && user.lead_id == ""){
//                         let sharpuser = await appfunctions.sharpSpring(user._id,'createLeads',user,''); 
//                         if(sharpuser.data && sharpuser.data.success && sharpuser.data.id){
//                          let userData = await appfunctions.updateUserByColumn(user._id,"lead_id",sharpuser.data.id,user)
//                         }else{
//                           //res.json(appfunctions.successResponse("msg_success", sharpuser));
//                         } 
//                       } 
//                     Emailtemplates.findOne(
//                         {
//                           slug: "verification_otp",
//                           language_id:ObjectId(user.language_id)
//                         },
//                         (err, template) => {
//                           if(err)
//                           {
//                             res.json(appfunctions.failResponse("msg_something_wrong"));
//                           }
//                           else
//                           {
//                               if(template)
//                               {
//                                   var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                   var issEmailSent = appfunctions.sendEmail(
//                                     template.subject,
//                                     user.email,
//                                     //config.emailFrom,
//                                     res.locals.app_title+' <'+config.emailFrom+'>',
//                                     templatereplace
//                                   );
//                                   if (issEmailSent == false) {
//                                     res.json(appfunctions.failResponse("msg_email_not_send"));
//                                   } else {
//                                     res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                   }
//                               }
//                               else
//                               {
//                                   Emailtemplates.findOne(
//                                   {
//                                     slug: "verification_otp",
//                                     language_id:ObjectId(config.defaultLanguageId)
//                                   },
//                                   (err, template) => {

//                                     if(err)
//                                     {
//                                       res.json(appfunctions.failResponse("msg_something_wrong"));
//                                     }
//                                     else
//                                     {
//                                       var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                       var issEmailSent = appfunctions.sendEmail(
//                                         template.subject,
//                                         user.email,
//                                         //config.emailFrom,
//                                         res.locals.app_title+' <'+config.emailFrom+'>',
//                                         templatereplace
//                                       );
//                                       if (issEmailSent == false) {
//                                         res.json(appfunctions.failResponse("msg_email_not_send"));
//                                       } else {
//                                         res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                       }
//                                     }
//                                   })
//                                 }                          
//                             }
//                         });
//                       }
//                     });
//                 }
//               });
//             }
//           }
//       });
//     }else if(req.body.isGoogle == 1){        
//         User.findOne({ google_id: req.body.google_id }, (err, user) => {
//           if (err){
//             res.json(appfunctions.failResponse("msg_not_valid_user"));
//           }else{              
//               if(user != null && user.status == 1){                
//                 user.google_id = req.body.google_id;
//                 user.login_with_social = 1; 
//                 user.save((errs, loginuser)=>{
//                   if(errs){
//                     res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                   }else{
//                     var data = JSON.stringify(user);
//                     data = JSON.parse(data);
//                     data.isCompleted = 1;
//                     res.json(appfunctions.successResponse("msg_login_successfully", data));                         
//                   }
//                 })
//               }else if(user != null && user.status == 0 && user.email == null){

//                 if (req.body.surname) user.surname = req.body.surname;
//                 if (req.body.gender) user.gender = req.body.gender;
//                 if (req.body.name) user.name = req.body.name;
//                 if (req.body.email) user.email = req.body.email;
//                 if (req.body.language_id) user.language_id = req.body.language_id;      
//                 user.role_id = 2;
//                 user.version = req.body.version?req.body.version:'1.0';
//                 user.status = 0; 
//                 user.learning_language_id = req.body.learning_language_id?req.body.learning_language_id:req.body.language_id;
//                 user.login_with_social = 1; 
//                 User.findOne({ email: req.body.email }, (err, existingUser) => {
//                       if (existingUser) {
//                         res.json(appfunctions.failResponse("msg_email_already_exist"));
//                       } else {                      
//                         var otp = Math.floor(1000 + Math.random() * 9000);
//                         user.otp = otp;
//                         user.save((errs, user) => {
//                         if (errs) {
//                           res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                         } else {
//                           Emailtemplates.findOne(
//                               {
//                                 slug: "verification_otp",
//                                 language_id:ObjectId(user.language_id)
//                               },
//                               (err, template) => {
//                                 if(err)
//                                 {
//                                   res.json(appfunctions.failResponse("msg_something_wrong"));
//                                 }
//                                 else
//                                 {
//                                     if(template)
//                                     {
//                                         var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                         var issEmailSent = appfunctions.sendEmail(
//                                           template.subject,
//                                           user.email,
//                                           //config.emailFrom,
//                                           res.locals.app_title+' <'+config.emailFrom+'>',
//                                           templatereplace
//                                         );
//                                         if (issEmailSent == false) {
//                                           res.json(appfunctions.failResponse("msg_email_not_send"));
//                                         } else {
//                                           res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                         }
//                                     }
//                                     else
//                                     {
//                                         Emailtemplates.findOne(
//                                         {
//                                           slug: "verification_otp",
//                                           language_id:ObjectId(config.defaultLanguageId)
//                                         },
//                                         (err, template) => {

//                                           if(err)
//                                           {
//                                             res.json(appfunctions.failResponse("msg_something_wrong"));
//                                           }
//                                           else
//                                           {
//                                             var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                             var issEmailSent = appfunctions.sendEmail(
//                                               template.subject,
//                                               user.email,
//                                               //config.emailFrom,
//                                               res.locals.app_title+' <'+config.emailFrom+'>',
//                                               templatereplace
//                                             );
//                                             if (issEmailSent == false) {
//                                               res.json(appfunctions.failResponse("msg_email_not_send"));
//                                             } else {
//                                               res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                             }
//                                           }
//                                         })
//                                     }                          
//                                 }
//                               });
//                             }
//                           });
//                       }
//                 });
//               }else if(user != null && user.status == 0 && user.email != null){                
//                 var otp = Math.floor(1000 + Math.random() * 9000);
//                 user.otp = otp;
//                 user.login_with_social = 1; 
//                 user.save((errs, user) => {
//                 if (errs) {
//                   res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                 } else {
//                   Emailtemplates.findOne(
//                       {
//                         slug: "verification_otp",
//                         language_id:ObjectId(user.language_id)
//                       },
//                       (err, template) => {
//                         if(err)
//                         {
//                           res.json(appfunctions.failResponse("msg_something_wrong"));
//                         }
//                         else
//                         {
//                             if(template)
//                             {
//                                 var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                 var issEmailSent = appfunctions.sendEmail(
//                                   template.subject,
//                                   user.email,
//                                   //config.emailFrom,
//                                   res.locals.app_title+' <'+config.emailFrom+'>',
//                                   templatereplace
//                                 );
//                                 if (issEmailSent == false) {
//                                   res.json(appfunctions.failResponse("msg_email_not_send"));
//                                 } else {
//                                   res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                 }
//                             }
//                             else
//                             {
//                                 Emailtemplates.findOne(
//                                 {
//                                   slug: "verification_otp",
//                                   language_id:ObjectId(config.defaultLanguageId)
//                                 },
//                                 (err, template) => {

//                                   if(err)
//                                   {
//                                     res.json(appfunctions.failResponse("msg_something_wrong"));
//                                   }
//                                   else
//                                   {
//                                     var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                     var issEmailSent = appfunctions.sendEmail(
//                                       template.subject,
//                                       user.email,
//                                       //config.emailFrom,
//                                       res.locals.app_title+' <'+config.emailFrom+'>',
//                                       templatereplace
//                                     );
//                                     if (issEmailSent == false) {
//                                       res.json(appfunctions.failResponse("msg_email_not_send"));
//                                     } else {
//                                       res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                     }
//                                   }
//                                 })
//                             }                          
//                         }
//                       });
//                     }
//                   });
//               } else{

//                 User.findOne({ email: req.body.email }, (err, existingUser) => {
//                   if (existingUser) {
//                     if(existingUser.status == 1){
//                       existingUser.google_id = req.body.google_id;
//                       existingUser.login_with_social = 1; 
//                       existingUser.save((errs, loginuser)=>{
//                         if(errs){
//                           res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                         }else{
//                           var data = JSON.stringify(existingUser);
//                           data = JSON.parse(data);
//                           data.isCompleted = 1;
//                           res.status(200).json({
//                             success: true,
//                             data: data,
//                             message: "msg_success"
//                           });     
//                         }
//                       })
//                     }else if(existingUser.status == 0){
//                       existingUser.google_id = req.body.google_id;
//                       var otp = Math.floor(1000 + Math.random() * 9000);
//                       existingUser.otp = otp;
//                       existingUser.login_with_social = 1; 
//                       existingUser.save((error, user)=>{
//                         if(error){
//                           json(appfunctions.failResponse("msg_something_wrong", errs));
//                         }else{
//                           Emailtemplates.findOne({slug:"verification_otp",language_id:ObjectId(user.language_id)},(err, template)=>{
//                               if(err){
//                                 res.json(appfunctions.failResponse("msg_something_wrong"));
//                               }else{
//                                 if(template){
//                                   var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                   var issEmailSent = appfunctions.sendEmail(
//                                     template.subject,
//                                     user.email,
//                                     //config.emailFrom,
//                                     res.locals.app_title+' <'+config.emailFrom+'>',
//                                     templatereplace
//                                   );
//                                   if (issEmailSent == false) {
//                                     res.json(appfunctions.failResponse("msg_email_not_send"));
//                                   } else {
//                                     res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                   }
//                                 }else{
//                                   Emailtemplates.findOne({slug:'verification_otp',language_id:ObjectId(config.defaultLanguageId)},(err,template)=>{
//                                       if(err)
//                                       {
//                                         res.json(appfunctions.failResponse("msg_something_wrong"));
//                                       }
//                                       else
//                                       {
//                                         var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                         var issEmailSent = appfunctions.sendEmail(
//                                           template.subject,
//                                           user.email,
//                                           //config.emailFrom,
//                                           res.locals.app_title+' <'+config.emailFrom+'>',
//                                           templatereplace
//                                         );
//                                         if (issEmailSent == false) {
//                                           res.json(appfunctions.failResponse("msg_email_not_send"));
//                                         } else {
//                                           res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                         }
//                                       }
//                                   })
//                                 }
//                               }
//                           })
//                         }
//                       })
//                     }else{
//                       res.json(appfunctions.failResponse("msg_email_already_exist"));
//                     }
//                   }else{
//                     let user = new User();
//                     if (req.body.gender) user.gender = req.body.gender;
//                     if (req.body.name) user.name = req.body.name;
//                     if (req.body.email) user.email = req.body.email;
//                     if (req.body.language_id) user.language_id = req.body.language_id;  
//                     if (req.body.google_id) user.google_id = req.body.google_id;      
//                     user.role_id = 2;
//                     user.version = req.body.version?req.body.version:'1.0';
//                     user.status = 0; //req.body.status;
//                     user.login_with_social = 1; 
//                     user.learning_language_id = req.body.learning_language_id;                     
//                     var otp = Math.floor(1000 + Math.random() * 9000);
//                     user.otp = otp;
//                     user.save(async(errs, user) => {
//                     if (errs) {
//                       res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                     } else {
//                       if(user && user.lead_id == ""){
//                         let sharpuser = await appfunctions.sharpSpring(user._id,'createLeads',user,''); 
//                         if(sharpuser.data && sharpuser.data.success && sharpuser.data.id){
//                          let userData = await appfunctions.updateUserByColumn(user._id,"lead_id",sharpuser.data.id,user)
//                         }else{
//                           //res.json(appfunctions.successResponse("msg_success", sharpuser));
//                         } 
//                       } 
//                       Emailtemplates.findOne(
//                           {
//                             slug: "verification_otp",
//                             language_id:ObjectId(user.language_id)
//                           },
//                           (err, template) => {
//                             if(err)
//                             {
//                               res.json(appfunctions.failResponse("msg_something_wrong"));
//                             }
//                             else
//                             {
//                                 if(template)
//                                 {
//                                     var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                     var issEmailSent = appfunctions.sendEmail(
//                                       template.subject,
//                                       user.email,
//                                       //config.emailFrom,
//                                       res.locals.app_title+' <'+config.emailFrom+'>',
//                                       templatereplace
//                                     );
//                                     if (issEmailSent == false) {
//                                       res.json(appfunctions.failResponse("msg_email_not_send"));
//                                     } else {
//                                       res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                     }
//                                 }
//                                 else
//                                 {
//                                     Emailtemplates.findOne(
//                                     {
//                                       slug: "verification_otp",
//                                       language_id:ObjectId(config.defaultLanguageId)
//                                     },
//                                     (err, template) => {

//                                       if(err)
//                                       {
//                                         res.json(appfunctions.failResponse("msg_something_wrong"));
//                                       }
//                                       else
//                                       {
//                                         var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                         var issEmailSent = appfunctions.sendEmail(
//                                           template.subject,
//                                           user.email,
//                                           //config.emailFrom,
//                                           res.locals.app_title+' <'+config.emailFrom+'>',
//                                           templatereplace
//                                         );
//                                         if (issEmailSent == false) {
//                                           res.json(appfunctions.failResponse("msg_email_not_send"));
//                                         } else {
//                                           res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                         }
//                                       }
//                                     })
//                                   }                          
//                               }
//                           });
//                         }
//                       });
//                   }
//                 });
//               }
//           }
//       });
//     }else {      
//       User.findOne({email:req.body.email}, (err, existingUser)=>{
//           if(err){
//             res.json(appfunctions.failResponse("msg_email_already_exist"));
//           }else{            
//             if(existingUser){ 
//               res.json(appfunctions.failResponse("msg_email_already_exist"));
//             }else{              
//               let user = new User();
//               if (req.body.surname) user.surname = req.body.surname;
//               if (req.body.gender) user.gender = req.body.gender;
//               if (req.body.name) user.name = req.body.name;
//               if (req.body.email) user.email = req.body.email;
//               if (req.body.password) user.password = req.body.password;    
//               if (req.body.language_id) user.language_id = req.body.language_id;
//               if (req.body.learning_language_id) user.learning_language_id = req.body.learning_language_id;      
//               user.role_id = 2;
//               user.version = req.body.version?req.body.version:'1.0';
//               user.status = 0; //req.body.status;              
//               user.login_with_social = 2; 
//               User.findOne({ email: req.body.email }, (err, existingUser) => {
//                 if (existingUser && existingUser.status ==1 )
//                 {
//                   res.json(appfunctions.failResponse("msg_email_already_exist"));       
//                 } else {              
//                   var otp = Math.floor(1000 + Math.random() * 9000);
//                   user.otp = otp;

//                   user.save(async(errs, user) => {
//                     if (errs) {
//                       res.json(appfunctions.failResponse("msg_something_wrong", errs));
//                     } else {
//                       if(user && user.lead_id == ""){
//                         let sharpuser = await appfunctions.sharpSpring(user._id,'createLeads',user,''); 
//                         if(sharpuser.data && sharpuser.data.success && sharpuser.data.id){
//                          let userData = await appfunctions.updateUserByColumn(user._id,"lead_id",sharpuser.data.id,user)
//                         }else{
//                           //res.json(appfunctions.successResponse("msg_success", sharpuser));
//                         } 
//                       } 
//                       Emailtemplates.findOne(
//                           {
//                             slug: "verification_otp",
//                             language_id:ObjectId(user.language_id)
//                           },
//                           (err, template) => {
//                             if(err)
//                             {
//                               res.json(appfunctions.failResponse("msg_something_wrong"));
//                             }
//                             else
//                             {
//                                 if(template)
//                                 {
//                                     var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                     var issEmailSent = appfunctions.sendEmail(
//                                       template.subject,
//                                       user.email,
//                                       //config.emailFrom,
//                                       res.locals.app_title+' <'+config.emailFrom+'>',
//                                       templatereplace
//                                     );
//                                     if (issEmailSent == false) {
//                                       res.json(appfunctions.failResponse("msg_email_not_send"));
//                                     } else {
//                                       res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                     }
//                                 }
//                                 else
//                                 {
//                                     Emailtemplates.findOne(
//                                     {
//                                       slug: "verification_otp",
//                                       language_id:ObjectId(config.defaultLanguageId)
//                                     },
//                                     (err, template) => {

//                                       if(err)
//                                       {
//                                         res.json(appfunctions.failResponse("msg_something_wrong"));
//                                       }
//                                       else
//                                       {
//                                         var templatereplace = template.description.replace( "{otp}",otp).replace("{firstname}",user.name).replace("{lastname}",user.surname);
//                                         var issEmailSent = appfunctions.sendEmail(
//                                           template.subject,
//                                           user.email,
//                                           //config.emailFrom,
//                                           res.locals.app_title+' <'+config.emailFrom+'>',
//                                           templatereplace
//                                         );
//                                         if (issEmailSent == false) {
//                                           res.json(appfunctions.failResponse("msg_email_not_send"));
//                                         } else {
//                                           res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
//                                         }
//                                       }
//                                     })
//                                 }                          
//                             }
//                           });
//                         }
//                     });
//                 }
//               });
//             }
//           }
//       })
//     }
//   }
// });

//For verify OTP
router.post("/verifyOtp", (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(500).json({
      success: false,
      message: errors.mapped()
    });
  } else {
    User.findOne(
      {
        email: req.body.email,
        otp: req.body.otp
      },
      (err, existingUser) => {
        if (existingUser) {
          existingUser.status = 1;
          existingUser.otp = null;
          existingUser.token = "";
          const jwttoken = jwt.sign(JSON.stringify(existingUser), config.secret);
          existingUser.token = jwttoken;
          existingUser.save(async (errs, user) => {
            if (errs) {
              res.json(appfunctions.failResponse("msg_something_wrong", errs));
            } else {
              let demoLesson = await appfunctions.getLessonData(existingUser.learning_language_id, existingUser.language_id)
              //console.log(user);                            
              let data = new Object()
              data = JSON.stringify(user)
              data = JSON.parse(data)
              data.lesson_id = (demoLesson.data != null && demoLesson.data[0] != undefined) ? demoLesson.data[0]._id : "";
              //console.log(data);                             
              res.json(appfunctions.successResponse("msg_otp_verified", data));
            }
          });
        } else {
          res.json(appfunctions.failResponse("msg_otp_not_matched"));
        }
      }
    );
  }
});

//For User Logout
router.post("/logout", (req, res, next) => {
  var userid = req.body.user_id;
  // On Logout clear the device token for a user 
  User.updateOne(
    { _id: ObjectId(userid) },
    {
      $set: {
        device_token: ""
      }
    },
    function (err, result) {
      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong"));
      } else {
        res.json(appfunctions.successResponse("msg_profile_updated", result));
      }
    }
  );
});

//For approve terms and conditions
router.post("/approveTermsConditions", (req, res, next) => {
  User.findOne(
    {
      _id: ObjectId(req.body.user_id)
    },
    (err, uInst) => {

      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong"));
      } else {
        if (uInst) {
          uInst.last_confirm_terms = new Date();
          uInst.save();
          //  req.user.isTermChecked = 1;
          res.json(appfunctions.successResponse("msg_terms_conditions_approved", uInst, req.user));
        }
      }
    }
  );
});

//For forgot password
router.post("/forgotpassword", (req, res, next) => {
  User.findOne(
    {
      email: req.body.email,
      //status: 1
    },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        res.json(appfunctions.failResponse("msg_not_registred_user"));
      } else if (user) {
        //user.token =  crypto.randomBytes(20).toString('hex');
        user.token = "";
        var otp = Math.floor(1000 + Math.random() * 9000);
        user.otp = otp;
        user.save();

        Emailtemplates.findOne(
          {
            slug: "password_reset",
            language_id: ObjectId(user.language_id)
          },
          async (err, template) => {

            if (err) {
              res.json(appfunctions.failResponse("msg_something_wrong"));
            }
            else {
              if (template) {
                // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                var templatereplace = user.username ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                var issEmailSent = appfunctions.sendEmail(
                  template.subject,
                  user.email,
                  //config.emailFrom,
                  res.locals.app_title + ' <' + config.emailFrom + '>',

                  templatereplace
                );
                if (issEmailSent == false) {
                  res.json(appfunctions.failResponse("msg_email_not_send"));
                } else {
                  if (user.lead_id) {
                    let data = await appfunctions.updateUserByColumn(user._id, "lastemailreceived", moment(), user)
                  }
                  res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                }
              }
              else {
                Emailtemplates.findOne(
                  {
                    slug: "password_reset",
                    language_id: ObjectId(config.defaultLanguageId)
                  },
                  async (err, template) => {

                    if (err) {
                      res.json(appfunctions.failResponse("msg_something_wrong"));
                    }
                    else {
                      // var templatereplace = template.description.replace("{otp}", otp).replace("{firstname}", user.name).replace("{lastname}", user.surname);
                      var templatereplace = user.username ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                      var issEmailSent = appfunctions.sendEmail(
                        template.subject,
                        user.email,
                        //config.emailFrom,
                        res.locals.app_title + ' <' + config.emailFrom + '>',
                        templatereplace
                      );
                      if (issEmailSent == false) {
                        res.json(appfunctions.failResponse("msg_email_not_send"));
                      } else {
                        if (user.lead_id) {
                          let data = await appfunctions.updateUserByColumn(user._id, "lastemailreceived", moment(), user)
                        }
                        res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                      }
                    }
                  })
              }

            }
          });
      }
    }
  );
});

//For resend otp
router.post("/resendotp", (req, res, next) => {
  User.findOne(
    {
      email: req.body.email,
      //status: 1
    },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        res.json(appfunctions.failResponse("msg_not_registred_user"));
      } else if (user) {
        var otp = Math.floor(1000 + Math.random() * 9000);
        user.otp = otp;
        user.save();
        Emailtemplates.findOne(
          {
            slug: "verification_otp",
            language_id: ObjectId(user.language_id)
          },
          async (err, template) => {

            if (err) {
              res.json(appfunctions.failResponse("msg_something_wrong"));
            }
            else {
              if (template) {
                var templatereplace = user.username ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                var issEmailSent = appfunctions.sendEmail(
                  template.subject,
                  user.email,
                  //config.emailFrom,
                  res.locals.app_title + ' <' + config.emailFrom + '>',

                  templatereplace
                );
                if (issEmailSent == false) {
                  res.json(appfunctions.failResponse("msg_email_not_send"));
                } else {
                  if (user.lead_id) {
                    let data = await appfunctions.updateUserByColumn(user._id, "lastemailreceived", moment(), user)
                  }
                  res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user));
                }
              }
              else {
                Emailtemplates.findOne(
                  {
                    slug: "verification_otp",
                    language_id: ObjectId(config.defaultLanguageId)
                  },
                  async (err, template) => {

                    if (err) {
                      res.json(appfunctions.failResponse("msg_something_wrong"));
                    }
                    else {
                      var templatereplace = user.username ? template.description.replace("{otp}", otp).replace("{username}", user.username) : template.description.replace("{otp}", otp).replace("{username}", user.name + " " + user.surname);
                      var issEmailSent = appfunctions.sendEmail(
                        template.subject,
                        user.email,
                        //config.emailFrom,
                        res.locals.app_title + ' <' + config.emailFrom + '>',

                        templatereplace
                      );
                      if (issEmailSent == false) {
                        res.json(appfunctions.failResponse("msg_email_not_send"));
                      } else {
                        if (user.lead_id) {
                          let data = await appfunctions.updateUserByColumn(user._id, "lastemailreceived", moment(), user)
                        }
                        res.json(appfunctions.successResponse("msg_check_reg_email_for_otp", user,));
                      }
                    }
                  })
              }

            }
          });

      }
    }
  );
});

//For reset password
router.post("/resetpassword", (req, res, next) => {
  User.findOne(
    {
      email: req.body.email
    },
    (err, user) => {
      if (err) {
        res.json(appfunctions.failResponse("msg_not_valid_user"));
      } else {
        if (req.body.password != req.body.confirm_password) {
          res.json(appfunctions.failResponse("msg_confirm_pass_not_matched"));
        } else {

          user.password = req.body.password;
          user.save();
          res.json(appfunctions.successResponse("msg_password_changed"));
        }
      }
    }
  );
});

//For change password
router.post('/changepassword', (req, res, next) => {
  //let oldpassword = bcrypt.hashSync(req.body.old_password, 10);
  User.findOne({
    _id: ObjectId(req.body.user_id)
  }, (err, user) => {
    if (err) {
      res.json(appfunctions.failResponse("msg_not_valid_user"));
    } else {

      bcrypt.compare(req.body.old_password, user.password, (err, isMatch) => {
        if (isMatch) {
          user.password = req.body.new_password;
          user.save();
          res.json(appfunctions.successResponse("msg_password_changed"));

        } else {
          res.json(appfunctions.failResponse("msg_old_password_wrong"));
        }
      });


    }
  })
})

//App Guide Data
router.post('/app-guide', (req, res, next) => {
  language_id = req.body.language_id;
  AppGuide.find({ language_id: language_id }, { _id: 0 })
    .select(["title", 'heading', 'description'])
    .sort({ 'created': 1 })
    .limit(8)
    .exec(function (err, result) {
      if (err) {
        res.json(appfunctions.failResponse("erro", err));
      } else {
        if (result.length > 0) {
          res.json(appfunctions.successResponse("msg_app_guides", result, language_id));
        } else {
          //Default Langauge App Guides
          AppGuide.find({ language_id: ObjectId(config.defaultLanguageId) }, { _id: 0 })
            .select(["title", 'heading', 'description'])
            .sort({ 'created': 1 })
            .limit(8)
            .exec(function (errs, results) {
              if (errs) {
                res.json(appfunctions.failResponse("erro", err));
              } else {
                res.json(appfunctions.successResponse("msg_app_guides", results, language_id));
              }
            })

        }
      }
    })
})

//CMS-Page-Dynamic Page Content
router.post("/getCmsPageData", (req, res, next) => {
  let slug = req.body.slug;
  let device = req.body.device;
  var language_id = req.body.language_id
    ? req.body.language_id
    : config.defaultLanguageId;
  if (device == "app") {
    res.json(
      appfunctions.successResponse(
        "msg_success",
        {
          //url: `https://devnode.devtechnosys.tech/birlingo-website/${slug}/${language_id}`
          url: config.website_base_url + slug + '/' + language_id
        },
        req.user
      )
    );
  } else if (device == "web") {
    cms.find(
      { $and: [{ language_id: language_id }, { slug: slug }] },
      (err, data) => {
        if (err) {
          res.json(appfunctions.failResponse("msg_something_wrong"));
        } else {
          res.json(appfunctions.successResponse("msg_success", data, req.user));
        }
      }
    );
  }
});

//Blogs
router.post('/blogs', async (req, res, next) => {
  let user_id = req.body.user_id;
  let language_id = req.body.language_id ? req.body.language_id : config.defaultLanguageId;
  var page = req.body.page || 1;
  var perPage = 10;
  let latest_blog = await Blog.findOne({ language_id: language_id }, { _id: 0 }).sort({ release_date: -1 }).select(["_id", "title", 'author_name', 'description', 'created', 'release_date', 'image', 'slug'])
  Blog.find({ language_id: language_id }, { _id: 0 })
    .select(['_id', "title", 'author_name', 'description', 'created', 'introductory_text', 'url_string', "image", 'release_date', 'slug'])
    .sort({ 'release_date': -1 })
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(async function (err, result, count) {
      if (err) {
        res.json(appfunctions.failResponse("erro", err));
      } else {

        if (result.length > 0) {
          const count = await Blog.count({ language_id: language_id });
          result = JSON.parse(JSON.stringify(result));
          let listing = result.map((element, i) => {
            var o = Object.assign({}, element);
            o.description = element.introductory_text != undefined ? element.introductory_text : element.description
            if (element.image != undefined && element.image != null) {
              var pathofimage = path.join(__dirname, "/../public/blog/") + element.image;
              try {
                if (fs.existsSync(pathofimage)) {
                  o.image = config.file_base_url + "/public/blog/" + element.image
                }
              } catch (err) {
                console.error(err)
              }
            } else {
              o.image = "";//config.file_base_url+"/public/blog/default.png" 
            }
            return o;
          })
          let response = {};
          response.current = page;
          response.language_id = language_id;
          response.pages = Math.ceil(count / perPage);
          response.pagelimit = perPage;
          response.count = count;
          response.records = listing;
          //result.header_blog.image = config.file_base_url+"/public/blog/"+latest_blog.image  
          latest_blog = JSON.parse(JSON.stringify(latest_blog))
          latest_blog.image = config.file_base_url + "/public/blog/" + latest_blog.image
          response.header_blog = latest_blog
          res.json(appfunctions.successResponse("msg_success", response, language_id));
        } else {
          //Blog in default language         
          Blog.find({ language_id: ObjectId(config.defaultLanguageId) }, { _id: 0 })
            .select(['_id', "title", 'author_name', 'description', 'introductory_text', 'url_string', 'created', "image", 'release_date', 'slug'])
            .sort({ 'release_date': -1 })
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec(async function (errs, results, count) {
              if (errs) {
                res.json(appfunctions.failResponse("erro", err));
              } else {
                let result = {};
                results = JSON.parse(JSON.stringify(result));
                let listing = results.map((element, i) => {
                  var o = Object.assign({}, element);
                  o.description = element.introductory_text != undefined ? element.introductory_text : element.description
                  if (element.image != undefined && element.image != null) {
                    var pathofimage = path.join(__dirname, "/../public/blog/") + element.image;
                    try {
                      if (fs.existsSync(pathofimage)) {
                        o.image = config.file_base_url + "/public/blog/" + element.image
                      }
                    } catch (err) {
                      console.error(err)
                    }
                  } else {
                    o.image = ""//onfig.file_base_url+"/public/blog/default.png"
                  }
                  return o;
                })
                const count = await Blog.countDocuments({ language_id: ObjectId(config.defaultLanguageId) });
                result.current = page;
                result.language_id = language_id;
                result.pages = Math.ceil(count / perPage);
                result.pagelimit = perPage;
                result.count = count;
                result.records = listing;
                //result.header_blog.image = config.file_base_url+"/public/blog/"+latest_blog.image             
                latest_blog = JSON.parse(JSON.stringify(latest_blog))
                latest_blog.image = config.file_base_url + "/public/blog/" + latest_blog.image
                response.header_blog = latest_blog
                if (results.length > 0) {

                  res.json(appfunctions.successResponse("msg_success", result, language_id));
                } else {
                  res.json(appfunctions.successResponse("msg_no_data_found", result, language_id));
                }

              }
            })
        }
      }
    })
})

//Blog Details
router.get('/blog/:language_id/:slug', async (req, res, next) => {
  let blogId = ObjectId(req.params.id);
  //Blog.find({_id:blogId})
  let language_id = req.params.language_id
  let slug = req.params.slug
  Blog.find({ language_id: ObjectId(language_id), slug: slug })
    .select(["title", 'author_name', 'description', 'introductory_text', 'url_string', 'created', '_id', "image", "release_date", 'slug'])
    .exec(async function (err, result, count) {
      if (err) {
        res.json(appfunctions.failResponse("erro", err));
      } else {
        if (result.length > 0) {
          results = JSON.parse(JSON.stringify(result));
          let listing = results.map((element, i) => {
            var o = Object.assign({}, element);
            if (element.image != undefined && element.image != null) {
              var pathofimage = path.join(__dirname, "/../public/blog/") + element.image;
              try {
                if (fs.existsSync(pathofimage)) {
                  o.image = config.file_base_url + "/public/blog/" + element.image
                }
              } catch (err) {
                console.error(err)
              }
            } else {
              o.image = '';//config.file_base_url+"/public/blog/default.png" 
            }
            return o;
          })
          let response = {};
          response.records = listing;
          res.json(appfunctions.successResponse("msg_success", response));
        }
      }
    })
})

//Get Global Data
router.get("/getSettingData", (req, res, next) => {
  //console.log(moment(1593669846))
  //console.log()
  Setting.findOne({}, { private_key_test: 0, private_key_live: 0 }, (err1, sett) => {
    res.json(appfunctions.successResponse("msg_app_guides", sett));
  });
});

//Get Methoda Content
router.post("/methodContent", async (req, res, next) => {
  let language_id = req.body.language_id ? req.body.language_id : config.defaultLanguageId;
  let faqs = await appfunctions.getFaqs(language_id, "method");
  let image = await MethodImage.findOne().select({ image_one: 1, image_two: 1, image_three: 1, image_four: 1, image_five: 1, _id: 0, image_one_text: 1, image_two_text: 1, image_three_text: 1, image_four_text: 1, image_five_text: 1, });
  Method.findOne({
    language_id: ObjectId(language_id)
  }, (err, result) => {
    if (err) {
      appfunctions.failResponse('msg_fail', err)
    } else {
      if (result) {
        let method_texts = new Array();
        let methods = {};

        methods.language_id = result.language_id
        methods.meta_title = result.meta_title
        methods.meta_keywords = result.meta_keywords
        methods.meta_description = result.meta_description
        // methods.method_texts = method_texts
        methods.left_learning_guarantee_texts = result.left_learning_guarantee_texts
        methods.right_learning_guarantee_texts = result.right_learning_guarantee_texts
        methods.how_it_works_texts = result.how_it_works_texts
        methods.hear_actively_texts = result.hear_actively_texts
        methods.have_a_say_texts = result.have_a_say_texts
        methods.step_3_speak_texts = result.step_3_speak_texts
        methods.hear_passively_texts = result.hear_passively_texts
        methods.step_4_listen_passively_texts = result.step_4_listen_passively_texts
        methods.step_4_hear_passively_texts = result.step_4_hear_passively_texts
        methods.classic_school_method_texts = result.classic_school_method_texts
        methods.guaranteed_learn_languages_faster_texts = result.guaranteed_learn_languages_faster_texts
        methods.motivation_thanks_to_quick_success_texts = result.motivation_thanks_to_quick_success_texts
        methods.off_to_new_adventures_texts = result.off_to_new_adventures_texts
        methods.speak_texts = result.speak_texts
        methods.step_2_listen_actively_title = result.step_2_listen_actively_title
        methods.step_3_have_a_say_title = result.step_3_have_a_say_title
        methods.step_4_listen_passively_title = result.step_4_listen_passively_title
        methods.faqs = faqs.data;
        methods.imageUrl = config.file_base_url + '/public/method/'
        methods.images = []
        methods.images = image
        methods.faster_intutive_learn_texts = result.faster_intutive_learn_texts;
        methods.left_steps_to_new_lang_text = result.left_steps_to_new_lang_text;
        methods.right_steps_to_new_lang_text = result.right_steps_to_new_lang_text;
        methods.languages_human_speak_text = result.languages_human_speak_text;
        methods.limit_of_lang_limit_of_world_text = result.limit_of_lang_limit_of_world_text;
        methods.learn_these_lan_with_birlingo = result.learn_these_lan_with_birlingo
        res.json(appfunctions.successResponse("msg_success", methods));
      } else {
        Method.findOne({
          language_id: ObjectId(config.defaultLanguageId)
        }, (errors, result) => {
          if (err) {
            appfunctions.failResponse('msg_fail', err)
          } else {
            let method_texts = new Array();
            let methods = {};
            result.method_texts.map((item, key) => {
              // console.log("method_text item: =====> ", item)
              // console.log("method_text key: =====> ", item)
              let method = new Object();
              if (key == 0) {
                method.heading = 'lbl_intuitives'
              } else if (key == 1) {
                method.heading = 'lbl_speak_automatically'
              } else if (key == 2) {
                method.heading = 'lbl_fast_success'
              }
              method.text = item
              method_texts.push(method)
            })
            methods.language_id = result.language_id
            methods.meta_title = result.meta_title
            methods.meta_keywords = result.meta_keywords
            methods.meta_description = result.meta_description
            methods.method_texts = method_texts
            methods.left_learning_guarantee_texts = result.left_learning_guarantee_texts
            methods.right_learning_guarantee_texts = result.right_learning_guarantee_texts
            methods.how_it_works_texts = result.how_it_works_texts
            methods.hear_actively_texts = result.hear_actively_texts
            method.have_a_say_texts = result.have_a_say_texts
            methods.step_3_speak_texts = result.step_3_speak_texts
            methods.hear_passively_texts = result.hear_passively_texts
            methods.step_4_listen_passively_texts = result.step_4_listen_passively_texts
            methods.step_4_hear_passively_texts = result.step_4_hear_passively_texts
            methods.classic_school_method_texts = result.classic_school_method_texts
            methods.guaranteed_learn_languages_faster_texts = result.guaranteed_learn_languages_faster_texts
            methods.motivation_thanks_to_quick_success_texts = result.motivation_thanks_to_quick_success_texts
            methods.off_to_new_adventures_texts = result.off_to_new_adventures_texts
            methods.speak_texts = result.speak_texts
            methods.step_2_listen_actively_title = result.step_2_listen_actively_title
            methods.step_3_have_a_say_title = result.step_3_have_a_say_title
            methods.step_4_listen_passively_title = result.step_4_listen_passively_title
            methods.faqs = faqs.data;
            result.method = method_texts;
            methods.imageUrl = config.file_base_url + '/public/method/'
            methods.images = []
            methods.images = image
            methods.faster_intutive_learn_texts = result.faster_intutive_learn_texts;
            methods.left_steps_to_new_lang_text = result.left_steps_to_new_lang_text;
            methods.right_steps_to_new_lang_text = result.right_steps_to_new_lang_text;
            methods.languages_human_speak_text = result.languages_human_speak_text;
            methods.limit_of_lang_limit_of_world_text = result.limit_of_lang_limit_of_world_text;
            methods.limit_of_lang_limit_of_world_text = result.limit_of_lang_limit_of_world_text;

            res.json(appfunctions.successResponse("msg_success", methods));
          }
        })
      }
    }
  });
});

//Get Home Content
router.post("/home", async (req, res) => {
  let language_id = req.body.language_id ? req.body.language_id : config.defaultLanguageId;
  let image = await HomeImage.findOne().select({ banner_image: 1, learning_text_image: 1, speak_text_image: 1, our_text_image: 1, content_text_image: 1, online_or_offline_text_image: 1, _id: 0, banner_text: 1, learning_text: 1, speak_text: 1, our_text: 1, content_text: 1, online_or_offline_text: 1 });
  Home.findOne({
    language_id: ObjectId(language_id)
  }, (err, result) => {
    if (err) {
      appfunctions.failResponse('msg_fail', err)
    } else {
      let off_online = new Array();
      result = JSON.parse(JSON.stringify(result))
      if (result) {
        // console.log("===========> ", result.method_texts);
        result.online_or_offline_texts.map((item, index) => {
          let data = new Object()
          if (index == 0) {
            data.heading = 'lbl_lessons_download'
            data.title = item
          }
          if (index == 1) {
            data.heading = 'lbl_audio_companion'
            data.title = item
          }
          if (index == 2) {
            data.heading = 'lbl_learning_guide'
            data.title = item
          }
          off_online.push(data)
        })
        // let method_texts = new Array();
        // let methods = {};
        // result.method_texts.map((item, key) => {
        //   let method = new Object();
        //   if (key == 0) {
        //     method.heading = 'lbl_intuitive_and_easy_learning'
        //   } else if (key == 1) {
        //     method.heading = 'lbl_pronounce_correctly_automatically'
        //   } else if (key == 2) {
        //     method.heading = 'lbl_quick_sense_of_achievement'
        //   }
        //   method.text = item
        //   method_texts.push(method)
        // })
        result.online_or_offline_texts = off_online
        // result.method_texts = method_texts
        result.under_lady_text = result.lady_texts ? result.lady_texts : ""
        result.imageUrl = config.file_base_url + '/public/home/'
        result.images = []
        result.images = image
        res.json(appfunctions.successResponse("msg_success", result));
      } else {

        Home.findOne({ language_id: ObjectId(config.defaultLanguageId) }, (err, result) => {
          if (err) {
            appfunctions.failResponse('msg_fail', err)
          } else {
            result = JSON.parse(JSON.stringify(result))
            result.online_or_offline_texts.map((item, index) => {
              let data = new Object()
              if (index == 0) {
                data.heading = 'lbl_lessons_download'
                data.title = item
              }
              if (index == 1) {
                data.heading = 'lbl_audio_companion'
                data.title = item
              }
              if (index == 2) {
                data.heading = 'lbl_learning_guide'
                data.title = item
              }
              off_online.push(data)
            })
            // result.method_texts = result.method_texts
            result.online_or_offline_texts = off_online
            result.under_lady_text = result.lady_texts ? result.lady_texts : ""
            result.imageUrl = config.file_base_url + '/public/home/'
            result.images = []
            result.images = image
            res.json(appfunctions.successResponse("msg_success", result));
          }
        })
      }
    }
  })
})



//Review Page
router.post('/reviews', async (req, res) => {
  let count1 = await Ratings.find({ rating: 1, like: 1, is_public: 1, status: 1 }).countDocuments();
  let count2 = await Ratings.find({ rating: 2, like: 1, is_public: 1, status: 1 }).countDocuments();
  let count3 = await Ratings.find({ rating: 3, like: 1, is_public: 1, status: 1 }).countDocuments();
  let count4 = await Ratings.find({ rating: 4, like: 1, is_public: 1, status: 1 }).countDocuments();
  let count5 = await Ratings.find({ rating: 5, like: 1, is_public: 1, status: 1 }).countDocuments();
  var page = req.body.page || 1;
  var perPage = 10;
  Ratings.find({ is_public: 1, rating: { $gte: 1 }, status: 1 })
    .populate({ path: 'user_id', select: { "name": 1, "surname": 1, "username": 1 } })
    //.select('rating','feedback','created','user_id')
    .sort({ 'created': -1 })
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(async function (err, result) {
      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong", JSON.stringify(err)));
      } else {
        let response = {}
        let count = await Ratings.count({ is_public: 1, rating: { $gte: 1 }, status: 1, like: 1 });
        let count1Percentage = count1 > 0 ? (count1 / count) * 100 : 0
        let count2Percentage = count2 > 0 ? (count2 / count) * 100 : 0
        let count3Percentage = count3 > 0 ? (count3 / count) * 100 : 0
        let count4Percentage = count4 > 0 ? (count4 / count) * 100 : 0
        let count5Percentage = count5 > 0 ? (count5 / count) * 100 : 0
        let ratingPercentage = new Array()
        let collect = new Object()
        for (i = 5; i >= 1; i--) {
          switch (i) {
            case 5:
              let collect5 = new Object()
              collect5.percentage = parseFloat(count5Percentage.toFixed(2)),
                collect5.lbl = "lbl_five_rating"
              ratingPercentage.push(collect5)
              break;
            case 4:
              let collect4 = new Object()
              collect4.percentage = parseFloat(count4Percentage.toFixed(2)),
                collect4.lbl = "lbl_four_rating"
              ratingPercentage.push(collect4)
              break;
            case 3:
              let collect3 = new Object()
              collect3.percentage = parseFloat(count3Percentage.toFixed(2)),
                collect3.lbl = "lbl_three_rating"
              ratingPercentage.push(collect3)
              break;
            case 2:
              let collect2 = new Object()
              collect2.percentage = parseFloat(count2Percentage.toFixed(2)),
                collect2.lbl = "lbl_two_rating"
              ratingPercentage.push(collect2)
              break;
            case 1:
              let collect = new Object()
              collect.percentage = parseFloat(count1Percentage.toFixed(2)),
                collect.lbl = "lbl_one_rating"
              ratingPercentage.push(collect)
              break;

          }
        }
        let ratinglistObj = new Object({
          current: page,
          pages: Math.ceil(count / perPage),
          pagelimit: perPage,
          count: count,
          result: result
        })
        response.percentage = ratingPercentage
        response.ratinglist = ratinglistObj
        res.json(appfunctions.successResponse("msg_success", response));
      }
    })
})

//Testimonials List
router.post('/testimonials', async (req, res, next) => {
  let language_id = req.body.language_id || config.defaultLanguageId
  if (ObjectId.isValid(language_id)) {
    Testimonials.find({ language_id: ObjectId(language_id) })
      .select(["title", 'name', 'description', 'created'])
      .sort({ created: -1 })
      .limit(5)
      .exec(async function (err, result, count) {
        if (err) {
          res.json(appfunctions.failResponse("erro", err));
        } else {
          if (result.length > 0) {
            results = JSON.parse(JSON.stringify(result));
            let response = results;
            res.json(appfunctions.successResponse("msg_success", response));
          }
        }
      })
  } else {
    res.json(appfunctions.failResponse("msg_enter_valid_language_id"));
  }

})

/**Get Subscription According to App Language**/
router.post('/subscriptionsForPrice', function (req, res) {
  let language_id = config.defaultLanguageId
  var currentDate = moment(new Date());
  var payment_type = _payment_mode == 1 ? "live" : "test"
  BaseSusb.aggregate([
    {
      $match: { status: 1, type: payment_type }
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { slug: "$_id" },
        pipeline: [{
          $match: {
            $expr: {
              $and: [
                { $eq: ['$language_id', ObjectId(language_id)] },
                { $eq: ["$basesubscription_id", "$$slug"] },
              ]
            }
          }
        }],
        as: "subscriptions",
      }
    },
    {
      $unwind: {
        path: "$subscriptions",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "usersubscriptions",
        let: { subs_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$subscription_id', "$$subs_id"] },
                  // { $eq: ['$user_id', ObjectId(req.user._id)] },
                  { $gte: ["$expire", currentDate] },
                  { $eq: ["$status", 1] }
                ]
              }
            }
          },
        ],
        as: 'usersubs',
      }
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: '$$ROOT.subscriptions.title' },
        subscription_saving: { $first: '$$ROOT.subscription_saving' },
        description: { $first: '$$ROOT.subscriptions.description' },
        price: { $first: '$$ROOT.price' },
        stripe_id: { $first: '$$ROOT.stripe_id' },
        validity: { $first: '$$ROOT.validity' },
        startdate: { $first: '$$ROOT.usersubs.created' },
        expiredate: { $first: '$$ROOT.usersubs.expire' },
        userplan: { $first: '$$ROOT.usersubs' },
        status: { $first: '$$ROOT.status' },
        payment_status: { $first: '$$ROOT.usersubs.payment_status' },
        subscription_name: { $first: '$$ROOT.usersubs.subscription_name' },
        subscription_schedule_name: { $first: '$$ROOT.usersubs.subscription_schedule_name' },
        subscribed_id: { $first: '$$ROOT.usersubs._id' },
        is_cancel: { $first: '$$ROOT.usersubs.is_cancel' },
        plan_ended: { $first: '$$ROOT.usersubs.plan_ended' },
        total: { $first: '$$ROOT.total' },
        apple_product_id: { $first: '$$ROOT.apple_product_id' },
      }
    },
    {
      $unwind: {
        path: "$usersubs",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: "$_id",
        name: "$$ROOT.title",
        description: "$$ROOT.description",
        validity: '$validity',
        price: "$price",
        total: "$total",
        stripe_id: "$stripe_id",
        apple_product_id: "$apple_product_id",
        startdate:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.start", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.start", 0] }, else: "" }
        },
        expire:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.expire", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.expire", 0] }, else: "" }
        },

        payment_status:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.payment_status", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.payment_status", 0] }, else: "" }
        },
        status:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.status", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.status", 0] }, else: "" }
        },
        susbcrition_name:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.subscription_name", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.subscription_name", 0] }, else: "" }
        },
        subscription_schedule_name:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.subscription_schedule_name", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.subscription_schedule_name", 0] }, else: "" }
        },
        subscribed_id:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan._id", 0] }, 0] }, then: { $arrayElemAt: ["$userplan._id", 0] }, else: "" }
        },
        is_cancel:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.is_cancel", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.is_cancel", 0] }, else: "" }
        },
        plan_ended:
        {
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.plan_ended", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.plan_ended", 0] }, else: "" }
        },
        subscription_saving: "$subscription_saving",
      }
    },
    {
      $sort: {
        validity: 1
        // total: -1
      }
    }
  ]).exec(function (err, result) {
    // console.log('Susbcriptions',result);
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      res.json(appfunctions.successResponse("msg_success", result, req.user));
    }
  });
})

//Get Home Content
router.post("/price", async (req, res) => {
  let language_id = req.body.language_id ? req.body.language_id : config.defaultLanguageId;
  let faqs = await appfunctions.getFaqs(language_id, 'price');
  let image = await PriceImage.findOne();
  // let image = await HomeImage.findOne().select({ banner_image: 1, learning_text_image: 1, speak_text_image: 1, our_text_image: 1, content_text_image: 1, online_or_offline_text_image: 1, _id: 0, banner_text: 1, learning_text: 1, speak_text: 1, our_text: 1, content_text: 1, online_or_offline_text: 1 });
  Price.findOne({ language_id: ObjectId(language_id) }, (err, result) => {
    if (err) {
      appfunctions.failResponse('msg_fail', err)
    } else {
      let price_data = {};
      price_data._id = result._id;
      price_data.subscription_pricing = result.subscription_pricing;
      price_data.language_id = result.language_id;
      price_data.subscription_pricing_texts = result.subscription_pricing_texts;
      price_data.meta_description = result.meta_description;
      price_data.meta_keywords = result.meta_keywords;
      price_data.meta_title = result.meta_title;
      price_data.all_packages_properties_texts = result.all_packages_properties_texts;
      price_data.left_learning_guarantee_texts = result.left_learning_guarantee_texts;
      price_data.right_learning_guarantee_texts = result.right_learning_guarantee_texts;
      price_data.images = [];
      price_data.faqs = faqs.data;
      price_data.images = image;
      price_data.created = result.created;
      price_data.imageUrl = config.file_base_url + '/public/price/';
      price_data.languages_human_speak_text = result.languages_human_speak_text;
      price_data.below_price_card_left_text = result.below_price_card_left_text;
      price_data.below_price_card_right_text = result.below_price_card_right_text;
      price_data.subscription_pricing_points_text = result.subscription_pricing_points_text;
      res.json(appfunctions.successResponse("msg_success", price_data));
    }
  })
})

router.get('/blogsList', async (req, res) => {
  let language_id = config.defaultLanguageId;
  Blog.find({ language_id: language_id }, async function (err, result) {
    if (err) {
      res.json(appfunctions.failResponse("erro", err));
    } else {
      let tag = `<url>
        <loc>https://devnode.devtechnosys.tech/birlingo-website/blog-detail/{slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.3</priority>
        <lastmod>2021-03-15</lastmod>
      </url>`
      let tempString = "";
      result.map((element, i) => {
        tempString = tempString + tag.replace(/{slug}/g, element.slug)
      })
      res.json(appfunctions.successResponse("msg_success", tempString));
    }
  })
})

router.post('/appleWebhooks2', async (req, res) => {
  console.log("appleWebHook: ", JSON.stringify(req.body));
  let event;
  try {
    event = req.body;
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // let webhookss = new webhooks()
  let webhookss = new webhookApple()
  webhookss.event_type = event.notification_type ? event.notification_type : "default";
  webhookss.event_object = event.unified_receipt && event.unified_receipt.latest_receipt_info.length && event.unified_receipt.latest_receipt_info[0] ? event.unified_receipt.latest_receipt_info[0] : {}
  webhookss.url = "AppleWebhook";
  webhookss.save((errs, results) => {
    return res.json({ result: event, 'message': "subscription_cycle" }).status(200).end();
  })
})



function getExpireDate1(product_id,date,is_trial_period,trialPeriodDays) 
{
  let expiry = ''; 
  if (product_id == "Birlingo_Subs1") {
    expiry = new Date(date.setMonth(date.getMonth() + 1));
  } else if (product_id == "Birlingo_Subs3") {
    expiry = new Date(date.setMonth(date.getMonth() + 3));
  } else if (product_id == "Birlingo_Subs6") {
    expiry = new Date(date.setMonth(date.getMonth() + 6));
  } else if (product_id == "Birlingo_Subs12") {
    expiry = new Date(date.setMonth(date.getMonth() + 12));
  } else if (product_id == "Birlingo_SubsUn1") {
    expiry = new Date(date.setMonth(date.getMonth() + 240));
  }

  if (is_trial_period == "true" || is_trial_period == 2) {
    expiry = expiry.setDate(expiry.getDate() + trialPeriodDays)
  }
  expiry = new Date(expiry);


  return expiry
}

router.post('/appleWebhooks', async (req, res) => {
  let event;

  try 
  {
    event = req.body; 
  } 
  catch(err)
  { 
    return console.log({ message: "Something went wrong, Please try again later.", error: err })
  }

  let transaction_history;
  switch (event.notification_type)
  {
    case "INITIAL_BUY":
      var auto_renew_status = event.auto_renew_status ? event.auto_renew_status : "true";
      transaction_history = event.unified_receipt && event.unified_receipt.latest_receipt_info.length && event.unified_receipt.latest_receipt_info[0] ? event.unified_receipt.latest_receipt_info[0] : {};
      if (transaction_history != {})
      {
        let query = {
          subscription_name: transaction_history.original_transaction_id,
        };
        if (auto_renew_status == "true")
        {
          if (transaction_history.is_trial_period == "false")
          {
            query['payment_status'] = "active";
            UserSubs.findOne(query, async function (err, userSubData) 
            {
              let data = {
                status:1,
                type:'subscription_create',
                user_id: userSubData.user_id ? userSubData.user_id : "",
                subscription_id :userSubData._id ? userSubData._id : "",
                payment_type : "charge_automatically",
                payment_status :"active",
                subscription_id : userSubData.subscription_id ? userSubData.subscription_id : "",
                transaction_id: transaction_history.original_transaction_id ? transaction_history.original_transaction_id : "",
                invoice_id: transaction_history.original_transaction_id ? transaction_history.original_transaction_id : "",
              }
              await createTransactionHistory1(updateData,transaction_history.orderId)
              .then(result=>{
                console.log({ message: "Apple Webhook successfully saved.", data: result });
              })
              .catch(err=>{
                res.json(err);
              })
            })
          }
        }
      }
      break;

    case "DID_CHANGE_RENEWAL_STATUS":
      var auto_renew_status = event.auto_renew_status == "true" ? "true" : "false";
      transaction_history = event.unified_receipt && event.unified_receipt.latest_receipt_info.length && event.unified_receipt.latest_receipt_info[0] ? event.unified_receipt.latest_receipt_info[0] : {};
      if (transaction_history != {})
      {
        let query = {subscription_name: transaction_history.original_transaction_id,};
        if (auto_renew_status == "true") 
        {
          if (transaction_history.is_trial_period == "false") 
          {
            UserSubs.findOne(query, async function (err, userSubData) {
              
              const subsPlanDetails = await BaseSusb.findOne({ _id: ObjectId(userSubData.subscription_id) })
              var date = new Date(parseInt(transaction_history.purchase_date_ms));
              let expiry = getExpireDate1(subsPlanDetails.apple_product_id,date,'','');

              let updateData = {
                trial_end:[],
                plan_ended:expiry,
                payment_status:"active",
                expire:expiry
              }

              await updateUserSubscription1(updateData,transaction_history.original_transaction_id)
              .then(async result=>{
                  let data = {
                    status:1,
                    type:'subscription_create',
                    user_id: userSubData.user_id ? userSubData.user_id : "",
                    subscription_id :userSubData._id ? userSubData._id : "",
                    payment_type : "charge_automatically",
                    payment_status :"active",
                    subscription_id : userSubData.subscription_id ? userSubData.subscription_id : "",
                    transaction_id: transaction_history.original_transaction_id ? transaction_history.original_transaction_id : "",
                    invoice_id: transaction_history.original_transaction_id ? transaction_history.original_transaction_id : "",
                  }

                  await createTransactionHistory1(updateData,transaction_history.original_transaction_id)
                  .then(result=>{
                    console.log({ message: "Google Webhook successfully saved.", data: result });
                  })
                  .catch(err=>{
                    res.json(err);
                  })
              })
              .catch(err =>{
                res.json(err);
              })
            })
          }
        } else {
          
          // case when user canceled his/her subscription
          var date = new Date(parseInt(transaction_history.purchase_date_ms));
          let updateData = {
            trial_end:[],
            is_cancel: 1,
            status:0,
            plan_ended:date,
            payment_status:"canceled",
            expire:date
          }

          await updateUserSubscription1(updateData,transaction_history.original_transaction_id)
          .then(result=>{
            console.log({ message: "subscription_updatedtocanceled Google", data: result })
          })
          .catch(err=>{
            res.json(err);
          })
        }
      }
      break;
  }

})




router.post('/googleWebhooks', async (req, res) => {
  let event;
  let transaction_history;
  try { event = req.body; } catch (err) { return console.log({ message: "Something went wrong, Please try again later.", error: err }) }
  var b64string = event && event.message && event.message.data;
  var buf = Buffer.from(b64string, 'base64'); 
  let string = buf.toString("utf8");
  let tempData = JSON.parse(string);

  if(tempData && tempData.subscriptionNotification && tempData.subscriptionNotification.subscriptionId)
  {
    const skuId = tempData.subscriptionNotification.subscriptionId;
    const purchaseToken = tempData.subscriptionNotification.purchaseToken;
    const packageName = tempData.packageName;

    try 
    {
      await JWTClient.authorize();
      const subscription = await playDeveloperApiClient.purchases.subscriptions.get({
          packageName: packageName,
          subscriptionId: skuId,
          token: purchaseToken
      });

      if (subscription.status === 200)
      {
        // Subscription response is successful. subscription.data will return the subscription information.
        transaction_history = subscription.data;
        if(transaction_history && transaction_history.orderId)
        {
          let query = {
            subscription_name: transaction_history.orderId,
          };
          if (transaction_history.autoRenewing == "true") 
          {
            UserSubs.findOne(query, async function (err, userSubData)
            {
              const subsPlanDetails = await BaseSusb.findOne({ _id: ObjectId(userSubData.subscription_id) })
              var date = new Date(parseInt(transaction_history.startTimeMillis));
              let expiry = getExpireDate1(subsPlanDetails.google_product_id,date,'','')

              let updateData = {
                trial_end:[],
                plan_ended:expiry,
                payment_status:"active",
                expire:expiry
              }

              await updateUserSubscription1(updateData,transaction_history.orderId)
              .then(async result=>{
                  let data = {
                    status:1,
                    type:'subscription_create',
                    user_id: userSubData.user_id ? userSubData.user_id : "",
                    subscription_id :userSubData._id ? userSubData._id : "",
                    payment_type : "charge_automatically",
                    payment_status :"active",
                    subscription_id : userSubData.subscription_id ? userSubData.subscription_id : "",
                    transaction_id: transaction_history.orderId ? transaction_history.orderId : "",
                    invoice_id: transaction_history.orderId ? transaction_history.orderId : "",
                  }
                  await createTransactionHistory1(updateData,transaction_history.orderId)
                  .then(result=>{
                    console.log({ message: "Google Webhook successfully saved.", data: result });
                  })
                  .catch(err=>{
                    res.json(err);
                  })
              })
              .catch(err =>{
                res.json(err);
              })
            })
          } 
          else
          { 
            // case when user canceled his/her subscription
            var date = new Date(parseInt(transaction_history.startTimeMillis));
            let updateData = {
              trial_end:[],
              is_cancel: 1,
              status:0,
              plan_ended:date,
              payment_status:"canceled",
              expire:date
            }

            await updateUserSubscription1(updateData,transaction_history.orderId)
            .then(result=>{
              console.log({ message: "subscription_updatedtocanceled Google", data: result })
            })
            .catch(err=>{
              res.json(err);
            })
          }
        }
      }
    }
    catch (error) 
    {
        // Logging error for debugging
        console.log("error from endddd",error)
    }

    // This message is returned when there is no successful response from the subscription/purchase get call
    return {
        status: 500,
        message: "Failed to verify subscription, Try again!"
    }
  }
})




// Trail Notification
// NOTE:  Currently this api is not in use from web and app so now I'm not change the first_name and last_name to username in email template
router.post('/webhooks', async (req, res) => {
  let event;
  try {
    event = req.body;
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type)
  {
    let webhookss = new webhooks()
    webhookss.event_type = event.type
    webhookss.event_object = event
    webhookss.url = "webhooks";
    webhookss.save((errs, results) => {
    if (results)
    {
        switch (event.type)
        {
          case "customer.subscription.deleted":
            let customer = event.data.object.customer
            let subscription = event.data.object.id
            let status = event.data.object.status;
            if(subscription != '')
            {
              var params = {
                subscription_name: subscription
              };
              var stringifyData = JSON.stringify(params);
              let parseData = JSON.parse(stringifyData);

              UserSubs.updateOne(
                { status: 2, payment_status: status },
                { $set: parseData },
                function (err, result) {
                  if (err) 
                  {
                    console.log('Error - 34564583', err);
                    return res.json({ 'errors': err }).status(200).end();
                  }
                  if (result) 
                  {
                    return res.json({ 'result': result }).status(200).end();
                  }
                })
            }
            break;
          case "invoice.payment_succeeded":
            let customer_id = event.data.object.customer
            let customer_email = event.data.object.customer_email
            let subscription_name = event.data.object.subscription
            let payment_status = event.data.object.status
            let susbendDate = event.data.object.lines.data[0].period.end;
            let susbstartDate = event.data.object.lines.data[0].period.start;

            var params = {
              subscription_name: subscription_name
            };
            var stringifyData = JSON.stringify(params);
            let parseData = JSON.parse(stringifyData);

            UserSubs.updateOne(
              { status: 1, payment_status: payment_status },
              { $set: parseData },
              async function (err, result) {
                if (err) 
                {
                  console.log('Error - 34564583', err);
                  return res.json({ 'errors': err }).status(200).end();
                }
                if (result) 
                {
                  let usersdata = await appfunctions.getUserDetailsById(result.user_id);
                  if (usersdata.lead_id) {
                    let sharp = await appfunctions.updateUserByColumn(usersdata._id, "lastpayment", moment(transactions.created), result)
                    sharp.then(result=>{
                      console.log(result)
                    })
                    .catch(err=>{
                      console.log('ERROR - 463823928',err.error)
                    })
                  }

                  let transactions = new Transaction()
                  transactions.transaction_id = event.data.object.charge
                  transactions.invoice_id = event.data.object.id,
                  transactions.type = event.data.object.billing_reason,
                  transactions.amount = event.data.object.amount_paid,
                  transactions.payment_type = event.data.object.collection_method,
                  transactions.status = event.data.object.paid == true ? 1 : 2
                  transactions.payment_intent_id = event.data.object.payment_intent?event.data.object.payment_intent:''
                  transactions.payment_status = payment_status;

                  transactions.user_id = result.user_id
                  transactions.usersubscription_id = result._id
                  transactions.subscription_id = result.subscription_id

                  transactions.save(async (errTrans, transactions) => {
                    if (errTrans) {
                      console.log('ERROR-458374',errTrans);
                      return res.json({ "errTrans": 'error in save errTrans' }).status(200).end();
                    }
                    if (transactions) {
                      return res.json({ 'result': transactions }).status(200).end();
                    }
                  })
                }
            })

            break;
          case "customer.subscription.trial_will_end":
              let subscriptionID = event.data.object.id
              let endtime = event.data.object.current_period_end
              let startime = event.data.object.current_period_start
              let dateend = moment(moment.unix(endtime), "DD MMM,YYYY")
              let datestart = moment(moment.unix(startime).utc(), "DD.MM.YYYY")
              var diff = dateend.diff(datestart, "days"); //console.log( "days-diffrence-",diff); Trail End Dirrence in days
              UserSubs.findOne({ subscription_name: subscriptionID }, function (err, result) {
                if (err) return res.json({ 'errors': err, 'message': "UserSubs find error." }).status(200).end();
                if (result) {
                  let user_id = result.user_id;
                  User.findOne({ _id: ObjectId(user_id) }, (errs, user) => {
                    if (errs) return res.json({ 'errors': errs, 'message': "Error in User-Find" }).status(200).end();
                    if (user) {
                      let email = user.email
                      Emailtemplates.findOne({ slug: "trial_period_end", language_id: ObjectId(user.language_id) }, async (err, template) => {
                        if (err) {
                          return res.json({ 'errors': err, 'message': "Error in Emailtemplates" }).status(200).end();
                        } else {
                          if (template) {
                            var templatereplace = template.description.replace("{date}", dateend).replace("{firstname}", user.name).replace("{lastname}", user.name);
                            var issEmailSent = appfunctions.sendEmail(
                              template.subject,
                              user.email,
                              config.emailFrom,
                              templatereplace
                            );
                            if (issEmailSent == false) {
                              return res.json(appfunctions.failResponse("msg_email_not_send")).status(200).end();
                            } else {
                              if (user.lead_id) {
                                let datas = await appfunctions.updateUserByColumn(user._id, "lastemailreceived", moment(), user)
                              }
                              return res.json(appfunctions.successResponse("msg_email_sent", user)).status(200).end();
                            }
                          } else {
                            return res.json(appfunctions.failResponse("template", 'template not found.')).status(200).end();
                          }
                        }
                      }
                      );
                    } else {
                      return res.json(errs).status(200).end();
                    }
                  }
                  )
                } else {
                  return res.json({ 'result': '', 'message': "UserSubs Not found" }).status(200).end();
                }
              }
              )
            break;
            case "invoice.payment_failed":
            
            return res.json({ 'result': '', 'message': "Payement Failed" }).status(200).end();
            break;
          // case "invoice.finalized":
          //   // console.log('invoice.finalized')
          //   let finalSubsname = event.data.object.subscription
          //   let final_invoice_id = event.data.object.id
          //   let final_transaction_id = event.data.object.charge
          //   let final_payment_intent = event.data.object.payment_intent
          //   let final_payment_status = event.data.object.status
          //   let final_amount_paid = event.data.object.amount_paid
          //   let final_payment_type = event.data.object.collection_method
          //   UserSubs.findOne(
          //     { subscription_name: finalSubsname, payment_status: "active" },
          //     function (err, result) {
          //       if (err) {
          //         return res.json({ 'errors': err, 'message': "UserSubs find error." }).status(200).end();
          //       }
          //       if (result) {
          //         let userSubsID = result._id
          //         Transaction.findOne({ usersubscription_id: ObjectId(userSubsID) }, function (errs, transaction) {
          //           if (errs) {
          //             return res.json({ 'errors': errs, 'message': "invoice.finalized Transaction find error." }).status(200).end();
          //           }
          //           if (transaction) {
          //             transaction.invoice_id = final_invoice_id
          //             transaction.transaction_id = final_transaction_id
          //             transaction.payment_intent_id = final_payment_intent
          //             transaction.payment_status = final_payment_status
          //             transaction.save();
          //             return res.json({ 'result': transaction, 'message': "invoice.finalized:transaction Saved oldone" }).status(200).end();
          //           } else {
          //             let transactionNew = new Transaction()
          //             transactionNew.user_id = result.user_id
          //             transactionNew.subscription_id = result._id
          //             transactionNew.invoice_id = final_invoice_id
          //             transactionNew.transaction_id = final_transaction_id
          //             transactionNew.payment_intent_id = final_payment_intent
          //             transactionNew.payment_status = final_payment_status
          //             transactionNew.amount = final_amount_paid
          //             transactionNew.payment_type = final_payment_type
          //             transactionNew.status = 1
          //             transactionNew.subscription_id = result.subscription_id
          //             transactionNew.type = 'subscription_create'
          //             transactionNew.save((errss, transactionNewS) => {
          //               if (errss) {
          //                 return res.json({ 'errors': errss, 'message': "invoice.finalized Transaction save error." }).status(200).end();
          //               }
          //               if (transactionNewS) {
          //                 return res.json({ 'result': transactionNewS, 'message': "invoice.finalized:transactionNewS Saved" }).status(200).end();
          //               } else {
          //                 return res.json({ 'result': transaction, 'message': "invoice.finalized Transaction not saved." }).status(200).end();
          //               }
          //             })

          //           }
          //         })
          //       } else {
          //         return res.json({ 'result': result, 'message': "UserSubs Not found" }).status(200).end();
          //       }
          //     })
          //   break;
          // case "customer.subscription.updated":
          //   // console.log('customer.subscription.updated', event)
          //   let subscriptionnn = event.data.object.id
          //   let paymentStatus = event.data.object.status
          //   UserSubs.findOne(
          //     {
          //       subscription_name: subscriptionnn,
          //       payment_status: "trialing",
          //       status: 1,
          //     },
          //     function (err, update) {
          //       if (err) {
          //         return res.json({ "subscription_update_err": err }).status(200).end();
          //       } else {
          //         if (update) {
          //           update.payment_status = paymentStatus
          //           update.expire = update.plan_ended
          //           update.save()
          //           return res.json({ "subscription_updatedtoactive": update }).status(200).end();
          //         } else {
          //           return res.json({ "not_found": subscriptionnn }).status(200).end();
          //         }
          //       }
          //     }
          //   )
          //   break;
          // case "customer.subscription.created":
          //   let sub_sched = event.object.schedule
          //   let subscription_id = event.object.id
          //   let payment_status1 = event.object.status
          //   let current_period_end = event.object.current_period_end
          //   let ended = moment.unix(current_period_end).utc()
          //   if (sub_sched) {
          //     UserSubs.findOne(
          //       {
          //         subscription_schedule_name: sub_sched,
          //         payment_status: "not_started",
          //         status: 3
          //       },
          //       function (err, userSubScheule) {
          //         if (err) {
          //           return res.json({ "subscription_created_error": err }).status(200).end();
          //         } else {
          //           if (result) {
          //             result.subscription_id = subscription_id
          //             result.payment_status = payment_status1
          //             result.plan_ended = moment(ended).format()
          //             result.status = 1
          //             result.save((errors, userSubsSave) => {
          //               if (errors) {
          //                 return res.json({ "subscription_created_save_err": errors }).status(200).end();
          //               } else {
          //                 if (userSubsSave) {
          //                   return res.json({ "subscription_created_save": userSubsSave }).status(200).end();
          //                 } else {
          //                   return res.json({ "subscription_created_save_null": userSubsSave }).status(200).end();
          //                 }
          //               }
          //             })
          //           } else {
          //             return res.json({ "subscription_created_result": userSubScheule }).status(200).end();
          //           }
          //         }
          //       }
          //     )
          //   }
          //   break;
            case "payment_intent.succeeded":
         
               let client_secret = event.data.object.client_secret;
               console.log
               let statuss = event.data.object.status;
                let status11 = 0;
                 let payment_status22 = 'pending';
                if(statuss == 'succeeded')
                {
                  status11 = 1;
                  payment_status22 = 'active';
                }
                else if(statuss == 'processing')
                {
                  status11 = 0;
                  payment_status22 = 'processing';
                }
                else if(statuss == 'payment_failed')
                {
                  status11 = 0;
                  payment_status22 = 'failed';
                }
                
                UserSubs.findOne({ payment_intent_client_secret: client_secret }, async (err, result) => {
                  var params = {
                    status: status11,
                    payment_status: payment_status22
                  };
                  var stringifyData = JSON.stringify(params);
                  let parseData = JSON.parse(stringifyData);
                  UserSubs.updateOne(
                    { payment_intent_client_secret: client_secret },
                    { $set: parseData },
                    function (err, result) {
                      if (err) {
                        console.log(err,'error on update')
                        res.json(appfunctions.failResponse("msg_something_wrong", err));
                      } else {
                        res.json(
                          appfunctions.successResponse(
                            "msg_success",
                            {
                              //terms: termsJson.response,
                              userSubs: UserSubs
                            }
                            //req.user
                          )
                        );
                      }
                    }
                  );
                });
         
            break;
          default:
            return res.json(event).status(200).end();
        }
      } else {
        return res.json(errs).status(200).end();
      }
    })
  }
})


let saveUserSubscription1 = (data)=>
{
  return new Promise((resolve, reject) => {
    let userSubs = new UserSubs(data);
    userSubs.save(async (err, schedule) => {
      if (err) {
        console.log(err);
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } else {
        resolve(schedule);
      }
    })
  })
}


let updateUserSubscription1 = (data,usersubs_id)=>
{
  return new Promise((resolve, reject) => {
    var stringifyData = JSON.stringify(data);
    let parseData = JSON.parse(stringifyData);

    userSubs.updateOne(
      { subscription_name: ObjectId(usersubs_id) },
      { $set: parseData },
      async (err, schedule) => {
      if (err) {
        console.log(err);
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } else {
        resolve(schedule);
      }
    })
  })
}


let createTransactionHistory1 = (data)=>
{
  return new Promise((resolve, reject) => {
    let transaction = new Transaction(data);
    transaction.save(async (err, schedule) => {
      if (err) {
        console.log(err);
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } else {
        resolve(schedule);
      }
    })
  })
}




function saveWebhookResponse(event) {
  let webhookss = new webhookApple()
  webhookss.event_type = event.notification_type ? event.notification_type : "default"
  webhookss.event_object = event.unified_receipt && event.unified_receipt.latest_receipt_info.length && event.unified_receipt.latest_receipt_info[0] ? event.unified_receipt.latest_receipt_info[0] : {}
  webhookss.url = "AppleWebhook";
  webhookss.save((errs, results) => {
    return console.log({ data: results, 'message': "Webhook saved successfully." });
  })
}

router.get("/homeImage", async (req, res) => {
  let image = await HomeImage.findOne().select({ banner_image: 1, learning_text_image: 1, speak_text_image: 1, our_text_image: 1, content_text_image: 1, online_or_offline_text_image: 1, _id: 0, banner_text: 1, learning_text: 1, speak_text: 1, our_text: 1, content_text: 1, online_or_offline_text: 1 });
  let result = {};
  result.imageUrl = config.file_base_url + '/public/home/';
  result.images = [];
  result.images = image;
  res.json(appfunctions.successResponse("msg_success", result));
})

module.exports = router;
