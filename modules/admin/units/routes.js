var modulePath = __dirname + "/model/units";
var modelPath = "/admin/units";
const { body, validationResult } = require('express-validator');

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get unit listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  let units = require(modulePath);
  units.unitList(req, res);
});

/** Routing is used to add unit **/

app.get(modelPath + "/add", isUserLogedIn,
  (req, res) => {
    let units = require(modulePath);
    units.getAddUnit(req, res);
});

app.post(modelPath + "/add", isUserLogedIn, 
  async (req, res) => {
    await body('unit_name')
      .not()
      .isEmpty()
      .withMessage(res.__("admin.units.please_enter_unit_name"))
      .run(req);
    await body('path')
      .not()
      .isEmpty()
      .withMessage(res.__("admin.units.please_enter_path"))
      .run(req);
    await body(res.__('group_path'))
      .not()
      .isEmpty()
      .withMessage(res.__("admin.units.please_enter_group_path"))
      .run(req);
    await body('order')
      .not()
      .isEmpty()
      .withMessage(res.__("admin.units.please_enter_order"))
      .run(req);

    let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
    if (errors.length !== 0){
      res.send({
        status: STATUS_ERROR,
        message: errors,
      });
    }else{
      let units = require(modulePath);
      units.postAddUnit(req, res);
    }
});

/** Routing is used to edit unit detail**/

app.get(modelPath + "/edit/:id", isUserLogedIn, function (req, res) {
  let units = require(modulePath);
  units.getEditUnitDetail(req, res);
});

app.post(modelPath + "/edit/:id", isUserLogedIn, async (req, res) => {
  await body('unit_name').not().isEmpty().withMessage(res.__('admin.units.please_enter_unit_name')),
  await body('path').not().isEmpty().withMessage(res.__('admin.units.please_enter_path')),
  await body('group_path').not().isEmpty().withMessage(res.__('admin.units.please_enter_group_path')),
  await body('order').not().isEmpty().withMessage(res.__('admin.units.please_enter_order'));

  let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
  if (errors.length !== 0){
    res.send({
      status: STATUS_ERROR,
      message: errors,
      rediect_url: "/units",
    });
  }
  let units = require(modulePath);
  units.postEditUnitDetail(req, res);
});

/** Routing is used to delete unit **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  let units = require(modulePath);
  units.deleteUnit(req, res);
});

/** Routing is used to update  unit status**/

app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, function (
  req,
  res
) {
  var units = require(modulePath);
  units.updateUnitStatus(req, res);
});
