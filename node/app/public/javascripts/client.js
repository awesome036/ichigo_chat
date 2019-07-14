'use strict'

// トークリストのスクロールバーデザイン変更
const tlps = new PerfectScrollbar('#talkList');

//イベントとコールバックの定義
const socket = io.connect();

socket.on("connected", function (roomId) { });
socket.on("publish", function (data) { addMessage(data); });
socket.on("find", function(data) { findTalkUser(data) });
socket.on("disconnect", function () { });

// チャットアプリのサーバ側に接続する
function start(roomId) {
	socket.emit("connected", roomId);

	// スクロールバーデザイン変更
	let room_Id = '#' + roomId;
	let ps = new PerfectScrollbar(room_Id, { wheelSpeed: 0.7 });

	getTalkInfo(roomId);
}

// メッセージの送信
function sendMessage() {
	let msg = $('#msg_input').val();
	msg = msg.trim();
	if (msg.match(/\S/g)){
		let languageTo = $('input[name=languageTo]').val();
		if(languageTo != 'any' && languageTo != ''){
			let languageFrom = $('input[name=languageFrom]').val();
			let roomTo = $('#roomId').val();
			let msgArea = $('#' + roomTo);
			$(msgArea).append(
				"<div id='loadingIcon' class='textLine'><div class='rightComment'>" +
				"<i class='fas fa-sync-alt fa-spin'></i>" +
				"</div></div>"
			);
			scrollBottom(msgArea);
			socket.emit("publish", {
				value: msg,
				from: languageFrom,
				to: languageTo,
				roomId: roomTo
			});
		}
	}
	$('#msg_input').val('');
}

// 自身の送信時やサーバ側から受信した際のメッセージを表示する
function addMessage(data) {
	let msgArea = $('#' + data.roomTo);
	var talkLatest = $('li[data-room=' + data.roomTo +'] .talkLatest');
	if ($('#loadingIcon').length){
		$('#loadingIcon').remove();
		$(msgArea).append(
			"<div class='textLine'><div class='rightComment'>" +
			"<p class='topText'>" + data.original + "</p>" +
			"<p class='underText'>" + data.translation + "</p>" +
			"</div></div>"
		);
		talkLatest.html(data.original);
	}else{
		$(msgArea).append(
			"<div class='textLine'><div class='leftComment'>" +
			"<p class='topText'>" + data.translation + "</p>" +
			"<p class='underText'>" + data.original + "</p>" +
			"</div></div>"
		);
		talkLatest.html(data.translation);
	}
	scrollBottom(msgArea);
}

// トーク相手が見つかった時、待機中の相手に知らせる
function findTalkUser(data) {
	let roomId = data.room_id;
	let elements = $('li[data-room="' + roomId + '"]');
	if (elements.length){
		$('li[data-room="' + roomId + '"]').remove();
		if (!$('#joinList').length) {
			$('#talkList').append(
				'<p>トークリスト</p>' +
				'<ul id="joinList"></ul>'
			);
		}
		$('#joinList').prepend(elements);
	}
	if($('#' + roomId).css('display') == 'block'){
		elements.addClass('blinkOnce');
	}else{
		elements.addClass('blinkInfinity');
	}
	getTalkInfo(roomId);
}

// トークルームの情報をサーバーから取得
function getTalkInfo(roomId) {
	$.ajax({
		async: true,
		url: '/update',
		type: 'post',
		data: {
			'roomId': roomId
		},
		dataType: 'json'
	}).done(function (res) {
		let room_Id = '#' + roomId;
		if (res.status == 'waiting') {
			// 相手待ちの場合
			$(room_Id).empty();
			$(room_Id).append(
				"<div class='seakArea'>" +
				"<p id='seakText'>相手が見つかるまで待機中です<br>見つかったら通知します</p>" +
				"<div id='seakIcons'>" +
				"<i class='fas fa-bell faa-ring animated fa-size'></i>" +
				"</div>" +
				"</div>" +
				'</div>'
			);
			let elements = $('li[data-room="' + roomId + '"]');
			elements.attr('data-username', 'Searching...');
		} else if (res.status == 'start') {
			// まだ一度もトークしていないルームの場合
			$(room_Id).empty();
			$(room_Id).append(
				"<div class='textLine'><div class='leftComment'>" +
				"<p class='topText'>Start ICHIGO.chat!</p>" +
				"</div></div>" +
				'</div>'
			);
			let elements = $('li[data-room="' + roomId + '"]');
			if ($(room_Id).css('display') == 'block') {
				$('#roomId').val(roomId);
				$('input[name=languageTo]').val(res.partner.language_code);
				$('.headerItem').empty();
				$('.headerItem').html(
					'<div class="userImageWrapper">' +
					'<img src="/images/' + res.partner.user_image + '"></div>' + res.partner.user_name
				);
				elements.addClass('blinkOnce');
			} else {
				elements.addClass('blinkInfinity');
			}
			elements.empty();
			elements.append(
				'<div class="userImageWrapper"><img src="/images/' + res.partner.user_image + '" ></div>' +
				'<dl><dt class="talkUser">' + res.partner.user_name + '</dt><dd class="talkLatest">Start ICHIGO.chat!</dd></dl>'
			);
			elements.attr('data-languagefrom', res.partner.language_code);
			elements.attr('data-username', res.partner.user_name);
		} else {
			// トーク済みのルームの場合
			$(room_Id).empty();
			for(var i = 0; i < res.talks.length; i++){
				if(res.talks[i].talk_position == 'right'){
					$(room_Id).append(
						"<div class='textLine'><div class='rightComment'>" +
						"<p class='topText'>" + res.talks[i].talk_original + "</p>" +
						"<p class='underText'>" + res.talks[i].talk_translation + "</p>" +
						"</div></div>"
					);
				}else{
					$(room_Id).append(
						"<div class='textLine'><div class='leftComment'>" +
						"<p class='topText'>" + res.talks[i].talk_translation + "</p>" +
						"<p class='underText'>" + res.talks[i].talk_original + "</p>" +
						"</div></div>"
					);
				}
			}
			$(room_Id).scrollTop = $(room_Id).scrollHeight;
			let elements = $('li[data-room="' + roomId + '"]');
			if(res.talks[i - 1].talk_position == 'right'){
				var message = res.talks[i - 1].talk_original;
			}else{
				var message = res.talks[i - 1].talk_translation;
			}
			if ($(room_Id).css('display') == 'block') {
				$('#roomId').val(roomId);
				$('input[name=languageTo]').val(res.partner.language_code);
				$('.headerItem').empty();
				$('.headerItem').html(
					'<div class="userImageWrapper">' +
					'<img src="/images/' + res.partner.user_image + '"></div>' + res.partner.user_name
				);
			}
			elements.empty();
			elements.append(
				'<div class="userImageWrapper"><img src="/images/' + res.partner.user_image + '" ></div>' +
				'<dl><dt class="talkUser">' + res.partner.user_name + '</dt><dd class="talkLatest">' + message + '</dd></dl>'
			);
			elements.attr('data-languagefrom', res.partner.language_code);
			elements.attr('data-username', res.partner.user_name);
		}
	}).fail(function (XMLHttpRequest, textStatus, errorThrown) {
		console.log("failed...");
		console.log("XMLHttpRequest : " + XMLHttpRequest.status);
		console.log("textStatus     : " + textStatus);
		console.log("errorThrown    : " + errorThrown.message);
	});
}

// 最下部から1画面以内にいた場合最下部にスクロール
function scrollBottom(msgArea) {
	if (msgArea.css('display') == 'block'){
		let msgHeight = msgArea.get(0).offsetHeight;
		let scHeight = msgArea.get(0).scrollHeight;
		let scTop = msgArea.scrollTop();
		if(scTop >= scHeight - msgHeight || scTop > scHeight - (msgHeight * 2)){
			// msgArea.scrollTop(scHeight);
			msgArea.animate({scrollTop: scHeight}, 500, 'swing');
		}
	}
}

// 相手待ちリストに新規トークルームを追加
function addRequestRoom(roomId){
	$('#seakAnimation').remove();
	if(!$('#requestList').length){
		$('#talkList').prepend(
			'<p>相手待ちリスト</p>' +
			'<ul id="requestList"></ul>'
		);
	}
	$('#requestList').prepend(
		'<li class="talkRoom" name="talkRoom" data-room="' + roomId + '" data-languagefrom="">' +
		'<div class="userImageWrapper"><i class="fas fa-user-circle"></i></div>' +
		'<dl><dt class="talkUser">待機中..<span class="blinkAnimation">.</span></dt><dd class="talkLatest">相手が見つかったら通知します</dd></dl >' +
		'</li>'
	);
	$('#messageArea').prepend(
		'<div id=' + roomId + ' class="messageList">' +
		"<div class='seakArea'>" +
		"<p id='seakText'>相手が見つかるまで待機中です<br>見つかったら通知します</p>" +
		"<div id='seakIcons'>" +
		"<i class='fas fa-bell faa-ring animated fa-size'></i>" +
		"</div>" +
		"</div>" +
		'</div>'
	);
	$('#'+roomId).fadeIn(150);
	start(roomId);
}

// トークリストに新規トークルームを追加
function addTalkRoom(data) {
	$('#seakAnimation').remove();
	if (!$('#joinList').length) {
		$('#talkList').append(
			'<p>トークリスト</p>' +
			'<ul id="joinList"></ul>'
		);
	}
	$('#joinList').prepend(
		'<li class="talkRoom" name="talkRoom" data-room="' + data.room_id + '" data-languagefrom="' + data.languageTo + '">' +
		'<div class="userImageWrapper"><img src="/images/' + data.userImage + '" ></div>' +
		'<dl><dt class="talkUser">' + data.userName + '</dt><dd class="talkLatest">Start ICHIGO.chat!</dd></dl>' +
		'</li>'
	);
	$('#messageArea').prepend(
		'<div id=' + data.room_id + ' class="messageList">' +
		"<div class='textLine'><div class='leftComment'>" +
		"<p class='topText'>Start ICHIGO.chat!</p>" +
		"</div></div>" +
		'</div>'
	);
	$('#' + data.room_id).fadeIn(150);
	start(data.room_id);
	socket.emit("find", data.room_id);
}

// すべてのトークルームと接続する
let elements = document.getElementsByName('talkRoom');
for (let i = 0; i < elements.length; i++) {
	let roomId = elements[i].dataset.room;
	start(roomId);
}

// トークルーム選択時の挙動
$(document).on('click', '.talkRoom', function (e) {
	// 送信時のルームID変更
	let roomId = e.currentTarget.dataset.room;
	$('#roomId').val(roomId);

	// 送信時の宛先言語変更
	let languageTo = e.currentTarget.dataset.languagefrom;
	$('input[name=languageTo]').val(languageTo);

	// メッセージヘッダー入れ替え
	var userItems = '';
	let userImage = e.currentTarget.firstChild.outerHTML;
	if(userImage){
		userItems += userImage;
	}
	userItems += e.currentTarget.dataset.username;
	$('.headerItem').html(userItems);

	// 選択トークルームの背景色変更
	$('.talkRoom').removeClass('selectTalk');
	$('li[data-room="' + roomId + '"]').addClass('selectTalk');

	// notificationの削除
	$(e.currentTarget).removeClass('blinkInfinity');

	// トークエリアの表示切替
	roomId = '#' + roomId;
	$('.messageList').each(function (i, o) {
		$(o).css('display', 'none');
	});
	$(roomId).css('display', 'block');

	// SP表示時メッセージエリアのスライドイン
	$('#messageArea').addClass('open');
});

// SP表示時メッセージエリアのスライドアウト
$(document).on('click', '.backButton', function(){
	$('#messageArea').removeClass('open');
	$('.talkRoom').removeClass('selectTalk');
});

// enterで送信、enter+shiftで改行
$('#msg_input').keydown( function(e) {
	if (!e.shiftKey) {
		if (e.keyCode == 13){
			sendMessage();
			return false;
		}
	}
});

// ログアウトモーダルウィンドウ表示
$('#logout').on('click', function(e) {
	$.when(
		$('#modal').append(
			"<p>ログアウトしますか？</p>" +
			"<div class='modalButtonBox'>" +
			"<a class='modalButton yes' href='/logout'>YES</a>" +
			"<a id='close' class='modalButton cancel'>CANCEL</a>" +
			"</div>"
		)
	).done(function() {
		$('#overlay, #modal').fadeIn(150);
	});
});

// モーダルウィンドウ非表示
$('#overlay').on('click', function(e) {
	if (!$(e.target).not('#close').closest('#modal').length){
		$.when(
			$('#overlay, #modal').fadeOut(150)
		).done(function () {
			$('#modal').empty()
		});
		return false;
	}
});


// トーク相手探索
$('#newRequest').click(function(){
	let setSeakAnime = function() {
		// メッセージエリアの情報をリセット
		$('.messageList').fadeOut(150);
		$('#roomId').val('');
		$('input[name=languageTo]').val('');
		$('.headerItem').empty();
		$('.headerItem').html(
			'Searching...'
		);
	
		// 探索中アニメーション表示
		$('#messageArea').addClass('open');
		$('#messageArea').append(
			"<div id='seakAnimation'>" +
			"<p id='seakText'>トーク相手を探しています..<span class='blinkAnimation'>.</span></p>" +
			"<div id='seakIcons'>" +
			"<i class='fas fa-spinner fa-spin fa-size'></i>" +
			"</div>" +
			"</div>"
		);
		$('#seakAnimation').fadeIn(150);
	};

	$.ajax({
		async: true,
		url: '/request',
		type: 'post',
		data: {
				'roomTo': 'any'
			},
		dataType: 'json'
	}).done(function(res){
		if (res.status == 'join'){
			// トーク相手が見つかった時
			setSeakAnime();
			setTimeout(function () {
				$.when(
					$('#seakAnimation').fadeOut(150)
				).done(function () {
					addTalkRoom(res)
				});
			}, 5000);
		} else if (res.status == 'request') {
			// トーク相手が見つからなかったので待ちルームを発行
			setSeakAnime();
			setTimeout(function () {
				$.when(
					$('#seakAnimation').fadeOut(150)
				).done(function () {
					addRequestRoom(res.room_id)
				});
			}, 5000);
		} else {
			// リクエストが既に３件あったらNG表示
			$.when(
				$('#modal').append(
					"<p>※リクエスト上限は3件までです</p>" +
					"<div class='modalButtonBox'>" +
					"<a id='close' class='modalButton cancel'>CLOSE</a>" +
					"</div>"
				)
			).done(function () {
				$('#overlay, #modal').fadeIn(150);
			});
		}
	}).fail(function (XMLHttpRequest, textStatus, errorThrown) {
		$.when(
			$('#modal').append(
				"<p>通信に失敗しました</p>" +
				"<div class='modalButtonBox'>" +
				"<a id='close' class='modalButton cancel'>CLOSE</a>" +
				"</div>"
			)
		).done(function () {
			$('#overlay, #modal').fadeIn(150);
		});
		console.log("failed...");
		console.log("XMLHttpRequest : " + XMLHttpRequest.status);
		console.log("textStatus     : " + textStatus);
		console.log("errorThrown    : " + errorThrown.message);
	});
});