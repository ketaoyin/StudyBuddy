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
    var collection = db.get('UserRequests');
 
    collection.createIndex({
    	Loc : "2dsphere"
	});

	collection.createIndex({created_at: 1}, {expireAfterSeconds: 60});
	//collection.insert({created_at: new Date(Date.now())}); //- Append this field to userrequests 
	var requests = {
	"Type" : "User",
	"UserID" : "8",
	"Radius" : "2",
	"Status" : "Active",
	"ClassID" : "2",
	"loc" : {
		"type" : "Point",
		"coordinates" : [
			1,
			1
		]
	},
	"created_at" : new Date(Date.now()) 
}
	collection.insert(requests) 

    collection.aggregate([
    	/*{
    	$geoNear: {
       			near: { type: "Point", coordinates: [ 1 , 1 ] },
       			distanceField: "dist.calculated",
        		maxDistance : 1000 * 1609,
        		spherical: true
        } 
        },*/
        {
     	$match:{ ClassID : "1"}
        },
        {
     	$match:{ Status : "Active"}
        },
        { $lookup:
       {
         from: 'UserProfiles',
         localField: 'UserID',
         foreignField: 'UserID',
         as: 'info'
       }
     },
     {
     	$unwind : "$info"
     },
     {
        	$out : "MatchResults"
     }
    ]); 

	db.get("MatchResults").find({},{},function(e,docs) {
	res.render('userlist', {
        "userlist": docs
       });
    });
});
    
module.exports = router;
