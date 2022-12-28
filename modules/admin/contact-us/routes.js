var modulePath	=	__dirname+'/model/contact-us';
var modelPath	=	'/admin/contact-us';
	
	app.use(modelPath,(req,res,next)=>{
		req.rendering.views		=	__dirname+'/views'
		next();
	});
	
	/** Routing is used to get feedback listing **/		
	app.all(modelPath,isUserLogedIn,function(req,res){
		var feedback	=	require(modulePath);
		feedback.list(req,res);
	});

	/** Routing is used to approved contact us detail status **/		
	app.all(modelPath+'/update_status/:id/:status',isUserLogedIn,function(req,res){
		var feedback	=	require(modulePath);
		feedback.updateStatus(req,res);
	});
	
	
	
