const slug = require("slug");
const fs = require("fs");
const { createTransport } = require("nodemailer");
const { renderFile } = require("ejs");
const { exec } = require("child_process");
const axios = require("axios");
const clone = require("clone");
const { ObjectId } = require("mongodb");
const { generate } = require("randomstring");

// const dateFormat	      = require("dateformat");
//const timeDate		= require("time").Date;
var clientSideSocket = require("socket.io-client")(WEBSITE_SOCKET_URL);

/** Function is used to set validation errors**/
uniqueValidations = function (validationErrors) {
  var userFields = [];
  var validationFields = [];
  if (Array.isArray(validationErrors)) {
    validationErrors.forEach(function (item) {
      if (validationErrors.indexOf(item.param) == -1) {
        userFields.push(item.param);
        validationFields.push(item);
      }
    });
    return validationFields;
  } else {
    return false;
  }
};

/** Function to check post request
 * @ param return true or false
 **/
isPost = function (req) {
  if (
    typeof req.body !== typeof undefined &&
    Object.keys(req.body).length !== 0
  ) {
    return true;
  } else {
    return false;
  }
};

/** Function to config datatable
 * options config conditions
 * return callback
 **/
dataTableConfig = function (req, res, options, callback) {
  let conditions = {};
  let datatableColumns = req.body.columns ? req.body.columns : [];

  /** Configuration of data table sorting */
  let datatableOrder = req.body.order ? req.body.order[0] : {};
  let datatableOrderColumnNumber = datatableOrder
    ? datatableOrder["column"]
    : 0;
  let datatableOrderDir = datatableOrder ? datatableOrder["dir"] : "asc";
  let sortingField = datatableColumns[datatableOrderColumnNumber]
    ? datatableColumns[datatableOrderColumnNumber].data
    : "_id";
  let sortCondition = {};
  sortCondition[sortingField] = datatableOrderDir == "asc" ? 1 : -1;
  conditions["sort_condition"] = sortCondition;

  /** Configuration of data table searching */
  let searching = req.body.search ? req.body.search : {};
  let searchCondition = {};
  if (Object.keys(searching).length > 0 && searching.value != "") {
    let searchingName = searching.value ? searching.value : "";
    let searchingRegex = searching.regex ? searching.regex : "";
    
    let searchingField =
      req.body.search && datatableColumns[searchingRegex]
        ? datatableColumns[searchingRegex].data
          ? datatableColumns[searchingRegex].data
          : datatableColumns[searchingRegex].name
        : "";
    let fieldType =
      req.body.search && datatableColumns[searchingRegex]
        ? datatableColumns[searchingRegex].data
          ? datatableColumns[searchingRegex].name
          : datatableColumns[searchingRegex].name
        : "";
    if (fieldType == "number") {
      searchCondition[searchingField] = Number(searchingName);
    } else {
      searchCondition[searchingField] = new RegExp(searchingName, "i");
    }

    conditions["search_condition"] = searchCondition;
  }
  conditions["search_condition"] = searchCondition;
  callback(conditions);
};

/** Function is used to upload a file
 * params options as file data
 * return json
 **/
moveUploadedFile = (options) => {
  return new Promise((resolve) => {
    let image = options.file ? options.file : {};
    
    let allowedExtensions =
      options && options.allowedExtensions
        ? options.allowedExtensions
        : IMAGE_EXTENSIONS;
    let allowedImageError =
      options && options.allowedImageError
        ? options.allowedImageError
        : IMAGE_EXTENSIONS_ERROR_MESSAGE;
    let allowedMimeTypes =
      options && options.allowedMimeTypes
        ? options.allowedMimeTypes
        : IMAGE_MIME_EXTENSIONS;
    let allowedMimeError =
      options && options.allowedMimeError
        ? options.allowedMimeError
        : IMAGE_MIME_EXTENSIONS_ERROR_MESSAGE;

    /** If no file */
    if (Object.keys(image).length == NOT) {
      
      return resolve({
        status: STATUS_SUCCESS,
        message: "",
        options: {},
      });
    }

    let filePath = options.file_path ? options.file_path : "";
    
    let fileName = image.name ? image.name : "";
    
    let extension = fileName ? fileName.split(".") : "";
    
    extension = extension.pop().toLowerCase();

    if (allowedExtensions.indexOf(extension) == -1) {
      
      resolve({
        status: STATUS_ERROR,
        message: allowedImageError,
        options: {},
      });
    } else {
      
      let newFileName = Date.now() + "-" + changeFileName(fileName);
      let uploadedFile = filePath + newFileName;
      image.mv(uploadedFile, (err) => {
        if (err) {
          let response = {
            status: STATUS_ERROR,
            new_file: image.name,
            message: "Something went wrong please try again later",
          };
          return resolve(response);
        } else {
          exec("file --mime-type -b " + uploadedFile, (err, out, code) => {
            
            if ( out && allowedMimeTypes.indexOf(out.trim()) == -1) {
              fs.unlink(filePath + newFileName, (err) => {
                if (err) {
                  resolve({
                    status: STATUS_ERROR,
                    message: "Something went wrong please try again later",
                    options: options,
                  });
                } else {
                  
                  resolve({
                    status: STATUS_ERROR,
                    message: allowedMimeError,
                    options: options,
                  });
                }
              });
            } else {
              let response = {
                status: STATUS_SUCCESS,
                new_file: newFileName,
                file_type: extension,
                message: "",
              };
              return resolve(response);
            }
          });
        }
      });
    }
  });
};

/**
 * Function for change file name
 *
 * @param fileName AS File Name
 *
 * @return filename
 */
changeFileName = (fileName) => {
  let fileData = fileName ? fileName.split(".") : [];
  let extension = fileData ? fileData.pop() : "";
  fileName = fileName.replace("." + extension, "");
  fileName = fileName.replace(RegExp("[^0-9a-zA-Z.]+", "g"), "");
  fileName = fileName.replace(".", "");
  return fileName + "." + extension;
}; //end changeFileName();

/** Function is used to append a file
 * params options as file data
 * return json
 **/
appendFile = (options) => {
  return new Promise((resolve) => { 
    let result = options.result ? options.result : [];
    let imagePath = options.path ? options.path : "";
    if (result && result.length > 0) {
      result.map((records, index) => {
        let image = records.image ? records.image : "";
        if (image) {
          result[index]["full_image_path"] = imagePath + records.image;
        } else {
          result[index]["full_image_path"] = NO_IMAGE_URL;
        }
      });

      let response = {
        status: STATUS_SUCCESS,
        result: result,
      };
      return resolve(response);
    }
  });
};

/** Function is used to get assigned unit list
 * params options as file data
 * return json
 **/
getAssignedUnits = (req, res, userPermissionId) => {
  return new Promise((resolve) => {
    const users = db.collection("users");
    users
      .aggregate([
        {
          $match: {
            is_active: ACTIVE,
            _id: ObjectId(req.session.user._id),
            is_deleted: NOT_DELETED,
          },
        },
        {
          $project: {
            items: {
              $filter: {
                input: "$assigned_units",
                as: "units",
                cond: { $eq: ["$$units.parent_id", INACTIVE] },
              },
            },
          },
        },
        { $unwind: "$items" },
        {
          $sort: {
            "items.order": SORT_ASC,
          },
        },

        {
          $lookup: {
            from: "units",
            let: { unitId: "$items._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$parent_id", "$$unitId"] },
                      { $eq: ["$is_active", ACTIVE] },
                      { $eq: ["$is_deleted", NOT_DELETED] },
                    ],
                  },
                },
              },
              {
                $sort: {
                  order: SORT_ASC,
                },
              },
            ],
            as: "unitDetail",
          },
        },
        {
          $group: {
            _id: "$_id",
            units: {
              $push: "$$ROOT",
            },
          },
        },
      ])
      .toArray((err, result) => {
        if (!err && result && result.length > 0) {
          let newResult = result[0]["units"].map((records, index) => {
            records.items["unitDetail"] = records.unitDetail;
            return records.items;
          });
          let response = {
            status: STATUS_SUCCESS,
            result: newResult,
            message: "",
          };
          return resolve(response);
        } else {
          res.redirect("/" + WEBSITE_ADMIN_NAME);
        }
      });
  });
};

/***
 * Get slug from data base
 */
convertInToSlug = (options) => {
  return new Promise((resolve) => {
    let title = options.title ? options.title : "";
    let collection = options.table_name ? options.table_name : "";
    let slugField = options.slug_field ? options.slug_field : "";

    if (title == "" || collection == "")
      return resolve({ slug: "", options: options });
    let collectionName = db.collection(String(collection));
    let changeTitleIntoSlug = slug(title).toLowerCase();

    let conditions = {};
    conditions[slugField] = { $regex: new RegExp(title, "i") };

    /** Get count from collection*/
    collectionName.countDocuments(conditions, (err, count) => {
      return resolve({
        slug:
          count > 0 ? changeTitleIntoSlug + "-" + count : changeTitleIntoSlug,
      });
    });
  });
};

/***
 * This function is used to generate a string
 * @ length as string length
 */
generateString = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/***
 * This function is used to generate a unique order id
 * @ length as string length
 */
generateOrderId = (length) => {
  return new Promise((resolve) => {
    let result = "";
    let characters = "0123456789";
    let charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    result = "NAS" + result;
    if (result) {
      const collection = db.collection("posted_loads");
      collection.countDocuments({ order_id: result }, (err, count) => {
        if (count > 0) {
          generateOrderId(length);
        } else {
          resolve(result);
        }
      });
    }
  });
};

/***
 * This function is used to generate a OTP
 * @ length as string length
 */
generateOTP = (length) => {
  var result = "";
  var characters = "0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * charactersLength)];
  }
  return result;
};

/** Sanitize form data */
sanitizeData = (data, notAllowedTags) => {
  let sanitized = destroyTags(data, notAllowedTags);
  return sanitized;
}; //End sanitizeData

/***
 * This function is used to destroy tags from form
 * @ data as from data
 * @ notAllowedTags as resticted tags
 */
destroyTags = (data, notAllowedTags) => {
  if (data.constructor === Object) {
    var result = {};
  } else {
    var result = [];
  }
  for (let key in data) {
    let value = data[key] != null ? data[key] : "";
    if (value.constructor === Array || value.constructor === Object) {
      result[key] = destroyTags(value, notAllowedTags);
    } else {
      result[key] = stripHtml(value.toString().trim(), notAllowedTags);
    }
  }
  return result;
}; //End destroyTags

/***
 * This function is used to strip tags from html
 * @ data as from data
 * @ notAllowedTags as resticted tags
 */
stripHtml = (data, notAllowedTags) => {
  for (let i = 0; i < notAllowedTags.length; i++) {
    data = data.replace(notAllowedTags[i], "");
  }
  return data;
}; //End destroyHtml

/**
 * function is used to clear regular expression string
 *
 * @param regex	As Regular expression
 *
 * @return regular expression
 */
cleanRegex = (regex) => {
  if (
    NOT_ALLOWED_CHARACTERS_FOR_REGEX &&
    NOT_ALLOWED_CHARACTERS_FOR_REGEX.length > 0
  ) {
    for (let i in NOT_ALLOWED_CHARACTERS_FOR_REGEX) {
      regex = regex
        .split(NOT_ALLOWED_CHARACTERS_FOR_REGEX[i])
        .join("\\" + NOT_ALLOWED_CHARACTERS_FOR_REGEX[i]);
    }
    return regex;
  } else {
    return regex;
  }
}; //end cleanRegex

/*** Get dropdown list */
getDropdownList = (options) => {
  return new Promise((resolve) => {
    let collectionName = options.collection_name ? options.collection_name : "";
    let searchCondition = options.search_condition
      ? options.search_condition
      : {};
    let getCondition = options.get_condition ? options.get_condition : {};
    let sort = options.sort ? options.sort : {};
    let skip = options.skip ? options.skip : NO_SKIP;
    let limit = options.limit ? options.limit : NO_LIMIT;
    let selected = options.selected ? options.selected : "";

    if (!collectionName) return resolve({});
    let html = "";
    let collection = db.collection(String(collectionName));
    collection
      .find(searchCondition, getCondition)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray((err, result) => {
        if (result && result.length > 0) {
          result.map((records) => {
            if(options.selectedType=="multiselect"){
              let multiSelected=selected.indexOf(String(records._id));
              
              let selectedOption =
              multiSelected!==-1 ? "selected" : "";
              
            html +=
              '<option value= "' +
              records._id +
              '" ' +
              selectedOption +
              ">" +
              records.name +
              "</option>";
            }else{
              let selectedOption =
              records._id == String(selected) ? "selected" : "";
            html +=
              '<option value= "' +
              records._id +
              '" ' +
              selectedOption +
              ">" +
              records.name +
              "</option>";
            }
            
          });
        }
        resolve({
          status: STATUS_SUCCESS,
          result: html,
          options: options,
        });
      });
  });
};
/*** Get dropdown list */
getDropdownNameList = (options) => {
  return new Promise((resolve) => {
    let collectionName = options.collection_name ? options.collection_name : "";
    let searchCondition = options.search_condition
      ? options.search_condition
      : {};
    let getCondition = options.get_condition ? options.get_condition : {};
    let sort = options.sort ? options.sort : {};
    let skip = options.skip ? options.skip : NO_SKIP;
    let limit = options.limit ? options.limit : NO_LIMIT;
    let selected = options.selected ? options.selected : "";

    if (!collectionName) return resolve({});
    let html = "";
    let collection = db.collection(String(collectionName));
    collection
      .find(searchCondition, getCondition)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray((err, result) => {
        if (result && result.length > 0) {
          result.map((records) => {
            let selectedOption =
              records._id == String(selected) ? "selected" : "";
            html +=
              '<option value= "' +
              records._id +
              '" ' +
              selectedOption +
              ">" +
              records.full_name +
              "</option>";
          });
        }
        resolve({
          status: STATUS_SUCCESS,
          result: html,
          options: options,
        });
      });
  });
};

/** User email and phone unique validation
 * @options table_name as collection name
 * @options field_value as search value
 * @options field_name as collection column name
 */
checkUniqueValue = (options) => {
  return new Promise((resolve) => {
    let collectionName = options.table_name ? options.table_name : "";
    let fieldValue = options.field_value ? options.field_value : "";
    let fieldName = options.field_name ? options.field_name : "";
    let oldId = options.old_id ? options.old_id : "";

    /** Invalid */
    if (!collectionName || !fieldValue || !fieldName)
      return resolve({ status: STATUS_ERROR, result: {} });

    /** Search condition */
    let searchCondition = { is_deleted: NOT_DELETED };
    if (oldId) searchCondition["_id"] = { $ne: ObjectId(oldId) };

    if (fieldName == USER_VERIFICATION_TYPE_EMAIL) {
      searchCondition["email"] = { $regex: new RegExp("^" + fieldValue, "i") };
    }
    if (fieldName == USER_VERIFICATION_TYPE_MOBILE) {
      searchCondition["mobile"] = fieldValue;
    }

    /** Search data in collection */
    let collection = db.collection(String(collectionName));
    collection.findOne(searchCondition, (err, result) => {
      if (!err && !result) {
        return resolve({
          status: STATUS_SUCCESS,
          result: result,
        });
      } else {
        return resolve({
          status: STATUS_ERROR,
          result: result,
        });
      }
    });
  });
};

sendEmail = (req, res, options) => {
  const emailSettings = require("./config/settings.json");
  console.log(emailSettings);
  try {
    let to = options && options.to ? options.to : "";
    let repArray = options && options.rep_array ? options.rep_array : "";
    let action = options && options.action ? options.action : "";
    let attachments = options && options.attachments ? options.attachments : "";
    let subject = options && options.subject ? options.subject : "";

    let userEmail = emailSettings["Email.user_email"];
    let emailHost = emailSettings["Email.host"];
    let emailPassword = emailSettings["Email.password"];
    let emailUserName = emailSettings["Email.user_name"];
    let emailPort = emailSettings["Email.port"];

    // let userEmail = res.locals.settings["Email.user_email"];
    // let emailHost = res.locals.settings["Email.host"];
    // let emailPassword = res.locals.settings["Email.password"];
    // let emailUserName = res.locals.settings["Email.user_name"];
    // let emailPort = res.locals.settings["Email.port"];

    const transporter = createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort == 465 ? true : false, // true for 465, false for other ports
      auth: {
        user: userEmail, // generated ethereal user
        pass: emailPassword, // generated ethereal password
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    const email_templates = db.collection("email_templates");
    const email_actions = db.collection("email_actions");

    /** Get Email template details **/
    email_templates.findOne(
      {
        action: action,
      },
      { projection: { _id: 1, name: 1, subject: 1, description: 1 } },
      (err, result) => {
        if (!err && result) {
          let emailTemplateResult = result;

          /** Get Email action details **/
          email_actions.findOne(
            {
              action: action,
            },
            { projection: { _id: 1, options: 1 } },
            (emailErr, emailResult) => {
              if (!emailErr && emailResult) {
                let actionData = emailResult;
                let actionOptions = actionData.options.toString().split(",");
                let body = emailTemplateResult.description;
                subject = subject ? subject : emailTemplateResult.subject;

                actionOptions.forEach((value, key) => {
                  body = body.replace(
                    RegExp("{" + value + "}", "g"),
                    repArray[key]
                  );
                });

                /** get email layout **/
                renderFile(
                  WEBSITE_LAYOUT_PATHS + "email.html",
                  // { settings: res.locals.settings },
                  { settings: emailSettings },
                  "",
                  (err, html) => {
                    html = html.replace(RegExp("{{MESSAGE_BODY}}", "g"), body);
                    let mailOptions = {
                      from: emailUserName,
                      to: to,
                      subject: subject,
                      html: html
                    };
                    /** Send  attachment **/
                    if (attachments) {
                      mailOptions["attachments"] = {
                        path: attachments,
                      };
                    }

                    /**Send email*/
                    transporter.sendMail(mailOptions, (error, info) => {
                      /** Save email logs details **/
                      const email_logs = db.collection("email_logs");
                      mailOptions.is_sent = error ? false : true;
                      mailOptions.error = error;
                      mailOptions.created = getUtcDate();
                      email_logs.insertOne(mailOptions);

                      if (error) {
                        console.error("error");
                        return console.error(error);
                      }
                    });
                  }
                );
              } else {
                return console.log("Error in email action");
              }
            }
          );
        } else {
          return console.log("Error in email template");
        }
      }
    );
  } catch (e) {
    console.log("email error in sendMail function");
    console.log(e);
  }
};

/**
 * Function to get date in any format with utc format
 *
 * @return date string
 */
getUtcDate = (date, format) => {
  if (date) {
    var now = date;
  } else {
    var now = new Date();
  }
  //let changedDate = 	now.setTimezone("UTC");
  if (format) {
    return now;
    //  dateFormat(now, format);
  } else {
    return now;
  }
}; //end getUtcDate();

/**
 * Function to send sms
 *
 * @return JSON
 */
sendSMS = (req, res, options) => {
  return new Promise((resolve) => {
    let mobileNumber =
      options && options.mobile_number ? options.mobile_number : "";
    let msgBody = options && options.sms_template ? options.sms_template : "";

    let apiUrl = res.locals.settings["Advanta.url"];
    let apiKey = res.locals.settings["Advanta.apikey"];
    let partnerId = res.locals.settings["Advanta.partner_id"];
    let shortcode = res.locals.settings["Advanta.shortcode"];

    // Use the service
    const smsOptions = {
      apikey: apiKey,
      partnerID: partnerId,
      message: msgBody,
      shortcode: shortcode,
      mobile: mobileNumber,
    };

    /** Save sms logs data **/
    let saveData = {};
    saveData["user_id"] = options.user_id ? ObjectId(options.user_id) : "";
    saveData["mobile_number"] = mobileNumber;
    saveData["message"] = msgBody;
    saveData["created"] = getUtcDate();

    /** Send message and capture the response or error */
    axios({
      url: apiUrl,
      method: "post",
      data: smsOptions,
    })
      .then((response) => {
        /********** Save sms logs ************/
        saveData["response"] = response.data ? response.data : {};

        saveSmsLogs(saveData);
        /********** Save sms logs ************/

        /** Send success response **/
        resolve({
          status: STATUS_SUCCESS,
          message: response,
        });
      })
      .catch((error) => {
        if (error) {
          /********** Save sms logs ************/
          saveData["response"] = error;

          saveSmsLogs(saveData);
          /********** Save sms logs ************/

          /** Send error response **/
          return resolve({
            status: STATUS_ERROR,
            message: error,
          });
        }
      });
  });
};

/**
 * Function to save sms logs
 *
 * @param options As	Data object
 *
 * @return null
 */
saveSmsLogs = (options) => {
  /** Save sms logs **/
  const sms_logs = db.collection("sms_logs");
  sms_logs.insertOne(options, (err, result) => {});
  return;
}; //End saveSmsLogs();

/** Generate JWT */
generateJWT = (data) => {
  let jwt = require("jsonwebtoken");
  let token = jwt.sign(data, JWT_CONFIG.private_key, {
    expiresIn: JWT_CONFIG.expire_time,
  });
  return token;
}; //End generateJWT

/** get user detail
 * slug as user slug
 */
getProfileDetail = (searchCondition, getCondition) => {
  return new Promise((resolve) => {
    let collection = db.collection("users");
    collection.findOne(
      searchCondition,
      { projection: getCondition },
      (err, result) => {
        if (!err && result && Object.keys(result).length > 0) {
          let options = {
            path: USER_FILE_URL,
            result: [result],
          };
          appendFile(options).then((response) => {
            let resultUser = response.result ? response.result[0] : {};
            resultUser["user_file_url"] = USER_FILE_URL;
            let collectionMaster = db.collection("masters");
            collectionMaster.findOne(
              { _id: ObjectId(resultUser.country_id) },
              { projection: { name: 1 } },
              (masterErr, masterResult) => {
                resultUser["country_name"] =
                  masterResult &&
                  Object.keys(masterResult).length > NOT &&
                  masterResult.name
                    ? masterResult.name
                    : "";
                return resolve({
                  status: STATUS_SUCCESS,
                  result: resultUser,
                });
              }
            );
          });
        } else {
          return resolve({
            status: STATUS_ERROR,
            result: result,
          });
        }
      }
    );
  });
};

/**
 * Function to get master list
 * @param options  	As 	data as json format
 * @return json
 */
getMasterList = (req, res, next, options) => {
  return new Promise((resolve) => {
    try {
      if (
        !options ||
        !options.type ||
        options.type.constructor !== Array ||
        options.type.length <= 0
      ) {
        /** Send error response **/
        return resolve({
          status: STATUS_ERROR,
          message: res.__(
            "admin.system.something_going_wrong_please_try_again"
          ),
        });
      }

      let masterConditions = {
        is_active: ACTIVE,
        key: { $in: options["type"] },
      };
      if (options.parent_id)
        masterConditions["parent_id"] = ObjectId(options.parent_id);

      /** Get master List **/
      const masters = db.collection("masters");
      masters
        .aggregate([
          { $match: masterConditions },
          { $sort: { name: SORT_ASC } },
          {
            $group: {
              _id: "$key",
              data: {
                $push: {
                  value: "$_id",
                  label: "$name",
                  slug: "$slug",
                  image: "$image",
                },
              },
            },
          },
        ])
        .toArray((err, result) => {
          if (err)
            return resolve({
              status: STATUS_ERROR,
              message: res.__(
                "admin.system.something_going_wrong_please_try_again"
              ),
            });

          let finalResult = {};
          if (result && result.length > NOT) {
            result.map((item, index) => {
              let masterType = item._id ? item._id : "";
              let masterData = item.data ? item.data : [];

              if (masterType && masterType == "vehicle") {
                /** Append vehicle image */
                let options = { path: VEHICLE_FILE_URL, result: masterData };
                appendFile(options).then((response) => {
                  finalResult[masterType] = response.result
                    ? response.result
                    : [];
                });
              } else {
                finalResult[masterType] = masterData;
              }
            });
          }

          /** Send success response **/
          resolve({
            status: STATUS_SUCCESS,
            result: finalResult,
          });
        });
    } catch (e) {
      /** Send error response **/
      resolve({
        status: STATUS_ERROR,
        message: res.__("admin.system.something_going_wrong_please_try_again"),
      });
    }
  }).catch(next);
}; // end getMasterList()

/**
 *  Function to insert notification
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
insertNotifications = (req, res, options) => {
  return new Promise((resolve) => {
    let notificationData = options["notification_data"]
      ? options["notification_data"]
      : "";
    let notificationType = notificationData["notification_type"]
      ? notificationData["notification_type"]
      : "";
    let createdBy = notificationData["user_id"]
      ? notificationData["user_id"]
      : req.session.user._id
      ? req.session.user._id
      : "";
    let notificationMessage = notificationData["notification_message"]
      ? notificationData["notification_message"]
      : "";
    let notificationTitle = NOTIFICATION_MESSAGES[notificationType]["title"];

    notificationMessage = notificationData["message"]
      ? notificationData["message"]
      : "";

    let saveNotificationData = {
      user_id: ObjectId(createdBy),
      title: notificationTitle,
      message: notificationMessage,
      extra_parameters: notificationData["extra_parameters"]
        ? notificationData["extra_parameters"]
        : {},
      notification_type: notificationType,
      is_seen: NOT_SEEN,
      is_read: NOT_READ,
      created: getUtcDate(),
      modified: getUtcDate(),
    };

    /** Set save notification options **/
    var saveOptions = {
      user_ids: [createdBy],
      notification_data: saveNotificationData,
      notification_type: notificationType,
    };

    /** Save notification data **/
    saveNotifications(req, res, saveOptions).then((saveDataStatus) => {
      let resolveResponse = {
        status: saveDataStatus.status,
        user_list: saveDataStatus.user_list ? saveDataStatus.user_list : [],
        message: saveDataStatus.message ? saveDataStatus.message : "",
      };
      resolve(resolveResponse);
    });
  });
}; // end insertNotification()

/**
 *  Function to save notifications
 *
 * @param req 			As Request Data
 * @param res 			As Response Data
 * @param options		As options
 *
 * @return array
 */
saveNotifications = (req, res, options) => {
  return new Promise((resolve) => {
    let userIds = options && options.user_ids ? options.user_ids : [];
    let notificationType =
      options && options.notification_type ? options.notification_type : "";

    if (userIds.length > 0 && notificationType) {
      let saveNotificationData =
        options && options.notification_data ? options.notification_data : [];

      /** Set insertable data **/
      let notificationsList = userIds.map((records) => {
        let tempNotificationData = clone(saveNotificationData);
        tempNotificationData["user_id"] = ObjectId(records);
        return tempNotificationData;
      });

      /** Insert in notification table **/
      const notifications = db.collection("notifications");
      notifications.insertMany(
        notificationsList,
        { forceServerObjectId: true },
        (notificationErr, notificationResult) => {
          if (!notificationErr) {
            /** Send push notification**/
            notificationsList.map((notificationUserId) => {
              let socketRequestData = {
                room_id: String(notificationUserId["user_id"]),
                emit_function: "notification_received",
                message: saveNotificationData["message"],
              };
              socketRequest(req, res, socketRequestData);
            });

            /** Set insertable data **/
            let resolveResponse = {
              status: STATUS_SUCCESS,
              user_list: notificationsList,
            };
            resolve(resolveResponse);
          } else {
            let resolveResponse = {
              status: STATUS_ERROR,
              user_list: [],
              message: res.__(
                "admin.system.something_going_wrong_please_try_again"
              ),
            };
            resolve(resolveResponse);
          }
        }
      );
    } else {
      /** Send error response **/
      let resolveResponse = {
        status: STATUS_ERROR,
        user_list: [],
        message: res.__("admin.users.no_user_selected"),
      };
      resolve(resolveResponse);
    }
  });
}; // end saveNotifications()

/**
 * Function for socket request from any where
 *
 * @param req		As Request Data
 * @param res		As Response Data
 * @param options	As options
 *
 * @return null
 */
socketRequest = (req, res, options) => {
  if (SOCKET_ENABLE) {
    if (
      typeof options.room_id !== typeof undefined &&
      typeof options.emit_function !== typeof undefined
    ) {
      clientSideSocket.emit("socketRequest", options);
    } else {
      return res.__("system.missing_parameters");
    }
  }
}; //end socketRequest()

/**
 * Function to export data
 * options as export data
 *
 * @return array
 */
exportData = (req, res, options) => {
  let fileName = options.file_name ? options.file_name : new Date();
  let exportType = options.export_type ? options.export_type : "";
  let tempData = options.result ? options.result : [];

  return new Promise((resolve) => {
    /** Convert data into xlsx */
    if (exportType == "xlsx") {
      let XLSX = require("xlsx");
      let ws = XLSX.utils.json_to_sheet(tempData);
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SheetJS");

      let ext = "csv";
      let fullExt = ".csv";
      res.setHeader(
        "Content-Disposition",
        "attachment; filename= " + fileName + fullExt + ""
      );
      res.end(XLSX.write(wb, { type: "buffer", bookType: ext }));
    }

    /** Convert data into pdf */
    if (exportType == "pdf") {
      let fs = require("fs");
      let html = fs.readFileSync(__dirname + "/pdf/user.html", "utf8");
      html = html.replace("{TABLE_DATA}", tempData);

      const htmlToPdf = require("html-pdf");
      let options = {
        format: "A4",
        header: {
          height: "25mm",
          contents:
            '<div style="text-align: center;">' + WEBSITE_TITLE + "</div>",
        },
        orientation: "landscape",
      };
      let filePath = __dirname + "/pdf/"; //file path
      htmlToPdf
        .create(html, options)
        .toFile(filePath + fileName + ".pdf", function (err, result) {
          let newFileName = fileName + ".pdf"; // file name
          res.download(filePath + newFileName, fileName);
        });
    }
  });
};

/**
 * Function to get data base slug
 *
 * @param tableName AS Table Name
 * @param title AS Title
 * @param slugField AS Slug Field Name in database
 *
 * @return string
 */
getDatabaseSlug = (options) => {
  return new Promise((resolve) => {
    let tableName = options && options.table_name ? options.table_name : "";
    let title = options && options.title ? options.title : "";
    let slugField = options && options.slug_field ? options.slug_field : "";

    if (title == "" || tableName == "")
      return resolve({ title: "", options: options });

    let convertTitleIntoSlug = slug(title).toLowerCase();
    let collectionName = db.collection(String(tableName));

    /* Set conditions */
    let conditions = {};
    conditions[slugField] = { $regex: new RegExp(convertTitleIntoSlug, "i") };

    /* Get count from table */
    collectionName.countDocuments(conditions, (err, count) => {
      /* Send response */
      resolve({
        title:
          count > 0 ? convertTitleIntoSlug + "-" + count : convertTitleIntoSlug,
      });
    });
  });
}; //end getDatabaseSlug();

/**
 * Function to generate a random sting
 *
 * @param req As Request Data
 * @param res As Response Data
 * @param options As options
 *
 * @return string
 */
getRandomString = (req, res, options) => {
  return new Promise((resolve) => {
    let srtingLength =
      options && options.srting_length
        ? parseInt(options.srting_length)
        : DEFAULT_RANDOM_NUMBER_LENGTH;

    /**Generate random string **/
    let unique = generate({
      length: srtingLength,
      charset: "alphanumeric",
      capitalization: "uppercase",
    });
    return resolve({
      status: STATUS_SUCCESS,
      result: unique,
    });
  });
}; //End getRandomString()

/**
 * Function to get difference in two dates in seconds
 *
 * @param startDate AS start date
 * @param endDate AS end date
 *
 * @return difference between two days in seconds
 */
getDifferenceBetweenTwoDates = function (startDate, endDate) {
  // startDate 	= new Date(startDate);
  endDate = endDate ? new Date(endDate) : new Date();
  var timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
  var diffInSeconds = Math.ceil(timeDiff / 1000);
  // var diffInDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  return diffInSeconds;
}; //end getDifferenceBetweenTwoDates();

/* convert id string array to objectid array
* objectIdStringArray as array of string id
* returns array
*/
getObjectIdArray=(objectIdStringArray)=>{
  if(objectIdStringArray.length>NOT){
    let ObjectIdArray=[];
      objectIdStringArray.forEach((objectIdString,index)=>{
        ObjectIdArray.push(ObjectId(objectIdString));
      });
      return ObjectIdArray;
  }else{
    return [];
  }
}/* end getObjectIdArray */ 

/* convert id string to objectid
* objectIdString as string of object id
* returns object
*/
getSingleObjectId=(objectIdString)=>{
  if(objectIdString.length>NOT) {
    return ObjectId(objectIdString)
  }
  else {
    return {};
  }
}/* end getSingleObjectId */ 

/** This function is used to convert _ and - fron string*/
_string=(string)=>{
  let newString=string.replace("_"," ").replace("-"," ");
  newString=newString.split(" ");
  newString=newString.map((item)=>{
    return item[0].toUpperCase()+item.slice(1);
  }).toString().replace(","," ");
  return newString;
}/* end _string */ 
