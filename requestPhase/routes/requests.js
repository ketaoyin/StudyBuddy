var express = require('express');

var router = express.Router();
var timeoutID;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET list of matches */
router.get('/userMatches', function(req, res) {

    /* Testing purposes only
    var dist = getDistanceFromLatLonInKm(1,1,3,3);
    console.log('dist ' + dist); */

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
        type : "Point",
        coordinates : [
             parseFloat(query.lng),
             parseFloat(query.lat)
        ]
    },
   "createdAt" : new Date(Date.now()) 
    }

    collection.update({"UserID" : query.userid},request,{ upsert: true });
  
    // Gather results of matching process after 4s (before timeout)
    timeoutID = setTimeout(function() {

    req.db.get('UserRequests').aggregate([
        {
        $geoNear: {
                near: { type: "Point", coordinates: [ parseFloat(query.lng) , parseFloat(query.lat) ] },
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
     }], function(err,data) {

    if(err)
        throw err;

    var listUsers = [] 
       data.forEach(function (result) {
        if(result.dist.calculated < parseFloat(result.Radius) && result.dist.calculated !=0 ) {
           var userInfo = {
                "Name" : result.info.Name,
                "Rating" : result.info.Rating,
                "Year" : result.info.Year,
                "Major" : result.info.Major,
                "UserID" : result.UserID,
                "Location" : result.loc.coordinates,
                "Distance away(m)" : result.dist.calculated
            };
            listUsers.push(userInfo);
          }
        });

        if(JSON.stringify(listUsers) == "[]") {
              res.json({"Msg" : 'No matches found'});
          }  

        else
      res.json({"Matches" : listUsers});

    });
  }, 4000);

 });   


/* Abort Match Process */
router.get('/stopMatchProcess', function(req, res) {
    clearTimeout(timeoutID);
    res.json({'msg' : 'User has aborted match process!'})
});

/*
//FOR testing purposes only
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI/180)
};
*/

module.exports = router;
