var modulePath	=	__dirname+'/model/reports_statistics';
var modelPath	=	'/admin/reports_statistics/';

app.use(modelPath,(req,res,next)=>{
	req.rendering.views		=	__dirname+'/views'
	next();
});

/** Routing is used to registered users **/		
app.all(modelPath,isUserLogedIn,function(req,res,next){	
	var reportStats	=	require(modulePath);
	reportStats.users(req,res,next);
});


/** Routing is used to export data users**/		
app.all(modelPath+':export_data_type/:export_type',isUserLogedIn,function(req,res,next){
	var payment	=	require(modulePath);
	payment.exportDataUsers(req,res,next);
});
