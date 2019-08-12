const express = require('express');
const router = express.Router();
const moment = require('moment');
const connection = require('../mysqlConnection');

router.get('/', function (req, res, next) {
	req.session.errorMsg = '入力が正しくありません';
	return res.redirect('/');
});

router.post('/', function (req, res, next) {
	let user_id = req.body.user_id;
	let user_name = req.body.user_name;
	let password = req.body.password;
	let passwordConf = req.body.passwordConf;
	let language = req.body.language;

	let isset = function (data) {
		if (data === "" || data === null || data === undefined) {
			return false;
		} else {
			return true;
		}
	};

	if(!isset(user_id) || !isset(user_name)
		|| !isset(password) || !isset(language)){
		req.session.errorMsg = '入力が正しくありません';
		return res.redirect('/');
	}

	if (password == passwordConf){
		// let createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
		let userIdExistsQuery = 'SELECT * FROM T_USER WHERE user_id = "' + user_id + '" LIMIT 1';
		let registerQuery = 'INSERT INTO T_USER(user_id, user_name, password, language_code) VALUES ("' + user_id + '", ' + '"' + user_name + '",' + '"' + password + '", ' + '"' + language + '")';
		connection.query(userIdExistsQuery, function (err, user_id) {
			let userIdExists = user_id.length;
			if (userIdExists) {
				req.session.errorMsg = 'このログインIDは既に使われています';
				res.redirect('/');
			} else {
				connection.query(registerQuery, function (err, rows) {
					req.session.successMsg = '登録に成功しました';
					res.redirect('/');
				});
			}
		});

	}else{
		req.session.errorMsg = '入力されたパスワードが一致しません';
		res.redirect('/');
	}

});
module.exports = router;