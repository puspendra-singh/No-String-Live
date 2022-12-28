const async = require("async");
function Faq() {

  /** Function to get list **/
  this.list = (req, res, next) => {
    if (isPost(req)) {
      let limit = req.body.length   ? parseInt(req.body.length) : DEFAULT_LIMIT;
      let skip  = req.body.start    ? parseInt(req.body.start)  : DEFAULT_SKIP;
      let draw  = req.body.draw     ? parseInt(req.body.draw)   : DEFAULT_SKIP;

      let commonCondition = { is_deleted: NOT_DELETED };
      dataTableConfig(req,res,null,function(configDataTable){
        configDataTable.search_condition = Object.assign(configDataTable.search_condition,commonCondition );
        const collection = db.collection("faqs");
        async.parallel(
          {
            list: (callback) => {
              collection.find(configDataTable.search_condition, {}).skip(skip).limit(limit).sort(configDataTable.sort_condition).toArray((errUser, resultUser) => {
                  callback(errUser, resultUser);
                });
            },
            recordsTotol: (callback) => {
              collection.countDocuments(commonCondition, {}, (err, result) => {
                callback(err, result);
              });
            },
            recordsfiltered: (callback) => {
              collection.countDocuments(configDataTable.search_condition,{},(err, result) => {
                  callback(err, result);
                }
              );
            },
          },
          (err, response) => {
            /** Send error message */
            if (err) return next(err);

            res.send({
              status          : STATUS_SUCCESS,
              draw            : draw,
              data            : response.list ? response.list : [],
              recordsTotal    : response.recordsTotol ? response.recordsTotol : 0,
              recordsFiltered : response.recordsfiltered ? response.recordsfiltered : 0,
            });
          }
        );
      });
    } else {
      req.breadcrumbs(BREADCRUMBS["admin/faq/list"]);
      res.render("list", {
        breadcrumbs: req.breadcrumbs(),
      });
    }
  }; //End List

  /** Function is used to add faq */
  this.getAdd = async (req, res, next) => {
    
    let faqCategoryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'faq_category',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };
    let faqCategoryList     = await getDropdownList(faqCategoryOptions);
      req.breadcrumbs(BREADCRUMBS["admin/faq/add"]);
      res.render("add",{
        faq_category_list     : faqCategoryList.result,
      });
    
  }; //End getAdd

  this.postAdd = async (req, res, next) => {
    
        let question   = req.body.question  ? req.body.question : "";
        let answer     = req.body.answer    ? req.body.answer : "";
        let category   = req.body.category  ? ObjectId(req.body.category) : {};
    

        const collection = db.collection("faqs");
        collection.insertOne(
          {
            question    : question,
            answer      : answer,
            category    : category,
            is_active   : ACTIVE,
            is_deleted  : NOT_DELETED,
            created     : new Date(),
          },
          function (err, result) {
            if (!err) {
              req.flash(STATUS_SUCCESS,res.__("admin.faq.faq_has_been_added_successfully"));
              res.send({
                status: STATUS_SUCCESS,
                message: '',
                rediect_url: "/admin/faq",
              });
            } else {
              req.flash(STATUS_ERROR,res.__("admin.system.something_went_wrong"));
              res.send({
                status      : STATUS_ERROR,
                message     : '',
                rediect_url : "/admin/faq",
              });
            }
          }
        );
      
  }; //End add

  /** Function to edit detail **/
  this.getEdit = function (req, res) {
    let faqId = req.params.id ? req.params.id : "";

    let faqCategoryOptions = {
      collection_name: 'masters',
      search_condition: {
        is_active: ACTIVE,
        is_deleted: NOT_DELETED,
        key: 'faq_category',
      },
      get_condition: { name: 1 },
      sort: { name: 1 },
      skip: NO_SKIP,
      limit: NO_LIMIT,
      selected: '',
    };

    var collection = db.collection("faqs");
    collection.findOne({ _id: ObjectId(faqId) }, async (err, result)=> {
      if (!err) {
        faqCategoryOptions.selected=result.category;
        let faqCategoryList     = await getDropdownList(faqCategoryOptions);
        req.breadcrumbs(BREADCRUMBS["admin/faq/edit"]);
        res.render("edit", {
          result  : result ? result : {},
          message : "",
          faq_category_list : faqCategoryList.result,
        });
      } else {
        req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
        res.redirect(WEBSITE_ADMIN_URL + "faq");
      }
    });
    
  }; //End editDetail

  this.postEdit = function (req, res) {
    let faqId = req.params.id ? req.params.id : "";
    let category   = req.body.category  ? ObjectId(req.body.category) : {};
      let question   = req.body.question  ? req.body.question : "";
      let answer     = req.body.description   ? req.body.description : "";

        const collection = db.collection("faqs");
        collection.updateOne({ _id: ObjectId(faqId) },{ $set: { question: question, answer : answer,category : category, modified: new Date()}},(err, result)=> {
          if (!err) {
            req.flash(STATUS_SUCCESS,res.__("admin.faq.faq_has_been_updated_successfully"));
            res.send({
              status      : STATUS_SUCCESS,
              message     : '',
              rediect_url : "/admin/faq",
            });
          } else {
            req.flash(STATUS_ERROR,res.__("admin.system.something_went_wrong"));
            res.send({
              status      : STATUS_ERROR,
              message     : '',
              rediect_url : "/admin/faq",
            });
          }
        });
      
  }; //End editDetail

  /** Function to delete detail **/
  this.deleteDetail   =  (req, res)=>{
    var faqId         = req.params.id ? req.params.id : "";
    const collection  = db.collection("faqs");
    collection.updateOne({ _id: ObjectId(faqId) },{ $set: { is_deleted: DELETED, modified: new Date()}},(err, result)=> {
        if (!err) {
          req.flash(STATUS_SUCCESS,res.__("admin.faq.faq_has_been_deleted_successfully"));
          res.redirect(WEBSITE_ADMIN_URL + "faq");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "faq");
        }
      }
    );
  }; //End deleteDetail

  /** Function to update status **/
  this.updateStatus =  (req, res)=> {
    var faqId = req.params.id ? req.params.id : "";
    var status = req.params.status == ACTIVE ? INACTIVE : ACTIVE;
    const collection = db.collection("faqs");
    collection.updateOne({ _id: ObjectId(faqId) },{$set: {is_active: status,modified: new Date()}},(err, result)=> {
        if (!err) {
          req.flash(STATUS_SUCCESS,res.__("admin.faq.status_has_been_updated_successfully"));
          res.redirect(WEBSITE_ADMIN_URL + "faq");
        } else {
          req.flash(STATUS_ERROR, res.__("admin.system.something_went_wrong"));
          res.redirect(WEBSITE_ADMIN_URL + "faq");
        }
      }
    );
  }; //End updateStatus
}
module.exports = new Faq();
