var express = require('express');
var router = express.Router();
var timeoutID;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET list of matches */
router.get('/userMatches', function(req, res) {
    var db = req.db;

    var collection = db.get('UserRequests');
    collection.createIndex({
        loc : "2dsphere"
    });

    // TTL - timeout for each requests in the table
    collection.createIndex({created_at: 1}, {expireAfterSeconds: 60});

    //Extract from incoming requests and add to UserRequests table

   /* collection.insert({created_at: new Date(Date.now())}); //- Append this field to userrequests 
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
    collection.insert(requests) */


    //call matchAndFilter after 5 seconds -- use setInterval instead
    timeoutId = setTimeout(function() {filterAndMatch(req);}, 5000);

    // return list of users that have overlapping ranges
    db.get("MatchResults").find({"$where" : "this.dist.calculated > parseInt(this.Radius)" },{},
        function(e,docs) {

    //check if docs is empty - return no users if so otherwise return list

    res.render('userlist', {
        "userlist": docs
       });
    }); 

 });   


//cancel matching process
function stopMatchingProcess() {
  clearTimeout(timeoutID);
}

//filtering and matching
function filterAndMatch(req) {
    var userRadius = 1609000
    req.db.get('UserRequests').aggregate([
        {
        $geoNear: {
                near: { type: "Point", coordinates: [ 1 , 1 ] },
                distanceField: "dist.calculated",
                maxDistance : userRadius,
                spherical: true
        } 
        },
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
};


module.exports = router;
