var express = require('express');
var cp = require('child_process');
var router = express.Router();
var ioServer = require('socket.io');
var ioClient = require('socket.io-client');
var tcpPortUsed = require('tcp-port-used');

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

//User A invites B to pair
/*
	Input:
		myid - invite sender's user ID
		userid - invitee's user ID
	Output (What User B receives in message from server):
		{
			Name - name of User A
			Rating - rating of User A
			Year - year of User A
			Major - major of User A
			Location - [lng, lat]
			NewGroupID - group ID for all members of this group
			NewChatPort - chat port for all members of this group
			UserID - user ID of invite sender
		}
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
	                "UserID" : myID
		        }

		        // Append correct Group ID and chat port ID number (group leader's port + 1000)
		        db.get('UserRequests').findOne({"UserID" : userID}, function(err, document) {
		        	
		        	console.log("USER B USERID: " + document.UserID);
		        	console.log("USER B GROUPID: " + document.GroupID);

		        	// Matchee should be group leader
		        	if (document.GroupID == userID) {

		        		console.log("Matchee would be group leader");
		        		userInfo["NewGroupID"] = document.GroupID;

		        		db.get('userIDPort').findOne({"UserID" : userID}, function(err, document) {

		        			if (document.ChatPort == null) {
		        				console.log("Leader has no chat port assigned");

		        				var newChatPort = (parseInt(document.Port) + 1000).toString();
		        				userInfo["NewChatPort"] = newChatPort;
		        				db.get('userIDPort').update({"UserID": userID}, {$set : {"ChatPort" : newChatPort}});
		        				
		        				console.log("Leader current chat port: " + newChatPort);
		        			}
		        			else {
		        				userInfo["NewChatPort"] = document.ChatPort;

		        				console.log("Leader current chat port: " + document.ChatPort);
		        			}

		        		});
		        	}
		        	// Matcher should be group leader
		        	else {
		        		console.log("Matcher would be group leader");
		        		userInfo["NewGroupID"] = myID;

		        		db.get('userIDPort').findOne({"UserID" : myID}, function(err, document) {

		        			if (document.ChatPort == null) {
		        				console.log("Leader has no chat port assigned");

		        				var newChatPort = (parseInt(document.Port) + 1000).toString();
		        				userInfo["NewChatPort"] = newChatPort;
		        				db.get('userIDPort').update({"UserID": myID}, {$set : {"ChatPort" : newChatPort}});
		        				
		        				console.log("Leader current chat port: " + newChatPort);
		        			}
		        			else {
		        				userInfo["NewChatPort"] = document.ChatPort;

		        				console.log("Leader current chat port: " + document.ChatPort);
		        			}

		        		});
		        	}
		        });


		        // Finds new port number for message receiver to use
		        db.get('userIDPort').find({}, {sort: {Port : -1}, limit : 1}, function(err, result) {
             		var newPortNum = (parseInt(result[0]["Port"], 10) + 1).toString();

             		console.log("NEW RECEIVER PORT: " + newPortNum);

	             	//look up which port user B is listening on
				    db.get('userIDPort').findOne({"UserID": userID}, function(err, document) {
				    	var currPortNum = document.Port;
						console.log("CURRENT USER PORT: " + currPortNum);

						// Add new port number to response object
						userInfo["UserPortNum"] = newPortNum;

						console.log("Matchee ID: " + userID + "\tMatchee PortNum: " + currPortNum);
						console.log('Matchee info package: ' + JSON.stringify(userInfo));

						var server = ioServer.listen(currPortNum);
						server.on("connection", (socket) => {
							console.log(`Client connected [id=${socket.id}]`);
						   
						    socket.emit("msg", userInfo);
							
							// Update database with new port number for user
				  			db.get('userIDPort').update({"UserID": userID}, {$set : {"Port" : newPortNum}});

						    socket.on("disconnect", () => {
						        console.log(`Client gone [id=${socket.id}]`);
							});
						 
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

		clientMsg.on("msg", function(msg) {
	   		clientMsg.disconnect();
	   		res.json(msg);
	  	});
   	});	
});


//User B responds to user A's pair request -- sends user A's and B's userid and response(1 or 0)
/*
	Input:
		value - 1 for accepting invite, 0 for reject
		newGroupID - new group ID received from server during HS2
		newChatPort - new chat port received from server during HS2
		myid - respondent's user ID
		userid - invite sender's user ID
	Output (What user A receives in message from server after User B responds):
		{
			Response - 1 or 0, 1 for accepted, 0 for rejected
			Msg - message, according to Response
			NewGroupID - group ID for all members of this group, if Response == 1
			NewChatPort - chat port for all members of this group, if Response == 1
		}
*/
router.post('/respondToPairReq', function(req, res, next) {
	var db = req.db;
	var query = req.body;
	var collection = db.get('UserRequests');

	var args = []
	args.push(query.newChatPort)

	//Server sends acknowledgment to User A
	if(parseInt(query.value) == 1) {

		//insert groupID field to users (myid and userid)
		db.get('UserRequests').update({"UserID": query.userid}, {$set : {"GroupID" : query.newGroupID}});
		db.get('UserRequests').update({"UserID": query.myid}, {$set : {"GroupID" : query.newGroupID}});

		//remove timestamps
		db.get('UserRequests').update({"UserID": query.myid}, {$unset : {"createdAt" : ""}});
		db.get('UserRequests').update({"UserID": query.userid}, {$unset : {"createdAt" : ""}});
  
		// Spin up chat server, if not already running
		var tcpPortUsed = require('tcp-port-used');

		console.log("GROUP CHAT PORT: " + query.newChatPort);

		tcpPortUsed.check(parseInt(query.newChatPort), address).then(function(inUse) {
			console.log("Chat port in use?: " + inUse)

			if(!inUse) {
				cp.fork('../chatServer' + '/server.js', args);
			}
		});

		// Finds new port number for message receiver to use
        db.get('userIDPort').find({}, {sort: {Port : -1}, limit : 1}, function(err, result) {
     		var newPortNum = (parseInt(result[0]["Port"], 10) + 1).toString();

     		console.log("NEW RECEIVER PORT: " + newPortNum);

         	//look up which port user B is listening on
		    db.get('userIDPort').findOne({"UserID": req.body.userid}, function(err, document) {
		    	var currPortNum = document.Port;
		    	console.log("User ID: " + req.body.userid + " Port: " + document.Port)

				var reply = {
			    	"Response" : "1",
			    	"Msg" : "Congrats!User B has accepted your request",
			    	"NewGroupID" : query.newGroupID,
			    	"NewChatPort" : query.newChatPort,
			    	"UserPortNum" : newPortNum
			    }

				var server = ioServer.listen(currPortNum);
				server.on("connection", (socket) => {
					//console.log('socket object' + socket)
					console.log(`Client connected [id=${socket.id}]`);
				   
				    socket.emit("msg", reply);
					
					// Update database with new port number for user
		  			db.get('userIDPort').update({"UserID": req.body.userid}, {$set : {"Port" : newPortNum}});

				    socket.on("disconnect", () => {
				        console.log(`Client gone [id=${socket.id}]`);
					});
				 
				});

     		});

		});


		res.json("Congrats! You've been paired with User A");

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
		// Finds new port number for message receiver to use
        db.get('userIDPort').find({}, {sort: {Port : -1}, limit : 1}, function(err, result) {
     		var newPortNum = (parseInt(result[0]["Port"], 10) + 1).toString();

     		console.log("NEW RECEIVER PORT: " + newPortNum);

         	//look up which port user B is listening on
		    db.get('userIDPort').findOne({"UserID": req.body.userid}, function(err, document) {
		    	var currPortNum = document.Port;
		    	console.log("User ID: " + req.body.userid + " Port: " + document.Port)

				var reply = {
			    	"Response" : "0",
			    	"Msg" : "Sorry! User B declined your request. Try looking for another buddy!",
			    	"UserPortNum" : newPortNum
			    }

				var server = ioServer.listen(currPortNum);
				server.on("connection", (socket) => {
					console.log(`Client connected [id=${socket.id}]`);
				   
				    socket.emit("msg", reply);
					
					// Update database with new port number for user
		  			db.get('userIDPort').update({"UserID": req.body.userid}, {$set : {"Port" : newPortNum}});

				    socket.on("disconnect", () => {
				        console.log(`Client gone [id=${socket.id}]`);
					});
				 
				});

     		});

		});

		res.json("Thanks for responding to User A!");
	}
		
});

module.exports = router;