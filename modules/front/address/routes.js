const { ObjectId } = require("bson");
const { body }     = require("express-validator");
const modelPath    = __dirname + "/model/address";
const address      = require(modelPath);

routes.post(API_URL + "countries", async (req, res, next) => {
  address.getCountriesList(req, res, next);
});

routes.post(API_URL + "states", async (req, res, next) => {
  address.getStatesList(req, res, next);
});

routes.post(API_URL + "cities", async (req, res, next) => {
  address.getCitiesList(req, res, next);
});