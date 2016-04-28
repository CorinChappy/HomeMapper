/*

	Application to gather data from the NAPTAN's Rail References Data set into a database of rail stations (MongoDB)

	Author: Corin Chaplin

*/

var argv = 	require('yargs')
			.demand(1, "File name required")
			.boolean(["v"])
			.alias({
				v : "verbose"
			})
			.default("y", true)
			.argv,

	location = argv._[0];


// Include CSV parser and MongoDB Driver
var csv = require("csv"),
	MongoClient = require('mongodb').MongoClient,


	collection, database,
	stats = {
		newRows : 0,
		failed : 0,
		duplicateRows : 0,
		noGeom : 0
	},
	parseComplete = false,
	rowsinuse = 0,

// General requires
	fs = require('fs');


// Start timer
console.time("runtime");


// Connect to mongodb
MongoClient.connect("mongodb://localhost:27017/homemapper",//?maxPoolSize=100",
	function(err, db){
		if(err){
			throw err;
		}

		database = db;

		db.ensureIndex("crime", { geom : "2dsphere" }, function(){
			// Get the correct collection
			db.collection("crime", function(err, col){
				collection = col;

				// Call the main function
				try{
					main(function(){
						console.log("Parse Complete");
						console.log();
						parseComplete = true;
						if(rowsinuse <= 0){
							db.close();
							finish();
						}
					});
				}catch(e){
					db.close();
					throw e;
				}
			});
		});
	}
);

/*
	STEP 5
	Final function that displays results etc
*/
function finish(){
	console.log("Transactions Complete");
	console.log("New Rows: "+stats.newRows);
	console.log("Duplicate Rows: "+stats.duplicateRows);
	console.log("Failures: "+stats.failed);
	console.timeEnd("runtime");
}


/* 
	STEP 1
	Function that reads the input string and collects that file, then parses it into the CSV parser
*/
function main(callback){

	// Set up the parser
	var input,
		parser = csv.parse(),
		transformer = csv.transform(parseLine, { parallel: 1 });

		
	try{
		// Sync, because this really is blocking.
		var stats = fs.lstatSync(location);
		if(stats.isFile()){
			input = fs.createReadStream(location);
		}
	}catch(e){}

	if(!input){
		// Error here
		throw "Error, bad file";
	}

	input.pipe(parser)
	.pipe(transformer)
	.on("finish",function(){callback();});
}


/*
	PART 2
	Function that takes the parsed line and puts it into the correct format
*/
function parseLine(record, callback){
	rowsinuse++;
	
	/* Detecting the duplicates */
	searchForDuplicates(record[0], function(docs){
			

		if(docs && docs.length > 0){
			// Add to existing database item
			stats.duplicateRows++;
			checkandclose(callback);
		}else{
			// Add new item to database
			addNewRecord(record, callback);
		}
	});
}


/*
	PART 3
	Find if that station already exists using the AtcoCode
*/
function searchForDuplicates(crimeid, callback){
	if(crimeid){
		var c = collection.find({ Crime_ID : crimeid }, {_id: 1}).limit(1).toArray(function(err, docs){
			callback(docs || false);
		});
	}else{
		callback(false);
	}
}

/*
	PART 4-1
	Add new record to database
*/
function addNewRecord(record, callback){


	var item = {
		Crime_ID : record[0],
		Month : record[1],
		Reported_by : record[2],
		Falls_within : record[3],
		Location : record[6],
		LSOA_code : record[7],
		LSOA_name : record[8],
		Crime_type : record[9],
		Last_outcome_category : record[10],
		Context : record[11],

		geom : {
			type: "Point",
			coordinates: [ parseFloat(record[4]), parseFloat(record[5]) ]
		}
	};

	//console.log(item);process.exit();


	collection.insert(item, {w:1}, function(err, result){
		if(err){
			stats.failed++;
		}else{
			stats.newRows++;
		}

		checkandclose(callback);
	});
}




function checkandclose(callback){
	if(argv.v){
		var s = "New: "+stats.newRows;
		if(argv.g){
			s += " (NoGeom: "+stats.noGeom+")";
		}
		s += " | Dups: "+stats.duplicateRows+" | Fails: "+stats.failed+" | Total: "+ (stats.newRows + stats.duplicateRows + stats.failed);
		process.stdout.write(s + "\033[0G");
	}

	rowsinuse--;
	callback();
	
	/*if(parseComplete && rowsinuse <= 0){
		database.close();
		finish();
		return true;
	}*/
}