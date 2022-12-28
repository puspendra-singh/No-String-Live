var modulePath = __dirname + "/model/order";
var modelPath = "/admin/orders";
var { body, check, validationResult } = require("express-validator");

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to render order listing view **/
app.get(modelPath, isUserLogedIn, async (req, res, next) => {
  var orders = require(modulePath);
  orders.getOdersList(req, res, next);
});
/** Routing is used to get orders listing **/
app.post(modelPath, isUserLogedIn, async (req, res, next) => {
  var orders = require(modulePath);
  orders.postOrdersList(req, res, next);
});

/** Routing is used to view  user detail**/
app.get(modelPath + "/view/:id", isUserLogedIn, (req, res) => {
  var orders = require(modulePath);
  orders.viewOrderDetails(req, res);
});