const async = require('async');
const path = require('path');
const bcrypt = require('bcryptjs');
const { body } = require("express-validator");
const { ObjectId } = require('mongodb');
const { getSocket }   = require('../../../../config/socket_chat');
const { validationResult } = require('express-validator');
function Users(req, res) {
  /** Function is used to user login**/
  this.userLogin = async (req, res) => {
   
    let username = req.body.username ? req.body.username : '';
    let password = req.body.password ? req.body.password : '';

    let collection = db.collection('users');
    collection.findOne(
      { email: { $regex: new RegExp('^' + username, 'i') } },
      { email: 1, password: 1 ,full_name: 1},
      (err, result) => {
        console.log(err, "res.__('admin.system.something_went_wrong_please_try_again_later')");
        if (!err) {
          if (result) {
            bcrypt.compare(password, result.password, (err, isMatch) => {
              if (isMatch) {
                req.flash(
                  STATUS_SUCCESS,
                  res.__('admin.user.you_have_successfully_login')
                );

                /** Session set */
                req.session.user = result;
                  
                res.send({
                  status: STATUS_SUCCESS,
                  message: '',
                  result: result,
                  rediect_url: WEBSITE_ADMIN_URL + 'dashboard',
                });
              } else {
                res.send({
                  message: [
                    {
                      param: 'password',
                      msg: res.__(
                        'admin.user.username_password_does_not_matched'
                      ),
                    },
                  ],
                  result: '',
                  rediect_url: '/',
                });
              }
            });
          } else {
            res.send({
              message: [
                {
                  param: 'password',
                  msg: res.__('admin.user.username_password_does_not_matched'),
                },
              ],
              result: '',
              rediect_url: '/',
            });
          }
        } else {
          req.flash(
            STATUS_ERROR,
            res.__('admin.system.something_went_wrong_please_try_again_later')
          );
          res.send({
            status: STATUS_ERROR,
            message: res.__('admin.system.something_went_wrong_please_try_again_later'),
            result: '',
            rediect_url: '/admin/login',
          });
        }
      }
    );
  };

  /** Function is used to send forgot password link**/
  this.forgotPassword = (req, res, next) => {
    /** Check email exist or not */
    var email = req.body.email ? req.body.email : '';
    var collection = db.collection('users');
    collection.findOne(
      {
        email: { $regex: new RegExp('^' + email, 'i') },
        role_id: ROLE_ID_ADMIN,
      },
      { projection: { email: 1, full_name: 1 } },
      (err, result) => {
        if (!err) {
          if (result) {
            /** set validate string */
            let validateString = generateString(VALIDATE_STRING_ROUND);
            let validateUrl =
              WEBSITE_ADMIN_URL + 'reset_password/' + validateString;

            const users = db.collection('users');
            users.updateOne(
              { email: { $regex: new RegExp('^' + email, 'i') } },
              {
                $set: {
                  validate_string: validateString,
                  modified: new Date(),
                },
              },
              async (error, resultUpdate) => {
                if (!error) {
                  /** Send email */
                  let emailOptions = {
                    action: 'forgot_password',
                    to: email,
                    rep_array: [result.full_name, validateUrl, validateUrl],
                  };
                  sendEmail(req, res, emailOptions);

                  res.send({
                    status: STATUS_SUCCESS,
                    message: '',
                    rediect_url: '/admin/confirm-mail',
                  });
                } else {
                  req.flash(
                    STATUS_ERROR,
                    res.__(
                      'admin.system.something_went_wrong_please_try_again_later'
                    )
                  );
                  res.send({
                    status: STATUS_ERROR,
                    message: '',
                    rediect_url: '/admin/forgot_password',
                  });
                }
              }
            );
          } else {
            res.send({
              // status: STATUS_ERROR,
              message: [
                {
                  param: 'email',
                  msg: res.__('admin.user.email_does_not_exist'),
                },
              ],
              result: '',
              rediect_url: '/',
            });
          }
        } else {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.system.something_went_wrong')
          );
          res.send({
            status: STATUS_ERROR,
            message: '',
            result: '',
            rediect_url: '/',
          });
        }
      }
    );
  };

  /** Function is used to resend link **/
  this.resendLink = async (req, res, next) => {
    let email = req.params.email ? req.params.email : '';

    /** set validate string */
    let validateString = generateString(VALIDATE_STRING_ROUND);
    let validateUrl = WEBSITE_ADMIN_URL + 'reset_password/' + validateString;

    const users = db.collection('users');
    users.updateOne(
      { email: email },
      {
        $set: {
          validate_string: validateString,
          modified: new Date(),
        },
      },
      async function (error, result) {
        if (!error) {
          /*** Start user detail */
          let searchCondition = { email: email };
          let getCondition = { full_name: 1 };
          let userDetail = await getProfileDetail(
            searchCondition,
            getCondition
          );
          let userResult = userDetail.result ? userDetail.result : {};

          /** Send email */
          let emailOptions = {
            action: 'forgot_password',
            to: email,
            rep_array: [userResult.full_name, validateUrl, validateUrl],
          };
          await sendEmail(req, res, emailOptions);

          req.flash(
            STATUS_SUCCESS,
            res.__(
              'admin.user.we_have_sent_you_an_email_with_instructions_to_reset_your_password'
            )
          );
          res.redirect(WEBSITE_ADMIN_URL + 'confirm-mail');
        } else {
          req.flash(
            STATUS_ERROR,
            res.__('admin.system.something_went_wrong_please_try_again_later')
          );
          res.redirect(WEBSITE_ADMIN_URL + 'confirm-mail');
        }
      }
    );
  };

  /** Function is used to reset password **/
  this.resetPassword = async (req, res, next) => {
    const { password, confirm_password } = req.body;
    if (isPost(req)) {
      req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS);
      
      await body("password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("admin.user.please_enter_password"))
        .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH})
        .withMessage(res.__("admin.user.password_should_be_6_characters_long"))
        // .matches(PASSWORD_ALPHANUMERIC_REGEX)
        // .withMessage(res.__("admin.user.password.it_should_be_alphanumeric"))
        .run(req);
      await body("confirm_password")
        .trim()
        .not()
        .isEmpty()
        .withMessage(res.__("admin.user.please_enter_confirm_password"))
        .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH})
        .withMessage(res.__("admin.user.password_should_be_6_characters_long"))
        // .matches(PASSWORD_ALPHANUMERIC_REGEX)
        // .withMessage(res.__("admin.user.password.it_should_be_alphanumeric"))
        .run(req);
      await body("confirm_password")
      .custom((value)=>{
        return value === req.body.password;
      })
      .withMessage('Confirm password does not matched with password')
      .run(req);
      /** Matche password with confirm password */
      
      let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
      // if (password !== confirm_password) {
      //   errors.push()
      // }
      let encryptedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
      if (errors.length === 0) {
        let validateString = req.params.validate_string
          ? req.params.validate_string
          : '';

        let collection = db.collection('users');
        collection.findOne(
          { validate_string: validateString, role_id: ROLE_ID_ADMIN },
          { projection: { email: 1 } },
          (err, result) => {
            if (!err) {
              if (result) {
                /** set validate string */
                const users = db.collection('users');
                users.updateOne(
                  { email: result.email },
                  {
                    $set: {
                      password: encryptedPassword,
                      validate_string: '',
                      modified: new Date(),
                    },
                  },
                  (error, result) => {
                    if (!error) {
                      req.flash(
                        STATUS_SUCCESS,
                        res.__(
                          'admin.user.password_has_been_changed_successfully'
                        )
                      );
                      res.send({
                        status: STATUS_SUCCESS,
                        message: '',
                        rediect_url: '/admin/login',
                      });
                    } else {
                      req.flash(
                        STATUS_ERROR,
                        res.__(
                          'admin.system.something_went_wrong_please_try_again_later'
                        )
                      );
                      res.send({
                        status: STATUS_ERROR,
                        message: '',
                        rediect_url: '/admin/forgot_password',
                      });
                    }
                  }
                );
              } else {
                req.flash(
                  STATUS_SUCCESS,
                  res.__('admin.user.link_has_been_expired')
                );
                res.send({
                  status: STATUS_ERROR,
                  message: '',
                  result: '',
                  rediect_url: '/',
                });
              }
            } else {
              req.flash(
                STATUS_SUCCESS,
                res.__('admin.system.something_went_wrong')
              );
              res.send({
                status: STATUS_ERROR,
                message: '',
                result: '',
                rediect_url: '/',
              });
            }
          }
        );
      } else {
        res.send({
          // status: STATUS_ERROR,
          message: errors,
          result: '',
          rediect_url: '',
        });
      }
    } else {
      let validateString = req.params.validate_string
        ? req.params.validate_string
        : '';
      let collection = db.collection('users');
      collection.findOne(
        { validate_string: validateString, role_id: ROLE_ID_ADMIN },
        { projection: { email: 1 } },
        function (err, result) {
          if (!err && result) {
            if (result) {
              res.render('reset-password');
            } else {
              req.flash(
                STATUS_ERROR,
                res.__('admin.user.link_has_been_expired')
              );

              req.flash(
                STATUS_ERROR,
                res.__('admin.user.link_has_been_expired')
              );
              res.redirect(WEBSITE_ADMIN_URL + 'login');
            }
          }
        }
      );
    }
  };

  /** Function to get dashboard detail **/
  this.dashboard = (req, res, next) => {
    let newDate = new Date();
    let currentYear = newDate.getFullYear();
    const monthArray = [
      '',
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    let collection = db.collection('users');
    let productsCollection = db.collection('products');
    async.parallel(
      {
        totalUserCount: (callback) => {
          collection.countDocuments(
            { is_deleted: NOT_DELETED ,_id:{$ne:ObjectId(res.locals.auth._id)}, document_verfication: VERIFIED},
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        verifiedDealerCount: (callback) => {
          collection.countDocuments(
            { user_type: ACTIVE, is_deleted: NOT_DELETED, document_verfication: VERIFIED},
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        privateSellerCount: (callback) => {
          collection.countDocuments(
            { user_type: DEACTIVE, is_deleted: NOT_DELETED, document_verfication: VERIFIED },
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        totalProductCount: (callback) => {
          productsCollection.countDocuments(
            { is_deleted: NOT_DELETED,is_approved: APPROVED },
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        totalOrdersCount: (callback) => {
          let ordersCollection = db.collection('orders');
          ordersCollection.countDocuments(
            { is_deleted: NOT_DELETED },
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        soldOrdersCount: (callback) => {
          let ordersCollection = db.collection('orders');
          ordersCollection.countDocuments(
            { is_deleted: NOT_DELETED, order_status: {$in:[API_ORDER_DELIVERED,API_ORDER_RATED]}},
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        requestedOrdersCount: (callback) => {
          let ordersCollection = db.collection('orders');
          ordersCollection.countDocuments(
            { is_deleted: NOT_DELETED, order_status: API_ORDER_REQUESTED},
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        verifiedDealerProductCount: (callback) => {
          productsCollection.aggregate([
            {$match:{ is_deleted: NOT_DELETED }},
            {
              $lookup: {
                from: 'users',
                let: { userId: '$user' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$_id', '$$userId'] }],
                      },
                    },
                  },
                  { $project: { _id: 1, user_type: 1 } },
                ],
                as: 'verifiedDealerProductCountDetails',
              },
            },
            {
              $project: {
                user_type: { '$arrayElemAt': ['$verifiedDealerProductCountDetails.user_type', 0] },
              }
            },
            {$match:{user_type:ACTIVE}}
          ]).toArray((error,result)=>{
            callback(null,result.length);
          })
        },
        privateSellerProductCount: (callback) => {
          productsCollection.aggregate([
            {$match:{ is_deleted: NOT_DELETED }},
            {
              $lookup: {
                from: 'users',
                let: { userId: '$user' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$_id', '$$userId'] }],
                      },
                    },
                  },
                  { $project: { _id: 1, user_type: 1 } },
                ],
                as: 'verifiedDealerProductCountDetails',
              },
            },
            {
              $project: {
                user_type: { '$arrayElemAt': ['$verifiedDealerProductCountDetails.user_type', 0] },
              }
            },
            {$match:{user_type:DEACTIVE}}
          ]).toArray((error,result)=>{
            callback(null,result.length);
          })
        },
        months: (callback) => {
          collection
            .aggregate([
              {
                $match: {
                  is_deleted: NOT_DELETED,
                },
              },
              {
                $project: {
                  month: { $month: '$created' },
                  year: { $year: '$created' },
                },
              },
              {
                $match: {
                  year: currentYear,
                },
              },
              {
                $group: {
                  _id: { month: '$month', year: '$year' },
                  count: { $sum: 1 },
                },
              },
            ])
            .sort({ '_id.month': -1 })
            .toArray((err, result) => {
              let usersFormatedData = [];
              let userData = result ? result : [];
              if (userData.length > 0) {
                userData.map((records) => {
                  usersFormatedData.push(monthArray[records._id.month]);
                });
              }
              callback(err, usersFormatedData);
            });
        },
        monthYearWiseUsers: (callback) => {
          collection
            .aggregate([
              {
                $match: {
                  is_deleted: NOT_DELETED,
                },
              },
              {
                $project: {
                  month: { $month: '$created' },
                  year: { $year: '$created' },
                },
              },
              {
                $match: {
                  year: currentYear,
                },
              },
              {
                $group: {
                  _id: { month: '$month', year: '$year' },
                  count: { $sum: 1 },
                },
              },
            ])
            .sort({ '_id.month': -1 })
            .toArray((err, result) => {
              let objectData = {
                label: 'Users',
                backgroundColor: 'rgba(7, 207, 41, 0.71)',
                borderColor: 'rgba(6, 172, 34, 0.96)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(7, 207, 41, 0.71)',
                hoverBorderColor: 'rgba(6, 172, 34, 0.96)',
              };
              let formatedData = [];
              let data = result ? result : [];
              if (data.length > 0) {
                data.map((records) => {
                  formatedData.push(records.count ? records.count : 0);
                });
              }
              objectData['data'] = formatedData;
              callback(err, objectData);
            });
        },
        totalReviewCount: (callback) => {
          let ordersCollection = db.collection('ratings');
          ordersCollection.countDocuments(
            { is_deleted: NOT_DELETED,is_active:ACTIVE},
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
        fiveStartReviewCount: (callback) => {
          let ordersCollection = db.collection('ratings');
          ordersCollection.countDocuments(
            { is_deleted: NOT_DELETED,rating:5},
            {},
            (err, result) => {
              callback(err, result);
            }
          );
        },
      },
      (err, response) => {
        if (err) return next(err);
        var result = {
          status: STATUS_SUCCESS,
          totalUserCount: response.totalUserCount ? response.totalUserCount : NOT,
          totalProductCount: response.totalProductCount ? response.totalProductCount : NOT,
          verifiedDealerCount: response.verifiedDealerCount ? response.verifiedDealerCount : NOT,
          privateSellerCount: response.privateSellerCount ? response.privateSellerCount : NOT,
          privateSellerProductCount: response.privateSellerProductCount ? response.privateSellerProductCount : NOT,
          verifiedDealerProductCount: response.verifiedDealerProductCount ? response.verifiedDealerProductCount : NOT,
          requestedOrdersCount: response.requestedOrdersCount ? response.requestedOrdersCount : NOT,
          soldOrdersCount: response.soldOrdersCount ? response.soldOrdersCount : NOT,
          totalOrdersCount: response.totalOrdersCount ? response.totalOrdersCount : NOT,
          totalReviewCount: response.totalReviewCount ? response.totalReviewCount : NOT,
          fiveStartReviewCount: response.fiveStartReviewCount ? response.fiveStartReviewCount : NOT,
          monthYearWiseData: {
            type: 'bar',
            data: {
              labels: response.months ? response.months : [],
              datasets: [response.monthYearWiseUsers],
            },
            options: {
              hover: {
                mode: 'label',
              },
              responsive: !0,
              legend: {
                position: 'top',
              },
              scales: {
                xAxes: [{ ticks: { beginAtZero: !0 } }],
                yAxes: [{ ticks: { beginAtZero: !0 } }],
              },
            },
          },
        };

        res.render('index', {
          result: result,
        });
      }
    );
  }; //End dashboard

  /** Function to get city list **/
  this.getCityList = async (req, res, next) => {
    let countryId = req.body.country_id ? req.body.country_id : '';
    let stateId = req.body.state_id ? req.body.state_id : '';
    let countryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'city',
        country: ObjectId(countryId),
        state: ObjectId(stateId),
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let cityList = await getDropdownList(countryOptions);
    res.send(cityList.result);
  }; //End getCityList

  /** Function to get state list **/
  this.getStateList = async (req, res, next) => {
    let countryId = req.body.country_id ? req.body.country_id : '';

    let countryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'state',
        country: ObjectId(countryId),
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let stateList = await getDropdownList(countryOptions);
    res.send(stateList.result);
  }; //End getStateList

  /** Function is used to user logout**/
  this.userLogout = function (req, res) {
    req.session = null;
    res.redirect('/admin');
  };

  /** Function to get country list **/
  this.getCountryList = async (req, res, next) => {
    let countryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'country',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
    };
    let countryList = await getDropdownList(countryOptions);
    res.send(countryList.result);
  }; //End getCountryList

  /** Function to edit user detail
   * @ params id as user id
   * **/
  this.editAdminDetail = function (req, res) {
    let userId = req.params.id ? req.params.id : '';
    if (isPost(req)) {
      req.body = sanitizeData(req.body, NOT_ALLOWED_TAGS);

      
      /*** To be changed password **/
      let password = req.body.password ? req.body.password : '';
      let confirmPassword = req.body.confirm_password
        ? req.body.confirm_password
        : '';

      /*** Mobile validation */
      let mobile = req.body.mobile ? req.body.mobile.trim(' ') : '';
        
        if (req.files) {
          let file = req.files ? req.files.image : {};
          if (Object.keys(file).length == 0) {
            res.send({
              status: STATUS_ERROR,
              errors: [
                {
                  param : 'image',
                  msg: res.__('admin.user.please_select_an_image'),
                },
              ],
            });
          } else {
            let options = {
              file: file,
              file_path: USER_FILE_PATH,
            };
            moveUploadedFile(options).then((response) => {
              if (response.status == STATUS_ERROR) {
                return res.send({
                  status: STATUS_ERROR,
                  errors: [{ param: 'image', msg: response.message }],
                });
              } else {
                var newFileName = response.new_file ? response.new_file : '';
                updateAdminProfile(req, res, newFileName);
              }
            });
          }
        } else {
          let oldImage = req.body.old_image ? req.body.old_image : '';
          updateAdminProfile(req, res, oldImage);
        }

    } else {
      var collection = db.collection('users');
      collection.findOne({ _id: ObjectId(userId) }, (errUser, resultUser) => {
        if (!errUser) {
          let options = {
            path: USER_FILE_URL,
            result: [resultUser],
          };
          appendFile(options).then((response) => {
            if (response.status == STATUS_ERROR) {
              req.flash(
                STATUS_ERROR,
                res.__('admin.system.something_went_wrong')
              );
              res.redirect(WEBSITE_ADMIN_URL + 'users/edit_profile/' + userId);
            } else {
              let result = response.result ? response.result[0] : {};
              req.breadcrumbs(BREADCRUMBS['admin/users/edit_profile']);
              res.render('edit_profile', {
                result: result,
                message: '',
              });
            }
          });
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'dashboard');
        }
      });
    }
  }; //End editUserDetail

  /** Function is used to update user */
  function updateAdminProfile(req, res, fileName) {
    let userId = req.params.id ? req.params.id : '';
    let firstName = req.body.first_name ? req.body.first_name : '';
    let lastName = req.body.last_name ? req.body.last_name : '';
    let mobile = req.body.mobile ? req.body.mobile : '';
    let countryCode = req.body.country_code ? req.body.country_code : '';
    let dialCode = req.body.dial_code ? req.body.dial_code : '';
    let address = req.body.address ? req.body.address : '';
    let password = req.body.password ? req.body.password : '';
    let fullName = firstName + ' ' + lastName;
    let encryptedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);

    /** Update user data **/
    let updateData = {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      mobile: mobile,
      country_code: countryCode,
      dial_code: dialCode,
      address: address,
      image: fileName,
      modified: new Date(),
    };

    /** Update password **/
    if (password) {
      updateData['password'] = encryptedPassword;
    }

    const users = db.collection('users');
    users.updateOne(
      { _id: ObjectId(userId) },
      { $set: updateData },
      (error, result) => {
        if (!error) {
          /** Session set */
          req.session.user['image'] = fileName;
          req.session.user['full_name'] = fullName;

          req.flash(
            STATUS_SUCCESS,
            res.__('admin.user.user_has_been_updated_successfully')
          );
          res.send({
            status: STATUS_SUCCESS,
            message: res.__('admin.user.user_has_been_updated_successfully'),
            rediect_url: '/admin/users/edit_profile/' + userId,
          });
        } else {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.system.something_went_wrong_please_try_again_later')
          );
          res.send({
            status: STATUS_ERROR,
            message: res.__(
              'admin.system.something_went_wrong_please_try_again_later'
            ),
            rediect_url: '/admin/users/edit_profile/' + userId,
          });
        }
      }
    );
  } // End updateUser



  /** Function to get user list **/
  this.getUserList = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip = req.body.start ? parseInt(req.body.start) : DEFAULT_SKIP;
      let draw = req.body.draw ? parseInt(req.body.draw) : DEFAULT_SKIP;
      let statusSearch = req.body.statusSearch ? req.body.statusSearch : '';

    
      let commonCondition = {
        is_deleted: NOT_DELETED,
        role_id : ROLE_ID_USER,
      };

      dataTableConfig(req, res, null, function (configDataTable) {
        configDataTable.search_condition = Object.assign(
          configDataTable.search_condition,
          commonCondition
        );

        if (statusSearch) {
          configDataTable.search_condition['is_active'] = Number(statusSearch);
        }

        const collection = db.collection('users');
        async.parallel(
          {
            userList: (callback) => {
              collection
                .aggregate([
                  { $match: configDataTable.search_condition },
                  { $sort: configDataTable.sort_condition },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $project: {
                      full_name: 1,
                      created: 1,
                      phone: 1,
                      is_active: 1,
                      user_type: 1
                    },
                  },
                ])
                .toArray((errUser, resultUser) => {
                  callback(errUser, resultUser);
                });
            },
            recordsTotol: (callback) => {
              collection.countDocuments(commonCondition, {}, (err, result) => {
                callback(err, result);
              });
            },
            recordsfiltered: (callback) => {
              collection.countDocuments(
                configDataTable.search_condition,
                {},
                (err, result) => {
                  callback(err, result);
                }
              );
            },
          },
          (err, response) => {
            /** Send error message*/
            if (err) return next(err);
            
            return res.send({
              status: STATUS_SUCCESS,
              draw: draw,
              data: response.userList ? response.userList : [],
              recordsTotal: response.recordsTotol ? response.recordsTotol : 0,
              recordsFiltered: response.recordsfiltered
                ? response.recordsfiltered
                : 0,
            });
          }
        );
      });
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/users/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End userList

  /**
   * function is used to add user
   * @param {Request Data} req 
   * @param {Response Data} res 
   * @param {callback} next 
   * @returns render/json
   */
  this.addUser = async (req, res, next) => {
    req.body            = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    let fullName        = req.body.full_name ? req.body.full_name : '';
    let phone           = req.body.phone ? req.body.phone : '';
    let dialCode        = req.body.dial_code ? req.body.dial_code : '';
    let countryCode     = req.body.country_code ? req.body.country_code : '';
    let password        = req.body.password ? req.body.password : '';
    let encryptPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
    
    /** Slug options */
    let slugOptions = {
      table_name: 'users',
      title: fullName,
      slug_field: 'full_name',
    };
    let slugData = await convertInToSlug(slugOptions);

    var insertData = {
      full_name: fullName,
      slug: slugData.slug,
      phone: {
        countryCode: countryCode,
        dialCode: dialCode,
        e164Number: phone,
        internationalNumber: phone,
        nationalNumber: phone,
        number: phone,
      },
      password: encryptPassword,
      email_verified: VERIFIED,
      user_type: USER_BUYER,
      role_id : ROLE_ID_USER,
      otp: '',
      check_otp_expire: "",
      is_active: ACTIVE,
      is_approved: DEACTIVE,
      is_profile_step: DEACTIVE,
      is_profile_updated: DEACTIVE,
      is_deleted: NOT_DELETED,
      created: new Date(),
      last_seen:getUtcDate(),
      is_notification_on: ACTIVE,
      check_link_expire: '',
      email_link_expired: '',
      acceptTerms: true,
      email_validate_string: '', 
    };

    if (req.files) {
      let profilePicture = req.files && req.files.image ? req.files.image : {};
      if (req.files.image && Object.keys(profilePicture).length == NOT) {
        return res.send({
          status: STATUS_ERROR,
          message: [
            {
              param: 'image',
              msg: res.__('admin.user.please_select_an_image'),
            },
          ],
        });
      } else {
        let profileImage = {};

        /** Upload profile file */
        let optionsProfile = {
          file: profilePicture,
          file_path: USER_FILE_PATH,
        };
        profileImage = await moveUploadedFile(optionsProfile);
        if (profileImage.status == STATUS_ERROR) {
          return res.send({
            status: STATUS_ERROR,
            message: [{ param: 'image', msg: profileImage.message }],
          });
        } else {
          let newFileName = profileImage.new_file ? profileImage.new_file : '';
          if (req.files.image) insertData['image'] = newFileName;
        }

        if (Object.keys(profileImage).length > NOT) {
          insertUser(req, res, insertData);
        }
      }
    } else {
      insertUser(req, res, insertData);
    }
    // } else {
    //   return res.send({
    //     status: STATUS_ERROR,
    //     message: errors,
    //     rediect_url: "/users",
    //   });
    // }
    // } else {
  };

  /** Function is used to insert user */
  insertUser = (req, res, insertData) => {
    const users = db.collection('users');
    users.insert(insertData, (error, result) => {
      if (!error) {
        req.flash(
          STATUS_SUCCESS,
          res.__('admin.users.user_has_been_added_successfully')
        );
        return res.send({
          status: STATUS_SUCCESS,
          message: '',
          rediect_url: WEBSITE_ADMIN_URL + 'users',
        });
      } else {
        req.flash(STATUS_SUCCESS, res.__('admin.system.something_went_wrong'));
        return res.send({
          status: STATUS_ERROR,
          message: '',
          rediect_url: WEBSITE_ADMIN_URL + 'users',
        });
      }
    });
  }; // End insertUser

  /** Function to view user detail **/
  this.viewUserDetail = function (req, res) {
    let userId = req.params.id ? req.params.id : '';
    let searchCondition = {_id : ObjectId(userId)};
    let getCondition    = {full_name : 1, phone : 1, image : 1, user_type:1, is_active:1}
    getProfileDetail(searchCondition, getCondition).then(response=>{
      if(response.status == STATUS_SUCCESS){
        req.breadcrumbs(BREADCRUMBS['admin/users/view']);
          res.render('view', {
            result: response.result
            }); 
      }else{
        req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
        res.redirect(WEBSITE_ADMIN_URL + 'users');
      }
    });
  }; //End viewUserDetail

  /**
   * 
   * @param {Request Data} req 
   * @param {Response Data} res 
   * @param {callback} next 
   * @returns render/json
   */
  this.editUser  = async (req, res, next) => {
    let userId           = req.params.id ? req.params.id : ObjectId();
    if(isPost(req)){
      req.body             = sanitizeData(req.body, NOT_ALLOWED_TAGS);
      let fullName         = req.body.full_name ? req.body.full_name : '';
      let phone            = req.body.phone ? req.body.phone : '';
      let dialCode         = req.body.dial_code ? req.body.dial_code : '';
      let countryCode      = req.body.country_code ? req.body.country_code : '';
      let password         = req.body.password ? req.body.password : '';

      let updateData = {
        full_name: fullName,
        phone: {
          countryCode: countryCode,
          dialCode: dialCode,
          e164Number: phone,
          internationalNumber: phone,
          nationalNumber: phone,
          number: phone,
        },
        modified: new Date(),
      };

      if(password){
        const encryptPassword  = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
        updateData['password'] = encryptPassword;
      }
    

      if (req.files) {
        let profilePicture = req.files && req.files.image ? req.files.image : {};
        if (req.files.image && Object.keys(profilePicture).length == NOT) {
          return res.send({
            status: STATUS_ERROR,
            message: [
              {
                param: 'image',
                msg: res.__('admin.user.please_select_an_image'),
              },
            ],
          });
        } else {
          let profileImage = {};

          /** Upload profile file */
          let optionsProfile = {
            file : profilePicture,
            file_path: USER_FILE_PATH,
          };
          profileImage = await moveUploadedFile(optionsProfile);
          if (profileImage.status == STATUS_ERROR) {
            return res.send({
              status: STATUS_ERROR,
              message: [{ param: 'image', msg: profileImage.message }],
            });
          } else {
            var newFileName = profileImage.new_file ? profileImage.new_file : '';
            if (req.files.image) updateData['image'] = newFileName;
          }
          if (Object.keys(profileImage).length > NOT) {
            updateUser(req, res, updateData);
          }
        }
      } else {
        updateUser(req, res, updateData);
      }
    }else{
      
      let searchCondition = {_id : ObjectId(userId)};
      let getCondition    = {full_name : 1, phone : 1, image : 1, user_type:1}
      getProfileDetail(searchCondition, getCondition).then(response=>{
        if(response.status == STATUS_SUCCESS){
          req.breadcrumbs(BREADCRUMBS['admin/users/edit']);
            res.render('edit', {
              result: response.result
              }); 
        }else{
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'users');
        }
      })
    }
  }; //End editUserDetail

  /**
   * Function is used to update user detail
   */
  updateUser = (req, res, updateData) => {
    let userId = req.params.id ? req.params.id : '';
    const users = db.collection('users');
    users.updateOne(
      { _id: ObjectId(userId) },
      { $set: updateData },
      (error, result) => {
        if (!error) {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.user.user_has_been_updated_successfully')
          );
          return res.send({
            status: STATUS_SUCCESS,
            message: '',
            rediect_url: WEBSITE_ADMIN_URL + 'users',
          });
        } else {
          req.flash(STATUS_SUCCESS,res.__('admin.system.something_went_wrong_please_try_again_later'));
          return res.send({
            status: STATUS_ERROR,
            message: '',
            rediect_url: WEBSITE_ADMIN_URL + 'users',
          });
        }
      }
    );
  }; // End updateCustomer


  /** Function to delete user detail **/
  this.deleteUserDetail = (req, res) => {
    var userId = req.params.id ? req.params.id : '';
    const users = db.collection('users');
    users.deleteOne({ _id: ObjectId(userId) }, (errUser, resultUser) => {
        if (!errUser) {
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.user.user_has_been_deleted_successfully')
          );
          res.redirect(WEBSITE_ADMIN_URL + 'users');
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'users');
        }
      }
    );
  }; //End deleteUserDetail

  /** Function to update user status **/
  this.updateUserStatus = (req, res) => {
    var userId = req.params.id ? req.params.id : '';
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const users = db.collection('users');
    users.updateOne(
      { _id: ObjectId(userId) },
      {
        $set: {
          is_active: status,
          modified: new Date(),
        },
      },
      (errUser, resultUser) => {
        if (!errUser) {
          if(status == INACTIVE){
            let socket = getSocket();
            console.log(socket)
            console.log('user deactivated')
            socket.broadcast.emit('user_deactivated',{user_id:userId,message:req.__("admin.system.user_deactivated")});
          }
          req.flash(
            STATUS_SUCCESS,
            res.__('admin.user.status_has_been_updated_successfully')
          );
          res.redirect(WEBSITE_ADMIN_URL + 'users');
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'users');
        }
      }
    );
  }; //End updateUserStatus

  /** Function to verify user email or phone **/
  this.verifyUser = (req, res) => {
    var userId = req.params.id ? req.params.id : '';
    var status = req.params.status ? req.params.status : '';
    let updateData = { modified: new Date() };
    let message = '';
    if (status && status == 'email') {
      updateData['email_verified'] = VERIFIED;
      updateData['validate_string'] = '';
      message = res.__('admin.user.email_has_been_verified_successfully');
    }

    if (status && status == 'phone') {
      updateData['mobile_verified'] = VERIFIED;
      updateData['validate_string'] = '';
      message = res.__('admin.user.phone_has_been_verified_successfully');
    }
    const users = db.collection('users');
    users.updateOne(
      { _id: ObjectId(userId) },
      { $set: updateData },
      (errUser, resultUser) => {
        if (!errUser) {
          req.flash(STATUS_SUCCESS, message);
          res.redirect(WEBSITE_ADMIN_URL + 'customers');
        } else {
          req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
          res.redirect(WEBSITE_ADMIN_URL + 'customers');
        }
      }
    );
  }; //End verifyUser

  /** this function is used to approve user */
  this.approveUser = (req,res)=>{
    const status  =  req.params.status ? Number(req.params.status) : "";
    const userId  =  req.params.userId ? req.params.userId : "";
    if(status && userId){
      const users = db.collection('users');
      users.findOneAndUpdate(
        { _id: ObjectId(userId) },
        { $set: {document_verfication:status,modified:getUtcDate()} },
        (errUser, resultUser) => {
          if (!errUser) {
            let fullName = resultUser.value.full_name;
            let email = resultUser.value.email;
            let action = status==VERIFIED?"document_verification_approved":"document_verification_rejected";
            let websiteLink = status==VERIFIED? WEBSITE_FRONT_URL : path.join(WEBSITE_FRONT_URL,'signup?step=3&email='+email);
            let subject = "Document Verification.";
            let emailOptions = {
              to: email,
              rep_array: [fullName, websiteLink],
              action: action,
              subject: subject,
            };
            /** Send Email */
            sendEmail(req, res, emailOptions);
            req.flash(STATUS_SUCCESS, res.__('admin.user.user_has_been_updated_successfully'));
            return res.redirect(WEBSITE_ADMIN_URL + 'users');
          } else {
            req.flash(STATUS_ERROR, res.__('admin.system.something_went_wrong'));
            return res.redirect(WEBSITE_ADMIN_URL + 'users');
          }
        }
      );
    }
  }/** End approveUser */
}
module.exports = new Users();
