var modulePath	=	__dirname+'/model/reports_products';
var modelPath	=	'/admin/reports_statistics/';

app.use(modelPath,(req,res,next)=>{
	req.rendering.views		=	__dirname+'/views'
	next();
});

/** Routing is used to registered Products **/		
app.all(modelPath+"products",isUserLogedIn,function(req,res,next){	
	var reportStats	=	require(modulePath);
	reportStats.products(req,res,next);
});


/** Routing is used to export data Products**/		
app.all(modelPath+'products/:export_data_type/:export_type',isUserLogedIn,function(req,res,next){
	var productReport	=	require(modulePath);
	productReport.exportDataProducts(req,res,next);
});
