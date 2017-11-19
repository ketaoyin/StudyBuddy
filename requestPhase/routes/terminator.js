var express = require('express');
var router = express.Router();
var ioServer = require('socket.io');
var ioClient = require('socket.io-client');

router.get('/', function(req, res, next) {
  res.json('Terminate Phase');
});

router.get('/exitGroup', function(req, res, next) {
	var db = req.db;
	var collection = db.get('UserRequests');
	var userID = req.query.userid;
	var groupID = req.query.groupid;

    //get size of group
	var groupSize = db.collection.find({"GroupID" : groupID}).count();

	collection.find({"UserID": userID}, {$exists: true}, function(err, doc)  {

		if(err)
	      throw err;

	    console.log('Matchee record found: ' + JSON.stringify(doc));


	    if(doc && doc[0].Status == 'Active' && doc[0].UserID == doc[0].GroupID && groupSize > 2) {
	    	console.log('Matchee is group leader')
	    	//choose new group leader etc

	    }

	    else {
	    	if(groupSize == 2) {
	    		//remove both requests

	    	}
	    	else {
	    		console.log('Matchee is group member')	
	    	}
	    }
	});	    
});	

module.exports = router;