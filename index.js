const https      = require("https");
const express   = require("express");
const app       = express();
const mongo     =    require('./config/connection')
const fs        = require('fs'); 
const cors = require('cors')
/** To store value in session **/

/** For socket methods*/
// var io          = null;
const session = require("cookie-session");
app.use(
  session({
    secret: "b2bplatform1234567890",
    resave: true /** To save session if modified*/,
    saveUninitialized: true /** To create session for store something*/,
  })
);

/** To use breadcrumbs **/

const breadcrumbs = require("express-breadcrumbs");
app.use(breadcrumbs.init());
app.use(breadcrumbs.setHome());
app.use("/admin",breadcrumbs.setHome({
  name: "Home",
  url: "/admin/dashboard",
}));

/** To use breadcrumbs **/

const fileupload = require("express-fileupload");
app.use(fileupload());


/** To use validate form value **/

const validator = require("express-validator");

// app.use(validator());



/** To use post method **/

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb"}));
app.use(bodyParser.json({ limit: '50mb' }));

/**  Use to access folder publically **/

app.use(express.static(__dirname + "/public"));
const nodeCache = require("node-cache");
myCache = new nodeCache();

/** Configure i18n**/

i18n = require("i18n");
i18n.configure({
  locales       : ["en"],
  defaultLocale : "en",
  directory     : __dirname + "/locales",
  autoReload    : true,
  updateFiles   : false,
});

app.use(i18n.init);

/** To use flash a message **/

const flash = require("express-flash-messages");
app.use(flash());

const expressEjsLayout = require("express-ejs-layouts");
app.use(expressEjsLayout);
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

require("dotenv").config();
process.env["HOME_PATH"] = __dirname;
const renderHtml = require("./render");
app.use(renderHtml);

const privateKey  = fs.readFileSync( "/var/www/nostrings.devtechnosys.tech/ssl/privkey.pem", "utf8");
const certificate = fs.readFileSync( "/var/www/nostrings.devtechnosys.tech/ssl/cert.pem", "utf8");
const chain       = fs.readFileSync( "/var/www/nostrings.devtechnosys.tech/ssl/fullchain.pem", "utf8");

const credentials = {
  key   : privateKey,
  cert  : certificate,
  ca    : chain,
};

app.use(cors())
const server = https.createServer(credentials, app);

server.listen(process.env.PORT,function(){
  console.log("Server running at port : " + process.env.PORT);
})

SOCKET_ENABLE = Boolean(process.env.SOCKET_ENABLE);
if(SOCKET_ENABLE){
  /*** Initialize socket connection */
const io = require('socket.io')(server,{
    cors: {
      origin:'*',
      methods: ["GET", "POST"]
    }
  });
  const {AppSocket} = require('./config/socket_chat');
  AppSocket(io);

}else{
	// io	  =   null;
}
var routes = require("./routes/web");
var routesApi = require("./routes/api");

process.on("uncaughtException", function (err) {
	console.log("error name ---------"+err.name);    // Print the error name
	console.log("error date ---------"+new Date());    // Print the error name
	console.log("error message ---------"+err.message); // Print the error message
	console.log("error stack ---------"+err.stack);   // Print the stack trace
	setTimeout(function(){
		process.exit(1);
	},1000);
});
routes.configure(app);
routesApi.configure(app, mongo);