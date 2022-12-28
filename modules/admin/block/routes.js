var modulePath = __dirname + "/model/block";
var modelPath = "/admin/block";

app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

/** Routing is used to get listing **/

app.all(modelPath, isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.list(req, res);
});

/** Routing is used to add  **/

app.all(modelPath + "/add", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.add(req, res);
});

/** Routing is used to view detail**/

app.get(modelPath + "/view/:id", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.view(req, res);
});

/** Routing is used to edit detail**/

app.all(modelPath + "/edit/:id", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.edit(req, res);
});

/** Routing is used to delete  **/

app.all(modelPath + "/delete/:id", isUserLogedIn, function (req, res) {
  var block = require(modulePath);
  block.deleteDetail(req, res);
});

/** Routing is used to update status**/

app.all(modelPath + "/update_status/:id/:status", isUserLogedIn, function (req,res) {
  var block = require(modulePath);
  block.updateStatus(req, res);
});
