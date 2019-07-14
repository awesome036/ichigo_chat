const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const connection = require('../mysqlConnection');

router.get('/', function (req, res, next) {
	req.session.errorMsg = '入力が正しくありません';
	res.redirect('/');
});

router.post('/', function (req, res) {
	if(req.session.user_id && req.session.language_code){
		let userId = req.session.user_id;
		let languageTo = req.session.language_code;

		// [リファクタリング]async/awaitにしてネストが深くならないように変更

		// let roomTo = JSON.stringify(req.body.roomTo);
		let selectQuery = 'SELECT room_id, user_from FROM T_ROOM WHERE room_status = 0 AND user_from != ? AND user_from NOT IN (SELECT user_from FROM T_ROOM WHERE user_to = ?) AND user_from NOT IN (SELECT user_to FROM T_ROOM WHERE user_from = ?) ORDER BY room_timestamp ASC LIMIT 1';
		let selectInserts = [userId, userId, userId];
		selectQuery = mysql.format(selectQuery, selectInserts);
		connection.query(selectQuery, function (err, rows) {
			if(rows[0]){
				// リクエストが見つかった時
				let roomId = rows[0].room_id;
				let userFrom = rows[0].user_from;
				let updateQuery = 'UPDATE T_ROOM SET user_to = ?, room_status = 1, language_to = ? WHERE room_id = ?';
				let updateInserts = [userId, languageTo, roomId];
				updateQuery = mysql.format(updateQuery, updateInserts);
				connection.query(updateQuery, function (err, rows) {
					if (err) {
						// console.log("ng");
					} else {
						let seakQuery = 'SELECT * FROM T_USER WHERE user_id = ?';
						let seakInserts = [userFrom];
						seakQuery = mysql.format(seakQuery, seakInserts);
						connection.query(seakQuery, function(err, rows) {
							let results = {
									status: 'join',
									room_id: roomId,
									languageTo: rows[0].language_code,
									userImage: rows[0].user_image,
									userName: rows[0].user_name
								};
							// console.log(results);
							results = JSON.stringify(results);
							res.send(results);
						});
					}
				});
			}else{
				// リクエストが見つからなかった時にリクエスト待ちルームを開設
				let selectMyRequestQuery = 'SELECT COUNT(*) AS count FROM T_ROOM WHERE room_status = 0 AND user_from = ?';
				let selectMyRequestInserts = [userId];
				selectMyRequestQuery = mysql.format(selectMyRequestQuery, selectMyRequestInserts);

				connection.query(selectMyRequestQuery, function (err, rows) {
					if (rows[0]['count'] < 3) {
						// リクエスト許可
						let newRoomId = 'C';
						let date = new Date();
						let timestamp = date.getTime();
						let str = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
						for(let i = 0; i < 15; i++){
							newRoomId += str.charAt(Math.floor(Math.random() * str.length));
						}
						let insertQuery = 'INSERT INTO T_ROOM(room_id, user_from, room_status, language_from, room_timestamp) VALUES(?, ?, 0, ?, ?)';
						let insertInserts = [newRoomId, userId, languageTo, timestamp];
						insertQuery = mysql.format(insertQuery, insertInserts);
						connection.query(insertQuery, function(err, rows){
							if (err) {
								// console.log('ng');
							} else {
								let results = {
									status: 'request',
									room_id: newRoomId
								};
								results = JSON.stringify(results);
								res.send(results);
							}
						});
					} else {
						// リクエスト不許可
						let results = {
								status: 'not'
							};
						results = JSON.stringify(results);
						res.send(results);
					}
				});
			}
		});
	}else{
		res.redirect('/');
	}
});

module.exports = router;
