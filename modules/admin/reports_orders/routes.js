var modulePath	=	__dirname+'/model/reports_orders';
var modelPath	=	'/admin/reports_statistics/';

app.use(modelPath,(req,res,next)=>{
	req.rendering.views		=	__dirname+'/views'
	next();
});

/** Routing is used to registered orders **/		
app.all(modelPath+"orders",isUserLogedIn,function(req,res,next){	
	var reportStats	=	require(modulePath);
	reportStats.orders(req,res,next);
});


/** Routing is used to export data orders**/		
app.all(modelPath+'orders/:export_data_type/:export_type',isUserLogedIn,function(req,res,next){
	var ordersPath	=	require(modulePath);
	ordersPath.exportDataOrders(req,res,next);
});
