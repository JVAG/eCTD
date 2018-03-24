var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var user = require('./routes/user');
var home = require('./routes/home');
var validate = require('./routes/validate');
var update = require('./routes/update');
var index = require('./routes/index');

var app = express();
var DEV_MODE = true;

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Create application/x-www-form-urlencoded parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret:'ectdsession123',
  resave:false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname,'public')));

app.use(function(req,res,next ) {

  function isPathAllowed(reqPath){
    return reqPath === '/' || reqPath === '/user/login' || reqPath === '/user/register';
  }

  if( !isPathAllowed(req.path) && !req.session.user ) {
    console.log(req.path , req.session.user);
    res.render('index',{
      err:'Please login.'
    });
  }
  else {
    console.log(req.method + ' ' + req.path );
    next();
  }
});

app.use('/user',user);
app.use('/home',home);
app.use('/validate',validate);
app.use('/update',update);

app.get('/', function(req,res){
  res.render('index',{
    err:''
  });
});

app.get('/logout',function(req,res) {
  req.session.destroy(function(err){
    res.render('index',{
      err:(err && err.message) || 'Logged out'
    });
  });
});

app.get('/test*',function(req,res){
  res.end('Test Page Pattern match');
});

var server = app.listen(8081, function(){
  let host = server.address().address;
  let port = server.address().port;
  console.log('eCTD app running at http://' + host + ':' + port);
});
