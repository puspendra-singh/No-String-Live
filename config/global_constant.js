WEBSITE_TITLE           = "No Strings Live";
WEBSITE_ADMIN_NAME      = "admin";
WEBSITE_FRONT_NAME      = "/";
API_URL                 = "/api/";
WEBSITE_URL             = process.env.URL;
WEBSITE_FRONT_URL       = process.env.FRONT_URL;
WEBSITE_ADMIN_URL       = process.env.URL+"admin/";
WEBSITE_API_URL         = process.env.URL+"api/";
WEBSITE_ROOT_PATH       = process.env.HOME_PATH;
FRONT_END_NAME          = "/";
FRONT_END_FOLDER_NAME   = "front"


WEBSITE_JS_FILE_PATH        = WEBSITE_URL + "admin/assets/";
WEBSITE_CSS_FILE_PATH       = WEBSITE_URL + "admin/assets/";
WEBSITE_IMAGE_FILE_PATH     = WEBSITE_URL + "admin/assets/images/";
WEBSITE_ADMIN_FILE_PATH     = "./../modules/admin/";
WEBSITE_FRONTEND_FILE_PATH  = "./../modules/frontend/";
WEBSITE_ADMIN_MODULE_PATH   = WEBSITE_ROOT_PATH + "/modules/admin/";
WEBSITE_LAYOUT_PATHS        = WEBSITE_ROOT_PATH + "/modules/front/layout/";
WEBSITE_LAYOUT_PATH         = WEBSITE_ROOT_PATH + "/modules/frontend/layout/"; 
WEBSITE_MODULES_PATH    	= WEBSITE_ROOT_PATH + "/modules/"+FRONT_END_FOLDER_NAME+"/";

/** Root file */
BASE_FILE_PATH = WEBSITE_ROOT_PATH + "/public/frontend/uploads/";
BASE_FILE_URL  = WEBSITE_URL + "frontend/uploads/";

/** User file path */
USER_FILE_PATH  = BASE_FILE_PATH + "users/";
USER_FILE_URL   = BASE_FILE_URL + "users/";

/** Product file path */
PRODUCT_FILE_PATH  = BASE_FILE_PATH + "products/";
PRODUCT_FILE_URL   = BASE_FILE_URL + "products/";

/** Ckeditor file path */
CKEDITOR_FILE_PATH 	= BASE_FILE_PATH + "ckeditor/";
CKEDITOR_FILE_URL 	= BASE_FILE_URL + "ckeditor/";

/** Slider file path */
SLIDER_FILE_PATH = BASE_FILE_PATH + "sliders/";
SLIDER_FILE_URL = BASE_FILE_URL + "sliders/";

/** Our team file path */
TEAM_FILE_PATH = BASE_FILE_PATH + "teams/";
TEAM_FILE_URL = BASE_FILE_URL + "teams/";

/** Testimonial file path */
TESTIMONIAL_FILE_PATH = BASE_FILE_PATH + "testimonials/";
TESTIMONIAL_FILE_URL  = BASE_FILE_URL + "testimonials/";

NO_IMAGE_URL = BASE_FILE_URL + "no_image.png";
PDF_IMAGE_URL = BASE_FILE_URL + "pdf.png";

VALID_IMAGE_EXTENSIONS = ["jpg", "png", "jpeg"];
NOT_VALID_IMAGE_ERROR  = "The file extensions are jpg, png and jpeg";

STATUS_ERROR   = "error";
STATUS_SUCCESS = "success";
ADMIN_GLOBAL_ERROR= "error";

SORT_DESC = -1;
SORT_ASC  = 1;

DEFAULT_LIMIT = 5;
DEFAULT_SKIP  = 5;

DEFAULT_API_LIMIT = 12;
DEFAULT_API_SKIP  = 12;

NOTIFICATION_LIMIT = 10;

/** Admin date format **/
BIRTHDAY_FORMAT  = "DD/MM/YYYY";
DATE_TIME_FORMAT = "DD/MM/YYYY ";
DEFAULT_DATE_TIME_FORMAT = "DD-MM-YYYY h:mm A";


/** Global status **/
ACTIVE 		            = 1;
INACTIVE 	            = 0;
DEACTIVE 		        = 0;
DELETED 		        = 1;
NOT_DELETED           	= 0;
NOT 		            = 0;
VERIFIED              	= 1;
NOT_VERIFIED          	= 0;
REJECTED          		= 2;
NOT_EXPIRED           	= 0;
EXPIRED                	= 1; 
NO_SKIP   	          	= 0;
NO_LIMIT  		        = 0;
NOT_SENT 		        = 0;
SENT     	            = 1;
APPROVED                = 1;
NOT_APPROVED            = 2;
APPROVAL_PENDING        = 0;
USER_BUYER              = 0;
USER_SELLER             = 1;
SELLER_APPROVAL_PENDING = 2; 
NOT_APPROVED_SELLER     = 0;
APPROVED_SELLER         = 1;
REQUESTED               = 1;
NOT_REQUESTED           = 0;
REQUEST_PENDING         = 2;
REQUEST_ACCEPTED        = 3;
REQUEST_REJECTED        = 4;  

/** User role id */
ROLE_ID_ADMIN 		= 1;
ROLE_ID_USER 	  	= 2;


/** Default mongo id */
DEFAULT_MONGOID = "9e9999999999d999c0be9b99"


/** FILE  **/
FILE_EXTENSIONS                    = ["jpeg", "jpg", "png", "pdf"];
FILE_EXTENSIONS_ERROR_MESSAGE      = "Invalid file, valid file extensions are " + FILE_EXTENSIONS + ". ";
FILE_MIME_EXTENSIONS               = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
FILE_MIME_EXTENSIONS_ERROR_MESSAGE = "Invalid file, valid image mime types are " + FILE_MIME_EXTENSIONS + ". ";

/** IMAGE */
IMAGE_EXTENSIONS                    = ["jpeg", "jpg", "png",];
IMAGE_EXTENSIONS_ERROR_MESSAGE      = "Invalid file, valid file extensions are " + IMAGE_EXTENSIONS + ". ";
IMAGE_MIME_EXTENSIONS               = ["image/jpeg", "image/jpg", "image/png"];
IMAGE_MIME_EXTENSIONS_ERROR_MESSAGE = "Invalid file, valid image mime types are " + IMAGE_MIME_EXTENSIONS + ". ";

/** VIDEO */
ALLOWED_VIDEO_EXTENSIONS 			=	["mp4","3gpp","x-ms-wmv"]; 
ALLOWED_VIDEO_ERROR_MESSAGE			= 	"Please select valid file, Valid file extensions are "+ALLOWED_VIDEO_EXTENSIONS.join(", ")+".";
ALLOWED_VIDEO_MIME_EXTENSIONS 		= 	["video/mp4","video/3gpp","video/x-ms-wmv"];
ALLOWED_VIDEO_MIME_ERROR_MESSAGE	= 	"Please select valid mime type, Valid mime types are "+ALLOWED_VIDEO_MIME_EXTENSIONS.join(", ")+".";

EXPORT_FILTERED         = "export_filtered";
VALIDATE_STRING_ROUND   = 10;
OTP_NUMBER_ROUND        = 4;
BCRYPT_SALT_ROUND       = 10;
ORDER_ID_ROUND   		= 9;
PASSWORD_MIN_LENGTH     = 6;
PASSWORD_MAX_LENGTH     = 20;
PASSWORD_ALPHANUMERIC_REGEX = [/^[A-Za-z0-9_@./#&+-]*$/];  // /^[A-Za-z0-9-+()]*$/;
NOT_ALLOWED_CHARACTERS_FOR_REGEX = ['(',')','+','*','?','[',']'];
EMAIL_REGEX = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$";
PASSWORD_REGEX = "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,50}$";
NAME_REGEX = "^([a-z|A-Z]){2,}((?: [a-z|A-Z]{2,})){0,4}$";
// STREET_REGEX = "^(?![0-9]*$)(?![#?!@$%^&*-]*$)[0-9|a-z|A-Z]+[,-]{0,1}((?:[ ,-][a-z|A-Z|0-9]+)[,-]{0,1})*$";
STREET_REGEX = "^(?![0-9]*$)(?![#?!@$ %^*&--]*$)[0-9a-zA-Z_@./#&+--,()$ ]+((?: [a-z|A-Z|0-9|_@./#&+--,%*$ ()\n]+)*)$";
ZIPCODE_REGEX = "^(?![a-zA-z-]*$)[a-zA-Z0-9]+((?:[-][a-z|A-Z|0-9]+))*$";
DESCRIPTION_REGEX = "^(?![0-9]*$)(?![ #?!@$%^&*--]*$)[0-9a-zA-Z_@./#&+--,()\n$ ]+((?: [a-z|A-Z|0-9|_@./#&+--,%*$ ()\n]+)*)$"
ADDRESS_REGEX = "^(?![0-9]*$)(?![ #?!@$%^&*--]*$)[0-9a-zA-Z_@./#&+--,()\n$ ]+((?: [a-z|A-Z|0-9|_@./#&+--,%*$ ()\n]+)*)$"
WEBSITE_REGEX = "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})";
TAXID_REGEX = "(?![a-zA-z-]*$)(?![0-9]*$)[a-zA-Z0-9]+((?:[- ][a-z|A-Z|0-9]+))*$";
BUSINESSID_REGEX = "(?![a-zA-z-]*$)(?![0-9]*$)[a-zA-Z0-9]+((?:[ -][a-z|A-Z|0-9]+))*$";
POWER_REGEX = "^([0-9]){1,3}((?:[.][0-9]{0,4})){0,2}$";
WEIGTH_REGEX = "^([0-9]){1,3}((?:[.][0-9]{0,4})){0,2}$";
FAN_REGEX    = "^([0-9]){1,2}$";
VOLTAGE_REGEX = "^([0-9]){1,3}((?:[.][0-9]{0,4})){0,2}$";
PRICE_REGEX = "^([0-9]){1,5}((?:[.][0-9]{0,4})){0,4}$";
/** mobile length  */
MOBILE_MIN_LENGTH = 7;
MOBILE_MAX_LENGTH = 15;

/*** Set near by constant */
DISTANCE_MULTIPLIER = 0.001;
MIN_DISTANCE		= 1*1000;
MAX_DISTANCE		= 100*1000;


/*** Character length validation */
MIN_NAME_LIMIT = 2;
MAX_NAME_LIMIT = 20;
MIN_CHARACTER_NAME_LIMIT 		= 2;
MAX_CHARACTER_NAME_LIMIT 		= 50;
MIN_CHARACTER_TITLE_LIMIT 		= 2;
MAX_CHARACTER_TITLE_LIMIT 		= 500;
MIN_CHARACTER_DESCRIPTION_LIMIT = 9; //with html tags
MAX_CHARACTER_DESCRIPTION_LIMIT = 20000;
MIN_COUNTRY_CODE_LIMIT = 2;
MAX_COUNTRY_CODE_LIMIT = 6;
MIN_DIAL_CODE_LIMIT = 1;
MAX_DIAL_CODE_LIMIT = 5;
MIN_PHONE_NUMBER_LIMIT = 6;
MAX_PHONE_NUMBER_LIMIT = 16;
MIN_STREET_LIMIT = 2;
MAX_STREET_LIMIT = 50;
MIN_ID_LIMIT = 2;
MAX_ID_LIMIT = 25;
MIN_PRODUCT_NAME_LIMIT = 2;
MAX_PRODUCT_NAME_LIMIT = 100;
MIN_PRICE_LIMIT = 1;
MAX_PRICE_LIMIT = 12;
MIN_RATING_LIMIT = 1;
MAX_RATING_LIMIT = 5;
MIN_REVIEW_TITLE_LIMIT = 1;
MAX_REVIEW_TITLE_LIMIT = 100;

USER_VERIFICATION_TYPE_EMAIL    = 'email';
USER_VERIFICATION_TYPE_MOBILE   = 'mobile';

NOT_ALLOWED_TAGS = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi];
NOT_ALLOWED_EMOJI= [';)',';)'];

/* One day in seconds */
// ONE_DAY_IN_SECONDS = 84600;
ONE_DAY_IN_SECONDS = 30000;
/* Random number length */
DEFAULT_RANDOM_NUMBER_LENGTH  = 6;
/** JWT config */
JWT_CONFIG = {
    algorithm   : 'RS256',
    private_key : 'asic_mango1233456789',
    expire_time : '12h'
}

/**product constants*/
PRODUCT_REQUESTED = 0; /** Product is just uploaded and waiting to admin's response */
PRODUCT_ACCEPTED = 1; /** Product accepted by admin */
PRODUCT_REJCTED = 2; /** Product rejected by admin */


/*** Setting input type dropdown */
SETTING_INPUT_TYPE_DROPDOWN = [
	{
		input_id	: "text",
		input_name	: "Text"
	},
	{
		input_id	: "textarea",
		input_name	: "Textarea"
	}
];

/*** Setting validate type dropdown */
SETTINGS_VALIDATE_TYPE_DROPDOWN = [
	{
		input_id	: "number",
		input_name	: "Number"
	},
	{
		input_id	: "float",
		input_name	: "Float"
	},
	{
		input_id	: "percentage",
		input_name	: "Percentage"
	},
];

/** Search status for user **/
USER_STATUS_SEARCH_DROPDOWN = [
	{
		status_id	: ACTIVE,
		status_name	: "Active"
	},
	{
		status_id	: DEACTIVE,
		status_name	: "Inactive"
	},
	// {
	// 	status_id	: VERIFIED,
	// 	status_name	: "Verified"
	// },
	// {
	// 	status_id	: NOT_VERIFIED,
	// 	status_name	: "Not Verified"
	// }
];



/** Search gender for user **/
USER_GENDER_DROPDOWN = [
	{
		status_id	: "Male",
		status_name	: "Male"
	},
	{
		status_id	: "Female",
		status_name	: "Female"
	},
	{
		status_id	: "Other",
		status_name	: "Other"
	},
];


WEBSITE_SOCKET_URL  = process.env.URL;
NOTIFICATION_USER_SIGNUP_REQUEST = 'signup';
NOTIFICATION_MESSAGES = {
	'signup' : {
		'title' : 'User Signup'
	}
}

READ		= 1;
NOT_READ	= 0;

SEEN 		= 1;
NOT_SEEN 	= 0;

READ_ONLY	= 1;
NOT_READ_ONLY	= 0;
/** Notification type */
NOTIFICATION_USER_SIGNUP_REQUEST = 'signup';

FLASH_SETTING = "5000";
PROJECT_DEFAULT_EMAIL = "superadminasicmango@getnada.com";
ADMIN_FOOTER_HEADING = "2022 © No Strings Live";

REQUIRED = 1;
EDITABLE = 1;

/*** API status */
API_STATUS_SUCCESS  = true;
API_STATUS_ERROR    = false;
API_STATUS_UNAUTHORIZED	= 401;
IS_LIKED			= 1;
IS_UNLIKED			= 2;
API_STATUS_CODE_OK              = 200;
API_STATUS_CODE_NO_CONTENT      = 204;
API_STATUS_CODE_BAD_REQUEST     = 400;
API_STATUS_CODE_UNAUTHORIZED    = 401;
API_STATUS_CODE_NOT_FOUND       = 404;


/** API PRODUCT ORDER CONSTANTS */
API_ORDER_REQUESTED		= 0; /** ORDER REQUESTED */
API_ORDER_ACCEPTED		= 1; /** ORDER PLACED */
API_ORDER_REJECTED		= 2; /** ORDER REQUEST DENIED */
API_ORDER_DISPATCHED	= 3; /** ORDER DISPATCHED SUCCESSFULLY */
API_ORDER_SHIPPED		= 4; /** ORDER SHIPPED SUCCESSFULLY */
API_ORDER_DELIVERED		= 5; /** ORDER DELIVERED SUCCESSFULLY */
API_ORDER_RETURN_REQ	= 6; /** ORDER RETURN_REQ SENT */
API_ORDER_RETURNED		= 7; /** ORDER RETURNED SUCCESSFULLY */
API_ORDER_CANCELED		= 8; /** ORDER CANCELED */
API_ORDER_RATED			= 9; /** ORDER RATED */
API_ORDER_RETURN_REQ_ACCEPT	= 10; /** ORDER RETURN_REQ ACCEPTED */
API_ORDER_RETURN_REQ_REJECT	= 11; /** ORDER RETURN_REQ REJECTED */

ORDER_STATUS_SEARCH_DROPDOWN = [
	{
		status_id	: API_ORDER_REQUESTED,
		status_name	: "Requested"
	},
	{
		status_id	: API_ORDER_ACCEPTED,
		status_name	: "Accepted"
	},
	{
		status_id	: API_ORDER_REJECTED,
		status_name	: "Rejected"
	},
	{
		status_id	: API_ORDER_DISPATCHED,
		status_name	: "Dispatched"
	},
	{
		status_id	: API_ORDER_SHIPPED,
		status_name	: "Shipped"
	},
	{
		status_id	: API_ORDER_DELIVERED,
		status_name	: "Delivered"
	},
	{
		status_id	: API_ORDER_RETURN_REQ,
		status_name	: "Return requests"
	},
	{
		status_id	: API_ORDER_RETURNED,
		status_name	: "Returned"
	},
	{
		status_id	: API_ORDER_CANCELED,
		status_name	: "Cancelled"
	},
	{
		status_id	: API_ORDER_RATED,
		status_name	: "Rated"
	},
];

/** escrow account constants */
ACCOUNT_CREATED = 1;
ACCOUNT_NOT_CREATED = 0;
ESCROW_EMAIL = "ramveer.jat@devtechnosys.info";
ESCROW_API_KEY = "2588_RcUWxFZDYHNrWmvNxlrcB31A2eIEqYnLajrRMK6E5Jn0P2sZHhtqwrKqHGLjxWlY";
ESCROW_AUTH = "Basic " + Buffer.from(ESCROW_EMAIL+':'+ESCROW_API_KEY).toString('base64');
ESCROW_API_URL = "https://api.escrow-sandbox.com/2017-09-01/";
ESCROW_SUCCESS_CODE = 200;
ESCROW_INSPECTION_PERIOD = 259200;
// ESCROW_INSPECTION_PERIOD = 300;
NOT_AGREE = false;
AGREE = true;
PAID = true;
UNPAID = false;


/** cart constants */
CART_NEGOTIABLE = true;
CART_NOT_NEGOTIABLE = false;


/** Admin notification constants */
ADMIN_NOTIFICATION = {
	PRODUCT_APPROVAL : { title:'Product approval request', message:'A new product is added and the seller has sent you request to approve this product.'}
}

PRIVATE_SELLER_SELLING_LIMIT = 5; /** This limit set as per month selling products */

BEFORE_LOGIN_SLIDE = 1;
AFTER_LOGIN_SLIDE = 2;

FORGOT_PASSWORD_MAIL_SUBJECT = "ASICMango reset password";
SIGNUP_STEPS = [1,2,3];
SIGNUP_EMAIL_ACTION = "registration";
SIGNUP_EMAIL_SUBJECT = "Thanks For Registration! Verify Your Account.";
EMAIL_VERIFIED = "email_verified";
VERIFY_EMAIL = "verify_email";
VERIFY_PHONE = "verify_phone";
REGISTRATION_SUCCESS = "registration_success";
DOCUMENT_VERIFICATION_PENDING = "document_verification_pending";