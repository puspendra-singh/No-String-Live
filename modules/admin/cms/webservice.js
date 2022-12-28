const router = require("express").Router();
const { check, validationResult } = require("express-validator/check");
const { matchedData, sanitize } = require("express-validator/filter");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Emailtemplates = require("../models/emailtemplates");
const Subscription = require("../models/subscription");
const checkJWT = require("../middlewares/check-jwt");
const urlSlug = require("url-slug");
const crypto = require("crypto");
const multer = require("multer");
const formidable = require("formidable");
const gm = require("gm");
const LearningLanguage = require("../models/learninglanguages");
const LessonFamily = require('../models/lessonfamilies');
const Languages = require("../models/languages");
const terms = require("../models/terms");
const BaseLesson = require("../models/baselessons")
const Lesson = require("../models/lessons")
const mongoose = require("mongoose");
const moment = require("moment");
const ObjectId = mongoose.Types.ObjectId;
const path = require("path");
const fs = require("fs");
const appfunctions = require("./AppFunctions/app_functions");
const config = require("../config/configdb");
const Transaction = require("../models/transactions")
const UserSubs = require("../models/user_subscription")
const LesssonHistory = require("../models/lessonhistory")
const settings = require("../models/settings")
const Rating = require('../models/ratings');
const SusbContent = require('../models/subs_content')
const BaseSusb = require("../models/basesubscription");
const Coupon = require('../models/coupon.js')
const Logs = require('../models/logs.js')

// for google in app
const {google} = require('googleapis');
const account = require('./googleInAppFile.json');

var logger = require('winston');
const { request } = require("http");

/*
 set the directory for the uploads to the uploaded to
*/
const DIR = "./public/uploads";

var stripe = "";

function getStripeInstance()
{
  return new Promise((resolve, reject) => {
    settings.findOne().exec((err, result) => {
      if (result.payment_mode === 1) {
        stripe = require('stripe')(result.private_key_live);
      } else {
        stripe = require('stripe')(result.private_key_test);
      }
      resolve(true);
    });
  });

}

const JWTClient = new google.auth.JWT(
  account.client_email,
  null,
  account.private_key,
  ["https://www.googleapis.com/auth/androidpublisher"]
);


//Splite String 
function getString(string) {
  let split = string.split("*").join(" ")
  return split;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    //console.log(file.originalname);
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage: storage }).single("photo");

function checkOnline(lastActieDateTime) {
  let currentTime = new Date();
  let lastTime = lastActieDateTime;
  let isOnline = "";
  let diffMs = currentTime - lastTime; // milliseconds between now & last active
  var diffDays = Math.floor(diffMs / 86400000); // days
  var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
  let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
  if (diffMins <= 5 && diffDays == 0) {
    isOnline = 1;
  } else {
    isOnline = 0;
  }
  return isOnline;
}






//GET ALL LEARNING LANGUAGES
router.get("/afterLoginlearningLanguages", async (req, res, next) => {
  let language_id = req.user.language_id ? ObjectId(req.user.language_id._id) : ObjectId(config.defaultLanguageId);
  let languages = await appfunctions.getLanguageDetailsById(language_id);
  LearningLanguage.aggregate([
    {
      $lookup: {
        from: "terms",
        let: {
          slug: "$term"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      {
                        $arrayElemAt: ["$language_id", 0]
                      },
                      ObjectId(language_id)
                    ]
                  },
                  {
                    $eq: ["$term", "$$slug"]
                  }
                ]
              }
            }
          }
        ],
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
        termtext: {
          $cond: {
            if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ""] },
            then: "$term_english",
            else: "$terms.text"
          }
        },
        casesensitivetext: {
          $toLower: {
            $cond: {
              if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ""] },
              then: "$term_english",
              else: "$terms.text"
            }
          }
        },
        language_id: {
          $arrayElemAt: ["$terms.language_id", 0]
        }
      }
    },
    {
      $sort: {
        casesensitivetext: 1
      }
    }
  ]).exec(function (err, result) {
    //console.log(JSON.stringify(req.user) + "req.user");
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      res.json(
        appfunctions.successResponse(
          "msg_success",
          { languages: result, selected: req.user.learning_language_id },
          req.user
        )
      );
    }
  });
});







/*
 For resend otp
*/
router.post("/resendOtp", (req, res, next) => {
  User.findOne(
    {
      email: req.body.email
    },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        res.json(appfunctions.failResponse("msg_not_registred_user"));
      } else if (user) {
        //user.token =  crypto.randomBytes(20).toString('hex');
        var otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        user.save();

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
                var templatereplace = template.description
                  .replace("{otp}", otp)
                  .replace("{name}", user.full_name);
                var issEmailSent = appfunctions.sendEmail(
                  template.subject,
                  user.email,
                  config.emailFrom,
                  templatereplace
                );
                if (issEmailSent == false) {
                  res.json(appfunctions.failResponse("msg_email_not_send"));
                } else {
                  res.json(
                    appfunctions.successResponse(
                      "msg_check_reg_email_for_otp",
                      user
                    )
                  );
                }
              } else {
                Emailtemplates.findOne(
                  {
                    slug: "verification_otp",
                    language_id: ObjectId(config.defaultLanguageId)
                  },
                  (err, template) => {
                    if (err) {
                      res.json(
                        appfunctions.failResponse("msg_something_wrong")
                      );
                    } else {
                      var templatereplace = template.description
                        .replace("{otp}", otp)
                        .replace("{name}", user.full_name);
                      var issEmailSent = appfunctions.sendEmail(
                        template.subject,
                        user.email,
                        config.emailFrom,
                        templatereplace
                      );
                      if (issEmailSent == false) {
                        res.json(
                          appfunctions.failResponse("msg_email_not_send")
                        );
                      } else {
                        res.json(
                          appfunctions.successResponse(
                            "msg_check_reg_email_for_otp",
                            user
                          )
                        );
                      }
                    }
                  }
                );
              }
            }
          }
        );
      }
    }
  );
});

router.get("/getManageAccount/:user_id", async (req, res, next) => {
  let user_id = req.params.user_id;
  //console.log(user_id) + "checkid";
  let language_id =
    req.user && req.user.language_id
      ? req.user.language_id._id
      : config.defaultLanguageId;
  let learningLan = await appfunctions.getAllLearningLanguages(language_id);
  let lang = await appfunctions.getAllLanguages(language_id);
  User.aggregate([
    { $match: { _id: { $eq: ObjectId(user_id) } } },
    {
      $project: {
        user_info: {
          id: "$$ROOT._id",
          name: "$$ROOT.name",
          surname: "$$ROOT.surname",
          username: "$$ROOT.username",
          gender: "$$ROOT.gender",
          email: "$$ROOT.email",
          last_confirm_terms: "$$ROOT.last_confirm_terms",
          role_id: "$$ROOT.role_id",
          last_active: "$$ROOT.last_active",
          facebook: "$$ROOT.facebook",
          //photo: { $ifNull: ["$$ROOT.photo", ''] },
          base_location: { $ifNull: ["$$ROOT.base_location", ""] },
          facebook_id: "$$ROOT.facebook_id",
          language_id: "$$ROOT.language_id",
          learning_language_id: "$$ROOT.learning_language_id",
          photo_authorised: { $ifNull: ["$$ROOT.photo_authorised", 0] },
          device_token: "$$ROOT.device_token",
          device_type: "$$ROOT.device_type"
        },
        learning_language_list: learningLan,
        language_list: lang
      }
    }
  ]).exec(function (err, result) {

    let datas = JSON.stringify(result);
    //console.log(datas["user_info"]);
    res.json(
      appfunctions.successResponse(
        "msg_success",
        result[0],
        req.user,
        datas.language_id
      )
    );
  });
});

/*
 For Update user account Info / Manage account:
*/
router.post("/updateManageAccount", async (req, res, next) => {
 
  let user_id = req.user._id
  User.findOne({ _id: ObjectId(req.user._id) }, async (err, result) => {
    var params = {
      username: req.body.username,
      gender: req.body.gender
    };
    var stringifyData = JSON.stringify(params);
    let parseData = JSON.parse(stringifyData);
    User.updateOne(
      { _id: ObjectId(user_id) },
      { $set: parseData },
      function (err, result) {
        if (err) {
          res.json(appfunctions.failResponse("msg_something_wrong", err));
        } else {
          User.findOne(
            {
              _id: ObjectId(user_id)
            },
            async (err, user) => {
              if (err) {
                res.json(appfunctions.failResponse("msg_not_valid_user"));
              } else {
                // Get terms according to change profile settings.
                let termsJson = await appfunctions.getTermsById(
                  req.body.language_id
                );
                res.json(
                  appfunctions.successResponse(
                    "msg_profile_updated",
                    {
                      //terms: termsJson.response,
                      user: user
                    },
                    req.user,
                    user.language_id
                  )
                );
              }
            }
          );
        }
      }
    );
  });
});

//For Update Learning Language
router.post("/updatelearninglang", (req, res, next) => {
  //console.log(req.body.learning_language_id+'req.user._id');
  User.updateOne(
    { _id: ObjectId(req.user._id) },
    { $set: { learning_language_id: req.body.learning_language_id } },
    function (err, result) {
      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong", err));
      } else {
        res.json(
          appfunctions.successResponse(
            "msg_learning_language_updated",
            req.body.learning_language_id,
            req.user
          )
        );
      }
    }
  );
});

/*
 For Update user last active time
*/

router.post("/updateLastActive", (req, res, next) => {
  User.findOne(
    {
      _id: ObjectId(req.body.id)
    },
    (err, user) => {
      if (err) {
        res.json(appfunctions.failResponse("msg_not_valid_user"));
      } else {
        //console.log(new Date());
        // user.last_active = req.body.last_active;
        user.last_active = new Date(); //current date time in utc-format
        user.isOnline = req.body.isOnline;
        user.save((err, result) => {
          //console.log(err);
          if (err) {
            res.json(appfunctions.failResponse("msg_something_wrong"));
          } else {
            //console.log('Pramod');
            res.json(
              appfunctions.successResponse("msg_profile_updated", "", req.user)
            );
          }
        });
      }
    }
  );
});

//For getting list of languages
router.get("/getLanguageList", (req, res, next) => {
  let language_id = config.defaultLanguageId;
  let user_language_id = req.user.language_id ? req.user.language_id._id : language_id
  Languages.aggregate([
    {
      $lookup: {
        from: "terms",
        let: {
          slug: "$term"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      {
                        $arrayElemAt: ["$language_id", 0]
                      },
                      ObjectId(language_id)
                    ]
                  },
                  {
                    $eq: ["$term", "$$slug"]
                  }
                ]
              }
            }
          }
        ],
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
        label: {
          $cond: {
            if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ""] },
            then: "$language",
            else: "$terms.text"
          }
        },
        casesensitivetext: {
          $toLower: {
            $cond: {
              if: { $eq: [{ $ifNull: ["$terms.text", ""] }, ""] },
              then: "$language",
              else: "$terms.text"
            }
          }
        },
        value: "$_id",
        selected: {
          $cond: {
            if: {
              $eq: ['$_id', ObjectId(user_language_id)]
            },
            then: 1,
            else: 0
          }
        }
      }
    },
    {
      $sort: {
        casesensitivetext: 1
      }
    }
  ]).exec(function (err, result) {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      res.json(appfunctions.successResponse("msg_success", result, req.user));
    }
  });
});




router.post("/afterloginterms", async (req, res, next) => {
  var language_id = req.body.language_id;
  var eng_language_id = config.defaultLanguageId;
  if (language_id) {
    let language = await appfunctions.getLanguageDetailsById(language_id)
    let ln_slug = language.term
    let lnlang = ln_slug.split("lang_")
    let learningLanlanguage = await appfunctions.getLearnLanguageDetailsById(req.user.learning_language_id)
    let ll_slug = learningLanlanguage ? learningLanlanguage.term : ""
    let llang = ll_slug.split("ll_")
    if (ll_slug != "" && llang[1] == lnlang[1]) {
      
      res.json(appfunctions.failResponse("msg_app_and_learning_lang_not_same"));
    } else {
      var query = terms
        .find({ language_id: eng_language_id })
        .select(["term", "text"]);
      query.exec(function (err, result) {
        if (err) {
          res.status(500).json({
            success: false,
            message: "msg_something_wrong"
          });
        }
        // __logger.error("result", JSON.stringify(result));
        var query1 = terms
          .find({ language_id: language_id })
          .select(["term", "text"]);
        query1.exec(async function (err1, result1) {
          if (err1) {

            res.json(appfunctions.failResponse("msg_something_wrong"));
          }
          // __logger.error("result", JSON.stringify(result1));
          var trm = {};
          for (var i = 0; i < result.length; i++) {
            trm[result[i].term] = result[i].text;
          }

          for (var i = 0; i < result1.length; i++) {
            if (result1[i].text != null && result1[i].text != "") {
              trm[result1[i].term] = result1[i].text;
            }
          }
          if (language_id) {
            await appfunctions.saveLanguageOfUser(
              req.user._id,
              req.body.language_id
            );
            // __logger.error("msg_provide_language", trm);
            res.json(
              appfunctions.successResponse(
                "msg_provide_language",
                trm,
                req.user,
                200,
                language_id
              )
            );
          } else {
            __logger.error("msg_provide_language");
            res.json(
              appfunctions.successResponse(
                "msg_provide_language",
                "",
                req.user,
                "",
                language_id
              )
            );
          }
        });
      });
    }
  }
});

function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() - minutes * 60000);
}

function DateFormat(date) {
  var days = date.getDate();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var hours = date.getHours();
  var minutes = date.getMinutes();
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = days + "/" + month + "/" + year + "/ " + hours + ":" + minutes;
  return strTime;
}

router.get("/systemParameters", function (req, res) {
  settings.findOne({}, (err, result) => {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      res.json(appfunctions.successResponse("msg_success", result));
    }
  });
});

/**Get Lesson Family According to App Language**/
router.post('/lesson-family', async function (req, res) {
  console.log("req.user =======> ", req.user);
  console.log("req.body >>>>>>> ", req.body);
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId
  let learning_language_id = req.user.learning_language_id;
  let demoLesson = await appfunctions.getLessonData(req.user.learning_language_id, req.user.language_id ? req.user.language_id._id : language_id);
  //let demoFmly = await LessonFamily.findOne({_id:ObjectId('5efae3f00cd68d7bc311472c')});
  let demoFmly = await LessonFamily.findOne({ _id: ObjectId(config.demoFamily) });
  let lessonpercentage = await appfunctions.getDemoLessonHitory(req.user._id);

  LessonFamily.aggregate([
    {
      $lookup: {
        from: 'baselessons',
        let: { 'familyid': "$_id", },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$lessonfamily_id', '$$familyid'] } },
                { $expr: { $eq: ['$is_demo', 2] } }
              ]
            }
          },
          {
            $lookup: {
              from: 'lessons',
              let: { baselessonid: "$_id", level_id: "$level_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ['$baselesson_id', '$$baselessonid'] } },
                      { $expr: { $eq: ['$learninglanguage_id', ObjectId(learning_language_id)] } },
                      { $expr: { $eq: ['$is_publish', 1] } },
                    ]
                  },
                },
              ],
              as: "lessons"
            }
          },
          {
            $unwind: {
              path: "$lessons",
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $group: {
              "_id": "$level_id",
              total: { $sum: 1 },
              level_id: { $first: '$$ROOT.level_id' },
            }
          },
        ],
        as: "baselesson"
      },
    },
    {
      $unwind: {
        path: "$baselesson",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
        _id: "$_id",
        level_id: '$baselesson.level_id',
        Lfamily: '$term',
        total: "$baselesson.total",
        image: "$image",
        text: "$term_english"
      }
    },
    {
      $sort: {
        "Lfamily": 1
      }
    }
  ]).exec(async function (err, result) {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      let familiesss = [], demos = {}, compeleted = 0, started = 0;
      result = JSON.parse(JSON.stringify(result))
      // console.log("lessonpercentage ======> ", lessonpercentage);
      if (lessonpercentage != null && lessonpercentage.active_progress == 100 && lessonpercentage.passive_progress == 100 && lessonpercentage.speak_progress == 100 && lessonpercentage.repeat_progress == 100) {
        compeleted = 1;
      }
      // console.log("completed: ", compeleted);
      if (lessonpercentage && lessonpercentage.active_progress != 0) {
        started = 1;
      }
      demos._id = config.demoFamily; // "5efae3f00cd68d7bc311472c"
      demos.lesson_id = (lessonpercentage && lessonpercentage.lesson_id != undefined) ? lessonpercentage.lesson_id : demoLesson.data[0]._id, demos.Lfamily = "lf_demo_lesson"
      demos.image = demoFmly.image
      demos.Lfamily = "lf_demo_lesson"
      demos.started = started;
      demos.levels = [{
        'fId': config.demoFamily,
        'fName': 'lf_demo_lesson',
        'fImage': demoFmly.image,
        'leve_id': 1,
        'label': 'lbl_level_one',
        "total": 1,
        "compeleted": compeleted,
        "progress": 0,
        'demo': {
          active_progress: lessonpercentage ? lessonpercentage.active_progress : 0,
          passive_progress: lessonpercentage ? lessonpercentage.passive_progress : 0,
          speak_progress: lessonpercentage ? lessonpercentage.speak_progress : 0,
          repeat_progress: lessonpercentage ? lessonpercentage.repeat_progress : 0,
          label: 'lbl_demo',
        }
      }]

      // Push demo lesson.
      familiesss.push(demos)
      let array = [];
      await result.reduce(async (promise1, key) => {
        // console.log("key : ", key);
        // console.log("key.fid : ", key.fId);
        // console.log("demoFamily : ", config.demoFamily);
        // if(key.fId == config.demoFamily && key.level_id == 1) key.total = key.total + 1;
        key.compeleted = 0
        key.progress = 0
        let comleted = await appfunctions.getCompeleted(key._id, req.user._id, req.user.learning_language_id, key.level_id);
        // console.log("completed: ", comleted);
        if (comleted && comleted != "") {
          key.compeleted = (comleted[0]) ? comleted[0].compeleted : 0
        }
        let started = await appfunctions.getLessonStarted(key._id, req.user._id, key.level_id);
        key.started = (started == true) ? 1 : 0;
        key.progress = parseInt(((key.compeleted / key.total) * 100).toFixed(2))
      }, Promise.resolve());

      let family = await LessonFamily.find().sort({ "order_by": 1 });
      family.map(ele => {
        let started = 0;
        let levels = result.filter(fam => {
          if (String(fam._id) == String(ele._id)) {
            // if(fam.started == 1)
            return fam;
          }
        })
        if (levels.length > 0) {
          let families = {}
          families._id = ele._id
          families.Lfamily = ele.term
          families.image = ele.image
          families.levels = []
          let levelArr = [];
          levels.map((level, next) => {
            // console.log("level ---------> ", JSON.stringify(level));
            let levess = {}
            levess.fId = ele._id
            levess.fName = ele.term
            levess.fImage = ele.image
            levess.level_id = level.level_id
            levess.label = level.level_id == 1 ? "lbl_level_one" : level.level_id == 2 ? 'lbl_level_two' : "lbl_level_three"
            // console.log("key : ", key);
            // console.log("key.fid : ", key.fId);
            // console.log("demoFamily : ", config.demoFamily);
            levess.total = level.total
            if (ele._id == config.demoFamily && levess.level_id == 1) {
              levess.total = levess.total + 1;
              if (compeleted == 1) level.compeleted = level.compeleted + 1;
              if (demos.started == 1) started = 1;
            }
            levess.compeleted = level.compeleted
            levess.progress = level.progress
            if (level.started == 1) {
              started = 1;
            }
            levelArr.push(levess)
          })
          families.started = started;
          levelArr.sort(function (a, b) {
            var keyA = a.level_id,
              keyB = b.level_id;
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          });
          families.levels = levelArr
          familiesss.push(families)
        }
      })
      if (req.user.lead_id) {
        //let sharpuser = await appfunctions.sharpSpring(user._id,'updateLeads',user,user.lead_id);
      } else {
        if (req.user && req.user.lead_id == '') {
          let sharpuser = await appfunctions.sharpSpring(req.user._id, 'createLeads', req.user, '');
          if (sharpuser.data && sharpuser.data.success && sharpuser.data.id) {
            let user = await appfunctions.updateUserByColumn(req.user._id, "lead_id", sharpuser.data.id, req.user)
          } else {
            //res.json(appfunctions.successResponse("msg_success", sharpuser));
          }
        }
      }
      let response = {}
      let demo = {}
      response.imageUrl = config.file_base_url + '/public/lf/'
      response.family = familiesss
      console.log("reposne sent  ---> ", response);
      res.json(appfunctions.successResponse("msg_success", response));
    }
  });
})

/**Get Subscription According to App Language**/
router.post('/subscriptions', function (req, res) {
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId
  var currentDate = new Date();
  var payment_type = _payment_mode == 1 ? "live" : "test";

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
                  { $eq: ['$user_id', ObjectId(req.user._id)] },
                  { $gte: ["$expire", currentDate] },
                  { $in: ["$status", [0, 1]] },
                  {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$is_cancel", 0] },
                          // { $eq: [ "$payment_status", "active" ] },
                          { $in: ["$payment_status", ["active", "trialing",'processing']] }
                        ]
                      },
                      {
                        $and: [
                          { $eq: ["$is_cancel", "1"] },
                          { $eq: ["$payment_status", "canceled"] },
                        ]
                      }
                    ]
                  }
                  // { $eq: ["$is_cancel", 0] }
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
        google_product_id: { $first: '$$ROOT.google_product_id' },
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
        apple_product_id: "$$ROOT.apple_product_id",
        google_product_id: "$$ROOT.google_product_id",
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
          $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.status", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.status", 0] }, else: 0 }
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
    
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      res.json(appfunctions.successResponse("msg_success", result, req.user));
    }
  });
})

//Demo Of App
router.post('/app-demo', async (req, res, next) => {
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId;
  let learning_language_id = req.user.learning_language_id ? req.user.learning_language_id : req.body.learning_language_id;
  // let instructionData = await appfunctions.sentenceInstructions(language_id);  
  // let demoLesson = await appfunctions.getLessonData(learning_language_id,language_id)  
  // let totalsentenceCount = demoLesson.data[0].sentences.length-1;
  let instructionData = await appfunctions.sentenceInstructions(language_id);
  let demoLesson = await appfunctions.getLessonData(learning_language_id, language_id)
  let totalsentenceCount = demoLesson.data[0] ? demoLesson.data[0].sentences.length - 1 : 0;
  let imagineArr = new Array();
  let compareArr = new Array();
  let listenArr = new Array();
  let demoJson = new Array()
  let repeatArr = new Array();
  let repeatAftArr = new Array();
  let demoendArr = new Array();
  let sounds = new Array();
  let soundSlow = new Array();
  let afterSongloopArr = new Array();
  let beforeSongloopArr = new Array();
  let finishArr = new Array();
  let oneSecAudio = config.file_base_url + '/public/audio_files/compress/1sec.mp3'
  //Before Imagine Array
  console.log("user-", req.user);
  if (instructionData) {
    instructionData = await appfunctions.sentenceInstructions(config.defaultLanguageId);
  }
  instructionData.before_imagin_texts.map((data, k) => {
    imagine = new Object();
    imagine.state = 'active',
      imagine.type = 'title',
      imagine.lessonID = "lbl_demo";
    if (k == 0) {
      let name = req.user.username ? req.user.username : req.user.name + " " + req.user.surname;
      // let surname         = req.user.surname != undefined?req.user.surname:"" ;
      imagine.title = name + ', ' + data
    } else {
      imagine.title = data
    }
    imagineArr.push(imagine);
    //return imagineArr;
  })
  //Before Compare Array
  // instructionData.before_compare_texts.map((data,k)=>{ 
  //   compare = new Object();    
  //   compare.state = 'active',
  //   compare.type     = 'title',
  //   compare.lessonID = "lbl_demo";
  //   compare.title    = data
  //   compareArr.push(compare);         
  // })  
  //Before Listen
  instructionData.before_listen_texts.map((data, k) => {
    listen = new Object();
    listen.state = 'active',
      listen.type = 'title',
      listen.lessonID = "lbl_demo";
    listen.title = data
    listenArr.push(listen);
  })
  //Before Repeat
  instructionData.before_repeat_texts.map((data, k) => {
    repeat = new Object();
    repeat.state = 'active',
      repeat.type = 'title',
      repeat.lessonID = "lbl_demo";
    repeat.title = data
    repeatArr.push(repeat);
  })

  //After Repeat
  instructionData.after_repeat_texts.map((data, k) => {
    repeatAfter = new Object();
    repeatAfter.state = 'active',
      repeatAfter.type = 'title',
      repeatAfter.lessonID = "lbl_demo";
    repeatAfter.title = data
    repeatAftArr.push(repeatAfter);
  })
  //After Demo End
  instructionData.after_demo_end_texts.map((data, k) => {
    if (k == 0) {
      demoend = new Object();
      demoend.state = 'active',
        demoend.key = 'repeat',
        demoend.type = 'title',
        demoend.lessonID = "lbl_demo";
      demoend.title = data
      demoendArr.push(demoend);
    }

  })

  //Before Song Loop
  instructionData.before_songloop_text.map((data, k) => {
    songloop = new Object();
    songloop.state = 'passive',
      songloop.fordemo = k == 0 ? 'titles' : "passive"
    songloop.type = 'title',
      songloop.lessonID = "lbl_demo";
    songloop.title = data
    beforeSongloopArr.push(songloop);
  })
  //After Song Loop
  instructionData.after_songloop_texts.map((data, k) => {
    songloop = new Object();
    songloop.state = 'speak',
      songloop.type = 'title',
      songloop.lessonID = "lbl_demo";
    songloop.title = data
    afterSongloopArr.push(songloop);
  })
  //After Song Loop
  instructionData.finish_texts.map((data, k) => {
    finish = new Object();
    finish.state = 'repeat',
      finish.type = 'title',
      finish.button = true,
      finish.lessonID = "lbl_demo";
    finish.heading = "lbl_congratulations"
    finish.title = data
    finishArr.push(finish);
  })
  data = JSON.stringify(demoLesson.data);
  let sentencelists = [];
  await demoLesson.data[0].sentences.reduce(async (promise1, key) => {
    try {
      key.base64 = "";
      let filename = path.join(__dirname, "../public/audio_files/compress/" + key.audio)
      if (filename != "" && fs.existsSync(filename)) {
        __logger.info(JSON.stringify(key))
        filestring = await fs.readFileSync(filename, { encoding: 'base64' });
        key.base64 = filestring
      }
    } catch (err) {
      __logger.error(JSON.stringify(err))
    }
  }, Promise.resolve());
  // console.log(demoLesson.data[0].sentences)
  if (demoLesson) {
    demoLesson.data.map((item, index) => {
      sentence = new Array();
      let total = item.sentences.length
      item.sentences.map((obj, key) => {
        let filename = "";
        if (obj.base64 != "" && obj.audio != "") {
          filename = config.file_base_url + '/public/audio_files/compress/' + obj.audio;
        }
        //Count of Sentences
        let sno = key + 1
        let number = sno + '/' + total
        //Sentence List
        let sentences = new Object();
        console.log('sentences:',sentences)
        sentences.number = number
        sentences.sentence = obj.comparessentences[0].wrong_sentence.split("*").join(" ")//getString(sentenceObj.comparessentences.correct_sentence);//sentenceObj.sentence;
        sentencelists.push(sentences);
        //Song loop Song loop
        let songloop = new Object()
        songloop.toggle = 'pause'
        songloop.sound = filename,
          songloop.base64 = obj.base64,
          sounds.push(songloop);
        //Slow/Fast  Song loop 
        let slow_song_with_sentance = new Object()
        slow_song_with_sentance.toggle = 'pause'
        slow_song_with_sentance.sound = filename,
          slow_song_with_sentance.base64 = obj.base64,
          slow_song_with_sentance.sentence1 = obj.sentence
        slow_song_with_sentance.latin_sentence = obj.latin_sentence != "" ? obj.latin_sentence : ""
        soundSlow.push(slow_song_with_sentance);

        if (key == 0) {
          //Before Imagine texts for first sentence of demo lesson
          imagineArr.map((itemsss) => {
            demoJson.push(itemsss)
          })
          //Imagine Step For First Sentence of demo lesson
          newdemo = new Object();
          newdemo.state = 'active',
            newdemo.type = 'imagination',
            newdemo.lessonID = "lbl_demo";
          newdemo.heading = 'lbl_imagine',
            newdemo.sentence = obj.comparessentences[0] != undefined ? obj.comparessentences[0].correct_sentence : ""
          demoJson.push(newdemo);

          //Before Compare Text for first sentence of demo lesson
          // compareArr.map((compare)=>{
          //   demoJson.push(compare)
          // })

          //Compare Step For First Sentence of demo lesson
          // comparess = new Object(); 
          // comparess.state          = 'active',    
          // comparess.type           = 'compare',
          // comparess.lessonID       = "lbl_demo";
          // comparess.heading        = 'lbl_compare',
          // comparess.sentence1      = obj.sentence  
          // comparess.sentence2      = obj.comparessentences[0]!=undefined?obj.comparessentences[0].wrong_sentence:""
          // comparess.latin_sentence = obj.latin_sentence!= null?obj.latin_sentence:""   
          // demoJson.push(comparess)

          //Before Compare Text for first sentence of demo lesson
          listenArr.map((listen) => {
            demoJson.push(listen)
          })
          //Listen Step for first sentence of demo lesson
          listenSent = new Object();
          listenSent.state = 'active',
            listenSent.type = 'song',
            listenSent.lessonID = "lbl_demo";
          listenSent.heading = 'lbl_listen',
            listenSent.sentence1 = obj.sentence
          listenSent.sentence2 = obj.comparessentences[0] != undefined ? obj.comparessentences[0].wrong_sentence : ""
          listenSent.latin_sentence = obj.latin_sentence != "" ? obj.latin_sentence : ""
          listenSent.toggle = 'pause',
            listenSent.sound = filename,
            listenSent.base64 = obj.base64
          demoJson.push(listenSent)

          //Store Imageination index to reach the each sentences
          demoJson.filter((ele, i) => {
            if (ele.type == "song" && key < total) {
              //compare.index    =  i;   
              sentences.index = i;
            }
          })

          //Before repeat Text for first sentence of demo lesson
          repeatArr.map((repeat) => {
            demoJson.push(repeat)
          })

          //Repeat Step for first sentence of demo lesson
          repeatSent = new Object();
          repeatSent.state = 'active',
            repeatSent.type = 'repeat',
            repeatSent.lessonID = "lbl_demo";
          repeatSent.heading = 'lbl_repeat',
            repeatSent.sentence1 = obj.comparessentences[0] != undefined ? obj.comparessentences[0].wrong_sentence : "",
            demoJson.push(repeatSent)
          //Added repeat Sentence

          //After repeat Text for first sentence of demo lesson
          repeatAftArr.map((repeatAfter) => {
            demoJson.push(repeatAfter)
          })
        } else {
          //Imagine step for other sentence
          newdemo = new Object();
          newdemo.state = 'active',
            newdemo.type = 'imagination',
            newdemo.lessonID = "lbl_demo";
          newdemo.heading = 'lbl_imagine',
            newdemo.sentence = obj.comparessentences[0] != undefined ? obj.comparessentences[0].correct_sentence : ""
          demoJson.push(newdemo);
          //Add Compare step for other sentence
          // comparess = new Object();     
          // comparess.type      = 'compare',
          // comparess.state     = 'active',
          // comparess.lessonID  = "lbl_demo";
          // comparess.heading   = 'lbl_compare',
          // comparess.sentence1 = obj.sentence  
          // comparess.sentence2 = obj.comparessentences[0]!=undefined?obj.comparessentences[0].wrong_sentence:""
          // comparess.latin_sentence = obj.latin_sentence != null ?obj.latin_sentence:""  
          // demoJson.push(comparess) 
          //Store Imageination index to reach the each sentences
          demoJson.filter((ele, i) => {
            if (ele.type == "imagination" && key < total) {
              sentences.index = i;
            }
          })
          //Add Listen step for other sentence
          listenSent = new Object();
          listenSent.state = 'active',
            listenSent.type = 'song',
            listenSent.lessonID = "lbl_demo";
          listenSent.heading = 'lbl_listen',
            listenSent.sentence1 = obj.sentence
          listenSent.sentence2 = obj.comparessentences[0] != undefined ? obj.comparessentences[0].wrong_sentence : ""
          listenSent.latin_sentence = obj.latin_sentence != "" ? obj.latin_sentence : ""
          listenSent.toggle = 'pause',
            listenSent.sound = filename,
            listenSent.base64 = obj.base64,
            demoJson.push(listenSent)
          //Added repeat step for other sentence
          repeatSent = new Object();
          repeatSent.state = 'active',
            repeatSent.type = 'repeat',
            repeatSent.lessonID = "lbl_demo";
          repeatSent.heading = 'lbl_repeat',
            repeatSent.sentence1 = obj.comparessentences[0] != undefined ? obj.comparessentences[0].wrong_sentence : "",
            demoJson.push(repeatSent)
        }
        //Demo End Steps           
        if (key == totalsentenceCount) {
          //After demo end texts              
          demoendArr.map((demoend) => {
            demoJson.push(demoend)
          })

          //After Song Loop Texts
          afterSongloopArr.map((songloop) => {
            demoJson.push(songloop)
          })

          //Slow Sound loop step
          let soundLoopS = new Object();
          soundLoopS.state = 'speak'
          soundLoopS.type = "slow_song_with_sentence"
          soundLoopS.lessonID = 'lbl_demo'
          soundLoopS.heading = 'lbl_slow_songloop'
          soundLoopS.toggle = 'pause'
          soundLoopS.data = soundSlow
          demoJson.push(soundLoopS);
          //Fast Sound loop step
          // let soundLoopF = new Object();
          // soundLoopF.state = 'speak'
          // soundLoopF.type = "fast_song_with_sentence"
          // soundLoopF.lessonID = 'lbl_demo'
          // soundLoopF.heading = 'lbl_fast_songloop'
          // soundLoopF.toggle = 'pause'
          // soundLoopF.data = soundSlow
          // demoJson.push(soundLoopF);

          //Gradution Screen
          let gradution = new Object();
          gradution.state = 'repeat'
          gradution.type = 'title',
            gradution.lessonID = "lbl_demo";
          gradution.heading = 'lbl_graduation',
            gradution.message = 'msg_graduation',
            demoJson.push(gradution);
          //Fast Sound loop step
          let sentenceList = new Object();
          sentenceList.state = 'repeat'
          sentenceList.type = "sentenceList"
          sentenceList.lessonID = "lbl_demo";
          sentenceList.heading = 'lbl_sentencelist'
          sentenceList.data = sentencelists
          demoJson.push(sentenceList);

          beforeSongloopArr.map((songloop) => {
            demoJson.push(songloop)
          })
          //Sound Loop Step
          let soundLoop = new Object();
          soundLoop.state = 'passive'
          soundLoop.type = "songLoop"
          soundLoop.lessonID = 'lbl_demo'
          soundLoop.heading = 'lbl_songloop',
            soundLoop.toggle = 'pause'
          soundLoop.data = sounds
          demoJson.push(soundLoop);


          //After Finish texts
          finishArr.map((finish) => {
            demoJson.push(finish)
          })
        }
      })
    })
  }
  var stateCount = {}; let demoprog = {};
  demoJson.forEach(function (v) {
    stateCount[v.state] = (stateCount[v.state] || 0) + 1;
  })
  let lessonpercentage = await appfunctions.getDemoLessonHitory(req.user._id);
  demoprog.lesson_id = lessonpercentage ? lessonpercentage.lesson_id : demoLesson.data[0]._id,
    demoprog.active_progress = lessonpercentage ? lessonpercentage.active_progress : 0,
    demoprog.passive_progress = lessonpercentage ? lessonpercentage.passive_progress : 0,
    demoprog.speak_progress = lessonpercentage ? lessonpercentage.speak_progress : 0,
    demoprog.repeat_progress = lessonpercentage ? lessonpercentage.repeat_progress : 0;
  demoprog.is_download = lessonpercentage ? lessonpercentage.is_download : 0;
  demoprog.is_demo = demoLesson.data[0].is_demo
  demoprog.user_id = req.user._id
  demoprog.lessonfamily_id = demoLesson.data[0].baselesson.lessonfamily_id;
  demoprog.level_id = demoLesson.data[0].level_id;
  demoprog.time_loop = lessonpercentage ? lessonpercentage.time_loop : 0
  demoprog.total = lessonpercentage ? lessonpercentage.total : 0
  demoprog.current = lessonpercentage ? lessonpercentage.current : 0
  demoprog.current_percentage = lessonpercentage ? lessonpercentage.current_percentage : 0
  demoprog.active_read = (lessonpercentage && lessonpercentage.active_data) ? parseInt(lessonpercentage.active_data.max) : 0
  demoprog.passive_read = (lessonpercentage && lessonpercentage.passive_data) ? parseInt(lessonpercentage.passive_data.max) : 0
  demoprog.speak_read = (lessonpercentage && lessonpercentage.speak_data) ? parseInt(lessonpercentage.speak_data.max) : 0
  demoprog.repeat_read = (lessonpercentage && lessonpercentage.repeat_data) ? parseInt(lessonpercentage.repeat_data.max) : 0
  demoprog.active_indexArray = (lessonpercentage && lessonpercentage.active_data) ? lessonpercentage.active_data.indexArray : 0
  demoprog.passive_indexArray = (lessonpercentage && lessonpercentage.passive_data) ? lessonpercentage.passive_data.indexArray : 0
  demoprog.speak_indexArray = (lessonpercentage && lessonpercentage.speak_data) ? lessonpercentage.speak_data.indexArray : 0
  demoprog.repeat_indexArray = (lessonpercentage && lessonpercentage.repeat_data) ? lessonpercentage.repeat_data.indexArray : 0
  let response = {};
  if (instructionData && demoLesson.data[0].sentences.length > 0) {
    response.lastModified = demoLesson.data[0].lastModified ? demoLesson.data[0].lastModified : demoLesson.data[0].created;
    response.demo = demoJson;
    response.stateCount = stateCount;
    response.oneSecAudio = oneSecAudio;
    response.progress = demoprog;
    response.demoFamily = config.demoFamily;
    res.json(appfunctions.successResponse("msg_success", response, language_id));
  } else {
    response.demo = demoJson;
    response.stateCount = stateCount;
    response.oneSecAudio = oneSecAudio;
    res.json(appfunctions.successResponse("msg_no_lesson_available_in_language", response, language_id));
  }
})


//Get Lesson List
router.post('/lessonList', async function (req, res) {
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId
  let learning_language_id = req.user.learning_language_id ? req.user.learning_language_id : config.defaultLearning
  let lessonfamily_id = req.body.lessonfamily_id
  let level = req.body.level
  let statusFilter = req.body.status != "" ? req.body.status : parseInt(0);
  let unwind = statusFilter != "" && statusFilter != undefined && statusFilter != "all" ? false : true
  var perPage = 30;
  var page = req.body.page || 1;
  var isFreeAccess = req.user.isFreeAccess;

  if (statusFilter != undefined && statusFilter != "" && statusFilter != "all") {
    // console.log("statusFilter0")
    if (statusFilter != 0) {
      var filterEndReq = {
        $and: [
          { status: parseInt(statusFilter) },
          { user_id: ObjectId(req.user._id) }
        ]
      };
    } else {
      var filterEndReq = { $and: [{ user_id: ObjectId(req.user._id) }] };
      unwind = true
    }
  } else {
    var filterEndReq = { $and: [{ user_id: ObjectId(req.user._id) }] };
  }

  if (level != undefined && level != "" && level != "all" && statusFilter != 0) {
    var filterLevel = {
      learninglanguage_id: ObjectId(learning_language_id),
      is_publish: 1,
      level_id: parseInt(level)
    }
  } else {
    if (statusFilter == 0) {
      let ids = await LesssonHistory.find({ user_id: ObjectId(req.user._id) }).select({ lesson_id: 1, _id: 0 });
      var newArray = [];
      ids.map(ele => {
        let id = ''
        id = ObjectId(ele.lesson_id)
        newArray.push(id)
      })
      if (newArray.length > 0) {
        if (!isNaN(level)) {
          var filterLevel = {
            level_id: parseInt(level),
            learninglanguage_id: ObjectId(learning_language_id),
            is_publish: 1,
            _id: { $nin: newArray }
          }
        } else {
          var filterLevel = {
            learninglanguage_id: ObjectId(learning_language_id),
            is_publish: 1,
            _id: { $nin: newArray }
          }
        }
      }
    } else {
      var filterLevel = {
        learninglanguage_id: ObjectId(learning_language_id),
        is_publish: 1,
      }
    }
  }

  //console.log(filterLevel,unwind,filterEndReq)
  let demoLesson = await appfunctions.getLessonData(req.user.learning_language_id, req.user.language_id ? req.user.language_id._id : language_id);
  let demoFmly = await LessonFamily.findOne({ _id: ObjectId(lessonfamily_id) });
  let lessonpercentage = await appfunctions.getDemoLessonHitory(req.user._id);
  Lesson.aggregate([
    {
      $match: filterLevel
    },
    {
      $lookup: {
        from: 'lessonhistories',
        let: { lesson_id: "$_id" },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$lesson_id', "$$lesson_id"] } },
              ]
            },
          },
          {
            $match: filterEndReq
          }
        ],
        as: "lessonhistories"
      }
    },
    {
      $unwind: {
        path: "$lessonhistories",
        preserveNullAndEmptyArrays: unwind
      }
    },
    {
      $lookup: {
        from: 'sentences',
        //localField:"_id",
        //foreignField:'lesson_id',
        let: { lesson_id: "$_id" },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$lesson_id', "$$lesson_id"] } },
              ]
            }
          },
          {
            $group: {
              _id: "$lesson_id",
              count: { $sum: 1 }
            }
          }
        ],
        as: "sentences"
      }
    },
    // {
    //   $unwind:
    //     {
    //       path: "$sentences",
    //       includeArrayIndex: "arrayIndex"
    //     }
    //  },          
    {
      $lookup: {
        from: "baselessons",
        let: { baselesson_id: "$baselesson_id" },
        pipeline: [{
          $match: {
            $and: [
              { $expr: { $eq: ["$_id", "$$baselesson_id"] } },
              { lessonfamily_id: ObjectId(lessonfamily_id) },
              { is_demo: parseInt(2) },
            ]
          }
        },
        {
          $lookup: {
            from: 'lessontitles',
            let: { baselessonT_id: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$baselesson_id", "$$baselessonT_id"] } },
                    { language_id: ObjectId(language_id) },

                  ]
                }
              }
            ],
            as: "titles"
          }
        },
        {
          $unwind: {
            path: "$titles",
            preserveNullAndEmptyArrays: true
          }
        },

        ],
        as: 'baselessons'
      }
    },
    {
      $unwind: {
        path: "$baselessons",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
        "lesson_id": "$_id",
        baselesson_id: '$baselesson_id',
        is_free:  { $cond:  { if: { $eq: ["$is_free", 1] }, then: 1, else: isFreeAccess }, },
        title: "$baselessons.titles.title",
        lessonfamily_id: "$baselessons.lessonfamily_id",
        baselesson_order_no: "$baselessons.order_no",
        total: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.total', ''] }, ''] }, then: 0, else: "$lessonhistories.total" } },
        progress: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.current', ''] }, ''] }, then: 0, else: "$lessonhistories.current" } },//"$lessonhistories.current",
        max_read_slide: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.max_read_slide', ''] }, ''] }, then: 0, else: "$lessonhistories.max_read_slide" } },//'$lessonhistories.current_percentage',
        current_percentage: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.current_percentage', ''] }, ''] }, then: 0, else: "$lessonhistories.current_percentage" } },//'$lessonhistories.current_percentage',
        active_progress: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.active_progress', ''] }, ''] }, then: 0, else: "$lessonhistories.active_progress" } },//'$lessonhistories.current_percentage',
        passive_progress: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.passive_progress', ''] }, ''] }, then: 0, else: "$lessonhistories.passive_progress" } },//'$lessonhistories.current_percentage',
        speak_progress: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.speak_progress', ''] }, ''] }, then: 0, else: "$lessonhistories.speak_progress" } },//'$lessonhistories.current_percentage',
        repeat_progress: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.repeat_progress', ''] }, ''] }, then: 0, else: "$lessonhistories.repeat_progress" } },//'$lessonhistories.current_percentage',
        status: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.status', ''] }, ''] }, then: 0, else: "$lessonhistories.status" } },//'$lessonhistories.current_percentage',
        user_id: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.user_id', ''] }, ''] }, then: 0, else: "$lessonhistories.user_id" } },//'$lessonhistories.current_percentage',
        sentences: "$sentences",
        level_id: "$level_id",
        is_download: { $cond: { if: { $eq: [{ $ifNull: ['$lessonhistories.is_download', ''] }, ''] }, then: 0, else: "$lessonhistories.is_download" } }
      }
    },
    {
      // $sort: {
      //   level_id: 1
      // }
      $sort: {
        baselesson_order_no: 1
      }
    },
    {
      $facet: {
        paginatedResults: [{ $skip: parseInt((perPage * page) - perPage) }, { $limit: perPage }],
        totalCount: [
          {
            $count: 'count'
          }
        ]
      }
    }
  ]).exec((err, result) => {
    //result = JSON.parse(JSON.stringify(result));
    // console.log("body", result[0].paginatedResults)
    if (err) {
      // __logger.info("msg_something_wrong===>" + JSON.stringify(err))
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      let demos = {}; compeleted = 0;
      if (lessonpercentage != null && lessonpercentage.active_progress == 100 && lessonpercentage.passive_progress == 100 && lessonpercentage.speak_progress == 100 && lessonpercentage.repeat_progress == 100) {
        compeleted = 1;
      }
      demos.lessonfamily_id = config.demoFamily;//"5e98691ea42d407923f81b1b";//"5efae3f00cd68d7bc311472c"
      demos.lesson_id = (lessonpercentage && lessonpercentage.lesson_id != undefined) ? lessonpercentage.lesson_id : demoLesson.data[0]._id,
        demos.title = "lbl_demo"
      demos.image = demoFmly.image
      demos.baselesson_id = demoLesson.data[0]['baselesson_id'] ? demoLesson.data[0]['baselesson_id'] : '5e3418af6504063787db5b29';
      demos.level_id = 1
      demos.is_free = 1
      demos.total = (lessonpercentage && lessonpercentage.total) ? lessonpercentage.total : 0
      demos.progress = (lessonpercentage && lessonpercentage.current) ? lessonpercentage.current : 0
      demos.max_read_slide = (lessonpercentage && lessonpercentage.max_read_slide) ? $lessonpercentage.max_read_slide : 0
      demos.is_download = (lessonpercentage && lessonpercentage.is_download) ? 1 : 0
      demos.active_progress = lessonpercentage ? lessonpercentage.active_progress : 0
      demos.passive_progress = lessonpercentage ? lessonpercentage.passive_progress : 0
      demos.speak_progress = lessonpercentage ? lessonpercentage.speak_progress : 0
      demos.repeat_progress = lessonpercentage ? lessonpercentage.repeat_progress : 0
      demos.status = lessonpercentage ? lessonpercentage.status : 0
      demos.label = 'lbl_demo',
        demos.is_demo = 1
      let demodata = {};
      //Addmin demo on first index
      if (page == 1) {
        //demodata = demos   
        //result[0].paginatedResults.push(demos)   

        let test = [];
        if (lessonfamily_id == config.demoFamily && (level == 1 || level == "all")) {
          test.push(demos)
        }
        result[0].paginatedResults.map(ele => {
          ele.is_demo = 0;
          test.push(ele)
        })
        result[0].paginatedResults = test;
      }
      response = {
        list: result[0].paginatedResults,
        current: perPage,
        total: result[0].totalCount[0] != undefined && result[0].totalCount[0].count != undefined ? result[0].totalCount[0].count : 1,
        page: page,
        level: level,
        status: statusFilter,
        isFreeAccess: isFreeAccess
      }
      res.json(appfunctions.successResponse("msg_success", response, req.user));
    }
  })
})

router.post('/sentencesByLessonId', async (req, res) => {
  let lesson_id = req.body.lesson_id;
  let baselesson_id = req.body.baselesson_id;
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId
  let sounds = new Array();
  let soundsP = new Array();
  let soundSlow = new Array();
  let sentencelists = new Array();
  let title = await appfunctions.getLessonTitleByID(language_id, baselesson_id);
  // __logger.info("lesson===>" + language_id, baselesson_id, JSON.stringify(title));

  Lesson.aggregate([
    {
      $match: { '_id': ObjectId(lesson_id) }
    },
    {
      $lookup: {
        from: 'sentences',
        let: { lesson_id: "$_id" },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$lesson_id', "$$lesson_id"] } },
              ]
            }
          },
          {
            $lookup: {
              from: "comparessentences",
              let: { sentence_id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$sentence_id", '$$sentence_id'] } },
                      { language_id: ObjectId(language_id) }
                    ]
                  }
                }
              ],
              as: "comparessentences"
            }
          },
          {
            $unwind: {
              path: '$comparessentences',
              preserveNullAndEmptyArrays: false
            }
          }
        ],
        as: "sentences"
      },
    },
    {
      $lookup: {
        from: "lessonhistories",
        let: { lesson_id: "$_id" },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$lesson_id', "$$lesson_id"] } },
                { $expr: { $eq: ['$user_id', ObjectId(req.user._id)] } },
              ]
            }
          },
        ],
        as: "lessonH"
      }
    },
    {
      $unwind: {
        path: "$lessonH",
        preserveNullAndEmptyArrays: true
      }
    },
  ]).exec(async (err, results) => {
    if (err) {
      // __logger.info("msg_something_wrong===>" + JSON.stringify(err))
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      //console.log(JSON.parse(JSON.stringify(results)))
      if (results[0] && results[0].lessonH && results[0].lastModified != undefined && results[0].lessonH.lastModified != undefined && results[0].lastModified.getTime() > results[0].lessonH.lastModified.getTime() && results[0].lessonH.is_download == 1) {
        await results[0].sentences.reduce(async (promise1, key) => {
          try {
            key.base64 = "";
            let filename = path.join(__dirname, "../public/audio_files/compress/" + key.audio)
            if (filename != "" && fs.existsSync(filename)) {
              // __logger.info(JSON.stringify(key))
              filestring = await fs.readFileSync(filename, { encoding: 'base64' });
              key.base64 = filestring
            }
          } catch (err) {
            __logger.error(JSON.stringify(err))
          }
        }, Promise.resolve());
      } else if (results[0] && results[0].lessonH == undefined) {
        await results[0].sentences.reduce(async (promise1, key) => {
          try {
            key.base64 = "";
            let filename = path.join(__dirname, "../public/audio_files/compress/" + key.audio)
            if (filename != "" && fs.existsSync(filename)) {
              // __logger.info(JSON.stringify(key))
              filestring = await fs.readFileSync(filename, { encoding: 'base64' });
              key.base64 = filestring
            }
          } catch (err) {
            __logger.error(JSON.stringify(err))
          }
        }, Promise.resolve());
      } else {
        await results[0].sentences.reduce(async (promise1, key) => {
          try {
            key.base64 = "";
            let filename = path.join(__dirname, "../public/audio_files/compress/" + key.audio)
            if (filename != "" && fs.existsSync(filename)) {
              // __logger.info(JSON.stringify(key))
              filestring = await fs.readFileSync(filename, { encoding: 'base64' });
              key.base64 = filestring
            }
          } catch (err) {
            __logger.error(JSON.stringify(err))
          }
        }, Promise.resolve());
      }

      let sentenceslist = [];
      let total = results[0].sentences.length
      //welcome
      let welcome = new Object();
      welcome.state = 'active'
      welcome.type = 'title',
        welcome.lessonID = (title && title.title) ? title.title : ""
      welcome.heading = 'lbl_welcome_text',
        sentenceslist.push(welcome);
      let filename = ""
      let oneSecAudio = config.file_base_url + '/public/audio_files/compress/1sec.mp3'
      //console.log('results',results[0]);    
      results[0].sentences.map((sentenceObj, key) => {
        if (sentenceObj.base64 != "") {
          filename = config.file_base_url + '/public/audio_files/compress/' + sentenceObj.audio
        }
        //Count of Sentences      
        let sno = key + 1
        let number = sno + '/' + total
        //Sentence List
        let sentences = new Object();
        sentences.number = number
        // console.log("=================>>>>: ", sentenceObj.comparessentences.correct_sentence);
        sentences.sentence = sentenceObj.comparessentences.correct_sentence != null ? sentenceObj.comparessentences.wrong_sentence.split("*").join(" ") : "No Sentence"//getString(sentenceObj.comparessentences.correct_sentence);//sentenceObj.sentence;
        sentencelists.push(sentences);
        let songloop = new Object()
        songloop.toggle = 'pause'
        songloop.sound = filename,
          sounds.push(songloop);

        //Added 1Sec Sound In Passive Listening
        // soundsP.push(songloop);
        // let dummSound = new Object()
        // dummSound.toggle = 'pause'
        // dummSound.sound  = oneSecAudio
        // soundsP.push(dummSound);

        let slow_song_with_sentance = new Object()
        slow_song_with_sentance.toggle = 'pause'
        slow_song_with_sentance.sound = filename,
          slow_song_with_sentance.base64 = sentenceObj.base64,
          slow_song_with_sentance.sentence1 = getString(sentenceObj.sentence)
        slow_song_with_sentance.latin_sentence = sentenceObj.latin_sentence != '' ? sentenceObj.latin_sentence : ""
        soundSlow.push(slow_song_with_sentance);

        //Imagine
        let imagine = new Object();
        imagine.state = 'active'
        imagine.type = 'imagination',
          imagine.lessonID = title.title
        imagine.heading = 'lbl_imagine',
          imagine.sentence = sentenceObj.comparessentences.correct_sentence != null ? getString(sentenceObj.comparessentences.correct_sentence) : "No Sentence"
        imagine.index = key
        sentenceslist.push(imagine);
        //Compare
        // compare = new Object();    
        // compare.state   =  'active'    
        // compare.type     = 'compare',
        // compare.lessonID = title.title
        // compare.heading  = 'lbl_compare',
        // compare.sentence1 = sentenceObj.sentence  
        // compare.sentence2 = sentenceObj.comparessentences.wrong_sentence != null ? sentenceObj.comparessentences.wrong_sentence :"No Sentence"
        // compare.latin_sentence = sentenceObj.latin_sentence != ""?sentenceObj.latin_sentence:"" 
        // compare.index    =  key
        // sentenceslist.push(compare)

        //Store Imageination index to reach the each sentences
        // sentenceslist.filter((ele, i)=>{
        //   if(ele.type=="imagination" && key < total){          
        //     //compare.index    =  i;   
        //     sentences.index   =  i;         
        //   }
        // })
        //Add Listen step for other sentence
        listen = new Object();
        listen.state = 'active',
          listen.type = 'song',
          listen.lessonID = title.title
        listen.heading = 'lbl_listen',
          listen.sentence1 = sentenceObj.sentence
        listen.sentence2 = sentenceObj.comparessentences.wrong_sentence != null ? sentenceObj.comparessentences.wrong_sentence : "No Sentence"
        listen.latin_sentence = sentenceObj.latin_sentence != "" ? sentenceObj.latin_sentence : ""
        listen.audioUrl = "",
          listen.toggle = 'pause',
          listen.sound = filename,
          listen.base64 = sentenceObj.base64,
          sentenceslist.push(listen)

        sentenceslist.filter((ele, i) => {
          if (ele.type == "song" && key < total) {
            //compare.index    =  i;   
            sentences.index = i;
          }
        })

        //Added repeat step for other sentence
        repeat = new Object();
        repeat.state = 'active'
        repeat.type = 'repeat',
          repeat.lessonID = title.title
        repeat.heading = 'lbl_repeat',
          repeat.sentence1 = sentenceObj.comparessentences.wrong_sentence != null ? sentenceObj.comparessentences.wrong_sentence : "No Sentence",
          sentenceslist.push(repeat)

        //Add Sound Loop
        if (sno == total) {
          //SLide for Passive Screen
          // let passive = new Object();
          // passive.state     = 'passive'         
          // passive.type      = 'title',
          // passive.lessonID  = title.title
          // passive.heading   = 'lbl_text_screen_active_listening',
          // passive.message   = 'msg_passive',             
          // sentenceslist.push(passive);   

          // //Sound Loop Step
          // let soundLoop = new Object();
          // soundLoop.state   = 'passive' 
          // soundLoop.type    = "songLoop"
          // soundLoop.lessonID= title.title
          // soundLoop.heading = 'lbl_songloop',
          // soundLoop.toggle  = 'pause'
          // soundLoop.data    = sounds
          // sentenceslist.push(soundLoop) ; 

          //SLide for Speaknow Screen
          let speaknow = new Object();
          speaknow.state = 'speak'
          speaknow.type = 'title',
            speaknow.lessonID = title.title
          speaknow.heading = 'lbl_text_screen_speaking',
            speaknow.message = 'msg_speaknow',
            sentenceslist.push(speaknow);

          //Slow Sound loop step
          let soundLoopS = new Object();
          soundLoopS.state = 'speak'
          soundLoopS.type = "slow_song_with_sentence"
          soundLoopS.lessonID = title.title
          soundLoopS.heading = 'lbl_slow_songloop'
          soundLoopS.toggle = 'pause'
          soundLoopS.data = soundSlow
          sentenceslist.push(soundLoopS);

          //Fast Sound loop step
          // let soundLoopF = new Object();
          // soundLoopF.state = 'speak'
          // soundLoopF.type = "fast_song_with_sentence"
          // soundLoopF.lessonID = title.title
          // soundLoopF.heading = 'lbl_fast_songloop'
          // soundLoopF.toggle = 'pause'
          // soundLoopF.data = soundSlow
          // sentenceslist.push(soundLoopF);


          //Gradution Screen
          let gradution = new Object();
          gradution.state = 'repeat'
          gradution.type = 'title',
            gradution.lessonID = title.title
          gradution.heading = 'lbl_graduation',
            gradution.message = 'msg_graduation',
            sentenceslist.push(gradution);

          //Fast Sound loop step
          let sentenceList = new Object();
          sentenceList.state = 'repeat'
          sentenceList.type = "sentenceList"
          sentenceList.lessonID = title.title
          sentenceList.heading = 'lbl_sentencelist'
          sentenceList.data = sentencelists
          sentenceslist.push(sentenceList);
          //SLide for Passive Screen        
          let passive = new Object();
          passive.state = 'passive'
          passive.type = 'title',
            passive.lessonID = title.title
          passive.heading = 'lbl_text_screen_active_listening',
            passive.message = 'msg_passive',
            sentenceslist.push(passive);

          //Sound Loop Step
          let soundLoop = new Object();
          soundLoop.state = 'passive'
          soundLoop.type = "songLoop"
          soundLoop.lessonID = title.title
          soundLoop.heading = 'lbl_songloop',
            soundLoop.toggle = 'pause'
          soundLoop.data = sounds
          sentenceslist.push(soundLoop);

          //Final List
          let final = new Object();
          // final.state = 'final'
          final.state = 'passive'
          final.type = "title"
          final.lessonID = title.title
          final.heading = 'lbl_finalscreen'
          final.message = 'msg_final',
            sentenceslist.push(final);
        }

      })
      var test = {};
      sentenceslist.forEach(function (v) {
        test[v.state] = (test[v.state] || 0) + 1;
      })
      var resposs = {}
      resposs.lastModified = results[0].lastModified ? results[0].lastModified : results[0].created;
      resposs.sentenceslist = sentenceslist
      resposs.oneSecAudio = oneSecAudio
      resposs.test = test
      resposs.progress = {}
      resposs.progress.lesson_id = results[0]._id
      resposs.progress.lessonfamily_id = results[0].lessonfamily_id;
      resposs.progress.status = results[0].lessonH ? results[0].lessonH.status : 0
      resposs.progress.active_progress = results[0].lessonH ? results[0].lessonH.active_progress : 0
      resposs.progress.passive_progress = results[0].lessonH ? results[0].lessonH.passive_progress : 0
      resposs.progress.speak_progress = results[0].lessonH ? results[0].lessonH.speak_progress : 0
      resposs.progress.repeat_progress = results[0].lessonH ? results[0].lessonH.repeat_progress : 0
      resposs.progress.max_read_slide = results[0].lessonH ? results[0].lessonH.max_read_slide : 0
      resposs.progress.current_percentage = results[0].lessonH ? results[0].lessonH.current_percentage : 0
      resposs.progress.is_demo = results[0].lessonH ? results[0].lessonH.is_demo : results[0].is_demo
      resposs.progress.user_id = req.user._id
      resposs.progress.level_id = results[0].level_id;
      resposs.progress.time_loop = results[0].lessonH ? results[0].lessonH.time_loop : 0
      resposs.progress.total = results[0].lessonH ? results[0].lessonH.total : 0
      // resposs.progress.current = results[0].lessonH ? results[0].lessonH.current : 0
      resposs.progress.current = results[0].lessonH ? results[0].lessonH.current <= sentenceslist.length ? results[0].lessonH.current : 0 : 0
      resposs.progress.active_read = (results[0].lessonH && results[0].lessonH.active_data) ? parseInt(results[0].lessonH.active_data.max) : 0
      resposs.progress.passive_read = (results[0].lessonH && results[0].lessonH.passive_data) ? parseInt(results[0].lessonH.passive_data.max) : 0
      resposs.progress.speak_read = (results[0].lessonH && results[0].lessonH.speak_data) ? parseInt(results[0].lessonH.speak_data.max) : 0
      resposs.progress.repeat_read = (results[0].lessonH && results[0].lessonH.repeat_data) ? parseInt(results[0].lessonH.repeat_data.max) : 0
      resposs.progress.active_indexArray = (results[0].lessonH && results[0].lessonH.active_data) ? results[0].lessonH.active_data.indexArray : 0
      resposs.progress.passive_indexArray = (results[0].lessonH && results[0].lessonH.passive_data) ? results[0].lessonH.passive_data.indexArray : 0
      resposs.progress.speak_indexArray = (results[0].lessonH && results[0].lessonH.speak_data) ? results[0].lessonH.speak_data.indexArray : 0
      resposs.progress.repeat_indexArray = (results[0].lessonH && results[0].lessonH.repeat_data) ? results[0].lessonH.repeat_data.indexArray : 0
      resposs.progress.repeat_indexArray = (results[0].lessonH && results[0].lessonH.repeat_data) ? results[0].lessonH.repeat_data.indexArray : 0
      resposs.progress.is_download = (results[0].lessonH
        && results[0].lastModified != undefined
        && results[0].lessonH.lastModified != undefined
        && results[0].lastModified.getTime() > results[0].lessonH.lastModified.getTime()) ? 0 : 1

      // __logger.info("resposs===>" + JSON.stringify(resposs))
      res.json(appfunctions.successResponse("msg_success", resposs, req.user));
    }
  })
})

// Save Lesson history
router.post("/saveLessonHistory", (req, res) => {
  let { lessonfamily_id, lesson_id, level_id, current, is_demo, active, passive, speak, repeat } = req.body
  let user_id = req.user._id;
  let time_loop = req.body.time_loop ? req.body.time_loop : 0
  let filterjson = {}
  let total_time_loop = 20 * 60
  let loop = time_loop >= parseInt(1200) ? parseInt(1200) : time_loop
  // __logger.info("resposs===>" + req.body)
  if (is_demo == 2) {
    filterjson.user_id = ObjectId(user_id)
    filterjson.lessonfamily_id = ObjectId(lessonfamily_id)
    filterjson.lesson_id = ObjectId(lesson_id)
    filterjson.is_demo = 2
  } else {
    filterjson.user_id = ObjectId(user_id)
    filterjson.lesson_id = ObjectId(lesson_id)
    filterjson.is_demo = 1
  }
  LesssonHistory.findOne(filterjson).exec((err, result) => {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      if (result) {
        result.level_id = level_id
        result.status = 1
        if (active != undefined && active.total != undefined && active.total != undefined && active.indexArray != undefined) {
          let readLength = active.indexArray.length
          let activeread = (result.active_data != undefined && result.active_data.max > parseInt(active.max)) ? result.active_data.max : parseInt(active.max)
          var actives = new Object()
          actives.total = parseInt(active.total),
            actives.max = activeread
          actives.indexArray = active.indexArray
          result.active_progress = (active.total > 0 && active.total >= parseInt(readLength) && readLength > 0) ? (parseInt(readLength) * 100) / active.total : result.active_progress
          result.active_data = actives
        }
        if (passive != undefined && passive.total != undefined && passive.max && passive.indexArray != undefined) {
          let passiveLength = passive.indexArray.length
          let passiveread = (result.passive_data != undefined && result.passive_data.max > parseInt(active.max)) ? result.passive_data.max : parseInt(passive.max)
          var passives = new Object()
          passives.total = parseInt(passive.total),
            passives.max = passiveread
          passives.indexArray = passive.indexArray
          result.passive_progress = (loop > 0) ? (loop * 100) / total_time_loop : result.passive_progress
          result.passive_data = passives
        }
        if (speak != undefined && speak.total != undefined && speak.max && speak.indexArray != undefined) {
          let speakLength = speak.indexArray.length || 0
          let speakread = (result.speak_data != undefined && result.speak_data.max > parseInt(active.max)) ? result.speak_data.max : parseInt(speak.max)
          var speaks = new Object()
          speaks.total = parseInt(speak.total),
            speaks.max = speakread
          speaks.indexArray = speak.indexArray
          result.speak_progress = (speakLength > 0 && speak.total >= parseInt(speakLength)) ? ((parseInt(speakLength) * 100) / speak.total) : result.speak_progress
          result.speak_data = speaks
        }
        if (repeat != undefined && repeat.total != undefined && repeat.max && repeat.indexArray != undefined) {
          let repeatLength = repeat.indexArray.length || 0
          let repeatread = (result.repeat_data != undefined && result.repeat_data.max > parseInt(repeat.max)) ? result.repeat_data.max : parseInt(repeat.max)
          var repeats = new Object()
          repeats.total = parseInt(repeat.total),
            repeats.max = repeatread
          repeats.indexArray = parseInt(repeatLength) == parseInt(repeat.total) ? repeat.indexArray : []
          result.repeat_progress = parseInt(repeatLength) == parseInt(repeat.total) ? 100 : 0
          result.repeat_data = repeats
        }
        result.current = parseInt(current);
        result.current_percentage = 0;
        result.time_loop = time_loop,
          result.lastModified = new Date();
        result.save(async (err, already) => {
          if (err) {
            res.json(appfunctions.failResponse("msg_something_wrong", err));
          } else {
            if (already.active_progress == 100 && already.passive_progress == 100 && already.speak_progress == 100 && already.repeat_progress == 100) {
              already.current_percentage = 100
              already.status = 2
              already.save()
              let user = await appfunctions.updateUserByColumn(req.user._id, "numberoflessonscompleted", 1, req.user)
            }
            res.json(appfunctions.successResponse("msg_history_saved", already, req.user));
          }
        })
      } else {
        let lessonHisObj = new LesssonHistory();
        lessonHisObj.user_id = user_id;
        lessonHisObj.lessonfamily_id = lessonfamily_id;
        lessonHisObj.lesson_id = lesson_id;
        lessonHisObj.current = current;
        lessonHisObj.is_demo = is_demo;
        lessonHisObj.time_loop = time_loop;
        lessonHisObj.level_id = level_id
        lessonHisObj.is_download = 1;
        lessonHisObj.lastModified = new Date();
        if (active != undefined && active.total != undefined && active.total != undefined && active.indexArray != undefined) {
          let readLength = active.indexArray.length || 0
          var actives = new Object()
          actives.total = parseInt(active.total),
            actives.max = parseInt(active.max),
            actives.indexArray = active.indexArray
          lessonHisObj.active_progress = (active.total > 0 && readLength > 0) ? ((parseInt(active.indexArray.length) * 100) / active.total) : 0
          lessonHisObj.active_data = actives
        } else {
          var actives = new Object()
          actives.total = active && active.total != undefined ? parseInt(active.total) : 0,
            actives.max = active && active.max != undefined ? parseInt(active.max) : 0,
            actives.indexArray = active && active.indexArray != undefined ? active.indexArray : [],
            lessonHisObj.active_progress = 0
          lessonHisObj.active_data = actives
        }
        if (passive != undefined && passive.total != undefined && passive.max && passive.indexArray != undefined) {
          let passiveLength = passive.indexArray.length || 0
          var passives = new Object()
          passives.total = parseInt(passive.total),
            passives.max = parseInt(passive.max)
          passives.indexArray = passive.indexArray
          lessonHisObj.passive_progress = (loop > 0) ? (loop * 100) / total_time_loop : 0
          lessonHisObj.passive_data = passives
        } else {
          var passives = new Object()
          let passiveLength = (passive != undefined && passive.indexArray) ? passive.indexArray.length : 0// yha aa rhi hai error
          passives.total = passive && passive.total != undefined ? parseInt(passive.total) : 0,
            passives.max = passive && passive.max != undefined ? parseInt(passive.max) : 0,
            passives.indexArray = passive && passive.indexArray != undefined ? passive.indexArray : [],
            lessonHisObj.passive_progress = (loop > 0) ? (loop * 100) / total_time_loop : 0
          lessonHisObj.passive_data = passives
        }
        if (speak != undefined && speak.total != undefined && speak.max && speak.indexArray != undefined) {
          let speakLength = speak != undefined ? speak.indexArray.length : 0
          var speaks = new Object()
          speaks.total = parseInt(speak.total),
            speaks.max = parseInt(speak.max)
          speaks.indexArray = speak.indexArray
          lessonHisObj.speak_progress = (speakLength > 0 && speak.total > 0) ? (speakLength / speak.total) * 100 : 0
          lessonHisObj.speak_data = speaks
        } else {
          let speakLength = speak.indexArray.length || 0
          var speaks = new Object()
          speaks.total = speak.total || 0,
            speaks.max = speak.max || 0
          speaks.indexArray = speak.indexArray || []
          lessonHisObj.speak_progress = (speak.total != undefined && speakLength > 0 && speak.total > 0) ? (speakLength / speak.total) * 100 : 0
          lessonHisObj.speak_data = speaks
        }
        if (repeat != undefined && repeat.total != undefined && repeat.max && repeat.indexArray != undefined) {
          let repeatLength = repeat.indexArray.length || 0
          var repeats = new Object()
          repeats.total = repeat.total
          repeats.max = repeat.max
          repeats.indexArray = parseInt(repeatLength) == parseInt(repeat.total) ? repeat.indexArray : []
          lessonHisObj.repeat_progress = parseInt(repeatLength) == parseInt(repeat.total) ? 100 : 0
          lessonHisObj.repeat_data = repeats
        } else {
          var repeats = new Object()
          repeats.total = repeat.total || 0,
            repeats.max = repeat.max || 0
          repeats.indexArray = repeat.indexArray || []
          lessonHisObj.repeat_progress = 0
          lessonHisObj.repeat_data = repeats
        }
        lessonHisObj.status = 1
        lessonHisObj.save(async (err, lesssonHitory) => {
          if (lesssonHitory.active_progress == 100 && lesssonHitory.passive_progress == 100 && lesssonHitory.speak_progress == 100 && lesssonHitory.repeat_progress == 100) {
            lesssonHitory.current_percentage = 100
            lesssonHitory.status = 2
            lessonhistory.save()
            let user = await appfunctions.updateUserByColumn(req.user._id, "numberoflessonscompleted", 1, req.user)
          } else {
            let user = await appfunctions.updateUserByColumn(req.user._id, "numberoflearningsessions", 1, req.user)
          }
          res.json(appfunctions.successResponse("msg_history_saved", lesssonHitory, req.user));
        })
      }
    }
  })
})

//Get User subscribed or not
router.get("/getSubsriptionStatus", (req, res) => {
  let user_id = req.user._id;
  var currentDate = moment(new Date());
  UserSubs.find({
    status: 1,
    expire: { $gte: currentDate },
    user_id: ObjectId(user_id),
  }).sort({ expire: 1 }).exec((err, result) => {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      let response = {}
      if (result[0]) {
        response.is_subsribed = 1
        response.date = result[0].expire
        res.json(appfunctions.successResponse("msg_success", response, req.user));
      } else {
        response.is_subsribed = 0
        response.date = ''
        res.json(appfunctions.successResponse("msg_success", response, req.user));
      }
    }
  })
})

//Rating For birlingo
router.post('/rating', async (req, res) => {
  let { rating, feedback, like, public } = req.body;
  let user_id = req.user._id;
  let emailtemplates = await Emailtemplates.findOne({ slug: "new_rating", language_id: config.defaultLanguageId });
  let adminDetails = await settings.find();
  var admin_email = adminDetails[0].admin_receive_email
  //console.log(adminDetails)
  let username = req.user.username ? req.user.username : req.user.name + "" + req.user.surname
  let userlike = like == 1 ? "Yes" : "No";
  let review = (feedback == undefined || feedback == "") ? "No feedback" : feedback;
  let is_public = (public == undefined) ? "Private" : (public == 1) ? "Public" : "Private";
  if (public != undefined && public == 1) {
    var url = config.base_url + "/admin/feedback/public-list/1/1"
  } else {
    var url = config.base_url + "/admin/feedback/private-list/1/1"
  }
  // console.log("url: ", url);
  var templatereplace = emailtemplates.description.replace("{full_name}", username).replace("{rating}", rating).replace("{review}", review).replace("{like}", userlike).replace("{public}", is_public).replace("{url}", url);
  // console.log("emailTemplete -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=: ", templatereplace);
  Rating.findOne({ user_id: ObjectId(user_id) }
    , function (err, already) {
      if (err) {
        res.json(appfunctions.failResponse("msg_something_wrong", err));
      } else {
        if (already) {
          already.rating = rating
          already.feedback = feedback
          already.like = like
          already.is_public = public != undefined ? public : 0;
          already.status = 0
          already.lastModified = moment(new Date());
          already.save((errs, update) => {
            if (errs) {
              res.json(appfunctions.failResponse("msg_something_wrong", err));
            } else {
              if (emailtemplates) {
                var issEmailSent = appfunctions.sendEmail(
                  emailtemplates.subject,
                  admin_email,
                  res.locals.app_title + '<' + config.emailFrom + '>',
                  templatereplace
                );
                if (issEmailSent == false) {
                  res.json(appfunctions.failResponse("msg_email_not_send"));
                } else {
                }

                res.json(appfunctions.successResponse("rating_updated_successfully", update, req.user));
              }
            }
          })
        } else {
          let ratingObj = new Rating();
          ratingObj.like = like
          ratingObj.is_public = public != undefined ? public : 0;
          ratingObj.rating = rating
          ratingObj.feedback = feedback
          ratingObj.user_id = user_id
          ratingObj.lastModified = moment(new Date());
          ratingObj.save((err, result) => {
            if (err) {
              res.json(appfunctions.failResponse("msg_something_wrong", err));
            } else {
              if (emailtemplates) {
                var issEmailSent = appfunctions.sendEmail(
                  emailtemplates.subject,
                  admin_email,
                  res.locals.app_title + ' <' + config.emailFrom + '>',
                  templatereplace
                );
                if (issEmailSent == false) {
                  res.json(appfunctions.failResponse("msg_email_not_send"));
                } else {
                  res.json(appfunctions.successResponse("rating_saved_successfully", result, req.user));
                }
              }
            }
          })
        }
      }
    }
  )
})

//Get Rating 
router.get("/getRatings", (req, res) => {
  let user_id = req.user._id;
  Rating.findOne({ user_id: ObjectId(user_id) }, function (err, result) {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      if (result) {
        res.json(appfunctions.successResponse("msg_success", result, req.user));
      } else {
        res.json(appfunctions.successResponse("msg_success", [], req.user));
      }
    }
  })
})

//Get Home Content
router.get("/susbcontent", (req, res) => {
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId;
  let off_online = new Array();
  SusbContent.findOne({ language_id: ObjectId(language_id) }, (err, result) => {
    if (err) {
      appfunctions.failResponse('msg_fail', err)
    } else {
      if (result) {
        let obj = new Object();
        obj.heading = result.heading ? result.heading : "";
        off_online.push(obj);
        result.description.map((item, index) => {
          let data = new Object();
          data.title = item
          off_online.push(data)
        })

        res.json(appfunctions.successResponse("msg_success", off_online, res.user));
      } else {

        SusbContent.findOne({ language_id: ObjectId(config.defaultLanguageId) }, (err, result) => {
          if (err) {
            appfunctions.failResponse('msg_fail', err)
          } else {
            let obj = new Object();
            obj.heading = result.heading ? result.heading : "";
            off_online.push(obj);
            result.description.map((item, index) => {
              let data = new Object();
              data.title = item
              off_online.push(data)
            })
            res.json(appfunctions.successResponse("msg_success", off_online, res.user));
          }
        })
      }
    }
  })
})

//Current USer Details
router.get("/currentUser", (req, res) => {
  let user_id = req.user._id
  User.findOne(
    {
      _id: user_id
    },
    function (err, user) {
      if (err) {
        res.json(appfunctions.failResponse("msg_err", err));
      } else {
        res.json(appfunctions.successResponse("msg_err", user, res.user));
      }
    }
  )

})


router.post("/updateLoginHrs", async (req, res) => {
  let user_id = req.user._id
  let mins = req.body.totalmins
  let user = await appfunctions.updateUserByColumn(req.user._id, "totalloginhours", mins, req.user)
  if (user.data) {
    res.json(appfunctions.successResponse("msg_err", user.data, res.user));
  } else {
    res.json(appfunctions.failResponse("msg_something_wrong", user));
  }

})

router.post('/apply-coupon', async function (req, res) {
  let valid = false;
  let user = req.user
  let coupon = req.body.code
  let subscription_id = req.body.subscription_id
  let user_subs = await UserSubs.findOne({ user_id: ObjectId(req.user._id) })
  let subscription = await BaseSusb.findOne({ _id: ObjectId(subscription_id) })
  let discount_less = 0;
  let discount_amount = 0;
  // console.log("req.body: ", req.body);
  // console.log("subscription: ",subscription)
  // return;

  Coupon.findOne({ coupon_code: coupon }).exec((err, result) => {
    console.log(result, coupon)
    if (err) {
      return res.json(appfunctions.failResponse("msg_err", err));
    } else if (result) {
      // console.log("result: ",result)
      // return;
      let response = {};
      if (result.discount_type === 1) {
        discount_less = subscription.total - result.discount_value
        discount_less = discount_less > 0 ? discount_less : 0
        discount_amount = result.discount_value
      } else if (result.discount_type === 2) {
        let percentOff = (subscription.total * result.discount_value) / 100
        percentOff = percentOff.toFixed(2)
        discount_amount = percentOff
        discount_less = subscription.total - percentOff
        discount_less = discount_less > 0 ? discount_less : 0
      }
      response.total = subscription.total
      response.discount_type = result.discount_type
      response.discount_off = result.discount_value
      response.discount_amount = parseFloat(discount_amount)
      response.discount_less = discount_less
      response.coupon = result.stripe_id
      if (result.valid_type == 1) {                                                             ///no Limit     
        if (!user_subs) {
          return res.json(appfunctions.successResponse("msg_applied", response));
        } else {
          return res.json(appfunctions.failResponse("msg_valid_for_first_subcsription"));
        }
      } else if (result.valid_type == 2) {                                                    //Valid from -to date
        let currentdate = moment()
        let todate = moment(result.to_date)
        if (result.to_date > currentdate) {
          return res.json(appfunctions.successResponse("msg_applied", response));
        } else {
          return res.json(appfunctions.failResponse("msg_coupon_expired"));
        }
      } else if (result.valid_type == 3) {                                                    //Valid for some days after register of 

        let registerDate = moment(req.user.created)
        let now = moment()
        var diff = now.diff(registerDate, "days");
        console.log("created:", req.user.created, "diffdays:", diff, '===result.days_value:', result.days_value)
        if (diff <= result.days_value && !req.user.customer_id) {
          return res.json(appfunctions.successResponse("msg_applied", response));
        } else {
          return res.json(appfunctions.failResponse("msg_not_applicable"));
        }
      } else if (result.valid_type == 4 && (user_subs.status == 2 || user_subs.status == 3)) {
        //Valid for some days after plan cancellation or expires

        let expiredate = moment(user_subs.expire)
        let noww = moment()
        var diffs = noww.diff(expiredate, "days");
        console.log("diffs:", diffs);
        console.log('===result.days_value:', result.days_value);
        console.log("expiredate:", expiredate);
        console.log("now:", noww);
        if (user_subs && diffs >= result.days_value && expiredate < noww) {
          return res.json(appfunctions.successResponse("msg_applied", response));
        } else {
          return res.json(appfunctions.failResponse("msg_not_applicable"));
        }
      } else {
        return res.json(appfunctions.failResponse("msg_coupon_not_valid"));
      }
    } else {
      return res.json(appfunctions.failResponse("msg_coupon_not_exists"));
    }
  })
})

//Get Demo Lesson only
router.get('/demoLessonOnly', async function (req, res) {
  // console.log("api called: ", req.user);
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId
  let lessonfamily_id = config.demoFamily;

  let demoLesson = await appfunctions.getLessonData(req.user.learning_language_id, req.user.language_id ? req.user.language_id._id : language_id);
  let demoFmly = await LessonFamily.findOne({ _id: ObjectId(lessonfamily_id) });
  let lessonpercentage = await appfunctions.getDemoLessonHitory(req.user._id);
  // console.log("demoFmlyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy : ", demoFmly);

  let demos = {}; compeleted = 0;
  if (lessonpercentage != null && lessonpercentage.active_progress == 100 && lessonpercentage.passive_progress == 100 && lessonpercentage.speak_progress == 100 && lessonpercentage.repeat_progress == 100) {
    compeleted = 1;
  }
  demos.lessonfamily_id = lessonfamily_id; // "5e98691ea42d407923f81b1b"; // "5efae3f00cd68d7bc311472c"
  demos.lesson_id = (lessonpercentage && lessonpercentage.lesson_id != undefined) ? lessonpercentage.lesson_id : demoLesson.data[0]._id,
    demos.title = "lbl_demo"
  demos.image = demoFmly.image
  demos.baselesson_id = demoLesson.data[0]['baselesson_id'] ? demoLesson.data[0]['baselesson_id'] : '5e3418af6504063787db5b29';
  demos.level_id = 1
  demos.is_free = 1
  demos.total = (lessonpercentage && lessonpercentage.total) ? lessonpercentage.total : 0
  demos.progress = (lessonpercentage && lessonpercentage.current) ? lessonpercentage.current : 0
  demos.max_read_slide = (lessonpercentage && lessonpercentage.max_read_slide) ? $lessonpercentage.max_read_slide : 0
  demos.is_download = (lessonpercentage && lessonpercentage.is_download) ? 1 : 0
  demos.active_progress = lessonpercentage ? lessonpercentage.active_progress : 0
  demos.passive_progress = lessonpercentage ? lessonpercentage.passive_progress : 0
  demos.speak_progress = lessonpercentage ? lessonpercentage.speak_progress : 0
  demos.repeat_progress = lessonpercentage ? lessonpercentage.repeat_progress : 0
  demos.status = lessonpercentage ? lessonpercentage.status : 0
  demos.label = 'lbl_demo',
    demos.is_demo = 1
  demos.term = demoFmly.term;
  res.json(appfunctions.successResponse("msg_success", demos, req.user));
})

// to delete user when there is no subscription is going on
router.post("/deleteUser", async function (req, res) {
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId
  var currentDate = new Date();
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
                  { $eq: ['$user_id', ObjectId(req.user._id)] },
                  { $gte: ["$expire", currentDate] },
                  { $eq: ["$status", 1] },
                  { $eq: ["$is_cancel", 0] }
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
        stripe_id: "$stripe_id",
        startdate: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.start", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.start", 0] }, else: "" } },
        expire: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.expire", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.expire", 0] }, else: "" } },
        payment_status: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.payment_status", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.payment_status", 0] }, else: "" } },
        status: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.status", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.status", 0] }, else: "" } },
        susbcrition_name: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.subscription_name", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.subscription_name", 0] }, else: "" } },
        subscription_schedule_name: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.subscription_schedule_name", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.subscription_schedule_name", 0] }, else: "" } },
        subscribed_id: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan._id", 0] }, 0] }, then: { $arrayElemAt: ["$userplan._id", 0] }, else: "" } },
        is_cancel: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.is_cancel", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.is_cancel", 0] }, else: "" } },
        plan_ended: { $cond: { if: { $ifNull: [{ $arrayElemAt: ["$userplan.plan_ended", 0] }, 0] }, then: { $arrayElemAt: ["$userplan.plan_ended", 0] }, else: "" } },
        subscription_saving: "$subscription_saving",
      }
    },
    {
      $sort: {
        validity: 1
      }
    }
  ]).exec(function (err, result) {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", err));
    } else {
      // res.json(appfunctions.successResponse("msg_success", result, req.user));
      result.map((ele, index) => {
        if (ele.status == 1 && (ele.payment_status == 'active' || ele.payment_status == 'trialing')) {
          return res.json(appfunctions.failResponse("err_subscription_cancel_then_delete", err));
        }
      })

      User.remove({ _id: ObjectId(req.user._id) }, function (error, deleted) {
        if (error) {
          res.json(appfunctions.failResponse("msg_something_wrong", err));
        } else {
          res.json(appfunctions.successResponse("msg_account_deleted", {}));
        }
      })
    }
  });
})

// to update welcome process check in user table
router.get("/welcomeProceeded", async function (req, res) {
  User.updateOne({ _id: ObjectId(req.user._id) }, { $set: { isWeclomeProceed: 1 } }, async function (error, updated) {
    if (error) return res.json(appfunctions.failResponse("msg_something_wrong", err));
    if (!error && !updated) return res.json(appfunctions.failResponse("msg_user_not_found", {}));
    User.findOne({ _id: ObjectId(req.user._id) }, async function (err, userData) {
      if (err) return res.json(appfunctions.failResponse("msg_something_wrong", err));
      if (!err && !userData) return res.json(appfunctions.failResponse("msg_user_not_found", {}));
      return res.json(appfunctions.successResponse("", userData));
    })
  })
})


router.get("/subscription-content", (req, res) => {
  let language_id = req.user.language_id ? req.user.language_id._id : config.defaultLanguageId;
  SusbContent.findOne({ language_id: ObjectId(language_id) }, (err, result) => {
    if (err) {
      appfunctions.failResponse('msg_fail', err)
    } else {
      if (result) {
        res.json(appfunctions.successResponse("msg_success", result, res.user));
      } else {
        SusbContent.findOne({ language_id: ObjectId(config.defaultLanguageId) }, (err, result) => {
          if (err) {
            appfunctions.failResponse('msg_fail', err)
          } else {
            res.json(appfunctions.successResponse("msg_success", result, res.user));
          }
        })
      }
    }
  })
})



router.get('/accessToken', (req, res) => {
  JWTClient.getAccessToken((err,token)=>{    	
      if(err){        	
          return res.status(404).send("get access token failed");
      }
      console.log(token);

      return res.status(200).send(token);
  })  
});



function saveLogs(event, rNumber) {
  let logs = new Logs()
  logs.error = event ? event : ""
  logs.uni_id = rNumber ? rNumber : ""
  logs.save(async (errs, results) => {
    console.log("log response ----> ", results);
    if(errs) return false;
    return results;
  })
}



/* 
  Remove Default Card and Add New card 
*/

async function OldandNewCard(customer_id, token) {
  await getStripeInstance();
  let customer = customer_id
  return new Promise((resolve, reject) => {
    stripe.customers.retrieve(customer, function (err, customerInfo) {
      if (err)
      {
        reject({ status: 404, error: err })
      }
      else
      {
        if (customerInfo) 
        {
          let default_card = customerInfo.default_source
          if (default_card)
          {
            stripe.customers.deleteSource(customer, default_card, async function (errDeleteCard, confirmation) {
              if (errDeleteCard) {
                reject({ status: 404, error: errDeleteCard })
              } else if (confirmation && confirmation.deleted == true) {
                if (token) {
                  stripe.customers.createSource(customer, { source: token }, async function (errors, card) {
                    if (errors) {
                      reject({ status: 404, error: errors })
                    } else if (card) {
                      resolve({ status: 200, data: card });
                    }
                  })
                }
              } else {
                reject({ status: 404, error: confirmation })
              }
            });
          } else {
            if (token) {
              stripe.customers.createSource(customer, { source: token }, async function (errors, card) {
                if (errors) {
                  reject({ status: 404, error: errors })
                } else if (card) {
                  resolve({ status: 200, data: card });
                }
              })
            }
          }
        } else {
          resolve({ status: 200, data: customerInfo });
        }
      }
    });
  })
}


/* 
  Create Payment for Unlimited Plan by Sofort  
*/

router.post("/createPaymentIntent", async (req, res, next) => {
  await getStripeInstance();
  try 
  {
    await createCustomer(req.user.email,currentDate,username)
    .then(async customer=>{
        let customerid = customer.id;
        await appfunctions.updateCustomer(req.user._id, customerid);
    
        const paymentIntent = await stripe.paymentIntents.create({
          amount: req.body.price * 100,
          currency: 'eur',
          payment_method_types: [
            'card',
            'sofort'
          ],
          metadata: {
            subscription_id: req.body.subscription_id,
            user_id: req.user._id,
          },
          customer:customerid
        });

        let d = new Date();
        let year = d.getFullYear();
        let month = d.getMonth();
        let day = d.getDate();
        let fDate = new Date(year + 20, month, day);

        let userSubs = new UserSubs();
        userSubs.user_id = req.user._id;
        userSubs.expire = fDate;
        userSubs.plan_ended = fDate;
        userSubs.subscription_id = req.body.subscription_id;
        userSubs.payment_intent_client_secret = paymentIntent.client_secret;
        userSubs.payment_status = "pending";
        userSubs.status = 0;
        userSubs.subscription_name = req.body.subscription_id;
        userSubs.validity = 240;
        userSubs.save(async (err, result) => {
        if (err)
        {
          res.json(appfunctions.failResponse('msg_something_wrong', err));
        } 
        else
        {
          if (result) 
          {
            res.json(
              appfunctions.successResponse(
                "msg_success",
                {'client_secret':paymentIntent.client_secret },
                req.user
              )
            );
            let subname = req.body.title;
            let extension_date = moment(result.plan_ended).add(1, 'days')
            await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
            await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subname, req.user)
            await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", moment(result.created), req.user)
            res.json(appfunctions.successResponse('msg_subscribed_suceessfully', '', req.user));
          }
        }
      })
    })
    .catch(err=>{
      console.log('ERROR - 884436',err)
      res.json(err);
    })
  } catch (error) {
    res.json(appfunctions.failResponse("msg_something_wrong"));
  }
});

/* 
  Sofort - Update Payment Status when process done  
*/

router.post("/updateSofortPaymentStatus", async (req, res, next) => {
  let intent_clientSecret = req.body.intent_clientSecret;
  let status = 0;
  let payment_status = 'pending';
  if(req.body.status == 'succeeded')
  {
    status = 1;
    payment_status = 'active';
  }
  else if(req.body.status == 'processing')
  {
    status = 0;
    payment_status = 'processing';
  }
  else if(req.body.status == 'failed')
  {
    status = 0;
    payment_status = 'failed';
  }
  
  //UserSubs.findOne({ payment_intent_client_secret: intent_clientSecret }, async (err, result) => {
    var params = {
      status: status,
      payment_status: payment_status
    };
    var stringifyData = JSON.stringify(params);
    let parseData = JSON.parse(stringifyData);
    UserSubs.updateOne(
      { payment_intent_client_secret: intent_clientSecret },
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
              },
              req.user
            )
          );
        }
      }
    );
  //});
});


async function handleCallback(res, err, result, from)
{
  if (err)
  {
    return appfunctions.failResponse('msg_something_wrong', JSON.stringify(err));
  } 
  else if (result)
  {
    console.log('Success')
    return result;
  }
}




async function createSubscriptionSchedules(startTimestamp,customerid,stripe_id,quantity)
{
  return new Promise((resolve, reject) => {
    stripe.subscriptionSchedules.create(
    {
      customer: customerid,
      start_date: startTimestamp,
      end_behavior: 'release',
      phases: [
        {
          plans: [
            { plan: stripe_id, quantity: quantity },
          ],
          iterations: 12,
        },
      ],
    }, function(err, result){
      if (err)
      {
        console.log('err',err)
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    });
  });
}

async function deleteSubscription(subscription_name)
{
  return new Promise((resolve, reject) => {
    stripe.subscriptions.del(subscription_name, function(err, result){
      if (err)
      {
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    }); 
  });
}



async function updateSubscription(susb_name, data)
{
  return new Promise((resolve, reject) => {
    stripe.subscriptions.update(susb_name, data, function(err, result){
      if (err)
      {
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    }); 
  }); 
}


const createCustomer = (email,currentDate,username) => {
  return new Promise((resolve, reject) => {
    var data = {}; 
    data = {
      description: 'New account created on stripe on this ' + currentDate.format() + " date.",
      name: username,
      email: email
    }
    stripe.customers.create(data, function(err, result){
      if (err)
      {
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    });
  });
}


const createCustomerSource = (customerid,token) => {
  return new Promise((resolve, reject) => {
    stripe.customers.createSource(customerid, { source: token }, function(err, result){
      if (err)
      {
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    });
  });
}

const createCharge = (customerid,token,price) => {
  return new Promise((resolve, reject) => {
    stripe.charges.create({
      //source: token,
      currency: 'EUR',
      amount: price * 100,
      customer:customerid
    }, function(err, result){
      if (err)
      {
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    });
  });
}


const createSubscription = (coupon ,customer_id,stripe_id,quantityNew, diff) => {
  
  return new Promise((resolve, reject) => {
    var subscreate = {
      customer: customer_id,
      items: [{ plan: stripe_id, quantity: quantityNew }],
    }
    if(coupon && coupon != "" && coupon != undefined && diff > 0  )
    {
      subscreate.coupon = coupon;
      subscreate.trial_period_days = diff;
    }
    else if (coupon && coupon != "" && coupon != undefined && diff <= 0) {
      subscreate.coupon = coupon;
    }

    stripe.subscriptions.create(subscreate, function(err, result){
      if (err)
      {
        console.log(err,'err')
        reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        console.log('Success')
        resolve(result)
      }
    });
  });
}





const findIfUserHasSubscription = (user_id) => {
  return new Promise(async (resolve, reject) => {
    await UserSubs.findOne({
      $and: [
        { user_id: ObjectId(user_id) },
        { status: 1 },
        { is_cancel: { $ne: 1 } }
      ]
    }).sort({ "expire": -1 }).exec(
      async function (err, result) {
        if (err)
        {
          reject(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
        } 
        else if (result)
        {
          console.log('Success')
          resolve(result)
        }
      });
  });
}





 
                                    
let saveUserSubscription = (data)=>
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

let updateUserSubscription = (data,usersubs_id)=>
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


let createTransactionHistory = (data)=>
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












/* 
  Save subscription of a user via website with Credit card method. 
*/

router.post("/subscribed", async (req, res, next) => {
  await getStripeInstance();
  const token = req.body.stripeToken; // Using Express
  let amount = req.body.amount;
  let username = req.user.username
  let payment_type = req.body.payment_type;
  let amountIsInr = amount * 100;
  let user_id = req.user._id;
  let subscription_id = req.body.subscription_id;
  let stripe_id = req.body.stripe_id;
  let subscription = await appfunctions.getSubscription(subscription_id)
  let quantityNew = 1; //subscription.validity
  var currentDate = moment(new Date());
  let customerid = "";
  let coupon = req.body.coupon;
  let customer_id = req.user.customer_id ? req.user.customer_id : "";
  let subscreate = {}
  let subscriptionsname = subscription.title;

  //Pramod Start 
  if (req.user.customer_id) 
  {
    // First Delete Default card source and update new one. 
    await OldandNewCard(customer_id, token)
    .then(async result=>{
      await findIfUserHasSubscription(user_id)
      .then(async result=>{
        if (result.payment_status)
        {
          let previousDate = new Date(result.expire);
          let currentDate = new Date();
          
          if(subscription_id == result.subscription_id)
          {
            console.log(1);
            res.json(appfunctions.failResponse('msg_already_purchase_this_plan'));
          }
          if (result.payment_status == "not_started")
          {
            let quantity = 1; 
            await createSubscriptionSchedules(startTimestamp,customer_id,stripe_id,quantity).then(subscriptionSchedule) 
            .then(async subscriptionSchedule =>{
              let data = {
                validity:subscription.validity,
                user_id:user_id,
                subscription_schedule_name:subscriptionSchedule.id,
                subscription_name:subscriptionSchedule.subscription,
                subscription_id:subscription_id,
                start:moment(moment.unix(subscriptionSchedule.phases[0].start_date).utc()),
                expire:moment(moment.unix(subscriptionSchedule.phases[0].end_date).utc()),
                status:1
              }
              await saveUserSubscription(data)
              .then(result=>{
                res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
              })
              .catch(err=>{
                res.json(err);
              })
            })
            .catch(err=>{
              res.json(err);
            })
          }
          else if (result.payment_status == "trialing" && result.status == 1) 
          {
            result.status = 2
            result.save();
            let trialend = moment(result.expire, 'DD.MM.YYYY')
            let now = moment();
            var diff = trialend.diff(now, "days");
            await deleteSubscription(result.subscription_name)
            .then(async deletesubs=>{
              await createSubscription(coupon,customer_id,stripe_id,quantityNew, diff)
              .then(async subscriptionData=>{
                var fm = moment.unix(subscriptionData.current_period_end).utc();
                if(diff > 0 )
                {
                  let enddate = moment.unix(subscriptionData.current_period_end).utc();
                  fm = moment(enddate).add(subscription.validity, 'months')
                }
                
                let data = {
                  subscription_id:subscription_id, // Subscription plan id  
                  user_id:user_id,
                  validity:subscription.validity,
                  is_cancel:0,
                  //trial_end:subscriptionData.trial_end,
                  start:moment.unix(subscriptionData.start_date).utc(),
                  plan_ended:fm.format(),
                  expire:moment.unix(subscriptionData.current_period_end).utc(),
                  status:1,
                  payment_status:subscriptionData.status,
                  subscription_name:subscriptionData.id,  // Subscription stripe id 
                  subscription_schedule_name:'' // Subscription schedule Stripe id 
                }

                if(diff > 0 ) data.trial_end = [subscriptionData.trial_start, subscriptionData.trial_end];

                await saveUserSubscription(data)
                .then(async result=>{
                  let userColmns = await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscriptionsname, req.user)
                  res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
                })
                .catch(err=>{
                  console.log(err,'Create Subscription Error 002') 
                  res.json(err);
                })
              }).catch(err=>{
                // Create Subscription Error
                console.log(err,'Create Subscription Error 001') 
                res.json(err);
              })
          })
          .catch(err=>{
            // Delete Subscription Error 
            res.json(err);
          })
          }
          else if ((result.payment_status == "active" && subscription_id != result.subscription_id && result.validity != 240) || (result.payment_status == "active" && currentDate > previousDate))
          {
            
            let startdate = result.expire;
            let startTimestamp = moment(startdate).unix();
            let susb_name = result.susbcrition_name;
            let quantity = 1;

            let updateData = { cancel_at_period_end: true };
            await updateSubscription(susb_name, updateData)
            .then(async subscriptionSchedule=>{
              await createSubscriptionSchedules(startTimestamp,stripe_id,quantity)
              .then(async subscriptionData=>{
                
                let data = {
                  subscription_id:subscription_id, // Subscription plan id  
                  user_id:user_id,
                  validity:subscription.validity,
                  is_cancel:0,
                  //trial_end:subscriptionData.trial_end,
                  start:moment(moment.unix(subscriptionData.phases[0].start_date).utc()),
                  plan_ended:moment(moment.unix(subscriptionData.phases[0].end_date).utc()),
                  expire:moment(moment.unix(subscriptionData.phases[0].end_date).utc()),
                  status:1,
                  payment_status:subscriptionData.status,
                  subscription_name:subscriptionData.subscription,  // Subscription stripe id 
                  subscription_schedule_name:subscriptionData.id // Subscription schedule Stripe id 
                }

                data.trial_end = [];
                
                await saveUserSubscription(data)
                .then(async result=>{
                  let userColmns = await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscriptionsname, req.user)
                  res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
                })
                .catch(err=>{
                  res.json(err);
                })
              })
              .catch(err=>{
                //Create Subscription Schedule error 
                res.json(err)
              })
            })
            .catch(err=>{
              //Update Subscription Error 
              __logger.info("msg_subscriptionSchedule_err" + JSON.stringify(err))
              res.json(err)
            
            })
          }
          else {
            res.json(appfunctions.failResponse('msg_already_purchase_this_plan'));
          }
        }
        else
        {
          let diff = 0; 
          await createSubscription(coupon,customer_id,stripe_id,quantityNew, diff)
          .then(async subscriptionData=> 
          {
              var fm = moment.unix(subscriptionData.current_period_end).utc();
                if(diff > 0 )
                {
                  let enddate = moment.unix(subscriptionData.current_period_end).utc();
                  fm = moment(enddate).add(subscription.validity, 'months')
                }
                
                let data = {
                  subscription_id:subscription_id, // Subscription plan id  
                  user_id:user_id,
                  validity:subscription.validity,
                  is_cancel:0,
                  //trial_end:subscriptionData.trial_end,
                  start:moment.unix(subscriptionData.start_date).utc(),
                  plan_ended:fm.format(),
                  expire:moment.unix(subscriptionData.current_period_end).utc(),
                  status:1,
                  payment_status:subscriptionData.status,
                  subscription_name:subscriptionData.id,  // Subscription stripe id 
                  subscription_schedule_name:'' // Subscription schedule Stripe id 
                }

                if(diff > 0 ) data.trial_end = [subscriptionData.trial_start, subscriptionData.trial_end];

                await saveUserSubscription(data)
                .then(async result=>{
                  let userColmns = await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscriptionsname, req.user)
                  res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
                })
                .catch(err=>{
                  res.json(err);
                })
          })
          .catch(err=>{
            // Create Subscription error 
            res.json(err)
          })
        }
      })
      .catch(err =>{
        // Find Subscription error 
        res.json(err)
      })
    })
    .catch(err=>{
      //Delete and create default source errror 
      console.log('delete-add-card-Error',err.error)
      res.json(err)
    })
  }
  else
  {
    let checkPreviousPlan = await UserSubs.findOne({ $and: [{ user_id: ObjectId(user_id) }, { status: 1 }, { is_cancel: { $ne: 1 } }] })
    if (checkPreviousPlan) return res.json(appfunctions.failResponse('msg_already_purchase_this_plan'));
    let startTimestamp = moment(new Date()).unix();
    let trialendTimestamp = moment(new Date()).add(14, 'days').unix();

    await createCustomer(req.user.email,currentDate,username)
    .then(async customer=>{
        customerid = customer.id;
        await appfunctions.updateCustomer(req.user._id, customerid);
        let quantity = 3; 
        await createCustomerSource(customerid,token)
        .then(async card=>{
              let diff = 14;        
              await createSubscription(coupon,customerid,stripe_id,quantityNew, diff) 
              .then(async subscriptionData=>{
                var fm = moment.unix(subscriptionData.current_period_end).utc();
                if(diff > 0 )
                {
                  let enddate = moment.unix(subscriptionData.current_period_end).utc();
                  fm = moment(enddate).add(subscription.validity, 'months')
                }
                
                let data = {
                  subscription_id:subscription_id, // Subscription plan id  
                  user_id:user_id,
                  validity:subscription.validity,
                  is_cancel:0,
                  //trial_end:subscriptionData.trial_end,
                  start:moment.unix(subscriptionData.start_date).utc(),
                  plan_ended:fm.format(),
                  expire:moment.unix(subscriptionData.current_period_end).utc(),
                  status:1,
                  payment_status:subscriptionData.status,
                  subscription_name:subscriptionData.id,  // Subscription stripe id 
                  subscription_schedule_name:'' // Subscription schedule Stripe id 
                }
  
                if(diff > 0 ) data.trial_end = [subscriptionData.trial_start, subscriptionData.trial_end];
  
                await saveUserSubscription(data)
                .then(async result=>{
                  let userColmns = await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscriptionsname, req.user)
                  res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
                })
                .catch(err=>{
                  console.log(err,'err03')
                  res.json(err);
                })
              })
              .catch(err=>{
                console.log(err,'err02')
                res.json(err);
              })
        })
        .catch(err => { 
          // Create Customer Source Error 
          console.log(err,'err01')
          res.json(err);
        }); 
    })
    .catch(err => { 
       // Create Customer Error 
       console.log(err,'err04')
       res.json(err);
     });
  }
});



/* 
  Charge for unlimited subscription for one time 
*/
router.post("/subscribeForOneTime", async (req, res, next) => {
  await getStripeInstance();
  const token = req.body.stripeToken; // Using Express
  let user_id = req.user._id;
  let email = req.user.email;
  let subscription_id = req.body.subscription_id;
  let username = req.user.username
  let price = req.body.price;
  let stripe_id = req.body.stripe_id;
  var currentDate = moment(new Date());
  let coupon = req.body.coupon;
  let customerid = req.user.customer_id;
  let subscription = await appfunctions.getSubscription(subscription_id);
  if (req.user.customer_id) 
  {
     let customer_id = req.user.customer_id;
     // First Delete Default card source and update new one. 
     await OldandNewCard(customer_id, token)
     .then(async result=>{
      
      await findIfUserHasSubscription(user_id)
      .then(async result=>{
        if (result.payment_status)
        {
          if(result.payment_status == "trialing" && result.status == 1)
          {
            await deleteSubscription(result.subscription_name)
            .then(async deletesubs=>{
                result.status = 3 //cancelled    
                result.is_cancel = 1
                result.save(async (errinsave, usesave) => {
                  if(errinsave)
                  {
                    res.json(appfunctions.failResponse('msg_something_wrong', errinsave));
                  }
                  else
                  {
                    await createCharge(customerid,token,price)
                    .then(async charge=>{
                      let d = new Date();
                      let year = d.getFullYear();
                      let month = d.getMonth();
                      let day = d.getDate();

                      let data = {
                        subscription_id:subscription_id, // Subscription plan id  
                        user_id:user_id,
                        validity:240,
                        is_cancel:0,
                        trial_end: [],
                        start:new Date(),
                        plan_ended:new Date(year + 20, month, day),
                        expire:new Date(year + 20, month, day),
                        status:1,
                        payment_status:'active',
                        subscription_name:charge.id,  // Subscription stripe id 
                        subscription_schedule_name:'' // Subscription schedule Stripe id 
                      }
        
                      

                      await saveUserSubscription(data)
                      .then(async result=>{
                        let extension_date = moment(result.plan_ended).add(1, 'days')
                        await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
                        await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscription.title, req.user)
                        await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", moment(result.created), req.user)
                        res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
                      })
                      .catch(err => {
                        //Save Subscription Error 
                        console.log(err,'Save Subs Error 003')
                        res.json(err);
                      })
                    })
                    .catch(err=>{
                      console.log(err,'Create Charge Error 004')
                      //create charge Error 
                      res.json(err);
                    })
                  }
                })
            })
            .catch(err=>{
              console.log(err,'Delete Subscription Error 004')
              res.json(err)
            })
          }
          else if(result.payment_status == "active" && result.status == 1)
          {
              console.log(2);
              let susb_name = result.susbcrition_name;
              let updateData = { cancel_at_period_end: true };
              await updateSubscription(susb_name, updateData)
              .then(async subscriptionSchedule=>{
                result.status = 3 //cancelled    
                result.is_cancel = 1
                result.save(async (errinsave, usesave) => {
                  if(errinsave)
                  {
                    res.json(appfunctions.failResponse('msg_something_wrong', errinsave));
                  }
                  else
                  {
                    let title = subscription.title;
                    await createCharge(customerid,token,price)
                    .then(async charge=>{

                      let d = new Date();
                      let year = d.getFullYear();
                      let month = d.getMonth();
                      let day = d.getDate();

                      let data = {
                        subscription_id:subscription_id, // Subscription plan id  
                        user_id:user_id,
                        validity:240,
                        is_cancel:0,
                        trial_end: [],
                        start:new Date(),
                        plan_ended:new Date(year + 20, month, day),
                        expire:new Date(year + 20, month, day),
                        status:1,
                        payment_status:'active',
                        subscription_name:charge.id,  // Subscription stripe id 
                        subscription_schedule_name:'' // Subscription schedule Stripe id 
                      }

                      await saveUserSubscription(data)
                      .then(async result=>{
                        let extension_date = moment(result.plan_ended).add(1, 'days')
                        await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
                        await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", title, req.user)
                        await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", moment(result.created), req.user)
                        res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
                      })
                      .catch(err => {
                        //Save Subscription Error 
                        res.json(err);
                      })
                    })
                    .catch(err=>{
                      //create charge Error 
                      res.json(err);
                    })
                  }
                })
              })
              .catch(err=>{
                res.json(err);
              })
          }
          else
          {
            console.log(3);
          }
          
        }
        else
        {
          // If customer do not have any existing active subscription 
          let title = subscription.title;
          await createCharge(rcustomerid,token,price)
          .then(async charge=>{

            let d = new Date();
            let year = d.getFullYear();
            let month = d.getMonth();
            let day = d.getDate();
           

            let data = {
              subscription_id:subscription_id, // Subscription plan id  
              user_id:user_id,
              validity:240,
              is_cancel:0,
              trial_end: [],
              start:new Date(),
              plan_ended:new Date(year + 20, month, day),
              expire:new Date(year + 20, month, day),
              status:1,
              payment_status:'active',
              subscription_name:charge.id,  // Subscription stripe id 
              subscription_schedule_name:'' // Subscription schedule Stripe id 
            }

            await saveUserSubscription(data)
            .then(async result=>{
              let extension_date = moment(result.plan_ended).add(1, 'days')
              await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
              await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", title, req.user)
              await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", moment(result.created), req.user)
              res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
            })
            .catch(err => {
              //Save Subscription Error 
              res.json(err);
            })
          })
          .catch(err=>{
            //create charge Error 
            res.json(err);
          })
          console.log('Pramod')
        }
      })
      .catch(err=>{
        //Find subscription err 
        console.log('Find subscription err',err)
        res.json(err)
      })
    })
    .catch(err=>{
      //Delete and create default source errror 
      console.log('delete-add-card-Error',err.error)
      res.json(err)
    })
  }
  else
  {
    await createCustomer(email,currentDate,username)
    .then(async customer=>{
      await appfunctions.updateCustomer(req.user._id, customer.id);
      await createCustomerSource(customer.id,token)
        .then(async card=>{
          let title = subscription.title;
          
      
          await createCharge(customer.id,token,price)
          .then(async charge=>{
    
            let d = new Date();
            let year = d.getFullYear();
            let month = d.getMonth();
            let day = d.getDate();
    
            let data = {
              subscription_id:subscription_id, // Subscription plan id  
              user_id:user_id,
              validity:240,
              is_cancel:0,
              trial_end: [],
              start:new Date(),
              plan_ended:new Date(year + 20, month, day),
              expire:new Date(year + 20, month, day),
              status:1,
              payment_status:'active',
              subscription_name:charge.id,  // Subscription stripe id 
              subscription_schedule_name:'' // Subscription schedule Stripe id 
            }
    
            await saveUserSubscription(data)
            .then(async result=>{
              let extension_date = moment(result.plan_ended).add(1, 'days')
              await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
              await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", title, req.user)
              await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", moment(result.created), req.user)
              res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
            })
            .catch(err=>{
              console.log(err,'Save Subscription Error 005')
              res.json(err);
            })
           // await saveUserSubscription(charge,subscription_id,validity,status,start,end,expire,trial_start,trial_end, plan_ended)
          })
          .catch(err=>{
            console.log(err,'create charge Error 006')
            //create charge Error 
            res.json(err);
          })
        })
        .catch(err=>{
          console.log(err,'Create Customer Source ERROR 006')
          res.json(err)
        })
    })
    .catch(err=>{
      console.log(err,'create Customer Error 007')
      //create Customer Error 
      res.json(err);
    })
  }
})




/* 
  Cancel Subscription 
*/
router.post('/cancelSubs', async (req, res) => {
  await getStripeInstance();
  let subscribed_id = req.body.subscribed_id ? req.body.subscribed_id : "";
  UserSubs.findOne({ _id: ObjectId(subscribed_id) }, async (err, usersubs) => {
    if (err) {
      res.json(appfunctions.failResponse("msg_something_wrong", JSON.stringify(err)));
    } else if (usersubs != null && usersubs.payment_status == "trialing") {
      let subscription_name = usersubs.subscription_name
      if (subscription_name) {
        stripe.subscriptions.del(
          subscription_name,
          function (err, confirmation) {
            if (err) {
              res.json(appfunctions.failResponse("msg_something_wrong", err));
            } else {
              if (confirmation) {
                usersubs.status = 3 //cancelled    
                usersubs.is_cancel = 1
                usersubs.save(async (errinsave, usesave) => {
                  if (errinsave) {
                    res.json(appfunctions.failResponse("msg_something_wrong", JSON.stringify(errinsave)));
                  } else {
                    if (usesave) {
                      let termination_date = moment()
                      await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", null, req.user)
                      await appfunctions.updateUserByColumn(req.user._id, "extension_date", undefined, req.user)
                      await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", null, req.user)
                      res.json(appfunctions.successResponse("msg_subscritption_cancel_successfully", usesave, req.user));
                    }
                  }
                })
              }
            }
          }
        );
      }
    } else if (usersubs != null && usersubs.payment_status == "active") {
      let subscription_name = usersubs.subscription_name
      if (subscription_name) {
        stripe.subscriptions.update(
          subscription_name,
          { cancel_at_period_end: true },
          async function (err, subscription) {
            // console.log("cancel", subscription)
            // usersubs.status = 1
            let planDetails = await BaseSusb.findOne({ _id: ObjectId(usersubs.subscription_id) })
            if (planDetails.validity == 240 || planDetails.validity == "Unbegrenzt") {
              usersubs.status = 3;
              usersubs.expire = new Date();
            } else {
              usersubs.status = 1;
            }
            usersubs.is_cancel = 1
            usersubs.payment_status = 'canceled'
            usersubs.save(async (errinsave, usesave) => {
              if (errinsave) {
                res.json(appfunctions.failResponse("msg_something_wrong", JSON.stringify(errinsave)));
              } else {
                if (usesave) {
                  let termination_date = usesave.expire
                  let user = await appfunctions.updateUserByColumn(req.user._id, "termination_date", termination_date, req.user)
                  res.json(appfunctions.successResponse("msg_subscritption_cancel_when_ended_next_billing", usesave, req.user));
                }
              }
            })
          }
        );
      }
    } else if (usersubs != null && usersubs.payment_status == "not_started") {
      let subscription_schedule_name = usersubs.subscription_schedule_name;
      // console.log('usersubs', usersubs)
      if (subscription_schedule_name) {
        stripe.subscriptionSchedules.cancel(
          subscription_schedule_name,
          function (errSche, subscriptionSchedule) {
            console.log(subscriptionSchedule)
            if (errSche) {
              res.json(appfunctions.failResponse("msg_something_wrong", errSche));
            } else {
              let subsPaymentStatus = subscriptionSchedule.status
              if (subsPaymentStatus) {
                usersubs.status = 3
                usersubs.payment_status = subsPaymentStatus
                usersubs.save((errinsave, usesave) => {
                  if (errinsave) {
                    res.json(appfunctions.failResponse("msg_something_wrong", JSON.stringify(errinsave)));
                  } else {
                    if (usesave) {
                      res.json(appfunctions.successResponse("msg_schedule_subs_cancel_succes", usesave, req.user));
                    }
                  }
                })
              }
            }
          }
        );
      }
    }
  })
})


function getExpireDate(product_id,date,is_trial_period,trialPeriodDays) 
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






/* 
  Apple Payment Webhook   
*/
router.post("/subscribedForApplePay", async function (req, res) {

  
  let date = new Date(parseInt(req.body.purchase_date));
  
  var trialPeriodDays = 14;
  var purchase_date = new Date(parseInt(req.body.purchase_date));
  var trialPeriodEndDate = purchase_date.setDate(purchase_date.getDate() + trialPeriodDays);
  var expiry = getExpireDate(req.body.product_id,date,req.body.is_trial_period,trialPeriodDays);
  let subscription = await appfunctions.getSubscription(req.body.subscription_id);


 // ------------ // 
  let data = {
    user_id:req.user._id,
    validity:subscription.validity,
    subscription_schedule_name:'',
    subscription_name:req.body.transaction_id,
    subscription_id:req.body.subscription_id,
    apple_product_id: req.body.product_id,
    payment_status:req.body.is_trial_period == "true" ? "trialing" : "active",
    start:new Date(),
    plan_ended: expiry,
    expire:expiry,
    status:1
  }
  if (req.body.is_trial_period == "true" ) data.trial_end = [new Date(parseInt(req.body.purchase_date)).getTime(), trialPeriodEndDate];

  await saveUserSubscription(data)
  .then(result=>{
    res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
  })
  .catch(err=>{
    res.json(err);
  })

  // ------------ // 







  // UserSubs.findOne({ subscription_name: req.body.transaction_id }, function(error, record) {
  //   if(error) return res.json(appfunctions.failResponse('msg_something_wrong', error));
  //   if(!record || record == undefined) {
  //     let userSubs = new UserSubs();
  //     userSubs.user_id = ObjectId(req.user._id);
  //     userSubs.expire = expiry;
  //     userSubs.subscription_id = ObjectId(req.body.subscription_id);
  //     userSubs.validity = 1;
  //     userSubs.payment_status = req.body.is_trial_period == "true" ? "trialing" : "active";
  //     if (req.body.is_trial_period == "true") userSubs.trial_end = [new Date(parseInt(req.body.purchase_date)).getTime(), trialPeriodEndDate];
  //     userSubs.subscription_name = req.body.transaction_id;
  //     userSubs.apple_product_id = req.body.product_id;
  //     userSubs.plan_ended = expiry;
  //     userSubs.save(async (err, result) => {
  //       if (err) {
  //         res.json(appfunctions.failResponse('msg_something_wrong', err));
  //       } else {
  //         if (result) {
  //           if (result.created) {
  //             let user = await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", result.created, req.user)
  //             let extension_date = moment(result.plan_ended).add(1, 'days')
  //             let userExtension = await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
  //           }
  //           res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
  //         }
  //       }
  //     })
  //   } else {
  //     record.user_id = ObjectId(req.user._id);
  //     record.expire = expiry;
  //     record.subscription_id = ObjectId(req.body.subscription_id);
  //     record.validity = 1;
  //     record.status = 1;
  //     record.is_cancel = 0;
  //     record.payment_status = req.body.is_trial_period == "true" ? "trialing" : "active";
  //     if (req.body.is_trial_period == "true") record.trial_end = [new Date(parseInt(req.body.purchase_date)).getTime(), trialPeriodEndDate];
  //     record.subscription_name = req.body.transaction_id;
  //     record.apple_product_id = req.body.product_id;
  //     record.plan_ended = expiry;
  //     record.save(async (err, result) => {
  //       if (err) {
  //         res.json(appfunctions.failResponse('msg_something_wrong', err));
  //       } else {
  //         if (result) {
  //           if (result.created) {
  //             let user = await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", result.created, req.user)
  //             let extension_date = moment(result.plan_ended).add(1, 'days')
  //             let userExtension = await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
  //           }
  //           res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
  //         }
  //       }
  //     })
  //   }
  // })

})

/* 
  Google In App Webhook  
*/
router.post("/subscribedForGooglePay", async function (req, res) {

  
  let date = new Date(parseInt(req.body.purchase_date));
  
  var trialPeriodDays = 14;
  var purchase_date = new Date(parseInt(req.body.purchase_date));
  var trialPeriodEndDate = purchase_date.setDate(purchase_date.getDate() + trialPeriodDays);
  var expiry = getExpireDate(req.body.product_id,date,req.body.is_trial_period,trialPeriodDays);

  let subscription = await appfunctions.getSubscription(req.body.subscription_id);
  
  let data = {
    user_id:req.user._id,
    validity:subscription.validity,
    subscription_schedule_name:'',
    subscription_name:req.body.transaction_id,
    subscription_id:req.body.subscription_id,
    google_product_id: req.body.product_id,
    payment_status:req.body.is_trial_period == 2 ? "trialing" : "active",
    start:new Date(),
    plan_ended: expiry,
    expire:expiry,
    status:1
  }

  if (req.body.is_trial_period == 2) data.trial_end = [new Date(parseInt(req.body.purchase_date)).getTime(), trialPeriodEndDate];

  await saveUserSubscription(data)
  .then(result=>{
    res.json(appfunctions.successResponse('msg_scheduled_suceessfully', result, req.user));
  })
  .catch(err=>{
    res.json(err);
  })

  
  // let userSubs = new UserSubs();
  // userSubs.user_id = ObjectId(req.user._id);
  // userSubs.expire = expiry;
  // userSubs.subscription_id = ObjectId(req.body.subscription_id);
  // userSubs.validity = 1;
  // userSubs.payment_status = req.body.is_trial_period == 2 ? "trialing" : "active";
  // if (req.body.is_trial_period == 2) userSubs.trial_end = [new Date(parseInt(req.body.purchase_date)).getTime(), trialPeriodEndDate];
  // userSubs.subscription_name = req.body.transaction_id;
  // userSubs.google_product_id = req.body.product_id;
  // userSubs.plan_ended = expiry;
  // userSubs.save(async (err, result) => {
    
  //   if (err) {
  //     res.json(appfunctions.failResponse('msg_something_wrong', err));
  //   } else {
  //     if (result) {
  //       if (result.created) {
  //         let user = await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", result.created, req.user)
  //         let extension_date = moment(result.plan_ended).add(1, 'days')
  //         let userExtension = await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
  //       }
  //       res.json(appfunctions.successResponse('msg_subscribed_suceessfully', result, req.user));
  //     }
  //   }
  // })
})

router.post("/subscribed-backup", async (req, res, next) => {
  await getStripeInstance();
  const token = req.body.stripeToken; // Using Express
  let amount = req.body.amount;
  let username = req.user.username
  let payment_type = req.body.payment_type;
  let amountIsInr = amount * 100;
  let user_id = req.user._id;
  let subscription_id = req.body.subscription_id;
  let stripe_id = req.body.stripe_id;
  let subscription = await appfunctions.getSubscription(subscription_id)
  let quantityNew = 1; //subscription.validity
  var currentDate = moment(new Date());
  let customerid = "";
  let coupon = req.body.coupon;
  let customer_id = req.user.customer_id ? req.user.customer_id : "";
  let subscreate = {}

  /*
  UserSubs :  Payment Status 
  A. not_started 
  B. trialing
  C. Active
  */

  //Pramod Start 
  if (req.user.customer_id) 
  {
    await findIfUserHasSubscription(user_id)
    .then(err, result)
    {
      if (err)
      {
        res.json(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)));
      } 
      else if (result)
      {
        let previousDate = new Date(result.expire);
        let currentDate = new Date();
        if (result.payment_status == "not_started" && subscription_id != result.subscription_id)
        {
          let quantity = 1; 
          await createSubscriptionSchedules(startTimestamp,stripe_id,quantity).then(err_sche, subscriptionSchedule) 
          {
            if (err_sche)
            {
              res.json(appfunctions.failResponse('msg_subscriptionSchedule_err', err_sche));
            } 
            else
            {
              if (subscriptionSchedule)
              {
                let subSchedule = new UserSubs()
                subSchedule.user_id = req.user._id
                subSchedule.subscription_id = subscription_id
                subSchedule.subscription_schedule_name = subscriptionSchedule.id
                subSchedule.start = moment(moment.unix(subscriptionSchedule.phases[0].start_date).utc())
                subSchedule.expire = moment(moment.unix(subscriptionSchedule.phases[0].end_date).utc())
                subSchedule.payment_status = subscriptionSchedule.status
                subSchedule.validity = 5//subscription.plans.interval_count;
                subSchedule.status = 1;
                subSchedule.save((err, schedule) => {
                  if (err) {
                    res.json(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err)), 400);
                  } else {
                    if (schedule) {
                      res.json(appfunctions.successResponse('msg_scheduled_suceessfully', schedule, req.user));
                    } else {
                      res.json(appfunctions.failResponse('msg_scheduled_not_create_suceessfully', schedule));
                    }
                  }
                })
              }
              else
              {
                res.json(appfunctions.failResponse('msg_something_wrong', JSON.stringify(err_sche)), 400);
              }
            }
          }
        }
        else if (result.payment_status == "trialing" && result.status == 1) 
        {
            result.status = 2
            let trialend = moment(result.expire, 'DD.MM.YYYY')
            let now = moment();
            var diff = trialend.diff(now, "days");
            await deleteSubscription(result.subscription_name).then(errdel,confirmation)
            {
              if (errdel) 
              {
                res.json(appfunctions.failResponse('msg_errdel', errdel));
              }
              else
              {
                result.save(async (errExpire, expireoldTrail) => {
                  if (errExpire) 
                  {
                    res.json(appfunctions.failResponse('msg_errExpire', errExpire));
                  }
                  else
                  {
                    if (expireoldTrail)
                    {
                      await createSubscription(coupon,customer_id,stripe_id,quantityNew, diff).then(errs, subscription) 
                      {
                        if (errs) 
                        {
                          __logger.info("expireoldTrail" + JSON.stringify(errs))
                          res.json(appfunctions.failResponse('msg_something_wrong', errs));
                        }
                        else
                        {
                          let enddate = moment.unix(subscription.current_period_end).utc();
                          let subscriptionsname = subscription.plan.nickname
                          if (subscription.plan.interval && subscription.plan.interval == "year") {
                            var fm = moment(enddate);
                          } else {
                            var fm = moment(enddate).add(subscription.plan.interval_count, 'months')
                          }
                          //Update Subscription name
                          let userColmns = await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscriptionsname, req.user)
                          let userSubs = new UserSubs();
                          userSubs.user_id = req.user._id;
                          userSubs.expire = moment.unix(subscription.current_period_end).utc();
                          userSubs.subscription_id = subscription_id;
                          userSubs.validity = subscription.plan.interval_count;
                          userSubs.payment_status = subscription.status;
                          userSubs.trial_end = [moment.unix(subscription.trial_start).utc(), moment.unix(subscription.trial_end).utc()]
                          userSubs.subscription_name = subscription.id;
                          userSubs.plan_ended = fm.format()
                          userSubs.save((err, result) => {
                            if (err) {
                              res.json(appfunctions.failResponse('msg_something_wrong', err));
                            } else {
                              if (result) {
                                res.json(appfunctions.successResponse('msg_subscribed_suceessfully', subscription, req.user));
                              }
                            }
                          })
                        }
                      }
                    }
                  }
                })
              }
            }
        }
        else if ((result.payment_status == "active" && subscription_id != result.subscription_id && result.validity != 240) || (result.payment_status == "active" && currentDate > previousDate))
        {
          
          let startdate = result.expire;
          let startTimestamp = moment(startdate).unix();
          let susb_name = result.susbcrition_name;
          let quantity = 1;
          try {
            let updateData = { cancel_at_period_end: true };
            await updateSubscription(susb_name, updateData);
          } catch (updateerr) {
            __logger.info("msg_subscriptionSchedule_err" + JSON.stringify(updateerr))
            
          }


          await createSubscriptionSchedules(startTimestamp,stripe_id,quantity).then(err_sche, subscriptionSchedule) 
          {
            if (err_sche) {
              res.json(appfunctions.failResponse('msg_subscriptionSchedule_err', err_sche));
            } else {
              if (subscriptionSchedule) {
                let subSchedule = new UserSubs()
                subSchedule.user_id = req.user._id
                subSchedule.subscription_id = subscription_id
                subSchedule.subscription_schedule_name = subscriptionSchedule.id
                subSchedule.start = moment(moment.unix(subscriptionSchedule.phases[0].start_date).utc())
                subSchedule.expire = moment(moment.unix(subscriptionSchedule.phases[0].end_date).utc())
                subSchedule.payment_status = subscriptionSchedule.status
                subSchedule.validity = 5//subscription.plans.interval_count;
                subSchedule.status = 1;
                subSchedule.save((err, schedule) => {
                  if (err) {
                    // __logger.info("err" + JSON.stringify(err))
                    res.json(appfunctions.failResponse('msg_something_wrong', err));
                  } else {
                    if (schedule) {
                      res.json(appfunctions.successResponse('msg_scheduled_suceessfully', schedule, req.user));
                    } else {
                      res.json(appfunctions.failResponse('msg_scheduled_not_create_suceessfully', schedule));
                    }
                  }
                })
              }
            }
          }
        }
        else {
          res.json(appfunctions.failResponse('msg_already_purchase_this_plan'));
        }
      }
      else
      {
        await createSubscription(coupon,customer_id,stripe_id,quantityNew, diff).then(error, subscription) 
        {
          if (error) {
            res.json(appfunctions.failResponse('msg_something_wrong', error));
          } else 
          {
            let userSubs = new UserSubs();
            userSubs.user_id = user_id;
            userSubs.expire = moment.unix(subscription.current_period_end).utc();
            userSubs.plan_ended = moment.unix(subscription.current_period_end).utc();
            userSubs.subscription_id = subscription_id;
            userSubs.validity = subscription.plan.interval_count;
            userSubs.payment_status = subscription.status;
            userSubs.subscription_name = subscription.id;
            userSubs.save(async (err, result) => {
              if (err) {
                res.json(appfunctions.failResponse('msg_something_wrong', err));
              } 
              else 
              {
                if (result)
                {
                  //console.log(result);
                  let subname = subscription.plan.nickname
                  let extension_date = moment(result.plan_ended).add(1, 'days')
                  await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
                  await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subname, req.user)
                  await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", moment(result.created), req.user)
                  res.json(appfunctions.successResponse('msg_subscribed_suceessfully', subscription, req.user));
                }
              }
            })
          }
        }
      }
    }
  }
  else
  {
    let checkPreviousPlan = await UserSubs.findOne({ $and: [{ user_id: ObjectId(user_id) }, { status: 1 }, { is_cancel: { $ne: 1 } }] })
    if (checkPreviousPlan) return res.json(appfunctions.failResponse('msg_already_purchase_this_plan'));
    await createCustomer(currentDate,username).then(err, customer)
    {
      if (err) 
      {
        res.json(appfunctions.failResponse('msg_something_wrong', err, 400));
      }
      else
      {
        if (customer) 
        {
          customerid = customer.id
          await createCustomerSource(customerid,token).then(errors, card)
          {
            if (errors) 
            {
              res.json(appfunctions.failResponse('msg_something_wrong', errors, 400));
            }
            else
            {
              if (card) 
              {
                let diff = 14; 
                await createSubscription(coupon,customerid,stripe_id,quantityNew, diff).then(errs, subscription)
                {
                  if (errs) 
                  {
                    res.json(appfunctions.failResponse('msg_something_wrong', errs, 400));
                  }
                  else
                  {
                    await appfunctions.updateCustomer(req.user._id, customerid);
                    let enddate = moment.unix(subscription.current_period_end).utc();
                    let subscriptionsname = subscription.plan.nickname
                    if (subscription.plan.interval && subscription.plan.interval == "year") {
                      var fm = moment(enddate).add(subscription.plan.interval_count, 'years')
                    } else {
                      var fm = moment(enddate).add(subscription.plan.interval_count, 'months')
                    }
                    //Update Subscription name
                    let userColmns = await appfunctions.updateUserByColumn(req.user._id, "subscriptionname", subscriptionsname, req.user)
                    //console.log("months date later",fm.format())
                    let userSubs = new UserSubs();
                    userSubs.user_id = req.user._id;
                    userSubs.expire = moment.unix(subscription.current_period_end).utc();
                    userSubs.subscription_id = subscription_id;
                    userSubs.validity = subscription.plan.interval_count;
                    userSubs.payment_status = subscription.status;
                    userSubs.trial_end = [moment.unix(subscription.trial_start).utc(), moment.unix(subscription.trial_end).utc()]
                    userSubs.subscription_name = subscription.id;
                    userSubs.plan_ended = fm.format()
                    userSubs.save(async (err, result) => {
                      if (err) {
                        res.json(appfunctions.failResponse('msg_something_wrong', err));
                      } else {
                        if (result) {
                          if (result.created) {
                            let user = await appfunctions.updateUserByColumn(req.user._id, "firstsubscriptionstartdate", result.created, req.user)
                            let extension_date = moment(result.plan_ended).add(1, 'days')
                            let userExtension = await appfunctions.updateUserByColumn(req.user._id, "extension_date", extension_date, req.user)
                          }
                          res.json(appfunctions.successResponse('msg_subscribed_suceessfully', subscription, req.user));
                        }
                      }
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

module.exports = router;
