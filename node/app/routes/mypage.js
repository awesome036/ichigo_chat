const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const connection = require('../mysqlConnection');

router.get('/', function (req, res, next) {
	let userId = req.session.user_id;
	if (userId) {
		let query = 'SELECT user_name, language_code, user_image FROM T_USER WHERE user_id = "' + userId + '"';
		connection.query(query, function (err, rows) {
			if (!err) {
				res.locals.user = rows.length ? rows[0] : false;
			}
			let userName = rows[0].user_name
			query = 'SELECT room_id, room_status, language_from, language_to FROM T_ROOM WHERE user_from = ? OR user_to = ? AND room_status < 2 ORDER BY room_timestamp DESC';
			let inserts = [userId, userId];
			query = mysql.format(query, inserts);
			connection.query(query, function (err, rows){
				if (!err) {
					res.locals.rooms = rows.length ? rows : undefined;
				}
				res.render('mypage', {
					title: userName + ' | ICHIGO.chat'
				});
			});
		});
	}else{
		res.redirect('/login');
	}
});

module.exports = router;