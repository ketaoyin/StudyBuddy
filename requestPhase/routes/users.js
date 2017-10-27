var express = require('express');
var router = express.Router();
var hash = require('object-hash');      // Hasher for userID

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST create new user profile */
router.post('/createProfile', function(req, res) {
    /*
        Req params:
            userID, classID, latitutde, longitude, radius
    */
    var db = req.db;
    var user = req.body;

    console.log('Creating new user profile: ' + JSON.stringify(user));

    var hashUserId = hash(user);

    console.log(hashUserId);

    /* Append userId, rating, numRatings */
    user.UserID = hashUserId;
    user.Rating = 0;
    user.NumRatings = 0;

    var userID = hashUserId;
    var classID = user.classID;

    console.log("User ID: " + userID);
    console.log("Class ID: " + classID);

    // var collection = db.get('UserProfiles');

    // collection.insert(user, function(err, result) {
    //     if (err) {
    //         res.send('An error has occurred');
    //     } else {
    //         console.log('Success: ' + JSON.stringify(result[0]));
    //         res.send(result[0]);
    //     }
    // });

});

/* GET user profile information */
router.get('/userInfo', function(req, res) {
    var db = req.db;
    var loginUserName = req.body;
    // var loginPassword = login.Password;

    console.out(loginUserName);

    // collection.findOne({'UserName' : loginUserName, 'Password' : loginPassword}, function(err, result) {
    db.collection('UserProfiles', function(err, collection) {
        collection.find(function(err, result) {
            if (err) {
                res.send({'error':'an error has occured'});
            } else {
                console.log('Success');
                res.send(result);
            }
        });
    });
});
    
module.exports = router;
