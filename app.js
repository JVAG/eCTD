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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public/images', 'logo.jpg')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:'ectdsession123',
  resave:false,
  saveUninitialized: true
}));

app.use(function(req,res,next ) {

  function isPathAllowed(reqPath) {
    return DEV_MODE || reqPath === '/' || reqPath === '/user/login' || reqPath === '/user/register';
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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
