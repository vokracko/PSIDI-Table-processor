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
		var workerManager=require("../worker/workersManager.js");
		var express = require('express');
		//var Worker = require("./worker.js");
		var dbAdapter = require("./dbadapter.js");
		var bodyParser = require('body-parser')

		this.workerT= new workerManager(config);
		this.workers = [];
		this.app = express();
		this.db = new dbAdapter(config.db);
		this.port = config.port;

		this.app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});
		this.app.use(bodyParser.json());

		/*for(var i = 0; i < config.workers.length; ++i) {
			var workerConfig = config.workers[i];
			var worker = new Worker(workerConfig); 
			this.workers.push(worker);
		}*/
	}

	start() {
		this.app.get("/user/dataset/1", this.operation.bind(this));
		this.app.post("/user/dataset/1", this.datasetUpdate.bind(this));
		this.app.post("/user/", this.clientCreate.bind(this));
		this.app.listen(this.port);
	}

	isComplex(operation) {
		return operation == "transpose" ||
			operation == "scale" ||
			operation == "add";
	}

	operation(req, res) {
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
				//var workerManager1=require("../worker/workersManager.js");
				console.log("im a worker");
				this.workerT.callworker(req.query.action, scalar, rows, res, req);
				/*this.workers[0].execute(
					"/operation/" + req.query.action + scalar,
					rows,
					function(response) {
						res.send(response); // send -> response is already json
					}
				);*/
			}.bind(this));	
		} else { // just send dataset
			this.db.datasetGet(1, function(err, rows) {
				res.json(rows); // json -> rows = array
			});
		}
	}

	datasetUpdate(req, res) {
		console.log("service.datasetUpdate", req.body);
		this.db.datasetUpdate(1, req.body, function(err, result) {
			res.status(200).send();
		});
	}

	clientCreate(req, res) {
		console.log("service.clientCreate", req.body);
		this.db.userCreate(req.body[0], req.body[1], function(err, result) {
			res.status(200).send();
		});
	}
}

module.exports = Service;