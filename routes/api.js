
/**
 * Web.js
 *
 * This file is required by index.js. It sets up event listeners
 *
 * NODE.Js (http://nodejs.org)
 * Copyright Linux Foundation Collaborative (http://collabprojects.linuxfoundation.org/)
 *
 * @copyright     Linux Foundation Collaborative (http://collabprojects.linuxfoundation.org/)
 * @link          http://nodejs.org NODE.JS
 * @package       routes.js
 * @since         NODE.JS Latest version
 * @license       http://collabprojects.linuxfoundation.org Linux Foundation Collaborative
 */

/** Including contants file */
require("./../config/global_constant");
const path = require('path');
/** node cache module */
const NodeCache = require("node-cache");
	myCache 	= new NodeCache();

/* Include all packages used in this file */
const base64		= require('base-64');
const {readFile}	= require("fs");
const utf8			= require('utf8');

/** Including i18n for languages */
const i18n 			= require("i18n");

/** Including common function */
require(WEBSITE_ROOT_PATH + "/custom_helper");


/**
 * Export a function, so that we can pass the app and io instances from app.js
 *
 * @param router As Express Object
 * @param io As Socket Io Object
 * @param mongo As Mongo db Object
 *
 * @return void.
 */
module.exports = {
	configure: function(router,mongo) {
		db			= mongo.getDb();
		ObjectId	= require("mongodb").ObjectID;
		routes 		= router;

		/*******************Initialize csrf module***********************/
		const csrf = require('csurf');
		csrfProtection = csrf({ cookie: true });
		/*******************Initialize csrf module end ***********************/

		/** Before Filter **/
		routes.use(FRONT_END_NAME+"api/",function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
  			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
			res.header("authorization", '132465798dsfgfdsgdsfgdsfg')

			/** Read/write Basic settings from/in Cache **/
			let settings    = myCache.get( "settings" );
			if ( settings == undefined ){
				readFile(path.join(WEBSITE_ROOT_PATH ,"config/settings.json"), "utf8", function readFileCallback(err, data){
					if(err){
						next();
					}else{
						settings    		=    JSON.parse(data);
						myCache.set( "settings", settings, 0 );
						res.locals.settings =   settings;
						next();
					}
				});
			}else{
				res.locals.settings = settings;
				next();
			}
		});


		/** This function is used to check user login or not **/
		isUserLogedInApi = (req, res, next) => {
			return new Promise((resolve) => {
				let token = "";
				if(req.body.token && req.body.token !=""){
					token = req.body.token;
				}else if(req.headers.token && req.headers.token !=""){
					token = req.headers.token;
				}else{
					token = false;
				}
				if (!token){
					return res.status(API_STATUS_UNAUTHORIZED).send('Invalid request, token does not exist');
					// return res.send({
					// 	status: API_STATUS_UNAUTHORIZED,
					// 	result: {},
					// 	statusCode: "",
					// 	message: 'Invalid request, token does not exist',
					// });
				}
				 

				/*** JWT verification */
				let jwt = require('jsonwebtoken');
				jwt.verify(token, JWT_CONFIG.private_key, { expiresIn: JWT_CONFIG.expire_time }, (err, decoded) => {
					
					if (err) {
						// return res.send({
						// 	status: API_STATUS_UNAUTHORIZED,
						// 	result: {},
						// 	statusCode: "token_expire",
						// 	message: err.name + ', ' + err.message,
						// })
						return res.status(API_STATUS_UNAUTHORIZED).send(err.name + ', ' + err.message);
					} else {
						/*** User exist */
						let userId = (decoded.user_key) ? decoded.user_key : '';
						let collection = db.collection('users');
						collection.findOne({ _id: ObjectId(userId) }, (err, result) => {
							if (!err && result && Object.keys(result).length > 0) {
								if (result.is_deleted == DELETED) {
									return res.status(API_STATUS_UNAUTHORIZED).send(res.__("front.user.login.user_deleted"))
								} else if (result.is_active == DEACTIVE) {
									return res.status(API_STATUS_UNAUTHORIZED).send(res.__("front.user.login.account_deactivate_contact_to_admin"))
								} else if (result.email_verified == NOT_VERIFIED) {									
									return res.status(API_STATUS_UNAUTHORIZED).send(res.__("front.user.login.email_not_verified"))
								} else {
									return next();
								}
							} else {
								return res.send({
									status: API_STATUS_ERROR,
									result: {},
									statusCode: "user_authorized",
									message: 'Not an authorized user',
								})
							}
						})
					}
				});
			})
		};/** end isUserLogedInApi */
		
		/** Include API Middleware **/
		require(WEBSITE_MODULES_PATH+"home/routes");
		require(WEBSITE_MODULES_PATH+"user/routes");
		require(WEBSITE_MODULES_PATH+"address/routes");
		require(WEBSITE_MODULES_PATH+"product/routes");
	}
};

