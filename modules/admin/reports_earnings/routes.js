var modulePath	=	__dirname+'/model/reports_earnings';
var modelPath	=	'/admin/reports_statistics/';

app.use(modelPath,(req,res,next)=>{
	req.rendering.views		=	__dirname+'/views'
	next();
});

/** Routing is used to earnings **/		
app.all(modelPath+"earnings",isUserLogedIn,function(req,res,next){	
	var reportStats	=	require(modulePath);
	reportStats.earnings(req,res,next);
});


/** Routing is used to export earnings **/		
app.all(modelPath+'earnings/:export_data_type/:export_type',isUserLogedIn,function(req,res,next){
	var earningsPath	=	require(modulePath);
	earningsPath.exportDataearnings(req,res,next);
});
