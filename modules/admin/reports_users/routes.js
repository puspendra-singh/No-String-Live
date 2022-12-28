var modulePath	=	__dirname+'/model/reports_users';
var modelPath	=	'/admin/reports_statistics/';

app.use(modelPath,(req,res,next)=>{
	req.rendering.views		=	__dirname+'/views'
	next();
});

/** Routing is used to registered users **/		
app.all(modelPath+"users",isUserLogedIn,function(req,res,next){	
	var reportStats	=	require(modulePath);
	reportStats.users(req,res,next);
});


/** Routing is used to export data users**/		
app.all(modelPath+'users/:export_data_type/:export_type',isUserLogedIn,function(req,res,next){
	var usersPath	=	require(modulePath);
	usersPath.exportDataUsers(req,res,next);
});
