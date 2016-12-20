"use strict";


class Runnable {

	start() {
		throw Exception("not implemented");
	}

	stop() {
		throw Exception("not implemented");
	}
}

class Service extends Runnable {
	constructor(config) {
		super();
		var WorkerManager=require("./workersManager.js");
		var express = require('express');
		var DbAdapter = require("./dbadapter.js");
		var bodyParser = require('body-parser')

		this.workerManager= new WorkerManager(config);
		this.db = new DbAdapter(config.db);
		this.workers = [];
		this.app = express();
		this.port = config.port;

		this.app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});
		this.app.use(bodyParser.json());

	}

	start() {
		this.app.get("/user/dataset/1", this.operation.bind(this));
		this.app.post("/user/dataset/1", this.datasetUpdate.bind(this));
		this.app.listen(this.port);
	}

	isComplex(operation) {
		return operation == "transpose" ||
			operation == "scale" ||
			operation == "add";
	}

	operation(req, res) {
		console.log("service.operation enter")
		if(req.query.action) { // something will be computed 
			var dbCall;
			var scalar = "";

			if(this.isComplex(req.query.action)) { // send double array to compute result
				dbCall = this.db.datasetGet.bind(this.db);

				if(req.query.scalar) {
					scalar = "?scalar=" + req.query.scalar;
				}
			} else {
				dbCall = this.db.datasetGetFlat.bind(this.db);
			}
			dbCall(1, function(err, rows) {
				this.workerManager.taskSubmit(req.query.action, scalar, rows, res);
				console.log("service.operation done");
			}.bind(this));	
		} else { // just send dataset
			this.db.datasetGet(1, function(err, rows) {
				res.json(rows); // json -> rows = array
			});
		}

		console.log("service.operation exit");	
	}

	datasetUpdate(req, res) {
		console.log("service.datasetUpdate", req.body);
		this.db.datasetUpdate(1, req.body, function(err, result) {
			res.status(200).send();
		});
	}
}

module.exports = Service;