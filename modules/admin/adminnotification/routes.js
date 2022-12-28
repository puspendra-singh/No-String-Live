var modulePath = __dirname + "/model/notification";
var modelPath = "/admin/notification";
var { body, check, validationResult } = require("express-validator");

var notifications = require(modulePath);
app.use(modelPath, (req, res, next) => {
  req.rendering.views = __dirname + "/views";
  next();
});

app.post(modelPath, isUserLogedIn,function (req, res) {
  notifications.getNotifications(req, res);
});
app.post(modelPath+"/read", isUserLogedIn,function (req, res) {
  notifications.readNotification(req, res);
}); 

app.get(modelPath+'/:load_more', isUserLogedIn,function (req, res) {
  notifications.getAllNotifications(req, res);
});
