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
            username, password, year, major, name
    */
    var db = req.db;
    var user = req.body;

    console.log('Creating new user profile: ' + JSON.stringify(user));

    /* Append userId, rating, numRatings */

    var hashUserId = hash(user);

    var newUser = {
        "UserID" : hashUserId,
        "Rating" : "0",
        "Year" : user.year,
        "Major" : user.major,
        "NumRatings" : "0",
        "Password" : user.password,
        "UserName" : user.username,
        "Name" : user.name
    };

    var collection = db.get('UserProfiles');

    collection.insert(newUser, function(err, result) {
        if (err) {
            console.log('createProfile: An error has occurred')
            res.send('An error has occurred');
        } else {
            console.log('createProfile: Success');
            res.send('Success');
        }
    });

});

/* GET user profile information */
router.get('/userInfo', function(req, res) {
    var db = req.db;
    var loginUserName = req.params.username;
    var loginPassword = req.params.password;

    console.log(loginUserName);
    console.log(loginPassword);
    
    var collection = db.get('UserProfiles');

    // collection.findOne({'UserName' : loginUserName, 'Password' : loginPassword},{}, function(err, result) {
    //     if (err) {
    //         res.json({'error':'an error has occured'});
    //     } else {
    //         var userInfo = {

    //         };

    //         res.json(result);
    //     }
    // });

    collection.find({},{},function(e,docs){
        res.json(docs);
    });

});
    
module.exports = router;
