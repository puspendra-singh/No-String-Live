BREADCRUMBS = {
  "admin/users/edit_profile"                   : [{ name: "Profile", url: "", icon: "edit" }],
  "admin/users/list"                           : [{ name: "Users",   url: "", icon: "add" }],
  "admin/users/add"                            : [{ name: "Users",   url: WEBSITE_ADMIN_URL + "users", icon: "add"}, { name: "Add",            url: "", icon: "add" }],
  "admin/users/edit"                           : [{ name: "Users",   url: WEBSITE_ADMIN_URL + "users", icon: "add" },{ name: "Edit",           url: "", icon: "edit"}],
  "admin/users/view"                           : [{ name: "Users",   url: WEBSITE_ADMIN_URL + "users", icon: "add" },{ name: "View",           url: "", icon: "eye" }],
  "admin/users/manage_address"                 : [{ name: "Users",   url: WEBSITE_ADMIN_URL + "users", icon: "add" },{ name: "Manage Address", url: "", icon: "view" }],
  "admin/users/manage_address/shipping_address": [{ name: "Users",   url: WEBSITE_ADMIN_URL + "users", icon: "add" },{ name: "Manage Address", url:WEBSITE_ADMIN_URL + "users/manage_address/{dynamic_variable}", icon: "view" },{ name: "Shipping Address", url: "", icon: "edit" }],
  "admin/users/manage_address/billing_address" : [{ name: "Users",   url: WEBSITE_ADMIN_URL + "users", icon: "add" },{ name: "Manage Address", url: "", icon: "view" },{ name: "Billing Address",  url: "", icon: "edit" }],
  "admin/users/manage_address/add_address": [{ name: "Users", url: WEBSITE_ADMIN_URL + "users", icon: "edit" },{ name: "Add Address", url: "", icon: "edit" }],


  "admin/units/list": [{ name: "Units", url: "", icon: "user" }],
  "admin/units/edit": [{ name: "Units", url: WEBSITE_ADMIN_URL + "units", icon: "user" },{ name: "Edit", url: "", icon: "add" }],
  "admin/units/add" : [{ name: "Units", url: WEBSITE_ADMIN_URL + "units", icon: "user" },{ name: "Add",  url: "", icon: "add" }],

  "admin/masters/list": [{ name: "dynamic_variable", url: "", icon: "user" }],
  "admin/masters/edit": [{name: "dynamic_variable",url: WEBSITE_ADMIN_URL + "masters/{dynamic_variable}",icon: "user",},{ name: "Edit", url: "", icon: "add" }],
  "admin/masters/view": [{name: "dynamic_variable",url: WEBSITE_ADMIN_URL + "masters/{dynamic_variable}",icon: "user",},{ name: "View", url: "", icon: "add" }],
  "admin/masters/add" : [{name: "dynamic_variable",url: WEBSITE_ADMIN_URL + "masters/{dynamic_variable}",icon: "user",},{ name: "Add", url: "", icon: "add" }],

  "admin/text_settings/list": [{ name: "Text-Settings", url: "", icon: "user" }],
  "admin/text_settings/edit": [{name: "Text-Settings",url: WEBSITE_ADMIN_URL + "text_settings/{dynamic_variable}",icon: "user",},{ name: "Edit", url: "", icon: "add" }],
  "admin/text_settings/view": [{name: "Text-Settings",url: WEBSITE_ADMIN_URL + "text_settings/{dynamic_variable}",icon: "user"},{ name: "View", url: "", icon: "add" },],
  "admin/text_settings/add": [{name: "Text-Settings",url: WEBSITE_ADMIN_URL + "text_settings/{dynamic_variable}",icon: "user",},{ name: "Add", url: "", icon: "add" },],

  "admin/faq/list": [{ name: "Faq", url: "", icon: "user" }],
  "admin/faq/edit": [{ name: "Faq", url: WEBSITE_ADMIN_URL + "faq", icon: "user" },{ name: "Edit", url: "", icon: "edit" }],
  "admin/faq/add": [{ name: "Faq", url: WEBSITE_ADMIN_URL + "faq", icon: "user" },{ name: "Add", url: "", icon: "add" }],

  "admin/cms/list": [{ name: "CMS", url: "", icon: "user" }],
  "admin/cms/edit": [{ name: "CMS", url: WEBSITE_ADMIN_URL + "cms", icon: "user" },{ name: "Edit", url: "", icon: "edit" },],
  "admin/cms/view": [{ name: "CMS", url: WEBSITE_ADMIN_URL + "cms", icon: "user" },{ name: "View", url: "", icon: "eye" },],
  "admin/cms/add": [{ name: "CMS", url: WEBSITE_ADMIN_URL + "cms", icon: "user" },{ name: "Add", url: "", icon: "add" },],

  "admin/team/list": [{ name: "Team", url: "", icon: "user" }],
  "admin/team/edit": [{ name: "Team", url: WEBSITE_ADMIN_URL + "team", icon: "user" },{ name: "Edit", url: "", icon: "edit" },],
  "admin/team/view": [{ name: "Team", url: WEBSITE_ADMIN_URL + "team", icon: "user" },{ name: "View", url: "", icon: "eye" },],
  "admin/team/add" : [{ name: "Team", url: WEBSITE_ADMIN_URL + "team", icon: "user" },{ name: "Add", url: "", icon: "add" },],

  "admin/email_templates/list": [{ name: "Email Templates", url: "", icon: "user" }],
  "admin/email_templates/edit": [{name: "Email Templates",url: WEBSITE_ADMIN_URL + "email_templates",icon: "user",},{ name: "Edit", url: "", icon: "edit" }],

  'admin/setting/list' 	: [{name:'Settings',url:'',icon:'settings'}],
  'admin/setting/add'  	: [{name:'Settings',url:WEBSITE_ADMIN_URL+'settings',icon:'settings'},{name:'Add Setting',url:'',icon:'add'}],
  'admin/setting/edit' 	: [{name:'Settings',url:WEBSITE_ADMIN_URL+'settings',icon:'settings'},{name:'Edit Setting',url:'',icon:'mode_edit'}],
  'admin/setting/prefix' 	: [{name:'dynamic_variable',url:'',icon:'settings'}],

  'admin/contactus/list' 	: [{name:'Contact Us',url:'',icon:'feedback'}],
  'admin/reports_statistics/users' 	: [{name:'User Reports',url:'',icon:'feedback'}],
  'admin/reports_statistics/orders' 	: [{name:'Orders Reports',url:'',icon:'feedback'}],
  'admin/reports_statistics/products' 	: [{name:'Products Reports',url:'',icon:'feedback'}],
  'admin/reports_statistics/earnings' 	: [{name:'Earnings Reports',url:'',icon:'feedback'}],

  'admin/notifications/list' 	: [{name:'Notifications',url:'',icon:'feedback'}],
  "admin/notifications/edit": [{ name: "Notifications", url: WEBSITE_ADMIN_URL + "notifications", icon: "user" },{ name: "Edit", url: "", icon: "eye" }],

  "admin/products/list": [{ name: "Products", url: "", icon: "add" }],
  "admin/products/add" : [{ name: "Products",  url: WEBSITE_ADMIN_URL + "products", icon: "add" },{ name: "Add", url: "",  icon: "add" },],
  "admin/products/edit": [{ name: "Products", url: WEBSITE_ADMIN_URL + "products", icon: "add" }, { name: "Edit", url: "", icon: "edit" },],
  "admin/products/view": [{ name: "Products", url: WEBSITE_ADMIN_URL + "products", icon: "add" }, { name: "View", url: "", icon: "eye" },],

  "admin/slider/list": [{ name: "Slider", url: "", icon: "add" }],
  "admin/slider/add" : [{ name: "Slider",  url: WEBSITE_ADMIN_URL + "Slider", icon: "add" },{ name: "Add", url: "",  icon: "add" },],
  "admin/slider/edit": [{ name: "Slider", url: WEBSITE_ADMIN_URL + "Slider", icon: "edit" }, { name: "Edit", url: "", icon: "edit" },],

  "admin/testimonials": [{ name: "Testimonials", url: "", icon: "add" }],
  "admin/testimonials/add" : [{ name: "Testimonials",  url: WEBSITE_ADMIN_URL + "testimonials", icon: "add" },{ name: "Add", url: "",  icon: "add" },],
  "admin/testimonials/edit": [{ name: "Testimonials", url: WEBSITE_ADMIN_URL + "testimonials", icon: "edit" }, { name: "Edit", url: "", icon: "edit" },],

  "admin/orders": [{ name: "Orders", url: "", icon: "add" }],
  "admin/orders/view" : [{ name: "Orders",  url: WEBSITE_ADMIN_URL + "orders", icon: "add" },{ name: "View", url: "",  icon: "add" },],

  "admin/reviews": [{ name: "Reviews", url: "", icon: "add" }],
  "admin/reviews/view" : [{ name: "Reviews",  url: WEBSITE_ADMIN_URL + "reviews", icon: "add" },{ name: "View", url: "",  icon: "add" },],
  "admin/reviews/edit" : [{ name: "Reviews",  url: WEBSITE_ADMIN_URL + "reviews", icon: "add" },{ name: "Edit", url: "",  icon: "add" },],

  "admin/notification" : [{ name: "Notifications",  url: "", icon: "add" }],
  "admin/reported-products" : [{ name: "Reported Products",  url: "", icon: "add" }],
};