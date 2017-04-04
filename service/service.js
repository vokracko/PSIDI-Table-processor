"use strict";

class Service {
	constructor(config) {
		var WorkerManager = require("./workersManager.js");
		var express = require('express');
		var DbAdapter = require("./dbadapter.js");
		var bodyParser = require('body-parser');
		var BasicStrategy = require('passport-http').BasicStrategy;

		this.ioconverters = require('./ioconverter.js');
		this.workerManager = new WorkerManager(config);
		this.db = new DbAdapter(config.db);
		this.workers = [];
		this.app = express();
		this.port = config.port;

		this.passport = require("passport");


		this.app.use(function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Headers, Authorization");
			res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
			next();
		});
		this.app.use(bodyParser.json());
		this.app.param('dataset_id', function(req, res, next, dataset_id){
			req.dataset_id = dataset_id;
			return next();
		});
		this.app.param('index', function(req, res, next, index){
			req.index = index;
			return next();
		});
		this.app.param('user_id', function(req, res, next, user_id){
			req.user_id = user_id;
			return next();
		});

		var service = this;

		this.passport.use(new BasicStrategy(
		  function(email, password, done) {
		    service.db.autheticate(email, password, function (err, user) {
		    	console.log(email, password, err, user);
		    	if (err || !user) { 
		    		return done(err);
		    	}
		      
		    	return done(null, {email: email});
		    });
		  }
		));

	}

	authorize(cb, req, res) {
		console.log("authorize");
		var cb = cb.bind(this, req, res);

		this.db.authorize(req.user.email, req.dataset_id, function(err, result) {
			if(err || result.length == 0) {
				res.status(401).send(); 
				return;
			}

			cb();
		});
	}

	start() {
        this.app.post("/user/", this.userPost.bind(this));

        this.app.get("/user/dataset", this.passport.authenticate('basic', { session: false }), this.datasetGetList.bind(this));
		this.app.get("/user/dataset/:dataset_id", this.passport.authenticate('basic', { session: false }),this.authorize.bind(this, this.datasetGet)); // operation
		this.app.get("/user/dataset/:dataset_id/col/:index", this.passport.authenticate('basic', { session: false }),this.authorize.bind(this, this.datasetGetCol)); // operation
		this.app.get("/user/dataset/:dataset_id/row/:index", this.passport.authenticate('basic', { session: false }),this.authorize.bind(this, this.datasetGetRow)); // operation
		this.app.put("/user/dataset/:dataset_id", this.passport.authenticate('basic', { session: false }),this.authorize.bind(this, this.datasetPut)); // update
		this.app.post("/user/dataset/", this.passport.authenticate('basic', { session: false }),this.datasetPost.bind(this)); 

		this.app.listen(this.port);
	}

	datasetGetList(req, res) {
		this.db.datasetList(req.user.email, function(err, rows) {
			res.json({result: rows});
		});
	}

	isComplex(operation) {
		return operation == "transpose" ||
			operation == "scale" ||
			operation == "add";
	}

	datasetGetCol(req, res) {
		if(!req.query.action) {
			res.status(400).send();
		}

		this.db.datasetCol(req.dataset_id, req.index, function(err, rows) {
			this.workerManager.taskSubmit(req.query.action, '', rows, res);
		}.bind(this));
	}

	datasetGetRow(req, res) {
		if(!req.query.action) {
			res.status(400).send();
		}

		this.db.datasetRow(req.dataset_id, req.index, function(err, rows) {
			this.workerManager.taskSubmit(req.query.action, '', rows, res);
		}.bind(this));
	}

    datasetGet(req, res) {
    	console.log("service.datasetGet enter");

		if (req.query.action) { // something will be computed

			var dbCall;
			var scalar = "";

			if (this.isComplex(req.query.action)) { // send double array to compute result
				dbCall = this.db.datasetGet.bind(this.db);

				if (req.query.scalar) {
					scalar = "?scalar=" + req.query.scalar;
				}
			} else {
				dbCall = this.db.datasetGetFlat.bind(this.db);
			}
			dbCall(req.dataset_id, function(err, rows) {
				if(err || !rows) {
					res.status(404).send();
					return;
				}
				this.workerManager.taskSubmit(req.query.action, scalar, rows, res);
				console.log("service.operation done");
			}.bind(this));	
		} else if(req.query.format) { // export
			this.db.datasetGet(req.dataset_id, function(err, rows) {
				if(err || !rows) {
					res.status(404).send();
					return;
				}
				var converter;
				var mimeType;
				var ext;

				switch(req.query.format) {
					case 'xml': 
						converter = new this.ioconverters.XML(); 
						mimeType = 'text/xml'; 
						ext = 'xml';
						break;
					case 'csv': 
						converter = new this.ioconverters.CSV();
						mimeType = 'text/csv'; 
						ext = 'csv';						
						break;
					case 'json': 
						converter = new this.ioconverters.JSON(); 
						mimeType = 'application/json';
						ext = 'json';
						break;
				}

				if (!converter) {
					res.status(400).send();
					return;
				}

				var data = converter.fromJSON(rows);

				if (!data) {
					res.status(400).send(); // TODO correct code
					return;
				}

				res.set({
					'Content-Type': mimeType, 
					'Content-Disposition': 'attachment;filename="dataset.' + ext + '"'
				});

				res.send(data);
			}.bind(this));
		}
		else { // just send dataset
			this.db.datasetGet(req.dataset_id, function(err, rows) {
				if(err || !rows) {
					res.status(404).send();
					return;
				}
				res.json({result: rows});
			});
		}

		console.log("service.datasetGet exit");
	}

	userPost(req, res) {
		console.log("service.clientCreate", req.body);
		this.db.userCreate(req.body.email, req.body.password, function (err, result) {
			if(err || !result) {
				res.status(409).send();
			} else {
				res.status(201).send();
			}
		});
	}


	datasetPut(req, res) {
		this.db.datasetUpdate(req.dataset_id, req.body.data, function(err, result) {
			if(err || !result) {
				res.status(404).send()
			} else {
				res.status(200).send();
			}
		});
	}

	datasetPost(req, res) {
		var converter;
		var data;

		switch(req.body.format) {
			case 'xml': converter = new this.ioconverters.XML(); break;
			case 'csv': converter = new this.ioconverters.CSV(); break;
			case 'json': converter = new this.ioconverters.JSON(); break;
		}

		if (!converter) {
			res.status(400).send();
			return;
		}

		data = converter.toJSON(req.body.data);

		if(!data) {
			res.status(400).send();
			return;
		}

		// TODO user ID!!
		this.db.datasetCreate(1, req.body.name, data, function(err, result) {
			res.json({errors: err, id: result});
		})
	}
}

module.exports = Service;
