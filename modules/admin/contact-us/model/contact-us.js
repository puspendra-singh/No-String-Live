const async             = require("async");
function ContactUs(req,res){

	/** Function to get contact us list **/
	this.list	=	(req,res,next)=>{
		if(isPost(req)){
			let limit 		= (req.body.length) 	? parseInt(req.body.length)	:DEFAULT_LIMIT; 
			let skip  		= (req.body.start)  	? parseInt(req.body.start) 	:DEFAULT_SKIP;
			let draw  		= (req.body.draw)   	? parseInt(req.body.draw)	:DEFAULT_SKIP;
			let fromDate  	= (req.body.fromDate)  	? req.body.fromDate 		:'';
			let toDate  	= (req.body.toDate)  	? req.body.toDate 			:'';

			
			let commonCondition= {};
			dataTableConfig(req,res,null,function(configDataTable){
				configDataTable.search_condition	=	Object.assign(configDataTable.search_condition, commonCondition);

				/**  Date filter */
				if(fromDate && toDate){
					configDataTable.search_condition["created"] = {
						$gte : new Date(fromDate),
						$lte : new Date(toDate)
					}
				}

				const collection  =  db.collection("contact_us");
				async.parallel({
					userList : (callback)=>{
						collection.aggregate([
							{$match:configDataTable.search_condition},
							{$project:{
								name  : 1, email: 1, description : 1, created: 1
							}}
						]).sort(configDataTable.sort_condition).skip(skip).limit(limit).toArray((errUser, resultUser)=>{
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
			req.breadcrumbs(BREADCRUMBS['admin/contactus/list']);
			res.render('list',{
				breadcrumbs	:	req.breadcrumbs()
			});
		}
	}//End List

	/** Function to update status **/
	this.updateStatus	=	(req,res)=>{
		var contactId	=	(req.params.id)	?	req.params.id	:'';
		var status		=	(req.params.status)	?	ACTIVE :INACTIVE;
		const collection	=	db.collection("contact-us");
		collection.updateOne({_id : ObjectId(contactId)},{$set:{status : status,modified : new Date()}},(errUser, resultUser)=>{
			if(!errUser){
				req.flash(STATUS_SUCCESS,res.__('admin.contact_us.status_has_been_updated_successfully'));
				res.redirect(WEBSITE_ADMIN_URL+'contact-us');
			}else{
				req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
				res.redirect(WEBSITE_ADMIN_URL+'contact-us');
			}
		})
	}//End updateStatus
}	
module.exports	=	new ContactUs();
