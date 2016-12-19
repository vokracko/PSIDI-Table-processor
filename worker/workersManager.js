"use strict";

class workersManager{

    constructor(config) {
        var express = require('express');
        var Worker = require("./worker.js");
        var dbAdapter = require("./dbadapter.js");
        var bodyParser = require('body-parser')

        this.workers = [];
        var workersOther = [];
        this.app = express();
        this.db = new dbAdapter(config.db);
        this.port = config.port;

        this.app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
        this.app.use(bodyParser.json());

        for (var i = 0; i < config.workers.length; ++i) {
            var workerConfig = config.workers[i];
            var worker = new Worker(workerConfig);
            this.workers.push(worker);
        }
    }

        callworker(query, scalar, rows, res){
            workersOther.push(query, scalar, rows, res);

            while(workersOther.length!= null){
                sendToWorker();
            }

        }

        sendToWorker(){
            for (var i = 0; i < workers.length; i++) {
                if(!workers[i].isBusy()){
                    workers[i].push(workersOther.first())
                    this.workers[i].execute(
                        "/operation/" + req.query.action + scalar,
                        rows,
                        function (response) {
                            res.send(response); // send -> response is already json

                            
                        }
                    );
                }

            }


        }



}
