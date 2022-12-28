const async  = 	require("async");
const { validationResult } = require('express-validator');
function Notification(req,res){

	/** Function to get list **/
	this.list	=	(req,res,next)=>{
		if(isPost(req)){
			let limit = (req.body.length) ? parseInt(req.body.length):	DEFAULT_LIMIT; 
			let skip  = (req.body.start)  ? parseInt(req.body.start) :	DEFAULT_SKIP;
			let draw  = (req.body.draw)   ? parseInt(req.body.draw)	 :	DEFAULT_SKIP;
			
			let commonCondition= {}

			dataTableConfig(req,res,null,function(configDataTable){
				configDataTable.search_condition	=	Object.assign(configDataTable.search_condition, commonCondition);
				const collection  =  db.collection("notification_templates");
				async.parallel({
					userList : (callback)=>{
						collection.find(configDataTable.search_condition,{}
						).sort(configDataTable.sort_condition).skip(skip).limit(limit).toArray((err, result)=>{
							callback(err, result);
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
					
					res.send({
						status	 		: STATUS_SUCCESS,
						draw			: draw,
						data 	 		: (response.userList) ? response.userList : [],
						recordsTotal 	: (response.recordsTotol) ? response.recordsTotol : 0,
						recordsFiltered : (response.recordsfiltered) ? response.recordsfiltered : 0,
					});
				});
			});	
		}else{
			req.breadcrumbs(BREADCRUMBS['admin/notifications/list']);
			res.render('list',{
				breadcrumbs	:	req.breadcrumbs()
			});
		}
	}//End list

	
	/** Function to edit detail **/
	this.editDetail	=	(req,res)=>{
		let id				=	(req.params.id)	?	req.params.id	:'';
		const collection 	= db.collection("notification_templates");
		// if(isPost(req)){
			// req.body  = sanitizeData(req.body, NOT_ALLOWED_TAGS);
			// req.checkBody({
			// 	name: {
			// 		isLength :{
			// 			options    : {min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT},
			// 			errorMessage:res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character")
			// 		},
			// 		notEmpty: true,
			// 		errorMessage: res.__("admin.email_templates.please_enter_name"),
			// 	},
			// 	subject: {
			// 		isLength :{
			// 			options    : {min : MIN_CHARACTER_TITLE_LIMIT, max : MAX_CHARACTER_TITLE_LIMIT},
			// 			errorMessage:res.__("system.title_limit.this_value_should_contain_minimum_and_maximum_character")
			// 		},
			// 		notEmpty: true,
			// 		errorMessage: res.__("admin.email_templates.please_enter_subject"),
			// 	},
			// 	description: {
			// 		isLength :{
			// 			options    : {min : MIN_CHARACTER_DESCRIPTION_LIMIT, max : MAX_CHARACTER_DESCRIPTION_LIMIT},
			// 			errorMessage:res.__("system.description_limit.this_value_should_contain_minimum_and_maximum_character")
			// 		},
			// 		notEmpty: true,
			// 		errorMessage: res.__("admin.email_templates.please_enter_description"),
			// 	},
			// });

			var errors = uniqueValidations(validationResult(req).errors);
    if (errors.length === 0) {
				let name        = req.body.name         ? req.body.name : "";
				let subject     = req.body.subject      ? req.body.subject : "";
				let description = req.body.description  ? req.body.description : "";

				collection.updateOne(
					{ _id: ObjectId(id) },
					{ $set: { name: name, subject : subject, description : description ,modified: new Date() } },
					 (err, result)=> {
					  if (!err) {
						
						req.flash(STATUS_SUCCESS,
						  res.__("admin.email_templates.email_templates_has_been_updated_successfully")
						);
						res.send({
						  status		: STATUS_SUCCESS,
						  message		: '',
						  rediect_url	: "/admin/notifications",
						});
					  } else {
						req.flash(
						  STATUS_ERROR,
						  res.__("admin.system.something_went_wrong")
						);
						res.send({
						  status		: STATUS_ERROR,
						  message		: '',
						  rediect_url	: "",
						});
					  }
					}
				  );
			}else{
				res.send({
					status		: STATUS_ERROR,
					message		: errors,
					rediect_url	: "",
				});
			}
		// }
		// else{
		// 	collection.findOne({_id:	ObjectId(id)},(err, result)=>{
		// 		if(!err){
		// 			req.breadcrumbs(BREADCRUMBS['admin/notifications/edit']);
		// 			res.render('edit',{
		// 				result : (result) ? result :{},
		// 				message	 : ''
		// 			});
		// 		}else{
		// 			req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
		// 			res.redirect(WEBSITE_ADMIN_URL+'notifications');	
		// 		}
		// 	});
		// }
	}//End editDetail


	/** Function to update status **/
	this.updateStatus	=	function(req,res){
		var id		=	(req.params.id)		?	req.params.id	:'';
		var status	=	(req.params.status == ACTIVE)	?	INACTIVE :ACTIVE;
		const users	=	db.collection("notification_templates");
		users.updateOne(
			{_id	: ObjectId(id)},
			{$set:{
				is_active	:	status,
				modified	:	new Date()
			}},function(errUser, resultUser){
				if(!errUser){
					req.flash(STATUS_SUCCESS,res.__('admin.user.status_has_been_updated_successfully'));
					res.redirect(WEBSITE_ADMIN_URL+'notifications');
				}else{
					req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
					res.redirect(WEBSITE_ADMIN_URL+'notifications');
				}
			}
		)
	}//End updateStatus
}	
module.exports	=	new Notification();
