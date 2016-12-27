"use strict";

class workersManager{

    constructor(config) {
        var express = require('express');
        var Worker = require("../service/worker.js");
        var dbAdapter = require("../service/dbadapter.js");
        var bodyParser = require('body-parser');

        this.workers = [];
        this.workersOther = [];
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

    sendToWorker(work){
        var action = work.action;
        var scalar = work.scalar;
        var rows = work.rows;
        var self = this;

        for (var i = 0; i < this.workers.length; i++) {

            // Check if worker is available
            if(!this.workers[i].isBusy()){
                // Make the worker execute this work
                this.workers[i].execute(
                    "/operation/" + action + scalar,
                    rows,
                    function (response) {
                        work.res.send(response); // send -> response is already json
                        // When the work is processed, remove it from work array
                        self.workersOther = self.workersOther.filter(function(element) {
                            return element.id !== work.id;
                        });
                    }
                );
            }

        }


    }

        callworker(action, scalar, rows, res,req){
            var work = {id: +new Date(), action: action, scalar: scalar, rows: rows, res: res, req: req};
            // Store the work
            this.workersOther.push(work);

            // While there is work to process, send to worker
            while(this.workersOther.length!= 0){
                this.sendToWorker(work);

            }

        }





}
module.exports=workersManager;
