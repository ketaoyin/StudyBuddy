var express = require('express');

var router = express.Router();

var timeoutID;

var HashMap = require('hashmap');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET list of matches */
/* 
    Input: userid, radius, classid, lng, lat, searchType
    Output:
        if searching for individual:
            {"Matches" : [List of matched users' information JSON objects],
             "UserPortNum" : request sender's port number for socket.io}
        if searching for group:
            {"Matches" : [
                {Leader: {Group Leader's Information JSON object},
                 Members: [List of group member's information JSON objects]}
             ],
             "UserPortNum" : request sender's port number for socket.io}
*/
router.post('/userMatches', function(req, res) {

    var db = req.db;
    var collection = db.get('UserRequests');

    // CREATE NEW USER-PORT ASSIGNMENT, IF NECESSARY
    var userPortNum = "";
    db.get('userIDPort').findOne({"UserID" : req.body.userid}, function(err, result) {
        if (result == null) {
            console.log("User (" + req.body.userid + ") does not have a port number assigned");

            db.get('userIDPort').find({}, {sort: {Port : -1}, limit : 1}, function(err, result) {
                console.log("Max port number is: " + result[0]["Port"]);
                var portNum = (parseInt(result[0]["Port"], 10) + 1).toString();
                console.log("New Port Number: " + portNum);

                var entry = {
                    "UserID" : req.body.userid,
                    "Port" : portNum
                }

                db.get('userIDPort').insert(entry);
                
                console.log("User (" + req.body.userid + ") has been assigned port number: " + portNum + "\n");

                // Return port num to user
                userPortNum = portNum;
            });
        }
        else {
            console.log("This user (" + req.body.userid + ") is assigned port number " + result["Port"])

            // Return port num to user
            userPortNum = result["Port"];
        }
    });

    // Creating index for spatial data
    collection.createIndex({
        loc : "2dsphere"
    });

    // Creating TTL Index for each user request
    collection.createIndex({createdAt: 1}, {expireAfterSeconds: 300});

    //Extract information from incoming requests and add to UserRequests table
    var query = req.body;
    var request = {
        "Type" : "User",
        "UserID" : query.userid,
        "Radius" : query.radius,
        "Status" : "Active",
        "ClassID" : query.classid,
        "loc" : {
            type : "Point",
            coordinates : [
                 parseFloat(query.lng),
                 parseFloat(query.lat)
            ]
        },
        "createdAt" : new Date(Date.now()) 
    }

    // Search type: "Group" or "Individual"
    var searchType = query.searchType;

    // Update a request instead if it is already in table
    collection.update({"UserID" : query.userid},request,{ upsert: true });
  
    // Gather results of matching process after 4s (before timeout)
    timeoutID = setTimeout(function() {

        var listUsers = [];

        if (searchType == "Individual") {
            // Aggregate pipeline to find users that are within request sender's radius
            req.db.get('UserRequests').aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [
                                parseFloat(query.lng),
                                parseFloat(query.lat)
                            ]
                        },
                        distanceField: "dist.calculated",
                        maxDistance : parseFloat(query.radius),
                        spherical: true
                    }
                },
                {
                    $match:{ ClassID : query.classid}
                },
                {
                    $match:{ Status : "Active"}
                },
                {
                    $lookup: {
                        from: 'UserProfiles',
                        localField: 'UserID',
                        foreignField: 'UserID',
                        as: 'info'
                    }
                },
                {
                    $unwind : "$info"
                }
            ], function(err, data) {
                if(err) {
                    console.log("ERROR: initial aggregation");
                    console.log(err);
                    throw err;
                }

                // List of users to be returned
                data.forEach(function (result) {

                    // Check if request sender is within matchee's range
                    if(result.UserID != result.GroupID && result.dist.calculated < parseFloat(result.Radius) && result.dist.calculated !=0 ) {
                        // Push each matched individual into return list
                        
                        console.log("Found individual that match the user's criteria...");
                        var userInfo = {
                            "Name" : result.info.Name,
                            "Rating" : result.info.Rating,
                            "Year" : result.info.Year,
                            "Major" : result.info.Major,
                            "UserID" : result.UserID,
                            "Location" : result.loc.coordinates,
                            "Distance away(m)" : result.dist.calculated
                        };

                        console.log(JSON.stringify(userInfo));

                        listUsers.push(userInfo);
                    };
                });

                // No matches found
                if(JSON.stringify(listUsers) == "[]") {
                    res.json({"Msg" : 'No matches found'});
                }
                // Return matches
                else {
                    res.json({
                        "Matches" : listUsers,
                        "UserPortNum" : userPortNum
                    });
                }

            });

        }

        else if (searchType == "Group") {
            // Aggregate pipeline to find users that are within request sender's radius
            req.db.get('UserRequests').aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [
                                parseFloat(query.lng),
                                parseFloat(query.lat)
                            ]
                        },
                        distanceField: "dist.calculated",
                        maxDistance : parseFloat(query.radius),
                        spherical: true
                    }
                },
                {
                    $match:{
                        ClassID: query.classid,
                        GroupID: {$exists: true} 
                    }
                },
                {
                    $lookup: {
                        from: 'UserProfiles',
                        localField: 'UserID',
                        foreignField: 'UserID',
                        as: 'info'
                    }
                },
                {
                    $unwind: "$info"
                },
                {
                    $sort: {Group : 1}
                }
            ], function(err, data) {
                if(err) {
                    console.log("ERROR: initial aggregation");
                    console.log(err);
                    throw err;
                }

                var map = new HashMap();

                // Add all possible users to respectives groups in map
                data.forEach(function (result) {
                    if (map.has(result.GroupID)) {
                        var set = map.get(result.GroupID);
                        set.push(result);
                        map.set(result.GroupID, set);
                    }
                    else {
                        var set = [];
                        set.push(result);
                        map.set(result.GroupID, set);
                    }
                });

                var keySet = map.keys();

                // Process each individual group
                for (var i = 0; i < keySet.length; i++) {
                    var groupMembers = map.get(keySet[i]);

                    var leader;
                    var members = [];
                    var keepGroup = false;

                    // Process each user in the group
                    for (var j = 0; j < groupMembers.length; j++) {
                        var user = groupMembers[j];

                        var userInfo = {
                            "Name" : user.info.Name,
                            "Rating" : user.info.Rating,
                            "Year" : user.info.Year,
                            "Major" : user.info.Major,
                            "UserID" : user.UserID,
                            "Location" : user.loc.coordinates,
                            "Distance away(m)" : user.dist.calculated
                        }

                        // User is group member, add to list of members
                        if (user.GroupID != user.UserID) {
                            members.push(userInfo);
                        }
                        // User is group leader and is within range of request sender, making this a valid return group
                        else if (user.GroupID == user.UserID && user.dist.calculated < parseFloat(user.Radius) && user.dist.calculated != 0) {
                            leader = userInfo;
                            keepGroup = true;
                        }
                    }

                    // If this group is a valid matchee, add to return list
                    if (keepGroup) {
                        var groupInfo = {
                            "Leader" : leader,
                            "Members" : members
                        }
                        listUsers.push(groupInfo);
                    }
                }
            

                // No matches found
                if(JSON.stringify(listUsers) == "[]") {
                    res.json({"Msg" : 'No matches found'});
                }
                // Return matches
                else {
                    res.json({
                        "Matches" : listUsers,
                        "UserPortNum" : userPortNum
                    });
                }

            });

        }        

    }, 4000);
 });


/* Abort Match Process */
router.get('/stopMatchProcess', function(req, res) {
    clearTimeout(timeoutID);
    res.json({'msg' : 'User has aborted match process!'})
});

module.exports = router;
