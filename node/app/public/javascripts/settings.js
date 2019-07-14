'use strict'

$(document).ready(function(){
	// ServiceWorker
	window.addEventListener('load', function () {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register("/serviceWorker.js");
		}
	});
	
	// ブラウザバック無効化
	history.pushState(null, null, null);
	$(window).on("popstate", function (event) {
		if (!event.originalEvent.state) {
			history.pushState(null, null, null);
			return;
		}
	});
	

	// 	iOS仮想キーボード表示時のfixed修正 */
	if ('ontouchstart' in window) {
		$('#msg_input')
			.on('focus', function () {
				$('body').addClass('fixfixed');
				// document.addEventListener('touchmove', function (e) {
				// 	e.preventDefault();
				// }, { passive: false });
			})
			.on('blur', function () {
				$('body').removeClass('fixfixed');
			});
	}
});
