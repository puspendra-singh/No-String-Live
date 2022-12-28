const async  = 	require("async");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
function User(req, res) {

  /** Function is used to user login **/
  this.login = async(req, res)=> {
    let email        = (req.body.email) ? req.body.email : '';
    let password        = (req.body.password) ? req.body.password : '';
    let identifier      = (req.body.device_token) ? req.body.device_token : '';
    let osType          = (req.body.os_type)  ? req.body.os_type : '';
    let searchCondition = { is_deleted : NOT_DELETED};


    /** login as not exist */
    if(!identifier) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    /** Check body */
    req.checkBody({	
      "email" :{
        isEmail	:{
          errorMessage:res.__("front.user.please_enter_a_valid_email")
        },
        notEmpty		:true,
        errorMessage	:res.__("front.user.please_enter_your_email_or_mobile")
      },
      "password" :{
        notEmpty		:true,
        errorMessage	:res.__("front.user.please_enter_password")
      },
    });

    searchCondition['email']    = { $regex: new RegExp("^" + email, "i") };

    let errors  = uniqueValidations(req.validationErrors());
    errors      = (errors && errors.length>0) ? errors :  [];

    if(errors.length == NOT || !errors){

      /** Search data in collection */
      let collection = db.collection(String('users'));
      collection.findOne(searchCondition, async (err, result)=>{
        let userDetail = (result && Object.keys(result).length > NOT) ? result :{};
        if(err) return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("front.user.something_went_wrong_please_try_again_later"),
          result    : {},
          error		  :	[],
        });

        if(Object.keys(userDetail).length == NOT){
          return res.send({
            status		:	API_STATUS_ERROR,
            message		:	res.__("front.user.login.user_does_not_exist"),
            result    : {},
            error		  :	[],
          });
        }

        /** Compare password */
        const bcrypt = require("bcryptjs");
        bcrypt.compare(password, result.password, async (err, isMatch) => {
          if(result && Object.keys(result).length > NOT && isMatch){
            let response= {
              status          : API_STATUS_SUCCESS,
              status_code     : API_STATUS_CODE_OK,
              message         : res.__("front.user.login.successfully_login"),
              result          : {},
              token           : '',
              error		        :	[],
            };
            
            if(result.is_active == INACTIVE) {
              response['status']		=	API_STATUS_ERROR; 
              response['status']		=	API_STATUS_ERROR;
              response['message']   = res.__("front.user.login.account_deactivate_contact_to_admin");
              return res.send(response);
            }else if(result.email_verified == NOT_VERIFIED){
                response['login_as']		=	'email';
                response['status']	    =	API_STATUS_ERROR;
                response['message']     = res.__("front.user.login.email_not_verified");
                response['validate_string']  = userDetail.validate_string;
                return res.send(response);
            }else{

              /*** Start user detail */
              let getCondition    = {
                password              : 0, 
                confirm_password      : 0, 
                is_active             : 0, 
                is_deleted            : 0, 
                is_approved           : 0, 
                email_validate_string : 0,
                phone_validate_otp    : 0
              }
              let userDetail      = await getProfileDetail(searchCondition, getCondition);
              let userResult      = (userDetail.result)  ? userDetail.result : {}
  
              if(Object.keys(userResult).length == NOT){
                return res.send({
                  status		      :	API_STATUS_ERROR,
                  status_code     : API_STATUS_CODE_NO_CONTENT,
                  message		      :	res.__("front.user.login.invalid_username_password"),
                  result          : {},
                  error		        :	[],
                })
              } 
              /*** End user detail */

              let data            = {slug : result.slug, user_key : result._id, email : result.email}; 
              let token           = generateJWT(data);
              response['token']   = token;
              response['result']  = userResult;
              
              if(userResult.is_welcome){
                collection.updateOne({_id : ObjectId(result._id)},{$set:{is_welcome : DEACTIVE}}, (err, result)=>{})
              }

              /** Update user login devices */
              if(identifier) await updateUserLoginDevices(req,res,{user_id : userResult._id, identifier : identifier, osType : osType});
              return res.send(response);
            }

            
          }else{
            return res.send({
              status		:	API_STATUS_ERROR,
              message		:	res.__("front.user.login.invalid_username_password"),
              result    : {},
              error		  :	[],
            });
          }
        }) 
      })
    }else{
      return res.send({
        status		:	API_STATUS_ERROR,
        message		:	'',
        result    : {},
        error		  :	errors,
      });
    }
  }


    
  /** Function is used to update login user devices **/
  updateUserLoginDevices = (req,res,options)=>{
    return new Promise(resolve=>{
      const collection	=	db.collection('user_devices');
      collection.findOneAndUpdate(
        {
          user_id   : ObjectId(options.user_id)
        },
        {
          $addToSet: {
            devices_identifier: {
               $each: [options.identifier],
            }
          },
          $setOnInsert: {
            created     : getUtcDate()
          },
        },
        { upsert: true },
      (error,result)=>{
        return resolve()
      })
    })
  }

  /** Function is used to user signup **/
  this.signup = async (req, res)=> {
    req.body      = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    
    /*** Common validation for all types of user */
    req.checkBody({	
      "full_name":{
        isLength		:{
          options    : {min :MIN_CHARACTER_NAME_LIMIT , max : MAX_CHARACTER_NAME_LIMIT},
          errorMessage:res.__("admin.user.mobile_should_be_between_8_to_12")
        },
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_enter_first_name")
      },
      "email":{
        notEmpty		:true,
        isEmail			:{
          errorMessage:res.__("admin.user.please_enter_a_valid_email")
        },
        errorMessage	:res.__("admin.user.please_enter_an_email"),
      },
      "country_name":{
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_select_country")
      },
      "city_name":{
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_select_city")
      },
      "domain_name":{
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_select_domain")
      },
      "company_name":{
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_enter_company_name")
      },
      "password":{
        isLength		:{
          options    : {min : PASSWORD_MIN_LENGTH },
          errorMessage:res.__("admin.user.password_should_be_6_characters_long")
        },
        matches	 : {
          options    	: PASSWORD_ALPHANUMERIC_REGEX,
          errorMessage:res.__("admin.user.password.it_should_be_alphanumeric")
        },
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_enter_password")
      },
      "confirm_password":{
        isLength		:{
          options    : {min :PASSWORD_MIN_LENGTH},
          errorMessage:res.__("admin.user.password.it_should_be_6_characters_long")
        },
        matches	 : {
          options    	: PASSWORD_ALPHANUMERIC_REGEX,
          errorMessage:res.__("admin.user.password.it_should_be_alphanumeric")
        },
        notEmpty : true,
        errorMessage	:res.__("admin.user.please_enter_confirm_password")	
      },
    });
    

    let fullName				       = (req.body.full_name)				  ?	req.body.full_name:'';
    let email 					       = (req.body.email)						  ?	req.body.email:'';
    let countryName 					 = (req.body.country_name)			?	req.body.country_name:'';
    let cityName 					     = (req.body.city_name)				  ?	req.body.city_name:'';
    let domainName 				     = (req.body.domain_name)			  ?	req.body.domain_name:'';
    let companyName 				   = (req.body.company_name)			?	req.body.company_name:'';
    let companyLocation 	     = (req.body.company_location)	?	req.body.company_location:'';
    let password 				       = (req.body.password)					?	req.body.password:'';
    let confirmPassword 		   = (req.body.confirm_password)  ?	req.body.confirm_password:'';
    let encryptPassword 		   = bcrypt.hashSync(password, BCRYPT_SALT_ROUND);

    /** Match password with confirm password */
    if (password && confirmPassword) {
      req.checkBody("confirm_password", "admin.user.password_does_not_matched").equals(req.body.password);
    }

    let errors  = uniqueValidations(req.validationErrors());
    errors      = (errors && errors.length>0) ? errors :  [];

    /** user email unique options */
    if(email){
      let emailUniqueOptions = {
        table_name  : "users",
        field_value : email,
        field_name  : 'email'
      };
  
      let isEmailUnique  = await checkUniqueValue(emailUniqueOptions);
      if(errors.length >= 0 && isEmailUnique && isEmailUnique.status == STATUS_ERROR){
        errors.push({param : 'email', msg : res.__("admin.user.email_is_already_in_use_please_try_something_different"), value:email, location:'body'})
      }
    }
   

    if(errors.length == NOT){

      /** Slug options */
      let slugOptions = {
        table_name  : "users",
        title       : fullName,
        slug_field  : 'full_name'
      };
      let slugData        = await convertInToSlug(slugOptions);
      let validateOTP     = generateOTP(OTP_NUMBER_ROUND);
      let validateString  = generateString(VALIDATE_STRING_ROUND);
      let insertData = {
        full_name					        :	fullName,
        slug                      : slugData.slug,
        email						          :	email,
        country_id						    :	ObjectId(countryName),
        city_id                   : ObjectId(cityName),
        domain_id                 : ObjectId(domainName),
        company_name              : companyName,
        company_location          : companyLocation,
        password					        :	encryptPassword,
        role_id						        :	ROLE_ID_USER,
        email_verified				    :	NOT_VERIFIED,
        validate_otp			        : Number(validateOTP),
        validate_string           : validateString,
        is_notification_on        : ACTIVE,
        is_email_on               : ACTIVE,
        is_active					        :	ACTIVE,
        is_deleted					      :	NOT_DELETED,
        is_ghost                  : DEACTIVE,
        is_welcome                : ACTIVE,
        created						        :	getUtcDate(),
        otp_expired						    :	getUtcDate()
      };
      signupUser(req,res,insertData)
    }else{
      res.send({
        status	:	API_STATUS_ERROR,
        error		:	errors,
        result  : '',
        message : ''
      });
    }
  }


  /** Function is used to insert user */
	signupUser    = async (req,res,insertData)=>{
		const users	=	db.collection('users');
		users.insertOne(insertData,async (error,result)=>{
			if(!error){

        /*** Send email to user */
        let validateOTP    = insertData.validate_otp;
        let emailOptions = {
          action      : 'registration',
          to          : insertData.email,
          rep_array   : [insertData.full_name, validateOTP]
        };
        sendEmail(req, res,emailOptions);

				return res.send({
					status		          :	API_STATUS_SUCCESS,
          message		          :	res.__("front.user.you_have_successfully_registered_on_nas"),
          validate_string     : insertData.validate_string,
          error		            :	[],
				});
			}else{
				return res.send({
					status		          :	API_STATUS_ERROR,
          message		          :	res.__("front.something_went_wrong_please_try_again_later"),
          validate_string     : '',
          error		            :	'',
				});
			}
		})
  };// End InsertUser
  


  /** Function is used to verify user by either email **/
  this.userVerification = (req, res)=> {
    req.body            = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    let validateOtp     = (req.body.validate_otp)       ? req.body.validate_otp : '';
    let validateString  = (req.body.validate_string)    ? req.body.validate_string : '';

    if(!validateString && validateOtp) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    /** search condition */
    let conditionSearch = { 
      is_deleted      : NOT_DELETED, 
      is_active       : ACTIVE,
      validate_string : validateString,
      validate_otp    : Number(validateOtp)
    };

    /** update condition */
    let conditionUpdate = {
      email_verified  : VERIFIED,
      validate_otp    : '',
      modified        : getUtcDate()
    };

    let collection = db.collection('users');
    collection.updateOne(conditionSearch,{$set:conditionUpdate},(err, result)=>{
      if(!err && result && result.modifiedCount > NOT){
        return res.send({
          status		:	API_STATUS_SUCCESS,
          message		:	res.__("front.user.email_has_been_verified"),
          result    : {},
          error		  :	[], 
        });
      }else if(!err && result && result.modifiedCount == NOT){
        return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("front.user.invalid_otp"),
          result    : {},
          error		  :	[], 
        });
      }else{
        return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("front.something_went_wrong_please_try_again_later"),
          result    : {},
          error		  :	[], 
        });
      }
    });
  };

  /** Function is used to resend otp or email **/
  this.resendVerification = async(req, res)=> {
    req.body              = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    let validateString    = (req.body.validate_string)  ? req.body.validate_string : '';
    let resendType        = (req.body.resend_type)      ? req.body.resend_type : '';

    /** Is valid request */
    if(!validateString && !resendType) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    })

    /*** generate otp */
    let validateOTP = await generateOTP(OTP_NUMBER_ROUND);

    /** search condition */
    let conditionSearch = { 
      is_deleted      : NOT_DELETED, 
      is_active       : ACTIVE,
      validate_string : validateString
    };         
    
    /** update condition */
    let conditionUpdate = {
      validate_otp : Number(validateOTP),
      modified     : getUtcDate()
    };


    /*** Start user detail */
    let getCondition = { email : 1, mobile  : 1 ,full_name:1}
    let userDetail   = await getProfileDetail(conditionSearch, getCondition);
    let userResult   = (userDetail.result)  ? userDetail.result : {}
    if(Object.keys(userResult).length == NOT){
      return res.send({
        status		:	API_STATUS_ERROR,
        message		:	res.__("front.user.user_not_exist"),
        result    : {},
        error		  :	[],
      })
    } 
    /*** End user detail */

    let collection = db.collection('users');
    collection.updateOne(conditionSearch,{$set:conditionUpdate},async (err, result)=>{
      if(!err && result && result.modifiedCount > NOT){

        /***Send mail */
        let emailOptions = {
          action        : (resendType == 'forgot_password') ? 'forgot_password' : 'registration',
          to            : userResult.email,
          rep_array     : [userResult.full_name, validateOTP]
        };
        sendEmail(req, res, emailOptions);

        return res.send({
          status		:	API_STATUS_SUCCESS,
          message		:	res.__("front.user.email_has_been_sent_on_your_registered_email"),
          result    : {},
          error		  :	[],
        });
      }else if(!err && result && result.modifiedCount == NOT){
        return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("front.user.email_does_not_exist_in_our_database"),
          result    : {},
          error		  :	[],
        });
      }else{
        return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("front.something_went_wrong_please_try_again_later"),
          result    : {},
          error		  :	[],
        });
      }
    });
  }

/** Function is used to send otp or email to reset password **/
this.forgotPassword = async (req, res)=> {
  let email   = (req.body.email)   ? req.body.email : '';
  if(!email) return res.send({
    status		:	API_STATUS_ERROR,
    message		:	res.__("front.user.invalid_request"),
    result    : {},
    error		  :	[],
  });

  let successMessage  = '';
  let errorMessage    = '';

  let searchCondition = { 
    is_deleted : NOT_DELETED,
    email      : { $regex: new RegExp("^" + email, "i") }
  };

  req.checkBody({	
    "email":{
      notEmpty		:true,
      isEmail			:{
        errorMessage:res.__("admin.user.please_enter_a_valid_email")
      },
      errorMessage	:res.__("admin.user.please_enter_an_email"),
    },
  })

  let errors  = uniqueValidations(req.validationErrors());
  errors      = (errors && errors.length>NOT) ? errors :  [];

  /*** Start user detail */
  let getCondition    = { _id : 1, validate_string: 1, email:1, full_name :1};
  let userDetail      = await getProfileDetail(searchCondition, getCondition);
  let userResult      = (userDetail.result)  ? userDetail.result : {}
  

  if(Object.keys(userResult).length == NOT){
    return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.user_not_exist"),
      result    : {},
      error		  :	[],
    })
  }
  /*** End user detail */


  if(errors.length == NOT || !errors){
    /** update condition */
    let validateOtp     = generateOTP(OTP_NUMBER_ROUND);
    let validateString  = generateString(VALIDATE_STRING_ROUND);
    let conditionUpdate = {validate_otp : Number(validateOtp), validate_string : validateString ,modified : getUtcDate()};
    let collection      = db.collection('users');
    collection.updateOne(searchCondition,{$set:conditionUpdate},async (err, result)=>{
      if(!err && result && result.modifiedCount > NOT){

        /*** Send an email */
        let emailOptions = {
          action      : 'forgot_password',
          to          : userResult.email,
          rep_array   : [userResult.full_name, validateOtp]
        };

        await sendEmail(req, res,emailOptions);

        return res.send({
          status		      :	API_STATUS_SUCCESS,
          message		      :	successMessage,
          validate_string : validateString,
          error		        :	[],
        });
      }else{
        return res.send({
          status		        :	API_STATUS_ERROR,
          message		        :	res.__("admin.front.something_went_wrong_please_try_again_later"),
          validate_string   : '',
          error		          :	[],
        });
      }
    });
  }else{
    return res.send({
      status		:	API_STATUS_ERROR,
      message		:	'',
      result    : {},
      error		  :	errors,
    });
  }
}


  /** Function is used to reset password **/
  this.resetPassword = async (req, res)=> {
    req.body            = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    let validateString  = (req.body.validate_string)  ? req.body.validate_string : '';
    let password        = (req.body.password)         ? req.body.password : '';
    let confirmPassword = (req.body.confirm_password) ? req.body.confirm_password : '';

    if(!validateString) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    req.checkBody({	
      "password":{
        isLength		:{
          options    : {min : PASSWORD_MIN_LENGTH },
          errorMessage:res.__("admin.user.password_should_be_6_characters_long")
        },
        matches	 : {
          options    	: PASSWORD_ALPHANUMERIC_REGEX,
          errorMessage:res.__("admin.user.password.it_should_be_alphanumeric")
        },
        notEmpty		:true,
        errorMessage	:res.__("admin.user.please_enter_password")
      },
      "confirm_password":{
        isLength		:{
          options    : {min :PASSWORD_MIN_LENGTH},
          errorMessage:res.__("admin.user.password.it_should_be_6_characters_long")
        },
        matches	 : {
          options    	: PASSWORD_ALPHANUMERIC_REGEX,
          errorMessage:res.__("admin.user.password.it_should_be_alphanumeric")
        },
        notEmpty : true,
        errorMessage	:res.__("admin.user.please_enter_confirm_password")	
      },
    });

    /** Match password with confirm password */
    if (password && confirmPassword) {
      req.checkBody("confirm_password", "admin.user.password_does_not_matched").equals(req.body.password);
    }

    let encryptPassword 	= bcrypt.hashSync(password, BCRYPT_SALT_ROUND);
    let errors  = uniqueValidations(req.validationErrors());
    errors      = (errors && errors.length>0) ? errors :  [];

    if(errors.length == NOT || !errors){

      /** search condition */
      let conditionSearch = { 
        is_deleted      : NOT_DELETED, 
        is_active       : ACTIVE,
        validate_string : validateString
      };
  
      /** update condition */
      let conditionUpdate = {
        password : encryptPassword
      };

      let collection = db.collection('users');
      collection.updateOne(conditionSearch,{$set:conditionUpdate},(err, result)=>{
        if(!err && result && result.modifiedCount > NOT){
          return res.send({
            status		:	API_STATUS_SUCCESS,
            message		:	res.__("front.user.password_has_been_changed_successfully"),
            result    : {},
            error		  :	[],
          });
        }else{
          return res.send({
            status		:	API_STATUS_ERROR,
            message		:	res.__("admin.front.something_went_wrong_please_try_again_later")	,
            result    : {},
            error		  :	[],
          });
        }
      });
    }else{
      return res.send({
        status		:	API_STATUS_ERROR,
        message		:	'',
        result    : {},
        error		  :	errors,
      });
    }
  }

  
  
  /** Function is used to update user profile **/
  this.editProfile = async (req, res)=> {
    req.body       = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    let editType	 = (req.body.type)	?	req.body.type:'';
    let slug	     = (req.body.slug)	?	req.body.slug:'';

    if(!slug && !editType){
      res.send({
        status		:	API_STATUS_ERROR,
        message		:	res.__("front.user.invalid_request"),
        result    : {},
        error		  :	[],
      })
    }

    /*** validation for type of user main detail */
    if(editType == 'main_profile'){
      req.checkBody({	
        "full_name":{
          isLength		:{
            options    : {min :MIN_CHARACTER_NAME_LIMIT , max : MAX_CHARACTER_NAME_LIMIT},
            errorMessage:res.__("admin.user.full_name_should_be_between_2_to_50")
          },
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_enter_full_name")
        },
        "email":{
          notEmpty		:true,
          isEmail			:{
            errorMessage:res.__("admin.user.please_enter_a_valid_email")
          },
          errorMessage	:res.__("admin.user.please_enter_an_email"),
        },
        "country_name":{
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_select_country")
        },
        "city_name":{
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_select_city")
        },
        "domain_name":{
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_select_domain")
        },
        "company_name":{
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_enter_company_name")
        },
      });
    }

    /*** validation for change password */
    if(editType == 'change_password'){
      req.checkBody({	
        "old_password":{
          isLength		:{
            options    : {min :PASSWORD_MIN_LENGTH , max : PASSWORD_MAX_LENGTH},
            errorMessage:res.__("admin.user.password_should_be_between_6_to_8")
          },
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_enter_old_password")
        },
        "new_password":{
          isLength		:{
            options    : {min :PASSWORD_MIN_LENGTH , max : PASSWORD_MAX_LENGTH},
            errorMessage:res.__("admin.user.password_should_be_between_6_to_8")
          },
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_enter_new_password"),
        },
        "confirm_password":{
          isLength		:{
            options    : {min :PASSWORD_MIN_LENGTH , max : PASSWORD_MAX_LENGTH},
            errorMessage:res.__("admin.user.password_should_be_between_6_to_8")
          },
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_select_country")
        },
      });
    }

    /*** validation for type of user status */
    if(editType == 'message'){
      req.checkBody({	
        "status_title":{
          isLength		:{
            options    : {min :MIN_CHARACTER_TITLE_LIMIT , max : MAX_CHARACTER_TITLE_LIMIT},
            errorMessage:res.__("admin.user.about_title_should_be_between_2_to_500")
          },
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_enter_status_title")
        },
        "status_message":{
          isLength		:{
            options    : {min :MIN_CHARACTER_TITLE_LIMIT , max : MAX_CHARACTER_TITLE_LIMIT},
            errorMessage:res.__("admin.user.about_message_should_be_between_2_to_500")
          },
          notEmpty		:true,
          errorMessage	:res.__("admin.user.please_enter_status_message")
        },
      })
    }

    let errors  = uniqueValidations(req.validationErrors());
    errors      = (errors && errors.length>0) ? errors :  [];

    if(errors.length == NOT){
      let updateData = {modified :	getUtcDate()};
      let successMessage = '';

      /** Set to update change password */
      if(editType == 'change_password'){
        let oldPassword				   = (req.body.old_password)		?	req.body.old_password:'';
        let newPassword 				 = (req.body.new_password)    ?	req.body.new_password:'';

        /**Validate confirm password*/
        req.checkBody("confirm_password", res.__("admin.user.confirm_password_should_be_same_as_password")).equals(newPassword);
        try{
          let users = db.collection("users");
          users.findOne({slug : slug},{projection: {password:1}},(error,userResult)=>{
            if(error || !userResult){
              /** Send error response **/
              return res.send({
                  status  : API_STATUS_ERROR,
                  error : [{"param":"old_password","msg":res.__("admin.user_profile.old_password_you_entered_did_not_matched")}],
              });
            }

            bcrypt.compare(oldPassword,userResult.password).then(passwordMatched=>{
              if(!passwordMatched){
                  /** Send error response **/
                  return res.send({
                      status  : API_STATUS_ERROR,
                      error : [{"param":"old_password","msg":res.__("admin.user_profile.old_password_you_entered_did_not_matched")}],
                  });
              }

              /** update profile details **/
              bcrypt.hash(newPassword, BCRYPT_SALT_ROUND).then(bcryptPassword=>{
                updateData['password'] = bcryptPassword

                successMessage = res.__("front.user.password_has_been_changed_successfully")
                updateUser(req,res,updateData, successMessage);
              });
            });
          })
        }catch(e){

          /** Send error response **/
          res.send({
              status  : API_STATUS_ERROR,
              error : [{param:'error',msg:res.__("admin.system.something_going_wrong_please_try_again")}]
          });
        }
      }

      /** Set to update profile status */
      if(editType == 'message'){
        let statusTitle				     = (req.body.status_title)		?	req.body.status_title:'';
        let statusMessage 				 = (req.body.status_message)  ?	req.body.status_message:'';
        updateData['about_title']   = statusTitle;
        updateData['about_message'] = statusMessage;

        successMessage = res.__("front.user.status_has_been_updated_successfully")
        updateUser(req,res,updateData,successMessage)
      }iv>



      /** Set to update profile basic detail */
      if(editType == 'main_profile'){
        let fullName				       = (req.body.full_name)				  ?	req.body.full_name:'';
        let email 					       = (req.body.email)						  ?	req.body.email:'';
        let countryName 					 = (req.body.country_name)			?	req.body.country_name:'';
        let cityName 					     = (req.body.city_name)				  ?	req.body.city_name:'';
        let domainName 				     = (req.body.domain_name)			  ?	req.body.domain_name:'';
        let companyName 				   = (req.body.company_name)			?	req.body.company_name:'';
        let gender 	               = (req.body.gender)	          ?	req.body.gender:'';
        let dateOfBirth 	         = (req.body.date_of_birth)	    ?	req.body.date_of_birth:'';
        let companyLocation 	     = (req.body.company_location)	?	req.body.company_location:'';

        updateData['email']	=	email
        updateData['gender']	=	gender
        updateData['city_id']	=	ObjectId(cityName)
        updateData['full_name']	=	fullName
        updateData['domain_id']	=	ObjectId(domainName)
        updateData['country_id']	=	ObjectId(countryName)
        updateData['company_name']	=	companyName
        updateData['company_location']	=	companyLocation
        updateData['date_of_birth']	=	getUtcDate(dateOfBirth)

        successMessage = res.__("front.user.profile_has_been_updated_successfully")
        updateUser(req,res,updateData,successMessage)
      }

      /** Set to update email or notification settings */
      if(editType == 'settings'){
        let settingType 		= (req.body.setting_type)  ?	req.body.setting_type:'';
        let settingStatus 	= (req.body.setting_status)  ?	req.body.setting_status:'';
        if(settingType == 'setting_email')  updateData['is_email_on'] = (settingStatus == DEACTIVE) ? DEACTIVE : ACTIVE
        if(settingType == 'setting_notification')  updateData['is_notification_on'] = (settingStatus == DEACTIVE) ? DEACTIVE : ACTIVE
        if(settingType == 'setting_ghost')  updateData['is_ghost'] = (settingStatus == DEACTIVE) ? DEACTIVE : ACTIVE
        
        successMessage = res.__("front.user.setting_has_been_updated_successfully")
        updateUser(req,res,updateData,successMessage)
      }


      /** Set to update profile image */
      if(editType == 'profile_image'){
        let profilePicture	=	(req.files && req.files.image)	?	req.files.image	:{};
        if(Object.keys(profilePicture).length > NOT){
          let options	=	{
            file		  :	profilePicture,
            file_path	:	USER_FILE_PATH
          };
          
          /*** Function is used to upload profile picture **/
          let userImage = await moveUploadedFile(options);
          if(userImage.status == STATUS_ERROR){
            return res.send({
              status	:	API_STATUS_ERROR,
              message	:	'',
              error		:	[{param : 'image', msg : userImage.message, value : profilePicture, location:'files'}],
              result  : '',
            })
          }else{
            let newFileName	=	(userImage.new_file) ? userImage.new_file :'';
            updateData['image'] = newFileName;

            successMessage = res.__("front.user.profile_picture_has_been_updated_successfully")
            updateUser(req,res,updateData,successMessage)
          }	
        }else{
          return res.send({
            status	:	API_STATUS_ERROR,
            message	:	'',
            error		:	[{param : 'image', msg : res.__("front.user.please_select_image"), value : profilePicture, location:'files'}],
            result  : '',
          })
        }
      }
    }else{
      res.send({
        status	:	API_STATUS_ERROR,
        error		:	errors,
        result  : '',
        message : ''
      });
    }
  }


  /** Function is used to update user */
  updateUser    = (req,res,updateData,successMessage)=>{
    let slug    = (req.body.slug)     ? req.body.slug : '';
    if(!slug) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    const users	=	db.collection('users');
    users.updateOne({slug: slug},{$set:updateData}, (error,result)=>{
      if(!error){
        return res.send({
          status		:	API_STATUS_SUCCESS,
          message		:	successMessage,
          result    : {},
          error		  :	[],
        });
      }else{
        return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("admin.front.something_went_wrong_please_try_again_later"),
          result    : {},
          error		  :	[],
        });
      }
    })
  };// End updateUser


  /** Function is to get profile detail **/
  this.getProfileDetail = async (req, res)=> {
    let slug    = (req.body.slug)  ? req.body.slug : '';
    let type    = (req.body.type)  ? req.body.type : '';
    let userId  = (req.body.user_id)? req.body.user_id : '';

    /*** Start user detail */
    let searchCondition = { slug : slug };
    let getCondition    = {
      password              : 0, 
      confirm_password      : 0, 
      is_active             : 0, 
      is_deleted            : 0, 
      is_approved           : 0, 
      email_validate_string : 0,
      phone_validate_otp    : 0
    }


    let userDetail      = await getProfileDetail(searchCondition, getCondition, type, userId);
    let userResult      = (userDetail.result)  ? userDetail.result : {}
    if(Object.keys(userResult).length == NOT){
      return res.send({
        status		    :	API_STATUS_ERROR,
        status_code   : API_STATUS_CODE_NO_CONTENT,
        message		    :	res.__("front.user.user_not_exist"),
        result        : userResult,
        error		      :	[],
      })
    }else{
      return res.send({
        status		    :	API_STATUS_SUCCESS,
        status_code   : API_STATUS_CODE_OK,
        message		    :	'',
        result        : userResult,
        error		      :	[],
      })
    } 
    /*** End user detail */
  };

  /** Function is to get user detail **/
  this.getUserDetail = async (req, res)=> {
    let userId    = (req.body.user_id)  ? req.body.user_id : '';

    /*** Start user detail */
    let searchCondition = { _id : ObjectId(userId) , is_active : ACTIVE, is_deleted: NOT_DELETED};
    let getCondition    = {
      password              : 0, 
      confirm_password      : 0, 
      is_active             : 0, 
      is_deleted            : 0, 
      is_approved           : 0, 
      email_validate_string : 0,
      phone_validate_otp    : 0
    }
    let userDetail      = await getProfileDetail(searchCondition, getCondition);
    let userResult      = (userDetail.result)  ? userDetail.result : {}
    if(Object.keys(userResult).length == NOT){
      return res.send({
        status		    :	API_STATUS_ERROR,
        message		    :	res.__("front.user.user_not_exist"),
        result        : userResult,
        error		      :	[],
      })
    }else{
      return res.send({
        status		    :	API_STATUS_SUCCESS,
        message		    :	'',
        result        : userResult,
        error		      :	[],
      })
    } 
    /*** End user detail */
  };


  /** Function is used to get user list **/
  this.getUsers  = async (req, res, next)=> {
    let slug            = (req.body.slug)           ? req.body.slug : '';
    let userId          = (req.body.user_id)        ? req.body.user_id : '';
    let countryId       = (req.body.country_id)     ? req.body.country_id : '';
    let cityId          = (req.body.city_id)        ? req.body.city_id : '';
    let domainId        = (req.body.domain_id)      ? req.body.domain_id : '';
    let fullName        = (req.body.full_name)      ? req.body.full_name : '';
    let companyName     = (req.body.company_name)   ? req.body.company_name : '';
    let activePage      = (req.body.skip)           ? req.body.skip : ACTIVE;
    let skip            = activePage*DEFAULT_API_LIMIT-DEFAULT_API_SKIP;

    /*** Search common condition */
    let searchCondition = {
      is_deleted  : NOT_DELETED, 
      is_active   : ACTIVE, 
      role_id     : ROLE_ID_USER, 
      slug        : {$ne :slug},
      is_ghost    : INACTIVE
    };  
    
    /*** Set specific condition to search user*/
    if(countryId) searchCondition['country_id']     = ObjectId(countryId)
    if(cityId) searchCondition['city_id']           = ObjectId(cityId)
    if(domainId) searchCondition['domain_id']       = ObjectId(domainId)
    if(fullName) searchCondition['full_name']       = {$regex : fullName, $options : 'i'}
    if(companyName) searchCondition['company_name'] = {$regex : companyName, $options : 'i'}

    let collection  = db.collection('users');
    async.parallel(
      {
        list: (callback) => {
          collection.aggregate([
            {$match : {$and:[searchCondition]}},
            {$sort  : {created :-1}},
            {$skip  : skip},
            {$limit : DEFAULT_API_LIMIT},
            {$lookup:{
              from: "masters",
              let: { countryId: "$country_id" },
              pipeline: [
                {$match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$countryId"] },
                      { $eq: ["$is_active", ACTIVE] },
                      { $eq: ["$is_deleted", NOT_DELETED] },
                    ],
                  },
                }}
              ],
              as: "countryDetail",
            }},
            {$lookup:{
              from: "masters",
              let: { cityId: "$city_id" },
              pipeline: [
                {$match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$cityId"] },
                      { $eq: ["$is_active", ACTIVE] },
                      { $eq: ["$is_deleted", NOT_DELETED] },
                    ],
                  },
                }}
              ],
              as: "cityDetail",
            }},
            {$lookup:{
              from: "masters",
              let: { domainId: "$domain_id" },
              pipeline: [
                {$match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$domainId"] },
                      { $eq: ["$is_active", ACTIVE] },
                      { $eq: ["$is_deleted", NOT_DELETED] },
                    ],
                  },
                }}
              ],
              as: "domainDetail",
            }},
            {$lookup:{
              from: "chat_requests",
              let: { userAs: [ObjectId(userId),"$_id"]},
              pipeline: [
                {$match: {
                  $expr: {
                    $and: [
                      { $in: [ "$sender_id", "$$userAs" ]},
                      { $in: [ "$receiver_id", "$$userAs" ]},
                      { $eq: [ "$status", ACTIVE]},
                      { $eq: [ "$is_blocked", NOT_DELETED]},
                    ],
                  },
                }}
              ],
              as: "friendDetail",
            }},
            {$project :{
              is_friend      : {$cond: { if: {$eq: [{'$arrayElemAt' :['$friendDetail.status',0]}, ACTIVE]}, then: ACTIVE, else : DEACTIVE}},
              country_name   : {'$arrayElemAt' :['$countryDetail.name',0]},
              city_name      : {'$arrayElemAt' :['$cityDetail.name',0]},
              domain_name    : {'$arrayElemAt' :['$domainDetail.name',0]},
              full_name      : 1,company_name :1, image : 1,slug:1
            }},
          ]).toArray((err, result)=>{
            if(result && result.length >NOT){
              /** Append customer image */
              let options = {path 	: USER_FILE_URL, result	: result};
              appendFile(options).then(response=>{
                callback(err, (response.result) ? response.result : []);
              }); 
            }else{
              callback(err, result);
            }
          })
        },
        recordsTotol: (callback) => {
          collection.countDocuments({$and:[searchCondition]}, {}, (err, result) => {
            callback(err, result);
          });
        }
      },
      (err, response) => {
        if(!err){
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : (response.list) ? response.list : [],
            records_total : (response.recordsTotol) ? response.recordsTotol : NOT,
            message       : '',
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : [],
            records_total : NOT,
            message       : '',
          })
        }
      }
    )
  }


  /** Function is used to get user list **/
  this.getChatUsers  = async (req, res, next)=> {
    let slug         = (req.body.slug)       ? req.body.slug : '';
    let userId       = (req.body.user_id)    ? req.body.user_id : '';
    let activePage   = (req.body.skip)       ? req.body.skip : ACTIVE;
    let skip         = activePage*DEFAULT_API_LIMIT-DEFAULT_API_SKIP;

    let collection  = db.collection('chat_requests');
    async.parallel(
      {
        list: (callback) => {
          collection.aggregate([
            {$match : {
              $and:[
                {conversation_id : {$exists: true}},
                {is_blocked : INACTIVE},
                {status : ACTIVE},
                {$or : [
                  {sender_id   : ObjectId(userId)},
                  {receiver_id : ObjectId(userId)}
                ]}
              ]
            }},
            {$sort:{created :-1}},
            {$skip:skip},
            {$limit: DEFAULT_API_LIMIT},
            {$lookup:{
              from : "users",
              let  : { userAsSender: ["$sender_id","$receiver_id"], conversationId : '$conversation_id'},
              pipeline: [
                {$match: {
                  $expr: {
                    $and: [
                      { $eq: ["$is_ghost", INACTIVE] },
                      { $eq: ["$is_deleted", NOT_DELETED] },
                      { $eq: ["$is_active", ACTIVE] },
                      { $in: [ "$_id", "$$userAsSender" ]},
                      { $ne: [ "$_id", ObjectId(userId) ]}
                    ],
                  },
                }},
                {$project:{
                  image : 1, full_name:1,is_deleted : 1
                }}
              ],
              as: "chatUserDetail",
            }},
            {$lookup:{
              from : "user_chats",
              let  : {conversationId : '$conversation_id', senderId : '$sender_id'},
              pipeline: [
                {$match: {
                  $expr: {
                    $and: [
                      { $eq: ["$conversation_id", "$$conversationId"] },
                    ],
                  },
                }},
                {$project:{
                  created_at    : {'$arrayElemAt' :['$messages.created_at',-1]},
                  last_message  : {'$arrayElemAt' :['$messages.message',-1]},
                  messages      : {
                    $filter: {
                      input: "$messages",
                      as: "item",
                      cond: { $and: [
                        { $eq: [ "$$item.is_read", NOT_READ ] },
                        { $eq: [ "$$item.sender_id", '$$senderId'] }
                      ]}
                    }
                  }
                }}
              ],
              as: "chatUserHistory",
            }},
            {$project :{
              conversation_id : 1,
              last_message    : {'$arrayElemAt' :['$chatUserHistory.last_message',0]},
              unread_message  : {$cond: { if: {'$arrayElemAt' :['$chatUserHistory.messages',0]}, then: {'$size' : {'$arrayElemAt' :['$chatUserHistory.messages',0]},} , else: []}},
              
              created_at      : {'$arrayElemAt' :['$chatUserHistory.created_at',0]},
              is_deleted      : {'$arrayElemAt' :['$chatUserDetail.is_deleted',0]},
              full_name       : {'$arrayElemAt' :['$chatUserDetail.full_name',0]},
              image           : {'$arrayElemAt' :['$chatUserDetail.image',0]},
            }},
            {$match :{is_deleted : {$exists: true}}},
          ]).toArray((err, result)=>{
            if(result && result.length >NOT){
              /** Append customer image */
              let options = {
                path 	  : USER_FILE_URL, 
                result	: result
              };
              appendFile(options).then(response=>{
                callback(err, (response.result) ? response.result : []);
              }); 
            }else{
              callback(err, result);
            }
          })
        },
        recordsTotol: (callback) => {
          collection.countDocuments(
            {
              $and:[
                {is_blocked : INACTIVE},
                {status : ACTIVE}
              ],
              $or : [
                {sender_id   : ObjectId(userId)},
                {receiver_id : ObjectId(userId)}
              ]
            }, {}, (err, result) => {
            callback(err, result);
          });
        }
      },
      (err, response) => {
        if(!err){
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : (response.list) ? response.list : [],
            records_total : (response.recordsTotol) ? response.recordsTotol : 0,
            message       : '',
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : [],
            records_total : NOT,
            message       : '',
          })
        }
      }
    )
  }

  /** Function is used to save report user data **/
  this.reportUser = async(req, res, next)=> {
    req.body      = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    req.checkBody({	
      "title":{
        notEmpty		:true,
        errorMessage	:res.__("front.this_field_is_required")
      },
      "description":{
        notEmpty		:true,
        errorMessage	:res.__("front.this_field_is_required")
      }
    });

    let errors  = uniqueValidations(req.validationErrors());
    errors      = (errors && errors.length>NOT) ? errors :  [];

    let slug        = (req.body.slug)         ? req.body.slug :'';
    let title       = (req.body.title)        ? req.body.title :'';
    let description = (req.body.description)  ? req.body.description :'';
    let reportTo    = (req.body.report_to)    ? req.body.report_to :'';
    let reportedBy  = (req.body.reported_by)  ? req.body.reported_by :'';

    if(!slug || !reportTo || !reportedBy) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    /** Set insertable data */
    let insertData = {
      report_to     : ObjectId(reportTo),
      reported_by   : ObjectId(reportedBy),
      title         : title,
      description   : description,
      status        : DEACTIVE,
      created       : getUtcDate()
    }

    if(errors && errors.length == NOT){
      const collection	=	db.collection("reported_users");
      collection.insertOne(insertData, (error,result)=>{
        if(!error){
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : '',
            message       : res.__("front.user.reported_user_saved_successfully"),
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : '',
            message       : res.__("front.something_went_wrong_please_try_again_later"),
          })
        }
      })
    }else{
      res.send({
        status	:	API_STATUS_ERROR,
        error		:	errors,
        result  : '',
        message : ''
      });
    }
  }

  /** Function is used to get user rating */
  this.getUserRating    = (req,res)=>{
    let slug      = (req.body.slug)       ? req.body.slug : '';
    let userId    = (req.body.user_id)    ? req.body.user_id : '';
    if(!slug && !userId) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    const collection	=	db.collection('rating_reviews');
    collection.findOne({user_id: ObjectId(userId)},{}, (error,result)=>{
      if(!error){
        return res.send({
          status		:	API_STATUS_SUCCESS,
          message		:	'',
          result    : (result) ? result : {},
          error		  :	[],
        });
      }else{
        return res.send({
          status		:	API_STATUS_ERROR,
          message		:	res.__("admin.front.something_went_wrong_please_try_again_later"),
          result    : {},
          error		  :	[],
        });
      }
    })
  };// End getUserRating


  /** Function is used to save user rating **/
  this.updateUserRating = async(req, res, next)=> {
    req.body      = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    req.checkBody({	
      "rating":{
        notEmpty		:true,
        errorMessage	:res.__("front.this_field_is_required")
      },
      "review":{
        notEmpty		:true,
        errorMessage	:res.__("front.this_field_is_required")
      }
    });

    let errors  = uniqueValidations(req.validationErrors());
    errors      = (errors && errors.length>NOT) ? errors :  [];

    let slug    = (req.body.slug)      ? req.body.slug :'';
    let userId  = (req.body.user_id)   ? req.body.user_id :'';
    let rating  = (req.body.rating)    ? req.body.rating :'';
    let review  = (req.body.review)    ? req.body.review :'';


    if(!slug || !userId) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    if(errors && errors.length == NOT){
      const collection	=	db.collection("rating_reviews");
      collection.findOneAndUpdate(
        { user_id: ObjectId(userId) },
        {
           $set: { rating: Number(rating), review : review, modified : getUtcDate() },
           $setOnInsert: { user_id : ObjectId(userId), created: getUtcDate() }
        },
        { upsert: true }, (error,result)=>{
        if(!error){
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : '',
            message       : res.__("front.user.rating_and_review_has_been_submitted_successfully"),
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : '',
            message       : res.__("front.something_went_wrong_please_try_again_later"),
          })
        }
      })
    }else{
      res.send({
        status	:	API_STATUS_ERROR,
        error		:	errors,
        result  : '',
        message : ''
      });
    }
  }

  /** Function is used to send chat request to orther user **/
  this.sendChatRequest = async(req, res, next)=> {

    let slug        = (req.body.slug)         ? req.body.slug :'';
    let senderId    = (req.body.sender_id)    ? req.body.sender_id :'';
    let receiverId  = (req.body.receiver_id)  ? req.body.receiver_id :'';

    if(!slug || !senderId ||  !receiverId) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    const collection	=	db.collection("chat_requests");
    collection.findOne({ sender_id   : ObjectId(senderId), receiver_id : ObjectId(receiverId)},async(error,result)=>{
        if(!error && !result){
          collection.insertOne({ sender_id  : ObjectId(senderId), receiver_id : ObjectId(receiverId), is_blocked : INACTIVE, status : INACTIVE, created : getUtcDate()},async(err,resInsert)=>{
            if(!error){
              /*** Start user detail */
              let getCondition    = {
                password              : 0, 
                confirm_password      : 0, 
                is_active             : 0, 
                is_deleted            : 0, 
                is_approved           : 0, 
                email_validate_string : 0,
                phone_validate_otp    : 0
              }
              let userDetail      = await getProfileDetail({slug :slug}, getCondition);
              let userResult      = (userDetail.result)  ? userDetail.result : {}


              /*** Start send notification */
              let frontLoadUrl              = WEBSITE_FRONT_URL+"profile?slug="+slug+"&chat_request=0";
              let notificationMessageParams = [userResult.full_name,frontLoadUrl];
              let notificationTemplate      = 'chat_request'
              let currentTemplates          = await notificationTemplates(req,res,notificationTemplate); 

              let notificationOptions = {
                notification_data : {
                  notification_type     : notificationTemplate,
                  notification_title    : (currentTemplates.subject)     ? currentTemplates.subject :'',
                  notification_message  : (currentTemplates.description) ? currentTemplates.description :'',
                  message_params        : notificationMessageParams,
                  user_id               : [receiverId]
                }
              };

              await insertNotifications(req,res,notificationOptions);
              /*** End send notification */

              return res.send({
                status        : API_STATUS_SUCCESS,
                error         : [],
                result        : '',
                message       : res.__("front.user.request_has_been_sent_successfully"),
              })
            }
          });
        }else if(!error && result){
          if(Object.keys(result).length > NOT){
            let status = (result.status) ? result.status : '';
            let isBlocked = (result.is_blocked) ? result.is_blocked : '';
            if(status == INACTIVE){
              return res.send({
                status        : API_STATUS_ERROR,
                error         : [],
                result        : '',
                message       : res.__("front.user.request_already_in_queue"),
              })
            }

            if(status == ACTIVE){
              return res.send({
                status        : API_STATUS_ERROR,
                error         : [],
                result        : '',
                message       : res.__("front.user.user_already_accepted_the_request"),
              })
            }

            if(isBlocked == ACTIVE){
              return res.send({
                status        : API_STATUS_ERROR,
                error         : [],
                result        : '',
                message       : res.__("front.user.you_can_not_send_chat_request_to_blocked_user"),
              })
            }

            if(status == REJECTED){
              collection.updateOne({ sender_id  : ObjectId(senderId), receiver_id : ObjectId(receiverId)}, {$set:{status : INACTIVE,modified :getUtcDate()}},(err,resUdate)=>{
                if(!error){
                  return res.send({
                    status        : API_STATUS_SUCCESS,
                    error         : [],
                    result        : '',
                    message       : res.__("front.user.request_has_been_sent_successfully"),
                  })
                }else{
                  return res.send({
                    status        : API_STATUS_ERROR,
                    error         : [],
                    result        : '',
                    message       : res.__("front.something_went_wrong_please_try_again_later"),
                  })
                }
              });
            }
          }
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : '',
            message       : res.__("front.something_went_wrong_please_try_again_later"),
          })
        }
      }
    )
  }

  /** Function is used to update chat request status **/
  this.updateChatRequestStatus = async(req, res, next)=> {
    let slug        = (req.body.slug)       ? req.body.slug :'';
    let senderId    = (req.body.sender_id)  ? req.body.sender_id :'';
    let receiverId  = (req.body.receiver_id)? req.body.receiver_id :'';
    let status      = (req.body.status)     ? Number(req.body.status) :INACTIVE;

    if(!slug || !senderId ||  !receiverId) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });
    
    const collection	=	db.collection("chat_requests");
    collection.findOneAndUpdate(
      { 
        sender_id   : ObjectId(senderId), 
        receiver_id : ObjectId(receiverId),
      },
      {
        $set: { modified : getUtcDate(), is_blocked : status },
        $setOnInsert: { sender_id : ObjectId(senderId), receiver_id :  ObjectId(receiverId), created : getUtcDate()}
      },{ upsert: true }, (error,result)=>{
        if(!error){
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : '',
            message       : (status == ACTIVE) ? res.__("front.user.user_has_been_blocked_successfully") : res.__("front.user.user_has_been_unblocked_successfully"),
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : '',
            message       : res.__("front.something_went_wrong_please_try_again_later"),
          })
        }
      }
    )
  }


  /** Function is used to delete user **/
  this.deleteUser = async(req, res, next)=> {
    let slug      = (req.body.slug) ? req.body.slug :'';
    if(!slug) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });
    
    const collection	=	db.collection("users");
    collection.findOneAndUpdate({slug : slug},{$set: { modified : getUtcDate(), is_deleted : DELETED }},(error,result)=>{
        if(!error && result){
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : '',
            message       :  res.__("front.user.user_has_been_deleted_successfully"),
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : '',
            message       : res.__("front.something_went_wrong_please_try_again_later"),
          })
        }
      }
    )
  }

  /** Function is used to update chat request status **/
  this.acceptRejectChatStatus = async(req, res, next)=> {
    let slug        = (req.body.slug)       ? req.body.slug :'';
    let senderId    = (req.body.sender_id)  ? req.body.sender_id :'';
    let receiverId  = (req.body.receiver_id)? req.body.receiver_id :'';
    let status      = (req.body.status)     ? Number(req.body.status) :INACTIVE;

    if(!slug || !senderId ||  !receiverId) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });
    
    const collection	=	db.collection("chat_requests");
    collection.updateOne(
      { 
        sender_id   : ObjectId(senderId), 
        receiver_id : ObjectId(receiverId),
        status      : INACTIVE
      },
      {
        $set: {conversation_id : ObjectId(), modified : getUtcDate(), status : status },
      }, async(error,result)=>{
        if(!error && result.modifiedCount > NOT){
          if(status == ACTIVE){
              /*** Start user detail */
              let getCondition    = {
                password              : 0, 
                confirm_password      : 0, 
                is_active             : 0, 
                is_deleted            : 0, 
                is_approved           : 0, 
                email_validate_string : 0,
                phone_validate_otp    : 0
              }
              let userDetail      = await getProfileDetail({slug :slug}, getCondition);
              let userResult      = (userDetail.result)  ? userDetail.result : {}

            /*** Start send notification */
            let frontLoadUrl              = WEBSITE_FRONT_URL+"profile?slug="+slug+"&chat_request=0";
            let notificationMessageParams = [userResult.full_name,frontLoadUrl];
            let notificationTemplate      = 'chat_approved';
            let currentTemplates          = await notificationTemplates(req,res,notificationTemplate); 

            let notificationOptions = {
              notification_data : {
                notification_type     : notificationTemplate,
                notification_title    : (currentTemplates.subject)     ? currentTemplates.subject :'',
                notification_message  : (currentTemplates.description) ? currentTemplates.description :'',
                message_params        : notificationMessageParams,
                user_id               : [senderId]
              }
            };

            await insertNotifications(req,res,notificationOptions);
            /*** End send notification */
          }
   
          return res.send({
            status        : API_STATUS_SUCCESS,
            error         : [],
            result        : '',
            message       : (status == ACTIVE) ? res.__("front.user.request_has_been_accepted_successfully") : res.__("front.user.request_has_been_rejected_successfully"),
          })
        }else{
          return res.send({
            status        : API_STATUS_ERROR,
            error         : [],
            result        : '',
            message       : res.__("front.something_went_wrong_please_try_again_later"),
          })
        }
      }
    )
  }// End acceptRejectChatStatus

  /** Function is to get notifications **/
  this.getNotifications = (req, res)=> {
    req.body    = sanitizeData(req.body, NOT_ALLOWED_TAGS);
    let slug    = (req.body.slug)     ? req.body.slug : '';
    let userId  = (req.body.user_id)  ? req.body.user_id : '';  
    let skip    = (req.body.skip)     ? Number(req.body.skip) : NOT;
    let limit   = (req.body.limit)    ? Number(req.body.limit) : DEFAULT_LIMIT;
    if(!userId) return res.send({
      status		:	API_STATUS_ERROR,
      message		:	res.__("front.user.invalid_request"),
      result    : {},
      error		  :	[],
    });

    let condition = {user_id: ObjectId(userId)};

    let async = require("async");
    let collection = db.collection("notifications");
    async.parallel(
      {
        totalCount: (callback) => {
          collection.countDocuments({ user_id: ObjectId(userId)},{},(err, result) => {
            callback(err, result);
          });
        },
        totalCountHeader: (callback) => {
          collection.countDocuments({ user_id: ObjectId(userId), is_seen : NOT_SEEN},{},(err, result) => {
            callback(err, result);
          });
        },
        notificationList: (callback) => {
          let options = {
            condition : condition,
            sort      : {created : -1},
            skip      : skip,
            limit     : limit
          }

          let searchCondition = (options.condition) ? options.condition :{};
          let sortCondition   = (options.sort)      ? options.sort  : {};
          let skipCondition   = (options.skip)      ? options.skip  : NOT;
          let limitCondition  = (options.limit)     ? options.limit : DEFAULT_LIMIT;

          collection.aggregate([
            {$match : searchCondition},
            {$sort  : sortCondition},
            {$skip  : skipCondition},
            {$limit : limitCondition},
          ]).toArray( (err, result)=> {
            callback(err, result);
          });
        },
      },
       (err, response)=> {
          if(err && !result){
            return res.send({
              status		    :	API_STATUS_ERROR,
              message		    :	res.__("front.user.something_went_wrong_please_try_again_later"),
              result        : [],
              error		      :	[],
            })
          }else{
            var result = {
              status            : STATUS_SUCCESS,
              totalCount        : response.totalCount ? response.totalCount : NOT,
              totalCountHeader  : response.totalCountHeader ? response.totalCountHeader : NOT,
              notificationList  : response.notificationList ? response.notificationList  : [],
            };
            return res.send({
              status		    :	API_STATUS_SUCCESS,
              message		    :	'',
              result        : result,
              error		      :	[],
            })
          } 
      }
    );
  }; //End notification
}
module.exports = new User();
