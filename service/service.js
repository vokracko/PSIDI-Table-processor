"use strict";

class Service {
	constructor(config) {
		var WorkerManager = require("./workersManager.js");
		var express = require('express');
		var DbAdapter = require("./dbadapter.js");
		var bodyParser = require('body-parser');

		this.ioconverters = require('./ioconverter.js');
		this.workerManager = new WorkerManager(config);
		this.db = new DbAdapter(config.db);
		this.workers = [];
		this.app = express();
		this.port = config.port;

		this.app.use(function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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

	}

	start() {
		this.app.put("/user/", this.userPut.bind(this)); // login
        this.app.post("/user/", this.userPost.bind(this));

        this.app.get("/user/dataset", this.datasetGetList.bind(this));
		this.app.get("/user/dataset/:dataset_id", this.authorize.bind(this, this.datasetGet)); // operation
		this.app.get("/user/dataset/:dataset_id/col/:index", this.authorize.bind(this, this.datasetGetCol)); // operation
		this.app.get("/user/dataset/:dataset_id/row/:index", this.authorize.bind(this, this.datasetGetRow)); // operation
		this.app.post("/user/dataset/:dataset_id", this.authorize.bind(this, this.datasetPost)); // update
		this.app.put("/user/dataset/", this.datasetPut.bind(this)); // create TODO validate token

		this.app.get("/user/macro", this.macroList.bind(this));
		this.app.post("/user/macro", this.macroCreate.bind(this));
		this.app.put("/user/macro", this.macroExecute.bind(this));
		this.app.listen(this.port);
	}

	datasetGetList(req, res) {
		this.db.datasetList(req.query.token, function(err, rows) {
			res.json(rows);
		});
	}

	authorize(cb, req, res) {
		if(!req.query.token) {
			res.status(401);
			return;
		}

		var cb = cb.bind(this, req, res);

		this.db.authorize(req.query.token, req.dataset_id, function(err, result) {
			if(err || result.length == 0) {
				res.status(401); 
				return;
			}

			cb();
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
				this.workerManager.taskSubmit(req.query.action, scalar, rows, res);
				console.log("service.operation done");
			}.bind(this));	
		} else if(req.query.format) { // export
			this.db.datasetGet(req.dataset_id, function(err, rows) {
				var converter;

				switch(req.query.format) {
					case 'xml': converter = new this.ioconverters.XML(); break;
					case 'csv': converter = new this.ioconverters.CSV(); break;
					case 'json': converter = new this.ioconverters.JSON(); break;
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

				res.json({data: data, format: req.query.format});
			}.bind(this));
		}
		else { // just send dataset
			this.db.datasetGet(req.dataset_id, function(err, rows) {

				res.json(rows); // json -> rows = array
			});
		}

		console.log("service.datasetGet exit");
	}

	userPost(req, res) {
		console.log("service.clientCreate", req.body);
		this.db.userCreate(req.body.email, req.body.password, function (err, result) {
			res.status(200).send();
		});
	}


	datasetPost(req, res) {
		this.db.datasetUpdate(req.dataset_id, req.body, function(err, result) {
			res.status(200).send();
		});
	}

	datasetPut(req, res) {
		var arr = req.body.filename.split('.');
		var ext = arr[arr.length - 1];
		var converter;
		var data;

		switch(ext) {
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
			res.status(400).send(); // TODO correct code
			return;
		}

		// TODO user ID!!
		this.db.datasetCreate(1, req.body.name, data, function(err, result) {
			res.json({errors: err, id: result});
		})
	}

	userPut(req, res) {

		if (!req.body.email || !req.body.password) {

			res.status(400).send();
			return;
		}

		this.db.userValidate(req.body.email, req.body.password, function(err, result) {
			if(err || !result) {
				res.status(400).send(); // TODO code
				return;
			} else {
				res.json({token: result});
				//console.log('here1');
			}
		});
	}

	macroCreate(req,res){
		var name=req.body.name;
		var ops= req.body.operations;
		console.log(req.body);
		// TODO user id
		this.db.macroCreate(1,name,ops,function (err,result) {
			res.status(200).send();
		});
	}

	macroList(req,res){
		// TODO user id
		this.db.macroList(1, function(err,result){
			res.json(result);
        });
    }


    macroExecute(req,res){
        var dataset= req.body.dataset;
        var macroId= req.body.macroId;
        this.db.macroOperations(macroId, function (err, result) {
			res.json(result);
        }.bind(this));
	}

}

module.exports = Service;
