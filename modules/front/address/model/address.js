const { body } = require("express-validator");

function Address (req, res, next){
  /* get countries list from database*/
  this.getCountriesList = (req, res, next) => {
    let collection = db.collection("masters");
    collection.find({key: 'country', is_active: ACTIVE}, { projection: {name: 1}}).sort({'name': 1}).toArray(async (err, result) => {
      if(!err && result){
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_country_list_successfully"),
          result: result,
          error: [],
        });
      }else{
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
      })
    }
    })
  }

  this.getStatesList = (req, res, next) => {
    /* get states list from database*/
    let collection = db.collection("masters");
    const countryId = req.body.countryId ? req.body.countryId : '';
    if(countryId){
      collection.find({ country: ObjectId(countryId), key: 'state', is_active: ACTIVE}, {projection: {name: 1}}).sort({'name': 1}).toArray(async (err, result) => {
        if(!err && result){
          return res.send({
            status: API_STATUS_SUCCESS,
            message: res.__("front.user.fetched_state_list_successfully"),
            result: result,
            error: [],
          });
        }else{
          return res.send({
            status: API_STATUS_ERROR,
            message: res.__("front.user.something_went_wrong"),
            result: {},
            error: [],
        })
      }
      });
    }else{
      return res.send({
        status: API_STATUS_ERROR,
        message: res.__("front.user.invalid_request"),
        result: {},
        error: [],
      });
    }
  }


  this.getCitiesList = (req, res, next) => {
    /* get cities list from database*/
    let collection = db.collection("masters");
    const countryId = req.body.countryId ? req.body.countryId : '';
    const stateId = req.body.stateId ? req.body.stateId : '';
    collection.find({ state: ObjectId(stateId), country: ObjectId(countryId), key: 'city', is_active: ACTIVE}, {projection: {name: 1}}).sort({'name': 1}).toArray(async (err, result) => {
      if(!err && result){
        return res.send({
          status: API_STATUS_SUCCESS,
          message: res.__("front.user.fetched_city_list_successfully"),
          result: result,
          error: [],
        });
      }else{
        return res.send({
          status: API_STATUS_ERROR,
          message: res.__("front.user.something_went_wrong"),
          result: {},
          error: [],
      })
    }
    })
  }
}


module.exports = new Address();