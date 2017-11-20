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
	var groupTable = db.get('GroupTable');
	
	var groupTableEntry = {
	 "UserID" : userID,
	 "GroupID" : groupID
	}

	db.get('GroupTable').update({"UserID" : userID},groupTableEntry,{ upsert: true });

	var killPorts = function() {
			var execFile = require('child_process').execFile;
    		db.get('userIDPort').findOne({"UserID" : userID}, function(err, document) {
	        	console.log(document.Port)
	        		
		       
		     var listenPort = parseInt(document.Port);
		     var chatPort = parseInt(document.Port) + 1000;
		       
			execFile('fuser',['-k',listenPort+'/tcp']);
			execFile('fuser',['-k',chatPort+'/tcp']);

			console.log('Killed listen and chat ports of user')

	    });
	};

	var removeUserDetails = function() {
		collection.remove({"UserID" : userID});
	    db.get('userIDPort').remove({"UserID" : userID});
	};

	collection.aggregate([
		 {
		 	$match:{ GroupID : groupID } 
		 },
		 ], function(err, data) {

		 	if(err) {
	            console.log("ERROR: initial aggregation");
	            console.log(err);
	            throw err;
            }

		collection.find({"UserID": userID}, {$exists: true}, function(err, doc)  {

		if(err)
	      throw err;

	    console.log('Matchee record found: ' + JSON.stringify(doc));

	    if(doc && doc[0].Status == 'Active' && doc[0].UserID == doc[0].GroupID && data.length > 2) {
	    	console.log('Matchee is group leader of group size > 2')
	    	//choose new group leader etc

	    }

	    else {
	    	//killPorts();
	    	//removeUserDetails();
	    	if(data.length == 0) {
	    		console.log('Last person leaving group. Dispatch rating requests to all')

	    		//Ratings - Ketao
	    		


	    	}

	    	if(doc[0].UserID == doc[0].GroupID && data.length == 2) {
	    		//remove both requests
	    		console.log('Matchee is group leader and size is 2')	

	    		   //send message to other member



	    		   /*db.get('userIDPort').findOne({"GroupID": groupID}, function(err, document) {

				    var server = ioServer.listen(document.Port);
					console.log('userIDPort' + document.Port)
					server.on("connection", (socket) => {
					    console.log(`Client connected [id=${socket.id}]`);

					    socket.emit("msg", "Booyah Sucker,leader left ya to rot!");

					    socket.on("disconnect", () => {
					        console.log(`Client gone [id=${socket.id}]`);
						});
					});
				});*/
	    	}

	    	else {
	    		console.log('Matchee is group member')
	    	}
	    }
	  });	
   });    
});	

module.exports = router;