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
     	$match:{ ClassID : "1"}
        },
        {
     	$match:{ Status : "Active"}
        },
        {
        	$out : "firstStage"
        }
    ]); 

 	var firstStageTable = db.get('firstStage');
	var query = {
    "loc" : {
        $geoWithin : {
            $centerSphere : [[1,1],10000/3959]
        }
    }
	};

	// var geofilter = 
	firstStageTable.find(query, {}).forEach(function(doc) {
		db.secondStage.insert(doc);
	});

	// db.createCollection("secondStage",geofilter)


	var secondStageTable = db.get('secondStage');

	secondStageTable.aggregate([
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
        	$out : "thirdStage"
        }
    ]); 

	var thirdStageTable = db.get('thirdStage');

	thirdStageTable.find({},{},function(e,docs) {
	res.render('userlist', {
        "userlist": docs
       });
    });

});
    

module.exports = router;
