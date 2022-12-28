const async = require("async");
const { ObjectId } = require("mongodb");
function ReportedsProducts(req,res){

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

				let collection 	=  db.collection("reported_products");
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
									let:{userId:"$user_id"},
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
									as:"userDetails"
								}
							},
							{
								$lookup:{
									from:'products',
									let:{productId:"$product_id"},
									pipeline:[
										{
											$match:{
												$expr:{
													$and:[
														{ $eq: ["$_id", "$$productId"] }
													]
												}
											}
										},
										{
											$project:{
												product_title : 1
											}
										}
									],
									as:"productDetails"
								}
							},
							{
								$project: {
									created: 1,
									indicative_price: 1,
									user_name: {"$arrayElemAt":["$userDetails.full_name",0]},
									productDetails: {"$arrayElemAt":["$productDetails",0]},
									userDetails: {"$arrayElemAt":["$userDetails",0]},
									description: 1
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
					console.log(response)
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
					req.breadcrumbs(BREADCRUMBS['admin/reported-products']);
					res.render('list',{
						productCount : NOT,
						monthYearWiseData   : {},
						categoryList : result,
					});
				}
			})
		}
	}//End Products

}	
module.exports	=	new ReportedsProducts();
