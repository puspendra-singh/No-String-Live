const { body, validationResult } = require('express-validator');
var modulePath	=	__dirname+'/model/masters';
var modelPath	=	'/admin/masters';
    
	app.use(modelPath,(req,res,next)=>{
		req.rendering.views		=	__dirname+'/views'
		next();
	});

    /** Routing is used to master listing **/
	app.all(modelPath+'/:key',isUserLogedIn,function(req,res,next){
		var master	=	require(modulePath);
		master.masterList(req,res,next);
	});
    
    /** Routing is used to add master **/
	app.get(modelPath+'/:key/add',isUserLogedIn,function(req,res,next){	
		var master	=	require(modulePath);
		master.getAddMaster(req,res,next);
	});

	app.post(modelPath+'/:key/add',isUserLogedIn, async (req,res,next) => {
		var key   = req.params.key ? req.params.key : "";
		if(key == 'wattage'){
			await body('name')
			.trim()
			.not()
			.isEmpty()
			.withMessage(res.__("admin.master.please_enter_name"))
			.isLength({min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT})
			.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
			.run(req);
		}else{
			await body('name')
			.trim()
			.not()
			.isEmpty()
			.withMessage(res.__("admin.master.please_enter_name"))
			.isLength({min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT})
			.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
			.matches("^([a-z|A-Z]){2,}((?: [a-z|A-Z]{2,})){0,2}$")
			.withMessage(res.__("admin.master.name_should_be_valid"))
			.run(req);
		}
		
		if(key == 'city'){
			await body('country')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_select_country"))
				.isLength({min : MIN_ID_LIMIT, max : MAX_ID_LIMIT})
				.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
				.run(req);
			
			await body('state')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_select_state"))
				.isLength({min : MIN_ID_LIMIT, max : MAX_ID_LIMIT})
				.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
				.run(req);
		}

		if(key == 'state'){
			await body('country')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_select_country"))
				.isLength({min : MIN_ID_LIMIT, max : MAX_ID_LIMIT})
				.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
				.run(req);
		}
		if(key == 'country'){
			await body('country_code')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_enter_country_code"))
				.isLength({min : MIN_COUNTRY_CODE_LIMIT, max : MAX_COUNTRY_CODE_LIMIT})
				.withMessage(res.__("admin.country_code_should_contain_between_2_to_6_characters"))
				.isAlpha('en-US')
				.withMessage(res.__("admin.master.country_code_should_be_in_alphabets"))
				.run(req);
		}
      
			let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
			
			if(key == 'brandlist'){
				if(req.files && req.files.brand_image){
					let file = (req.files) ? req.files.brand_image : {};
					if (Object.keys(file).length == 0) {
					  errors.push({location : 'files',param:'brand_image',msg:res.__("admin.team.image_is_required"), value:''})
					}
				  }else{
					errors.push({location : 'files',param:'brand_image',msg:res.__("admin.team.image_is_required"), value:''})
				  }
			}

			if(key == 'doc_preview'){
				if(req.files && req.files.id_document_image){
					let file = (req.files) ? req.files.id_document_image : {};
					if (Object.keys(file).length == 0) {
					  errors.push({location : 'files',param:'id_document_image',msg:res.__("admin.user.id_document_image_is_required"), value:''})
					}
				  }else{
					errors.push({location : 'files',param:'id_document_image',msg:res.__("admin.user.id_document_image_is_required"), value:''})
				  }
			}

			if (errors.length !== 0) {
				res.send({
					// status: STATUS_ERROR,
					message: errors,
				});
			}
			else{
				
				var master	=	require(modulePath);
				master.postAddMaster(req,res,next);
			}
    });
    
	/** Routing is used to view detail **/
	app.get(modelPath+'/:key/view/:id',isUserLogedIn,function(req,res,next){
		var master	=	require(modulePath);
		master.viewDetail(req,res,next);
	});
    
	/** Routing is used to edit detail **/
	app.get(modelPath+'/:key/edit/:id', isUserLogedIn,function(req,res,next){
		var master	=	require(modulePath);
		master.getEditMaster(req,res,next);
	});

	app.post(modelPath+'/:key/edit/:id', async (req, res, next) => {
		var key   = req.params.key ? req.params.key : "";
		await body('name')
			.trim()
			.not()
			.isEmpty()
			.withMessage(res.__("admin.master.please_enter_name"))
			.isLength({min : MIN_CHARACTER_NAME_LIMIT, max : MAX_CHARACTER_NAME_LIMIT})
			.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
			.matches("^([a-z|A-Z]){2,}((?: [a-z|A-Z]{2,})){0,2}$")
			.withMessage(res.__("admin.master.name_should_be_valid"))
			.run(req)
			
		if(key === 'city'){
			await body('country')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_select_country"))
				.isLength({min : MIN_ID_LIMIT, max : MAX_ID_LIMIT})
				.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
				.run(req);
			
			await body('state')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_select_state"))
				.isLength({min : MIN_ID_LIMIT, max : MAX_ID_LIMIT})
				.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
				.run(req);
		}

		if(key === 'state'){
			await body('country')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_select_country"))
				.isLength({min : MIN_ID_LIMIT, max : MAX_ID_LIMIT})
				.withMessage(res.__("system.name_limit.this_value_should_contain_minimum_and_maximum_character"))
				.run(req);
		}
		if(key == 'country'){
			await body('country_code')
				.trim()
				.not()
				.isEmpty()
				.withMessage(res.__("admin.master.please_enter_country_code"))
				.isLength({min : MIN_COUNTRY_CODE_LIMIT, max : MAX_COUNTRY_CODE_LIMIT})
				.withMessage(res.__("admin.country_code_should_contain_between_2_to_6_characters"))
				.isAlpha('en-US')
				.withMessage(res.__("admin.master.country_code_should_be_in_alphabets"))
				.run(req);
		}
			let errors = uniqueValidations(validationResult(req).array({onlyFirstError: true}));
			var key   = req.params.key ? req.params.key : "";

        if (errors.length !== 0) {
					res.send({
						message: errors,
						rediect_url: "/admin/masters/" + key,
					});
        }
				else{
					var master	=	require(modulePath);
					master.postEditMaster(req,res,next);
        }
    });
    
    /** Routing is used to update status **/
	app.all(modelPath+'/:key/update_status/:id/:status',isUserLogedIn,function(req,res,next){
		var master	=	require(modulePath);
		master.updateStatus(req,res,next);
	});
    
    /** Routing is used to remove **/
	app.all(modelPath+'/:key/remove/:id',isUserLogedIn,function(req,res,next){
		var master	=	require(modulePath);
		master.remove(req,res,next);
	});

	/** Routing is used to get states **/
	app.post(modelPath + "/city/get_states" , isUserLogedIn, function (req, res) {
		var master = require(modulePath);
		master.getStateList(req, res);
	});
//+ "/city/get_states"