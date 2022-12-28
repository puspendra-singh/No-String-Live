const async = require("async");
const { ObjectId } = require("mongodb");
function ReportsProducts(req,res){

	let exportFilteredConditionProduct = {};
	let exportConditionProduct         = {};

	/** Function to get all registered Products list **/
	this.products = (req,res,next)=>{
		if(isPost(req)){
			let limit 		= (req.body.length) 	? parseInt(req.body.length)	:DEFAULT_LIMIT; 
			let skip  		= (req.body.start)  	? parseInt(req.body.start) 	:DEFAULT_SKIP;
			let draw  		= (req.body.draw)   	? parseInt(req.body.draw)	:DEFAULT_SKIP;
			let fromDate  	= (req.body.fromDate)  	? req.body.fromDate 		:'';
			let toDate  	= (req.body.toDate)  	? req.body.toDate 			:'';
			let category  	= (req.body.category)  	? req.body.category 			:'';
			const sellerName  	= (req.body.seller_name)  	? req.body.seller_name 			:'';

			let commonCondition	= {is_deleted : NOT_DELETED};

			dataTableConfig(req,res,null,function(configDataTable){
				
				/**  Date filter */
				if(fromDate && toDate){
					configDataTable.search_condition["created"] = {
						$gte : new Date(fromDate),
						$lte : new Date(toDate)
					}
				}
				let sellerNameFilter = {};
				if(sellerName){
					sellerNameFilter={
						seller_name:{ $regex: sellerName, $options: 'i' }
					}
				}
				if(category){
					configDataTable.search_condition.category=ObjectId(category);
				}
				configDataTable.search_condition	=	Object.assign(configDataTable.search_condition, commonCondition);

				/** Set to export data */
				exportFilteredConditionProduct	=	Object.assign(configDataTable.search_condition, commonCondition);
				exportConditionProduct			=	Object.assign(exportConditionProduct, commonCondition);

				let collection 	=  db.collection("products");
				async.parallel({
					recordsTotol : (callback)=>{
						collection.countDocuments(commonCondition,{},(err, result)=> {
							callback(err, result)
						});
					},
					productList : (callback)=>{
						collection.aggregate([
							{
								$match: configDataTable.search_condition
							},
							{
								$lookup:{
									from:'users',
									let:{userId:"$user"},
									pipeline:[
										{
											$match:{
												$expr:{
													$and:[
														{ $eq: ["$_id", "$$userId"] }
													]
												}
											}
										},
										{
											$project:{
												full_name : 1
											}
										}
									],
									as:"sellerDetails"
								}
							},
							{
								$lookup:{
									from:'masters',
									let:{categoryId:"$category"},
									pipeline:[
										{
											$match:{
												$expr:{
													$and:[
														{ $eq: ["$_id", "$$categoryId"] }
													]
												}
											}
										},
										{
											$project:{
												name : 1
											}
										}
									],
									as:"category"
								}
							},
							{
								$project: {
									created: 1,
									quantity: 1,
									product_title: 1,
									indicative_price: 1,
									seller_name:{"$arrayElemAt":["$sellerDetails.full_name",0]},
									sellerDetails: {"$arrayElemAt":["$sellerDetails",0]},
									category:{"$arrayElemAt":["$category",0]}
								}
							},
							{
								$match:sellerNameFilter
							}
						]).sort(configDataTable.sort_condition).skip(skip).limit(limit).toArray((errProduct, resultProduct)=>{
							callback(errProduct, resultProduct);
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
						data 	 		: (response.productList) ? response.productList : [],
						recordsTotal 	: (response.recordsTotol) ? response.recordsTotol : NOT,
						recordsFiltered : (response.recordsfiltered) ? response.recordsfiltered : NOT,
					});
				});
			});	
		}else{
			db.collection('masters').aggregate([
				{
					$match:{
						key : 'category',
						is_deleted : NOT_DELETED,
						is_active : ACTIVE
					}
				}
			]).toArray((err,result)=>{
				if(!err && result){
					req.breadcrumbs(BREADCRUMBS['admin/reports_statistics/products']);
					res.render('list',{
						productCount : NOT,
						monthYearWiseData   : {},
						categoryList : result,
					});
				}
			})
		}
	}//End Products




	/** Function to export data Products **/
	this.exportDataProducts = function (req, res ,next) {
		let exportType 		= (req.params.export_type) ? req.params.export_type : '';
		let exportDataType 	= (req.params.export_data_type) ? req.params.export_data_type : '';
		let condition 		= (exportDataType == 'export_all') ? exportConditionProduct : exportFilteredConditionProduct;

		const collection = db.collection("products");
		collection.aggregate([
			{$match:condition},
			{$project:{
				created: 1,
				quantity: 1,
				product_title: 1,
				indicative_price: 1
              }} 
			]).sort({created : SORT_DESC}).toArray((err, result)=>{
			if(err) return next(err);
			let options = {};

			/** Export To pdf */
			if(exportType == 'pdf'){
				let thead = '';
				let body  = '';
				
				thead = '<thead> <th>Product Name </th><th>Price </th><th>Quantity</th><th>Created Date</th></thead>';
				if(result.length > NOT){
					result.map((records,index)=>{
						body += '<tr>'+
						'<td>'+ records.product_title+ '</td>'+
						'<td>'+ records.indicative_price+'</td>'+
						'<td>'+ records.quantity+'</td>'+
						'<td>'+ getUtcDate(records.created, "dd-mm-yyyy") + '</td>'+
						'</tr>'
					});
				}
				
				let html = '<table border="1" cellpadding="8" cellspacing="0">'+thead+'<tbody>'+body+'</tbody>'+'</table>';
				options['export_type'] 	= exportType;
				options['result'] 		= html;
				options['file_name'] 	= 'products';
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
							'Product Name' : (records.product_title)  	? records.product_title  : 'N/A', 
							'Price'     : (records.indicative_price) 		? records.indicative_price : 'N/A',
							'Quantity' : (records.quantity)  	? records.quantity :'N/A',
							'Created Date'     	: (records.created)  	? getUtcDate(records.created, "dd-mm-yyyy") :'N/A',
						};
					})
				}
				
				options['export_type'] 	= exportType;
				options['file_name'] 	= 'products';
				options['result'] 		= tempData;
				exportData(req, res, options)
			}
		});
	}// exportDataProducts
}	
module.exports	=	new ReportsProducts();
