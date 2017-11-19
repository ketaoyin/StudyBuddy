var express = require('express');
var cp = require('child_process');
var router = express.Router();
var ioServer = require('socket.io');
var ioClient = require('socket.io-client');

// Network interfaces
var address,
    ifaces = require('os').networkInterfaces();
for (var dev in ifaces) {
    ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
}

var serverIP = "http://" + address;

router.get('/', function(req, res, next) {
  res.json('Accept Phase');
});

//User A invites B to pair - Step 1,1.5,2
/*
	Input: myid - invite sender's user ID
		   userid - invitee's user ID
*/
router.post('/invitePairReq', function(req, res, next) {
	var db = req.db;
    var collection = db.get('UserRequests');
    var myID = req.body.myid;
    var userID = req.body.userid;
    console.log('My ID: ' + myID);
    console.log('Matchee ID: ' + userID);

    //check if user B exists
    collection.find({"UserID": userID}, {$exists: true}, function(err, doc)  {
	    if(err)
	    	throw err;

	    console.log('Matchee record found: ' + JSON.stringify(doc));

	    if(doc && doc[0].Status == 'Active') {
	    	console.log('Matchee is active')

			//fetch user A info to send to B
		   	collection.aggregate([ 
		   		{$lookup:
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
		    	
		    	var userInfo = {
	                "Name" : result[0].info.Name,
	                "Rating" : result[0].info.Rating,
	                "Year" : result[0].info.Year,
	                "Major" : result[0].info.Major,
	                "Location" : result[0].loc.coordinates,
		        }

		        // Append correct Group ID and chat port ID number (group leader's port + 1000)
		        db.get('UserRequests').find({"UserID" : userID}, function(err, document) {
		        	// Matchee should be group leader
		        	if (document.GroupID == userID) {

		        		console.log('here' + document.GroupID)
		        		userInfo["NewGroupID"] = document.GroupID;

		        		db.get('userIDPort').findOne({"UserID" : userID}, function(err, document) {
		        			userInfo["NewChatPort"] = (parseInt(document.Port) + 1000).toString();
		        		});
		        	}
		        	// Matcher should be group leader
		        	else {
		        		userInfo["NewGroupID"] = myID;

		        		db.get('userIDPort').findOne({"UserID" : myID}, function(err, document) {
		        			userInfo["NewChatPort"] = (parseInt(document.Port) + 1000).toString();
		        		});
		        	}
		        });


		        console.log('Matchee info package: ' + JSON.stringify(userInfo))

			    //look up which port user B is listening and send myInfo
			    db.get('userIDPort').findOne({"UserID": userID}, function(err, document) {

				    var server = ioServer.listen(document.Port);
					console.log('userIDPort' + document.Port)
					server.on("connection", (socket) => {
					    console.log(`Client connected [id=${socket.id}]`);

					    socket.emit("msg", userInfo);

					    socket.on("disconnect", () => {
					        console.log(`Client gone [id=${socket.id}]`);
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
/*
	Input: userid = user ID
*/
router.get('/receiveMsgFromServer', function(req, res, next) {
   var port;
   var userID = req.query.userid;
   
   req.db.get('userIDPort').findOne({"UserID": userID}, function(err, document) {

	   var clientMsg = ioClient.connect(serverIP + ":" + document.Port);

	   clientMsg.on("msg", (msg) => res.json(msg));
   });	
});


//User B responds to user A's pair request -- sends user A's and B's userid and response(1 or 0)
/*
	Input: value - 1 for accepting invite, 0 for reject
		   newGroupID - new group ID received from server during HS2
		   newChatPort - new chat port received from server during HS2
		   myid - respondent's user ID
		   userid - invite sender's user ID
	Output: {
				Response: 1 or 0, 1 for accepted, 0 for rejected
				Msg: message, according to Response
				NewGroupID: new group ID, if Response == 1
				NewChatPort: new chat port, if Response == 1
			}
*/
router.post('/respondToPairReq', function(req, res, next) {
	var db = req.db;
	var query = req.body;

	var args = []
	args.push(query.newChatPort)

	//Server sends acknowledgment to User A
	if(parseInt(query.value) == 1) {
		console.log('enter here')
		cp.fork('../simple-nodejs-chat' + '/server.js', args);
		db.get('userIDPort').findOne({"UserID": req.body.userid}, function(err, document) {

		    var server = ioServer.listen(document.Port);

		    console.log("User ID: " + req.body.userid + " Port: " + document.Port)
			server.on("connection", (socket) => {
			    console.info(`Client connected [id=${socket.id}]`);

			    var reply = {
			    	"Response" : "1",
			    	"Msg" : "Congrats!User B has accepted your request",
			    	"NewGroupID" : query.newGroupID,
			    	"NewChatPort" : query.newChatPort
			    }

			    socket.emit("msg", reply);
			    // socket.emit("msg", "Congrats!User B has accepted your request");

			    socket.on("disconnect", () => {
			        console.info(`Client gone [id=${socket.id}]`);
				});
			});
		});	 

		res.json("Congrats! You've been paired with User A");

		// ToDo: all members' requests do NOT timeout
		// User B (respondent) is the group leader
		if (query.myid == query.newGroupID) {
			db.get('UserRequests').update({"UserID": req.body.userid}, {$set : {"Status" : "Grouped"}});
		}
		// User A (invite sender) is the group leader
		else if (query.userid == query.newGroupID) {
			db.get('UserRequests').update({"UserID": req.body.myid}, {$set : {"Status" : "Grouped"}});
		}
		// ERROR: unexpected behavior
		else {
			console.log("ERROR: respondToPairReq unexpected behavior");
		}
		
	}

	else {
		db.get('userIDPort').findOne({"UserID": req.body.userid}, function(err, document) {

		    var server = ioServer.listen(document.Port);

			server.on("connection", (socket) => {
			    console.info(`Client connected [id=${socket.id}]`);

			    var reply = {
			    	"Response" : "0",
			    	"Msg" : "Sorry! User B declined your request. Try looking for another buddy!"
			    }

			    socket.emit("msg", reply);
			    // socket.emit("msg", "Sorry! User B declined your request. Try looking for another buddy! ");

			    socket.on("disconnect", () => {
			        console.info(`Client gone [id=${socket.id}]`);
			    });
			});
		});	 
		res.json("Thanks for responding to User A!");
	}
		
});

module.exports = router;