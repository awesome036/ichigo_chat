const express = require('express');
const router = express.Router();
const connection = require('../mysqlConnection');

router.get('/', function (req, res, next) {
	if (req.session.user_id) {
		res.redirect('/mypage');
	} else {
		req.session.errorMsg = '入力が正しくありません';
		res.redirect('/');
	}
});

router.post('/', function (req, res, next) {
	let user_id = req.body.user_id;
	let password = req.body.password;
	let query = 'SELECT user_id, language_code FROM T_USER WHERE user_id = "' + user_id + '" AND password = "' + password + '" LIMIT 1';
	connection.query(query, function (err, rows) {
		let userId = rows.length ? rows[0].user_id : false;
		if (userId) {
			req.session.user_id = userId;
			req.session.language_code = rows[0].language_code;
			res.redirect('/mypage');
		} else {
			req.session.errorMsg = '入力が正しくありません';
			res.redirect('/');
		}
	});
});

module.exports = router;