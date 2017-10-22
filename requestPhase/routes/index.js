var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET Userlist page. */
/*
router.get('/users', function(req, res) {
    var db = req.db;
    var collection = db.get('userprofiles');
    collection.find({},{},function(e,docs){
        res.render('userlist', {
            "userlist" : docs
        });
    });
});
*/

/* GET userinfo page on lookup. */
router.get('/userinfo', function(req, res) {
    var db = req.db;
    var collection = db.get('userrequests');
    collection.aggregate([
    	{
     	$match:{ ClassID : "1"}
        },
        {
     	$match:{ Status : "Active"}
        },
        //geosearch
        {
     	$match:{ Status : "Active"}
        },	
    	 { $lookup:
       {
         from: 'userprofiles',
         localField: 'UserID',
         foreignField: 'UserID',
         as: 'info'
       }
     },
     {
     	$unwind : "$info"
     },
    ], function(e,docs) {
        res.render('userlist', {
            "userlist": docs
        });
    });
});




module.exports = router;
