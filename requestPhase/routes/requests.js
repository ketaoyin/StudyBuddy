var express = require('express');
var router = express.Router();
var intervalID;
var timeoutID;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET list of matches */
router.get('/userMatches', function(req, res) {
    var db = req.db;
    var collection = db.get('UserRequests');

    // Creating index for spatial data
    collection.createIndex({
        loc : "2dsphere"
    });

    // Creating TTL Index for each user request
    collection.createIndex({createdAt: 1}, {expireAfterSeconds: 300});

    //Extract information from incoming requests and add to UserRequests table
    var query = req.query;
    var request = {
    "Type" : "User",
    "UserID" : query.userid,
    "Radius" : query.radius,
    "Status" : "Active",
    "ClassID" : query.classid,
    "loc" : {
        "type" : "Point",
        "coordinates" : [
             parseInt(query.lat),
             parseInt(query.lng)
        ]
    },
    "createdAt" : new Date(Date.now()) 
    }
    collection.insert(request);
    
    // Call matching process every second repeateadly for 5s
    setIntervalX(function () { filterAndMatch(req,query,res); }, 1000, 3);

    // Gather results of matching process
    timeoutID = setTimeout(function(){

    // Match users that have overlapping radius
    db.get("MatchResults").find({"$where" : "this.dist.calculated > parseInt(this.Radius)" },{},
        function(err,users) {

    if (err) {
        res.json({"Status": 'Failed'});
    }

    if(JSON.stringify(users) == JSON.stringify({})) {
        res.json({'Msg' : 'No matches found'});
    }        

    else {
       var listUsers = [] 
       users.forEach(function (result) {
           var userInfo = {
                "Name" : result.info.Name,
                "Rating" : result.info.Rating,
                "Year" : result.info.Year,
                "Major" : result.info.Major,
                "UserID" : result.UserID,
                "Location" : result.loc.coordinates,
                "Distance away" : result.dist.calculated
            };
            listUsers.push(userInfo);
        });
       console.log(listUsers);
       res.json(listUsers);
    }
    });
    }, 4000);

 });   

/* Abort Match Process */
router.get('/stopMatchProcess', function(req, res) {
    clearInterval(intervalID);
    clearTimeout(timeoutID);
    res.json({'msg' : 'User has aborted match process!'})
});

/* Helper function for refereshing list of users */
function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = setInterval(function () {
       callback();
       if (++x === repetitions) {
           clearInterval(intervalID);
       }
    }, delay);
};

//Function for filtering and matching users
function filterAndMatch(req,query) {
    req.db.get('UserRequests').aggregate([
        {
        $geoNear: {
                near: { type: "Point", coordinates: [ parseInt(query.lat) , parseInt(query.lng) ] },
                distanceField: "dist.calculated",
                maxDistance : parseInt(query.radius) * 1609000,
                spherical: true
        } 
        },
        {
        $match:{ ClassID : query.classid}
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

};

module.exports = router;
