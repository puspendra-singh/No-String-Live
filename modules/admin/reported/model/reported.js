const async = require("async");
const bcrypt = require("bcryptjs");
function Reported(req, res) {
  
	/** Function to get user list **/
	this.userList	=	(req,res,next)=>{
		if(isPost(req)){
			let limit 		= (req.body.length) 	? parseInt(req.body.length)	:DEFAULT_LIMIT; 
			let skip  		= (req.body.start)  	? parseInt(req.body.start) 	:DEFAULT_SKIP;
			let draw  		= (req.body.draw)   	? parseInt(req.body.draw)	:DEFAULT_SKIP;
			let fromDate  	= (req.body.fromDate)  	? req.body.fromDate 		:'';
			let toDate  	= (req.body.toDate)  	? req.body.toDate 			:'';

			let commonCondition= {
				is_deleted	:	NOT_DELETED,
				role_id		:	ROLE_ID_USER
			};

			dataTableConfig(req,res,null,function(configDataTable){
				configDataTable.search_condition	=	Object.assign(configDataTable.search_condition, commonCondition);

				/**  Date filter */
				if(fromDate && toDate){
					configDataTable.search_condition["created"] = {
						$gte : new Date(fromDate),
						$lte : new Date(toDate)
					}
				}

				const collection  =  db.collection("reported_users");
				async.parallel({
					userList : (callback)=>{
						collection.find(configDataTable.search_condition,{}
						).sort(configDataTable.sort_condition).skip(skip).limit(limit).toArray((errUser, resultUser)=>{
							callback(errUser, resultUser);
						});
					},
					recordsTotol : (callback)=>{
						collection.countDocuments(commonCondition,{},(err, result)=> {
							callback(err, result)
						});
					},
					recordsfiltered : (callback)=>{
						collection.countDocuments(configDataTable.search_condition,{},(err, result)=> {
							callback(err, result)
						});
					},
				},(err, response)=>{
					
					/** Send error message*/
					if(err) return next(err);
					
					return res.send({
						status	 		: STATUS_SUCCESS,
						draw			: draw,
						data 	 		: (response.userList) ? response.userList : [],
						recordsTotal 	: (response.recordsTotol) ? response.recordsTotol : 0,
						recordsFiltered : (response.recordsfiltered) ? response.recordsfiltered : 0,
					});
				});
			});	
		}else{
			req.breadcrumbs(BREADCRUMBS['admin/reported_users/list']);
			res.render('list',{
				breadcrumbs	:	req.breadcrumbs()
			});
		}
	}//End userList

	
	/** Function to view user detail **/
	this.viewUserDetail	=	function(req,res){
		const userId	=	(req.params.id)	?	req.params.id	:'';
		const users 	= db.collection("reported_users");
		users.findOne({_id : ObjectId(userId)},function(errUser, resultUser){
			if(!errUser){
				let countryId   = (resultUser.country) ? resultUser.country :''; 
				let country 	= db.collection("country");
				country.findOne({_id : ObjectId(countryId)},{}, (err, result)=>{
					if(err){
						req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
						res.redirect(WEBSITE_ADMIN_URL+'reported');
					}else{
						resultUser['country'] = (result && result.name) ? result.name :"";
						/** Set option to append image**/
						let options = {
							path 	: USER_FILE_URL,
							result	: [resultUser]
						};
						
						appendFile(options).then(response=>{
							req.breadcrumbs(BREADCRUMBS['admin/reported_users/view']);
							res.render('view',{
								result : (response.result && response.result[0]) ? response.result[0] :{},
								message	 : ''
							});
						});
					}  
				})
			}else{
				req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
				res.redirect(WEBSITE_ADMIN_URL+'reported');	
			}
		});
	}//End viewUserDetail
	
		
	/** Function to delete user detail **/
	this.deleteUserDetail	=	(req,res)=>{
		var userId	=	(req.params.id)	?	req.params.id	:'';
		const users	=	db.collection("reported_users");
		users.updateOne({_id : ObjectId(userId)},{$set:{is_deleted : DELETED,modified : new Date()}},function(errUser, resultUser){
			if(!errUser){
				req.flash(STATUS_SUCCESS,res.__('admin.user.user_has_been_deleted_successfully'));
				res.redirect(WEBSITE_ADMIN_URL+'reported');
			}else{
				req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
				res.redirect(WEBSITE_ADMIN_URL+'reported');
			}
		});
	}//End deleteUserDetail
	
	/** Function to update user status **/
	this.updateUserStatus	=	(req,res)=>{
		var userId	=	(req.params.id)		?	req.params.id	:'';
		var status	=	(req.params.status == ACTIVE)	?	INACTIVE :ACTIVE;
		const users	=	db.collection("reported_users");
		users.updateOne(
			{_id	: ObjectId(userId)},
			{$set:{
				is_active	:	status,
				modified	:	new Date()
			}},(errUser, resultUser)=>{
				if(!errUser){
					req.flash(STATUS_SUCCESS,res.__('admin.user.status_has_been_updated_successfully'));
					res.redirect(WEBSITE_ADMIN_URL+'reported');
				}else{
					req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
					res.redirect(WEBSITE_ADMIN_URL+'reported');
				}
			}
		)
	}//End updateUserStatus

	/** Function to verify user email or phone **/
	this.verifyUser	=	(req,res)=>{
		var userId		=	(req.params.id)		?	req.params.id	:'';
		var status		=	(req.params.status)	?	req.params.status	:'';
		let updateData 	= 	{modified	:	new Date()};
		let message 	= 	'';
		if(status && status =='email'){
			updateData['email_verified'] 	= VERIFIED;
			updateData['validate_string'] 	= '';
			message	=	res.__('admin.user.email_has_been_verified_successfully')
		}

		if(status && status =='phone'){
			updateData['mobile_verified'] = VERIFIED;
			updateData['validate_string'] 	= '';
			message	=	res.__('admin.user.phone_has_been_verified_successfully')
		}
		const users	=	db.collection("users");
		users.updateOne({_id : ObjectId(userId)},{$set:updateData},(errUser, resultUser)=>{
			if(!errUser){
				req.flash(STATUS_SUCCESS,message);
				res.redirect(WEBSITE_ADMIN_URL+'reported');
			}else{
				req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
				res.redirect(WEBSITE_ADMIN_URL+'reported');
			}
		})
	}//End updateUserStatus
}
module.exports = new Reported();