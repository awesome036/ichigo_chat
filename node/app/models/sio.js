const socketio = require('socket.io');
const mysql = require('mysql');
const connection = require('../mysqlConnection');
const app = require('../app');
const sessionMiddleware = app.session;

module.exports = sio;

function sio(server) {
	// Socket.IO
	const sio = socketio.listen(server);
	sio.set('transports', [ 'polling', 'websocket']);

	// socket.IOでsessionを使えるようにする
	sio.use(function (socket, next) {
		sessionMiddleware(socket.request, socket.request.res, next);
	});

	// 接続時
	sio.sockets.on('connection', function (socket) {

		// ブラウザ毎の接続開始周り。
		socket.on("connected", function (roomId) {
			socket.join(roomId);
			sio.to(roomId).emit("connected", roomId);
		});

		// メッセージ送信のイベント
		socket.on("publish", function (data) {
			const request = require('request');
			const uuidv4 = require('uuid/v4');
			const subscriptionKey = process.env.TRANSLATOR_TEXT_KEY;

			// let from = data.from;
			let from = data.from;
			let to = data.to;
			let roomId = data.roomId;

			let options = {
				method: 'POST',
				baseUrl: 'https://api.cognitive.microsofttranslator.com/',
				url: 'translate',
				qs: {
					'api-version': '3.0',
					'from': from,
					'to': to,
					'profanityAction': 'Marked'
				},
				headers: {
					'Ocp-Apim-Subscription-Key': subscriptionKey,
					'Content-type': 'application/json',
					'X-ClientTraceId': uuidv4().toString()
				},
				body: [{
					'text': data.value
				}],
				json: true,
			};

			request(options, function (err, res, body) {
				let text = body[0].translations[0].text;
				let original = data.value.replace(/\r?\n/g, '<br>');
				let translation = text.replace(/\r?\n/g, '<br>');
				sio.to(roomId).emit("publish", {
					'original': original,
					'translation': translation,
					'roomTo': roomId,
					'languageTo': to
				});

				// データベース書き込み
				let userId = socket.request.session.user_id;
				let date = new Date();
				let timestamp = date.getTime();
				let insertQuery = 'INSERT INTO T_TALK(room_id, talk_timestamp, talk_original, talk_translation, talk_from)' +
								'VALUES(?, ?, ?, ?, ?)';
				let insertInserts = [roomId, timestamp, original, translation, userId];
				insertQuery = mysql.format(insertQuery, insertInserts);
				connection.query(insertQuery, function (err, rows) {
					if (err) {
						console.log('ng');
					}
				});
				let updateQuery = 'UPDATE T_ROOM SET room_timestamp = ? WHERE room_id = ?';
				let updateInserts = [timestamp, roomId];
				updateQuery = mysql.format(updateQuery, updateInserts);
				connection.query(updateQuery, function (err, rows) {
					if(err) {
						console.log('ng');
					}
				});
			});
		});

		// トーク相手マッチング時のイベント
		socket.on("find", function(roomId) {
			sio.to(roomId).emit("find", {
				'room_id': roomId
			});
		});

		// ブラウザを閉じた等で退出イベント
		socket.on("disconnect", function () {
			
		});
	});
}