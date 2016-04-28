var express	= require('express');
var router	= express.Router();


// I couldn't see an easy way to do this via mongoose so
// Using naitive mongo driver for now
var MongoClient = require('mongodb').MongoClient;
var database;
var crimeCollection;
MongoClient.connect("mongodb://localhost:27017/homemapper", function(err, db){
	if(err){
		throw err;
	}
	database = db;
	db.collection("crime", function(err, col){
		crimeCollection = col;
	});
});


// Route for delivering police data
router.post('/police', function(req, res){
	var bounds = req.body.bounds;
	if(!bounds){
		return res.status(400).json({ error : "Bounds not given" });
	}
	bounds = JSON.parse(bounds);

	var geomRequest = {
		type : "Polygon",
		coordinates : [bounds]
	};

	crimeCollection.find({
		geom : {
			$geoWithin : {
				$geometry : geomRequest
			}
		}
	})
	.toArray(function(err, docs){
		if(err){
			return res.status(400).json({ error : "An error occurred", err : err });
		}
		return res.json({ results : docs || [] });
	});
});





module.exports = router;
