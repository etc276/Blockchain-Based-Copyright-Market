var app = require('../app');
var express = require('express');
var router = express.Router();
var geth = require('../models/geth.js');
var db = require('../models/db.js');
var Serverdownload = require('../models/ServerDownload.js');
var uploadDB = require('../models/uploadDB');

/* GET users listing. */
router.get('/', function(req, res, next) {
    if(app.getServerState() != "STABLE") {
		res.sendStatus(404);
	} else {
		if(req.query.key == null){
	//		console.log("hi");
			res.render('users', { title: 'For Users', Persons: {}});
		}else{
			let key = req.query.key;
			let value = req.query.value;
//			console.log("key= "+key+" value= "+value);
			db.dbquery(key,value)
			.then( (resp) => {
				if(resp.length == 0) resp = {};
				res.render('users.ejs', { Persons: resp} );
			})
			.catch( (err) => {
				console.log(err);
				res.sendStatus(500);
			});
		}	
    }
});

router.post('/receiveAddr', function(req, res, next) {
    let dest = req.body.addr;
    if(dest == undefined)
        res.send("addr does not exist.");

    geth.sendEth(dest)
    .then( tHash => {
        let obj = {"payed": dest};
        db.dbinsert(obj);
        res.send({ tHash: tHash });
    })
    .catch( err => {
        console.log(err);
    });
});

router.get('/receiveAddr', function(req, res, next) {
    let addr = req.query.addr;
    console.log("in rounter: " + addr);

    db.dbquery("payed", addr)
    .then((resp) => {
        if(resp.length != 0)
            res.send('yes');
        else
            res.send('no');
    })
    .catch((e) => {
        console.log(e);
        res.sendStatus(500);
    })
});

router.post('/', function(req,res){
    let value = req.body.tag;
	let key = req.body.key;
    
    db.dbquery(key, value)
    .then( (resp) => {
        if(resp.length == 0) resp = {};
        res.render('users.ejs', { Persons: resp} );
    })
    .catch( (err) => {
        console.log(err);
        res.sendStatus(500);
    });
})

router.get('/download',function(req,res){
	if(app.getServerState() == "STABLE" && req.session.sk){
        let keyword = req.query.keyword;
        let slice = req.query.slice;
        let ssn = req.session;
        let loginObj = app.getLoginObject();

        Serverdownload.DownloadFile(loginObj.userID, loginObj.userKey, loginObj.serverSk,
                                    loginObj.proxySk, loginObj.keywordKey, keyword,
                                    uploadDB.getCookie(), slice, ssn, function(data) {
            res.writeHead(200, {"Content-Type": "text/plain;charset=utf-8"});
            res.end(data);
        });
	} else {
		res.sendStatus(404);
	}
})

router.get('/detail', function(req, res) {
    let value = req.query.tag;
    // console.log(value);

    db.dbquery("keyword", value)
    .then( (resp) => {
        res.render('detail.ejs', { Persons: resp });
    })
    .catch( (err) => {
        console.log(err);
        res.sendStatus(500);
    })
})

module.exports = router;
