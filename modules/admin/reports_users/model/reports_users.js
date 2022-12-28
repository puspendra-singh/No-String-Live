const async = require("async");
function ReportsUsers(req,res){

	let exportFilteredConditionUser = {};
	let exportConditionUser         = {};

	/** Function to get all registered users list **/
	this.users	=	(req,res,next)=>{
		if(isPost(req)){
			let limit 		= (req.body.length) 	? parseInt(req.body.length)	:DEFAULT_LIMIT; 
			let skip  		= (req.body.start)  	? parseInt(req.body.start) 	:DEFAULT_SKIP;
			let draw  		= (req.body.draw)   	? parseInt(req.body.draw)	:DEFAULT_SKIP;
			let fromDate  	= (req.body.fromDate)  	? req.body.fromDate 		:'';
			let toDate  	= (req.body.toDate)  	? req.body.toDate 			:'';
			let sellerName  	= (req.body.user_name)  	? req.body.user_name 			:'';

			let commonCondition	= {role_id : ROLE_ID_USER, is_deleted : NOT_DELETED};

			dataTableConfig(req,res,null,function(configDataTable){
				
				/**  Date filter */
				if(fromDate && toDate){
					configDataTable.search_condition["created"] = {
						$gte : new Date(fromDate),
						$lte : new Date(toDate)
					}
				}

				configDataTable.search_condition	=	Object.assign(configDataTable.search_condition, commonCondition);

				/** manage condition if searched by name */
				if(sellerName){
					configDataTable.search_condition.full_name={ $regex: sellerName, $options: "i" }
				}
				/** Set to export data */
				exportFilteredConditionUser	=	Object.assign(configDataTable.search_condition, commonCondition);
				exportConditionUser			=	Object.assign(exportConditionUser, commonCondition);

				let collection 	=  db.collection("users");
				async.parallel({
					recordsTotol : (callback)=>{
						collection.countDocuments(commonCondition,{},(err, result)=> {
							callback(err, result)
						});
					},
					userList : (callback)=>{
						collection.aggregate([
							{$match:configDataTable.search_condition},

						]).sort(configDataTable.sort_condition).skip(skip).limit(limit).toArray((errUser, resultUser)=>{
							callback(errUser, resultUser);
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
						recordsTotal 	: (response.recordsTotol) ? response.recordsTotol : NOT,
						recordsFiltered : (response.recordsfiltered) ? response.recordsfiltered : NOT,
					});
				});
			});	
		}else{
			req.breadcrumbs(BREADCRUMBS['admin/reports_statistics/users']);
			res.render('list',{
				userCount 			: NOT,
				monthYearWiseData   : {}
			});
		}
	}//End users




	/** Function to export data users **/
	this.exportDataUsers = function (req, res ,next) {
		let exportType 		= (req.params.export_type) ? req.params.export_type : '';
		let exportDataType 	= (req.params.export_data_type) ? req.params.export_data_type : '';
		let condition 		= (exportDataType == 'export_all') ? exportConditionUser : exportFilteredConditionUser;

		const collection = db.collection("users");
		collection.aggregate([
			{$match:condition},
			{$lookup:{
                from: "masters",
                let: { countryId : "$country_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$countryId"] },
                      ],
                    },
                  }},
                  { $project: { _id: 1, name: 1 } },
                ],
                as: "countryDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { countryId : "$city_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$countryId"] },
                      ],
                    },
                  }},
                  { $project: { _id: 1, name: 1 } },
                ],
                as: "cityDetail",
            }},
            {$lookup:{
                from: "masters",
                let: { domainId : "$domain_id" },
                pipeline: [
                  {$match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$domainId"] },
                      ],
                    },
                  }},
                  { $project: { _id: 1, name: 1 } },
                ],
                as: "domainDetail",
			}},
			{$project:{
                email : 1, full_name:1,phone:1,email_verified:1,created: 1,
                country_name   : {'$arrayElemAt' :['$countryDetail.name',0]},
                city_name      : {'$arrayElemAt' :['$cityDetail.name',0]},
                domain_name    : {'$arrayElemAt' :['$domainDetail.name',0]},
              }} 
			]).sort({created : SORT_DESC}).toArray((err, result)=>{
			if(err) return next(err);
			let options = {};

			/** Export To pdf */
			if(exportType == 'pdf'){
				let thead = '';
				let body  = '';
				
				thead = '<thead> <th>Full Name </th><th>Email </th><th>Phone</th><th>Created Date</th></thead>';
				if(result.length > NOT){
					result.map((records,index)=>{
						body += '<tr>'+
						'<td>'+ records.full_name+ '</td>'+
						'<td>'+ records.email+'</td>'+
						'<td>'+ records.phone.number+'</td>'+
						'<td>'+ getUtcDate(records.created, "dd-mm-yyyy") + '</td>'+
						'</tr>'
					});
				}
				
				let html = '<table border="1" cellpadding="8" cellspacing="0">'+thead+'<tbody>'+body+'</tbody>'+'</table>';
				options['export_type'] 	= exportType;
				options['result'] 		= html;
				options['file_name'] 	= 'users';
				// res.send({data:html});
				// return;
				exportData(req, res, options)
			}

			/** Export To xlsx */
			if(exportType == 'xlsx'){
				let tempData = [];
				
				if(result.length > NOT){
					result.map((records,index)=>{
						tempData[index]  = {
							'Full Name' : (records.full_name)  	? records.full_name  : 'N/A', 
							'Email'     : (records.email) 		? records.email : 'N/A',
							'Phone' : (records.phone.number)  	? records.phone.number :'N/A',
							'Created Date'     	: (records.created)  	? getUtcDate(records.created, "dd-mm-yyyy") :'N/A',
						};
					})
				}
				
				options['export_type'] 	= exportType;
				options['file_name'] 	= 'users';
				options['result'] 		= tempData;
				exportData(req, res, options)
			}
		});
	}// exportDataUsers
}	
module.exports	=	new ReportsUsers();
