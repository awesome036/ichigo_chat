const express = require('express');
const router = express.Router();
const connection = require('../mysqlConnection');

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.session.user_id){
		res.redirect('/mypage');
	}else {
		let query = 'SELECT language_code, language_name FROM T_LANGUAGE';
		connection.query(query, function (err, rows) {
			if (!err) {
				res.locals.user = rows.length ? rows : false;
			}
			res.render('index', {
				errorMsg: req.session.errorMsg,
				successMsg: req.session.successMsg
			});
			req.session.destroy();
		});
	}
});

module.exports = router;