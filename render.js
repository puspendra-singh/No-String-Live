module.exports = function (req, res, next) {
  res.oldRender = res.render;
  res.render = function (view, options) {
    if (req.rendering) {
      if (req.rendering.views) {
        view = req.rendering.views + "/" + view;
      }
      if (req.rendering.layout) {
        if (!options || options == "undefined") {
          options = {};
        }
        options["layout"] = req.rendering.layout;
      }
    }
    this.oldRender(view, options, function (err, html) {
      if (err) throw err;
      res.send(html);
    });
  };
  next();
};
