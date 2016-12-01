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
		var express = require('express');
		var Worker = require("./worker.js");
		var dbAdapter = require("./dbadapter.js");
		var bodyParser = require('body-parser')

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

		for(var i = 0; i < config.workers.length; ++i) {
			var workerConfig = config.workers[i];
			var worker = new Worker(workerConfig); 
			this.workers.push(worker);
		}
	}

	start() {
		this.app.get("/user/dataset/1", this.operationSimple.bind(this));
		this.app.post("/user/dataset/1", this.datasetUpdate.bind(this));
		this.app.listen(this.port);
	}

	operationSimple(req, res) {
		if(req.query.action) { // tahle cast nefunguje
			this.db.datasetGetFlat(1, function(err, rows) {
				this.workers[0].execute(
					"/operation/" + req.query.action,
					{data: rows},
					function(response) {
						console.log("service.operationSimple.done", response);
						res.json(response);
					}
				);
			}.bind(this));
		} else {
			this.db.datasetGet(1, function(err, rows) {
				res.json(rows);
			});
		}
	}

	datasetUpdate(req, res) {
		console.log("service.datasetUpdate", req.body);
		this.db.datasetUpdate(1, req.body, function(err, result) {
			res.status(200);
		});
	}
}

module.exports = Service;