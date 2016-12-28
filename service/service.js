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
		
		this.ioconverters = require('./ioconverter.js');
		this.workerManager = new WorkerManager(config);
		this.db = new DbAdapter(config.db);
		this.workers = [];
		this.app = express();
		this.port = config.port;

		this.app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		  next();
		});
		this.app.use(bodyParser.json());

	}

	start() {
		this.app.post("/user/", this.userPost.bind(this)); // login

		this.app.get("/user/dataset/1", this.authorize.bind(this, this.datasetGet)); 
		this.app.post("/user/dataset/1", this.authorize.bind(this, this.datasetPost)); // update
		this.app.put("/user/dataset/", this.datasetPut.bind(this)); // create TODO validate that token is valid

		this.app.get("/user/macro", this.macroList.bind(this));
		this.app.post("/user/macro", this.macroCreate.bind(this));
		this.app.put("/user/macro", this.macroExecute.bind(this));
		this.app.listen(this.port);
	}

	authorize(cb, req, res) {
		var dataset_id = 1; // TODO
		if(!req.query.token) {
			res.status(400) // TODO code
			return;
		}

		var cb = cb.bind(this, req, res);

		this.db.authorize(req.query.token, dataset_id, function(err, result) {
			console.log("service.authorize result", result);
			if(err || result.length == 0) {
				console.log("service.authorize error", err);
				res.status(400); // TODO code
				return;
			}

			cb();
		})
	}

	isComplex(operation) {
		return operation == "transpose" ||
			operation == "scale" ||
			operation == "add";
	}

    datasetGet(req, res) {
    	var dataset_id = 1; // TODO dynamic from request
    	console.log("service.datasetGet enter");

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
			dbCall(dataset_id, function(err, rows) {
				this.workerManager.taskSubmit(req.query.action, scalar, rows, res);
				console.log("service.operation done");
			}.bind(this));	
		} else if(req.query.format) { // export
			this.db.datasetGet(dataset_id, function(err, rows) {
				var converter;

				switch(req.query.format) {
					case 'xml': converter = new this.ioconverters.XML(); break;
					case 'csv': converter = new this.ioconverters.CSV(); break;
					case 'json': converter = new this.ioconverters.JSON(); break;
				}

				if(!converter) {
					res.status(400).send();
					return;
				}

				var data = converter.fromJSON(rows);

				if(!data) {
					res.status(400).send(); // TODO correct code
					return;
				}
				
				res.json({data: data, format: req.query.format});
			}.bind(this));
		} 
		else { // just send dataset
			this.db.datasetGet(dataset_id, function(err, rows) {

				res.json(rows); // json -> rows = array
			});
		}

		console.log("service.datasetGet exit");	
	}

	datasetPost(req, res) {
		console.log("service.post", req.body);
		this.db.datasetUpdate(1, req.body, function(err, result) {
			res.status(200).send();
		});
	}

	datasetPut(req, res) {
		console.log("service.datasetPut", req.body);
		var arr = req.body.filename.split('.');
		var ext = arr[arr.length-1];
		var converter;
		var data;

		switch(ext) {
			case 'xml': converter = new this.ioconverters.XML(); break;
			case 'csv': converter = new this.ioconverters.CSV(); break;
			case 'json': converter = new this.ioconverters.JSON(); break;
		}

		if(!converter) {
			res.status(400).send();
			return;
		}

		data = converter.toJSON(req.body.data);

		if(!data) {
			res.status(400).send(); // TODO correct code
			return;
		}

		this.db.datasetCreate(1, "dataset name", data, function(err, result) {
			res.json({errors: err, result: result});
		})
	}

	userPost(req, res) {
		if(!req.body.email || !req.body.password) {
			res.status(400).send();
			return;
		}

		this.db.userValidate(req.body.email, req.body.password, function(err, result) {
			if(err || !result) {
				res.status(400).send(); // TODO code
				return;
			} else {
				res.json({token: result});
			}
		});
	}
	macroCreate(req,res){
		var name=req.body.name;
		var ops= req.body.operations;
		console.log("heererer");
		console.log(req.body);
		this.db.macroCreate(1,name,ops,function (err,result) {
			res.status(200).send();
        });
	}

	macroList(req,res){
		this.db.macroList(1, function(err,result){
			res.json(result);
        });
    }

    /*log(response) {
        response = JSON.parse(response);
        console.log("log", response);
        this.renderer.flashMessage("Result is " + response, "success");
    }*/

    sendRequest(method, url, data, onReply) {
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        var request = new XMLHttpRequest();
        var address = "localhost";//this.buildAddress(url);
        console.log("service.sendRequest", method, address, data);
        var request = new XMLHttpRequest();
        request.open(method, address, true);
        request.onreadystatechange = function() {
            if(this.readyState == 4) { //done
                console.log("client.sendRequest.done", this.responseText);
                onReply(this.responseText);
            }
        }
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }
  /*  buildAddress(url) {
        var res = this.address + url;

        if(url.indexOf('?') == -1) {
            res += "?token=" + this.token;
        } else {
            res += "&token=" + this.token;
        }

        return res;
    }
*/
    macroExecute(req,res){
        var dataset= req.body.dataset;
        var macroId= req.body.macroId;
        this.db.macroOperations(macroId, function (err, result) {
            /*var string=JSON.stringify(result);

            var json =  JSON.parse(string);
			var reply;
        	for(var i=0; i< json.length; i++){

                console.log(json[i].url);

                this.sendRequest("get",/*"/user/dataset/" + dataset + "?action=" + */
				/*				json[i].url, null,reply);// this.log.bind(this));
            console.log(reply);
        	}*/
			res.json(result);
        }.bind(this));
	}

}

module.exports = Service;