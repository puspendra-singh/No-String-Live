const async = require('async');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { validationResult } = require('express-validator');
function Notification(req, res) {

  /** This function is used to get all orders list */
  // this.getOdersList = (req,res,next)=>{
  //   req.breadcrumbs(BREADCRUMBS['admin/orders']);
  //   res.render('list', {
  //     breadcrumbs: req.breadcrumbs(),
  //   });
  // }/** end getOdersList */
  
  this.getNotifications=(req,res)=>{
    const loadMore  = 1;
    const limit  = (loadMore * NOTIFICATION_LIMIT);
    if(loadMore && limit >= NOTIFICATION_LIMIT){
      const collection  = db.collection('notifications');
      let searchCondition = {
        role : ROLE_ID_ADMIN,
        is_deleted : NOT_DELETED
      }
      let sortCondition = {
        created : SORT_DESC
      }
      let skipAndLimit = [
        {
          $skip : NOT
        },
        {
          $limit : limit
        },
      ]

      async.parallel({
        data: (callback) => {
          collection.aggregate([
            {
              $match : searchCondition
            },
            {
              $sort : sortCondition
            },
            ...skipAndLimit
          ]).toArray((error,result)=>{
            if(!error && result){
              callback(error,result);
            }
          })
        },
        recordsTotal: (callback) => {
            collection.countDocuments(searchCondition, {}, (err, result) => {
            callback(err, result);
          });
        },
        unreadNotifications: (callback) => {
          collection.countDocuments({
            ...searchCondition,
            is_read : NOT_READ
          }, {}, (err, result) => {
          callback(err, result);
        });
      },
      },
      (error,result)=>{
        if(!error){
          res.send(result)
        }
      });
    }
  }
  this.readNotification=(req,res)=>{
    const notificaitonId = req.body._id ? ObjectId(req.body._id) : "";
    if(notificaitonId){
      const searchCondition = {
        _id : notificaitonId,
      };
      const updateData = {
        is_read : READ
      };
      const colletion = db.collection('notifications');
      colletion.updateOne(
        searchCondition,
        {
          $set : updateData
        },
        (error,result)=>{
          if(!error){
            return res.send({
              status: STATUS_SUCCESS,
              message: ''
            });
          }
        }
      );
    }else{
      req.flash(
          STATUS_SUCCESS,
          res.__('admin.system.invalid_request')
        );
        return res.send({
          status: STATUS_ERROR,
          message: res.__('admin.system.invalid_request'),
        });
    }
  }

  this.getAllNotifications=(req,res)=>{
  const loadMore  = req.params.load_more  ? Number(req.params.load_more)  : "";
  const limit  = (loadMore * NOTIFICATION_LIMIT);

  if(loadMore && limit >= NOTIFICATION_LIMIT){
    const collection  = db.collection('notifications');
    let searchCondition = {
      role : ROLE_ID_ADMIN,
      is_deleted : NOT_DELETED
    }
    let sortCondition = {
      created : SORT_DESC
    }
    let skipAndLimit = [
      {
        $skip : NOT
      },
      {
        $limit : limit
      },
    ]

    async.parallel({
      data: (callback) => {
        collection.aggregate([
          {
            $match : searchCondition
          },
          {
            $sort : sortCondition
          },
          ...skipAndLimit
        ]).toArray((error,result)=>{
          if(!error && result){
            callback(error,result);
          }
        })
      },
      recordsTotal: (callback) => {
          collection.countDocuments(searchCondition, {}, (err, result) => {
          callback(err, result);
        });
      },
      unreadNotifications: (callback) => {
        collection.countDocuments({
          ...searchCondition,
          is_read : NOT_READ
        }, {limit:limit}, (err, result) => {
        callback(err, result);
      });
    },
    },
    (error,result)=>{
      if(!error){
        req.breadcrumbs(BREADCRUMBS['admin/notification']);
        res.render('list', {
          breadcrumbs: req.breadcrumbs(),
          result:result
        });
      }
    });
  }else {
      req.flash(
        STATUS_SUCCESS,
        res.__('admin.system.invalid_request')
      );
      return res.send({
        status: STATUS_ERROR,
        message: '',
        rediect_url: WEBSITE_ADMIN_URL + 'dashboard',
      });
    }
  }
}
module.exports = new Notification();
