  var modulePath = __dirname + "/model/reported";
  var modelPath = "/admin/reported";

  app.use(modelPath, (req, res, next) => {
    req.rendering.views = __dirname + "/views";
    next();
  });

	/** Routing is used to get users listing **/		
	app.all(modelPath,isUserLogedIn,function(req,res){
		var user	=	require(modulePath);
		user.userList(req,res);
	});
	
	/** Routing is used to view  user detail**/		
	app.get(modelPath+'/view/:id',isUserLogedIn,function(req,res){
		var user	=	require(modulePath);
		user.viewUserDetail(req,res);
	});
	
	/** Routing is used to delete user **/		
	app.all(modelPath+'/delete/:id',isUserLogedIn,function(req,res){
		var user	=	require(modulePath);
		user.deleteUserDetail(req,res);
	});
	
	/** Routing is used to update  user status**/		
	app.all(modelPath+'/update_status/:id/:status',isUserLogedIn,function(req,res){
		var user	=	require(modulePath);
		user.updateUserStatus(req,res);
	});

	/** Routing is used to verify  user email or phone **/		
	app.all(modelPath+'/verify/:id/:status',isUserLogedIn,function(req,res){
		var user	=	require(modulePath);
		user.verifyUser(req,res);
	});


