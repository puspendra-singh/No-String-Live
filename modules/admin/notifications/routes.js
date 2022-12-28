const { body } = require('express-validator');
var modulePath	=	__dirname+'/model/notifications';
var modelPath	=	'/admin/notifications';
	
	app.use(modelPath,(req,res,next)=>{
		req.rendering.views		=	__dirname+'/views'
		next();
	});
	
	/** Routing is used to get listing **/		
	app.all(modelPath,isUserLogedIn,(req,res)=>{
		var notifications	=	require(modulePath);
		notifications.list(req,res);
	});

	app.get(modelPath+'/edit/:id',isUserLogedIn,(req,res)=>{
		let id				=	(req.params.id)	?	req.params.id	:'';
		const collection 	= db.collection("notification_templates");
		var notifications	=	require(modulePath);
		collection.findOne({_id:	ObjectId(id)},(err, result)=>{
			if(!err){
				req.breadcrumbs(BREADCRUMBS['admin/notifications/edit']);
				res.render('edit',{
					result : (result) ? result :{},
					message	 : ''
				});
			}else{
				req.flash(STATUS_ERROR,res.__('admin.system.something_went_wrong'));
				res.redirect(WEBSITE_ADMIN_URL+'notifications');	
			}
		});
	});
	/** Routing is used to edit detail**/		
	app.post(modelPath+'/edit/:id', isUserLogedIn, async (req,res)=>{

		await body("name")
			.trim()
			.not()
			.isEmpty()
			.withMessage(res.__("admin.user.please_enter_name"))
      .isLength({min: MIN_CHARACTER_NAME_LIMIT, max: MAX_CHARACTER_NAME_LIMIT})
			.withMessage(res.__("admin.user.name_should_be_2_to_20_characters_long"))
			.matches(NAME_REGEX)
			.withMessage(res.__("admin.user.name_should_be_valid"))
			.run(req),
		await body("subject")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_subject"))
      .isLength({ min: MIN_CHARACTER_TITLE_LIMIT, max: MAX_CHARACTER_TITLE_LIMIT })
      .withMessage(res.__("admin.user.subject_should_be_2_to_50_characters_long"))
      .matches(NAME_REGEX)
      .withMessage(res.__("admin.user.subject_should_be_valid"))
      .run(req);
		await body("description")
      .trim()
      .not()
      .isEmpty()
      .withMessage(res.__("admin.user.please_enter_description"))
      .isLength({ min: MIN_CHARACTER_DESCRIPTION_LIMIT, max: MAX_CHARACTER_DESCRIPTION_LIMIT })
      .withMessage(res.__("admin.user.description_should_be_2_to_20000_characters_long"))
      .run(req)
	
		var notifications	=	require(modulePath);
		notifications.editDetail(req,res);
	});

	/** Routing is used to update detail**/		
	app.all(modelPath+'/update_status/:id/:status',isUserLogedIn,(req,res)=>{
		var notifications	=	require(modulePath);
		notifications.updateStatus(req,res);
	});
	
