var modulePath	=	__dirname+'/model/reported_products';
var modelPath	=	'/admin/reported-product/';

app.use(modelPath,(req,res,next)=>{
	req.rendering.views		=	__dirname+'/views'
	next();
});

/** Routing is used to registered Products **/		
app.all(modelPath,isUserLogedIn,function(req,res,next){	
	var reportStats	= require(modulePath);
	reportStats.products(req,res,next);
});