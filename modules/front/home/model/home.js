const asyncParallel = require("async/parallel");
const asyncForEachOf = require("async/forEachOf");
const { ObjectId } = require("mongodb");
const { validationResult } = require("express-validator");
function Home(req, res) {
  /** Function is to Get Slider data **/
  this.getSlider = (req, res) => {
    const visibility = req.body.visibility ? Number(req.body.visibility) : "";
    const sliders = db.collection("sliders");
    sliders
      .find({
        visibility: visibility,
        is_active: ACTIVE,
        is_deleted: NOT_DELETED
      })
      .toArray((err, result) => {
        if (err) {
          return res.send({
            status: API_STATUS_ERROR,
            result: [],
            message: "",
          });
        } else {
          let options = {
            path: SLIDER_FILE_URL,
            result: result,
          };
          if (result && result.length > 0) {
            appendFile(options).then((response) => {
              let fileResult = response.result ? response.result : [];
              return res.send({
                status: API_STATUS_SUCCESS,
                result: fileResult,
                message: "",
              });
            });
          }
        }
      });
  };

  /** Function is to get cms data*/
  this.getCms = (req, res) => {
    let slug = req.body && req.body.slug ? req.body.slug : "";
    if (!slug)
      return res.send({
        status: API_STATUS_ERROR,
        result: {},
        message: res.__("front.system.data_missing"),
      });
    const cms = db.collection("cms");
    cms.findOne(
      {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        slug: slug,
      },
      (err, result) => {
        if (!err) {
          return res.send({
            status: API_STATUS_SUCCESS,
            result: result ? result : {},
            message: "",
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            result: {},
            message: res.__("front.system.something_went_wrong"),
          });
        }
      }
    );
  };

  /** Function is to get faqs data*/
  this.getFaqs = (req, res, next) => {
    const type =req.body.type?ObjectId(req.body.type):'';
    const faqs = db.collection("faqs");
    faqs
      .find({
        category:type,is_active: ACTIVE, is_deleted: NOT_DELETED
      })
      .toArray((err, result) => {
        if (!err) {
          return res.send({
            status: API_STATUS_SUCCESS,
            result: result ? result : {},
            message: "",
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            result: {},
            message: res.__("front.system.something_went_wrong"),
          });
        }
      });
  };

  /** Function is used to save contact us detail**/
  this.contactUs = (req, res) => {
    let name = req.body.name ? req.body.name : "";
    let email = req.body.email ? req.body.email : "";
    let description = req.body.description ? req.body.description : "";

    let insertData = {
      name: name,
      email: email,
      description: description,
      created: getUtcDate(),
    };

    const errors = uniqueValidations(validationResult(req).errors);
    if (errors.length === 0) {
      const ContactUs = db.collection("contact_us");
      ContactUs.insertOne(insertData, (err, result) => {
        if (!err) {
          let data = result;
          return res.send({
            status: API_STATUS_SUCCESS,
            result: {},
            message: res.__("front.user.thanks_for_contacting_us."),
          });
        } else {
          return res.send({
            status: API_STATUS_ERROR,
            result: {},
            message: res.__("front.system.something_went_wrong"),
          });
        }
      });
    } else {
      res.send({
        status: API_STATUS_ERROR,
        error: errors,
        result: "",
        message: "",
      });
    }
  };

  /** Function is to get our team*/
  this.getOurTeam = (req, res, next) => {
    const sliders = db.collection("our_team");
    sliders.find({ is_active: ACTIVE, is_deleted : NOT_DELETED}) .toArray((err, result) => {
        if (err) {
          return res.send({
            status: API_STATUS_ERROR,
            result: [],
            message: "",
          });
        } else {
          let options = {
            path: TEAM_FILE_URL,
            result: result,
          };
          if (result && result.length > 0) {
            appendFile(options).then((response) => {
              let fileResult = response.result ? response.result : [];
              return res.send({
                status: API_STATUS_SUCCESS,
                result: fileResult,
                message: "",
              });
            });
          }
        }
      });
  };

  this.getSocialSites = (req, res, next) => {
    const type = req.body.type? req.body.type : "";
    const settings = db.collection("settings");
    settings.find({type: type}).toArray((err, result) => {
        if (!err && result.length !== NOT) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_settings_successfully"),
            result: result,
          });
        } 
        else {
          return res.send({
            status: API_STATUS_ERROR,
            result: [],
            message: err,
        });
              
        }
      })
  }
  this.getTestimonials=(req, res, next)=>{
    const testimonials = db.collection("testimonials");
    testimonials.find({is_active:ACTIVE,is_deleted:NOT_DELETED}).toArray((err, result) => {
        if (!err && result.length !== NOT) {
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_settings_successfully"),
            result: result,
          });
        } 
        else {  
          return res.send({
            status: API_STATUS_ERROR,
            result: [],
            message: err,
        });
              
        }
      })
  }
  
}
module.exports = new Home();
