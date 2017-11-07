var express = require('express');

var router = express.Router();
var ioServer = require('socket.io');
var ioClient = require('socket.io-client');

router.get('/', function(req, res, next) {
  res.json('Accept Phase');
});

//User A invites B to pair - Step 1,1.5,2
router.get('/invitePairReq', function(req, res, next) {
	var db = req.db;
    var collection = db.get('UserRequests');
    var myID = req.query.myid;
    var userID = req.query.userid;
    console.log(userID);
    console.log('my id' + myID);

    //check if user B exists
    collection.find({"UserID": userID}, {$exists: true}, function(err, doc)  {

    if(err)
    	throw err;

    if(doc && doc[0].Status == 'Active') {

	//fetch user A info to send to B
   	collection.aggregate([ {$lookup:
       {
         from: 'UserProfiles',
         localField: 'UserID',
         foreignField: 'UserID',
         as: 'info'
       }
     },
     {
     	$match: {"UserID" : myID}
     },
      {
        $unwind : "$info"
     }], function(err,result) {

     	if(err)
    	    throw err;
    	  console.log(result)
    	  var userInfo = {
                "Name" : result[0].info.Name,
                "Rating" : result[0].info.Rating,
                "Year" : result[0].info.Year,
                "Major" : result[0].info.Major,
                "Location" : result[0].loc.coordinates,
            }

    //look up which port user B is listening and send myInfo
    db.get('userIDPort').findOne({"UserID": userID}, function(err, document) {

    var server = ioServer.listen(document.Port);

	server.on("connection", (socket) => {
    console.info(`Client connected [id=${socket.id}]`);

    socket.emit("msg", userInfo);

    socket.on("disconnect", () => {
        console.info(`Client gone [id=${socket.id}]`);
	    });
	});
	});
   }); 

    res.json("Information sent to Client!Please wait for response");
  }

   else
   	res.json("User not active anymore! Please choose another Buddy!");
 });
});

// 1.User B receives req and can view User A's profile -- should be continously listening on client port
 // 2. User A listens on it's port after inviting User B -- -- should be continously listening on client port
router.get('/receiveMsgFromServer', function(req, res, next) {
   var port;
   var userID = req.query.userid;
   
   req.db.get('userIDPort').findOne({"UserID": userID}, function(err, document) {
   
   console.log("Here!!!!")

   var clientMsg = ioClient.connect("http://128.61.116.87:" + document.Port);
   
   console.log("HERE!!!!")

   clientMsg.on("msg", (msg) => res.json(msg));

   console.log("Got it!!!!")

   });	
});


//User B responds to user A's pair request -- sends user A's and B's userid and response(1 or 0)
router.get('/respondToPairReq', function(req, res, next) {
	var db = req.db;
	var query = req.query;

	//Server sends acknowledgment to User A
	if(query.value == '1') {
		db.get('userIDPort').findOne({"UserID": req.query.userid}, function(err, document) {

	    var server = ioServer.listen(document.Port);

		server.on("connection", (socket) => {
	    console.info(`Client connected [id=${socket.id}]`);

	    socket.emit("msg", "Congrats!User B has accepted your request");

	    socket.on("disconnect", () => {
	        console.info(`Client gone [id=${socket.id}]`);
		    });
		});
		});	 

		res.json("Congrats! You've been paired with User A");

		db.get('UserRequests').update({"UserID": req.query.userid}, {$set : {"Status" : "Grouped"}});

		// Group Leader remains active in the Requests Table
		// db.get('UserRequests').update({"UserID": req.query.myid}, {$set : {"Status" : "Grouped"}});
	}
		

	else {
		db.get('userIDPort').findOne({"UserID": req.query.userid}, function(err, document) {

	    var server = ioServer.listen(document.Port);

		server.on("connection", (socket) => {
	    console.info(`Client connected [id=${socket.id}]`);

	    socket.emit("msg", "Sorry! User B declined your request. Try looking for another buddy! ");

	    socket.on("disconnect", () => {
	        console.info(`Client gone [id=${socket.id}]`);
		    });
		});
		});	 
		res.json("Thanks for responding to User A!");
	}
		
});

module.exports = router;