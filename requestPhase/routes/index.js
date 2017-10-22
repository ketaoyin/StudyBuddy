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
 
    collection.ensureIndex({
    	loc : "2dsphere"
	});

    collection.aggregate([
    	{
    	$geoNear: {
       			near: { type: "Point", coordinates: [ 1 , 1 ] },
       			distanceField: "dist.calculated",
        		maxDistance : 1000* 1609,
        		spherical: true
        }
        },
        {
     	$match:{ ClassID : "1"}
        },
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
     {
        	$out : "matchResults"
     }
    ]); 

	db.get("matchResults").find({},{},function(e,docs) {
	res.render('userlist', {
        "userlist": docs
       });
    });
});
    
module.exports = router;
