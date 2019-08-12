const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const connection = require('../mysqlConnection');

router.get('/', function (req, res, next) {
	req.session.errorMsg = '入力が正しくありません';
	res.redirect('/');
});

router.post('/', function (req, res) {
	if (req.session.user_id && req.session.language_code) {
		let userId = req.session.user_id;
		let roomId = req.body.roomId;
		let roomQuery = 'SELECT user_from, user_to, room_status FROM T_ROOM WHERE room_id = ?';
		let roomInserts = [roomId];
		var results = new Object;
		roomQuery = mysql.format(roomQuery, roomInserts);
		connection.query(roomQuery, function (err, row) {
			if(err){
				console.log('ng_room');
			}else{
				if(row[0].room_status == 0){
					// 相手待ちのトークルームだった場合
					results.status = 'waiting';
					results = JSON.stringify(results);
					res.send(results);
				}else{
					// 相手有りのトークルームだった場合
					if(row[0].user_from == userId){
						var partner = row[0].user_to;
					}else{
						var partner = row[0].user_from;
					}
					let partnerQuery = 'SELECT user_name, language_code, user_image, user_info, user_twitter, user_facebook, user_instagram FROM T_USER WHERE user_id = ?';
					let partnerInserts = [partner];
					partnerQuery = mysql.format(partnerQuery, partnerInserts);
					connection.query(partnerQuery, function(err, row) {
						if(err){
							console.log("ng_partner");
						}else{
							// トーク相手の情報
							results.partner = row[0];
						}
						let talkQuery = 'SELECT talk_timestamp, talk_original, talk_translation, talk_from FROM T_TALK WHERE room_id = ? ORDER BY talk_timestamp ASC';
						let talkInserts = [roomId];
						talkQuery = mysql.format(talkQuery, talkInserts);
						connection.query(talkQuery, function(err, rows) {
							if(err){
								console.log("ng_talk");
							}else{
								if (rows.length){
									// トークがあった場合
									results.status = 'talked';

									// var talks = [];
									// 自分のトークの内容を判別
									for(let i = 0; i < rows.length; i++){
										if(rows[i].talk_from == userId){
											rows[i].talk_position = 'right';
										}else{
											rows[i].talk_position = 'left';
										}
									}
									results.talks = rows;
								}else{
									// トークがなかった場合
									results.status = 'start';
								}
								results = JSON.stringify(results);
								res.send(results);
							}
						});
					});

				}
			}
		});

	} else {
		res.redirect('/');
	}
});

module.exports = router;