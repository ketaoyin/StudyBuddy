var express = require('express');
var router = express.Router();
var cp = require('child_process');
var ioServer = require('socket.io');
var ioClient = require('socket.io-client');

router.get('/', function(req, res, next) {
  res.json('Terminate Phase');
});

/*
	Input:
		userid - user who is exiting the group
		groupid - group id of user who is leaving the group
*/
router.post('/exitGroup', function(req, res, next) {
	var db = req.db;
	var collection = db.get('UserRequests');
	var userID = req.body.userid;
	var groupID = req.body.groupid;

	var killPorts = function() {
		var execFile = require('child_process').execFile;
		db.get('userIDPort').findOne({"UserID" : userID}, function(err, document) {
        	console.log("Listen Port: " + document.Port + "\tChat Port: " + document.ChatPort);
         	var listenPort = parseInt(document.Port);
	    	var chatPort = parseInt(document.ChatPort);
	       	execFile('fuser',['-k',listenPort+'/tcp']);
	       	execFile('fuser',['-k',chatPort+'/tcp']);

			console.log("Killed listen port and chat port for User " + userID);

    	});
	};

	var killAllPorts = function(remainingListeningPort, remainingUserID) {
		var execFile = require('child_process').execFile;
		db.get('userIDPort').findOne({"UserID" : userID}, function(err, document) {
        	console.log("Listen Port: " + document.Port + "\tChat Port: " + document.ChatPort);
         	var listenPort = parseInt(document.Port);
	    	var chatPort = parseInt(document.ChatPort);
	    	var otherListenPort = parseInt(remainingListeningPort);
	       	execFile('fuser',['-k',listenPort+'/tcp']);
	       	execFile('fuser',['-k',remainingListeningPort+'/tcp']);
	       	execFile('fuser',['-k',chatPort+'/tcp']);

			console.log("Killed listen port and chat port for User " + userID);
			console.log("Killed listen port for User " + remainingUserID);
    	});
	};

	var removeUserDetails = function() {
		// Remove user request from userRequests table
		collection.remove({"UserID" : userID});
		// Remove user port mappings
		db.get('userIDPort').remove({"UserID" : userID});
	};


	collection.aggregate([
		{
			$match:{ GroupID : groupID } 
		}
		], function(err, data) {
		 	if(err) {
	        	console.log("ERROR: initial aggregation");
	        	console.log(err);
	        	throw err;
            }

			collection.find({"UserID": userID}, {$exists: true}, function(err, doc)  {

				if(err)
		    		throw err;

		    	console.log("Quitter record found: " + JSON.stringify(doc) + "\n");

		    	// Quitter is group leader, and there will be at least 2 people left in the group after
			    if(doc && doc[0].Status == 'Active' && doc[0].UserID == doc[0].GroupID && data.length > 2) {
			    	console.log("QUITTER: Quitter is group leader of group of size > 2");

			    	//choose new group leader
			    	var newLeader;

			    	for (i = 0; i < data.length; i++) {
			    		if (data[i].UserID != userID) {
			    			newLeader  = data[i];
			    			break;
			    		}
			    	}


			    	// Update groupID's of all members
			    	console.log("New group leader is " + newLeader.UserID);
			    	data.forEach(function (result) {
			    		collection.update({"UserID" : result.UserID}, {$set : {"GroupID" : newLeader.UserID}});
			    	});

			    	// Change newLeader status
			    	collection.update({"UserID": newLeader.UserID}, {$set : {"Status" : "Active"}});
			    	
			    	// Sends new leader's profile to other members
			    	db.get('UserProfiles').findOne({"UserID": newLeader.UserID}, function(err, leaderProfile) {
			    		var leaderProfile = {
                            "Name" : leaderProfile.Name,
                            "Rating" : leaderProfile.Rating,
                            "Year" : leaderProfile.Year,
                            "Major" : leaderProfile.Major
                        };

				    	// Start new chat server
				    	db.get('userIDPort').findOne({"UserID": newLeader.UserID}, function(err, document) {
				    	 	if (err) {
				    	 		console.log("ERROR: starting new chat server for new group leader");
				    	 		console.log(err);
				    	 		throw err;
				    	 	}
					    	var args = [];

					    	var chatPort;

					    	if (document.ChatPort == null) {
		        				console.log("New leader has no chat port assigned");

		        				chatPort = (parseInt(document.Port) + 1000).toString();
		        				db.get('userIDPort').update({"UserID": userID}, {$set : {"ChatPort" : chatPort}});
		        				
		        				console.log("New leader current chat port: " + chatPort);
		        			}
		        			else {
		        				console.log("New leader has chat port assigned already");
		        				charPort = document.ChatPort;
		        				console.log("New leader current chat port: " + document.ChatPort);
		        			}

		        			// Spin up new chat server
							args.push(parseInt(chatPort).toString());
							console.log(args[0]);
					    	cp.fork('../simple-nodejs-chat' + '/server.js', args);
					    
					    	// Notify all other users with list of updated members and new chat port
					    	data.forEach(function (result) {
					    	 	var message = {
					    	 		"Type" : "Departure",
							    	"Msg" : "Booyah Sucker, leader left ya to rot!",
							    	"NewChatPort" : chatPort,
							    	"UserID" : userID,					// Quitter UserID
							    	"GroupID" : newLeader.UserID, 		// New group ID
							    	"LeaderProfile" : leaderProfile 	// Leader's profile
					    	 	};

					    	 	if(result.UserID != userID) {
					    	 		db.get('userIDPort').findOne({"UserID": result.UserID}, function(err, document) {
									  	if (err) {
						                    console.log("ERROR: finding port mappings for rest of members");
						                    console.log(err);
						                    throw err;
				               			}

				               			var server = ioServer.listen(document.Port);
										console.log('userIDPort' + document.Port);

										server.on("connection", (socket) => {
										    console.log(`Client connected [id=${socket.id}]`);

										    var newPortNum;
					               			db.get('userIDPort').find({}, {sort: {Port : -1}, limit : 1}, function(err, portInfo) {
		             							newPortNum = (parseInt(portInfo[0]["Port"], 10) + 1).toString();
		             							
		             							// Update database with new port number for user
								  				db.get('userIDPort').update({"UserID": result.UserID}, {$set : {"Port" : newPortNum}}, function(err) {
								  					message["UserPortNum"] = newPortNum;
								  					socket.emit("msg", message);
								  					console.log("NEW RECEIVER PORT: " + newPortNum);
								  				});

		             						});

										    socket.on("disconnect", () => {
										        console.log(`Client gone [id=${socket.id}]`);
											});
										});

									});
					    	 	}

							});

				    	});

				    });

			    	killPorts();
			        removeUserDetails();

			        res.json("Thank you for using StudyBuddy!");
			    }

			    // A member leaves, and there will be at least 2 people left in the group afterwards
		    	else if(doc && doc[0].Status != 'Active' && doc[0].UserID != doc[0].GroupID && data.length > 2) {
		    		console.log("QUITTER: Quitter is group member of group of size > 2");

		    		// Notify all other users that a teammate has left
			    	data.forEach(function (result) {
			    	 	var message = {
			    	 		"Type" : "Departure",
					    	"Msg" : "A member has left the group!",
					    	"UserID" : userID
			    	 	};
			    	 	
			    	 	if(result.UserID != userID) {
			    	 		console.log("Remaining group member: " + result.UserID);

			    	 		db.get('userIDPort').findOne({"UserID" : result.UserID}, function(err, document) {
							  	if (err) {
				                    console.log("ERROR: finding port mappings for rest of members");
				                    console.log(err);
				                    throw err;
		               			}

								var server = ioServer.listen(document.Port);
								console.log('userIDPort' + document.Port);

		               			server.on("connection", (socket) => {
								    console.log(`Client connected [id=${socket.id}]`);

								    // Find new port num
								    db.get('userIDPort').find({}, {sort: {Port : -1}, limit : 1}, function(err, portInfo) {
	         							var newPortNum = (parseInt(portInfo[0]["Port"], 10) + 1).toString();
	         						
		         						message["UserPortNum"] = newPortNum;

										// Update database with new port number for user
						  				db.get('userIDPort').update({"UserID": result.UserID}, {$set : {"Port" : newPortNum}}, function(err) {
						  					if (err)
						  						console.log(err)

						  					console.log("UPDATE PORT FOR: " + result.UserID);
						  					console.log("NEW PORT NUM: " + newPortNum)

						  					socket.emit("msg", message);
						  				});
						  				
	         						});

								    socket.on("disconnect", () => {
								        console.log(`Client gone [id=${socket.id}]`);
									});
								});

							});
			    	 	}
					});

			    	killPorts();
			        removeUserDetails();

			        res.json("Thank you for using StudyBuddy!");
		    	}

		    	// Group will have less than 2 people left, and group needs to be dissolved
		    	else if (data.length <= 2) {
		    		console.log("QUITTER: Quitter leads to group dissolving");

		    		var remainingPort;
		    		var remainingUserID;

		    		// Notify all other users that a teammate has left
			    	data.forEach(function (result) {
			    	 	var message = {
			    	 		"Type" : "Disband",
					    	"Msg" : "A member has left the group!",
					    	"UserID" : userID
			    	 	};

			    	 	// For other member
			    	 	if(result.UserID != userID) {

			    	 		remainingUserID  = result.UserID;

			    	 		db.get('userIDPort').findOne({"UserID": result.UserID}, function(err, document) {
							  	if (err) {
				                    console.log("ERROR: finding port mappings for rest of members");
				                    console.log(err);
				                    throw err;
		               			}

		               			remainingPort = document.Port;

							    var server = ioServer.listen(document.Port);
								console.log('Remaining member (User ' + result.UserID + ')\'s userIDPort: ' + document.Port);

								server.on("connection", (socket) => {
								    console.log(`Client connected [id=${socket.id}]`);

								    socket.emit("msg", message);				

								    // Remove other member's request from userRequests table
									collection.remove({"UserID" : result.UserID});
									// Remove other member's port mapping
									db.get('userIDPort').remove({"UserID" : result.UserID});									

								    socket.on("disconnect", () => {			    	
								        console.log(`Client gone [id=${socket.id}]`);
									});
								});
							});
	
						}	
		    		});

			    	// For quitter
		    		// killPorts();
		    		killAllPorts(remainingPort,remainingUserID);
			        removeUserDetails();
			        res.json("Thank you for using StudyBuddy!");
		    	}
		    	// Unexpected behavior
		    	else {
		    		console.log("ERROR: WTF?! Group did not change properly.");
		    	}
   			});

    });    
});	

/*
	Input:
		myid - userID of person sending the rating
		userid - userID of person being rated
		rating - rating, from 1 to 5
*/
router.post('/rateMember', function(req, res, next) {
	var db = req.db;
	var collection = db.get('UserProfiles');
	var myID = req.body.myid;
	var userID = req.body.userid;
	var rating = parseFloat(req.body.rating);

	collection.findOne({"UserID" : userID}, function(err, profile) {
		var currRating = parseFloat(profile.Rating);
		var numRatings = parseFloat(profile.numRatings);

		console.log("Ratee profile: " + JSON.stringify(profile));
		console.log("Ratee current rating: " + currRating);
		console.log("Ratee current # ratings: " + numRatings);
		console.log("Rater's rating of ratee: " + rating);

		var newRating = (currRating * numRatings + rating) / (numRatings + 1);

		console.log("Ratee new rating: " + newRating);

		collection.update({"UserID" : userID}, {$set : {"Rating" : newRating.toString(), "numRatings" : parseInt(numRatings + 1).toString()}}, function(err, result) {
			if (err)
				console.log(err)

			res.json("Thank you for rating your teammate!");
		});

	});

});
module.exports = router;