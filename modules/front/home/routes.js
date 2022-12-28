const { body } = require("express-validator");

/** Model file path for current plugin **/
const modelPath = __dirname + "/model/home";
const home = require(modelPath);

/** Routing is used to get slider data **/
routes.post(API_URL + "slider", (req, res, next) => {
  const visibility = req.body.visibility ? Number(req.body.visibility) : "";
  if(visibility){
    home.getSlider(req, res, next);
  }else{
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
});

/** Routing is used to get cms list **/
routes.post(API_URL + "cms", (req, res, next) => {
  home.getCms(req, res, next);
});

/** Routing is used to get faqs **/
routes.post(API_URL + "faqs", (req, res, next) => {
  home.getFaqs(req, res, next);
});

/** Routing is used to get contant us **/
routes.post(API_URL + "contactUs", async (req, res, next) => {
  
    await body("name")
      .trim()
      .not()
      .isEmpty()
      .withMessage('front.user_name_is_required')
      .isLength({ min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT })
      .withMessage("front.name.limit.name_should_contain_between_2_to_50_characters")
      .matches(NAME_REGEX)
      .withMessage("front.user.name.should_be_valid")
      .run(req);

    await body("email")
      .trim()
      .not()
      .isEmpty()
      .withMessage('front.user.email_is_required')
      .isEmail()
      .withMessage("system.email.this_value_should_be_valid")
      .normalizeEmail()
      .run(req);

    await body("description")
      .trim()
      .not()
      .isEmpty()
      .withMessage('front.user.description_is_required')
      .isLength({ min: MIN_CHARACTER_DESCRIPTION_LIMIT, max: MAX_CHARACTER_DESCRIPTION_LIMIT })
      .withMessage("front.description.limit.description_should_contain_between_2_to_20000_characters")
      .matches(DESCRIPTION_REGEX)
      .withMessage("front.user.description_should_be_valid")
      .run(req);
      
  
    home.contactUs(req, res, next);
  }
);

routes.post(API_URL + "our_team", (req, res, next) => {
    home.getOurTeam(req, res, next);
  }
);

/** Routing is used to get faqs **/
routes.post(API_URL + "social_sites", (req, res, next) => {
  home.getSocialSites(req, res, next);
});
/** Routing is used to get all testimonials */
routes.get(API_URL + "testimonials", (req, res, next) => {
  home.getTestimonials(req, res, next);
});