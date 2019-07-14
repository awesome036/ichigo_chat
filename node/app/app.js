const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
require('dotenv').config();

const indexRouter = require('./routes/index');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const mypageRouter = require('./routes/mypage');
const requestRouter = require('./routes/request');
const updateRouter = require('./routes/update')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
})
app.use(cookieParser(process.env.COOKIE_SECRET));

let sessionMiddleware = session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	name: '_ichigo_login_sid',
	saveUninitialized: true,
	store: new RedisStore({
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT,
		pass: process.env.REDIS_PASSWORD,
		prefix: 'sid:'
	}),
	cookie: {
		path: '/',
		httpOnly: true,
		secure: false
	}
});
app.session = sessionMiddleware;
app.use(sessionMiddleware);

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/mypage', mypageRouter);
app.use('/request', requestRouter);
app.use('/update', updateRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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