"use strict";

class workersManager{

    constructor(config) {
        var express = require('express');
        var Worker = require("./worker.js");
        var bodyParser = require('body-parser');

        this.workers = [];
        this.tasks = [];
        this.app = express();
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

    selectWorker() {
        for (var i = 0; i < this.workers.length; i++) {
            // Check if worker is available
            if(!this.workers[i].busy) {
                this.workers[i].busy = true;
                return this.workers[i];

            }
        }

        return null;
    }

    submitTask(action, scalar, rows, res, req) {
        var worker = this.selectWorker();
        var task = this.createTask(action, scalar, rows, res, req, worker);

        if(worker) {
            this.assignTask(worker, task, this.onDone.bind(this));
        } else {
            this.tasks.push(task);    
        }
    }

    createTask(action, scalar, rows, res, req, worker){
        return {id: +new Date(), action: action, scalar: scalar, rows: rows, res: res, req: req, worker: worker};
    }

    assignTask(worker, task, onDone) {
        worker.execute(
            "/operation/" + task.action + task.scalar,
            task.rows,
            function (response) {
                task.res.send(response);  // send -> response is already json
                onDone(task);
            }
        );
    }

    onDone(task) {
        console.log(this.tasks);
        console.log(this.workers);
        this.tasks = this.tasks.filter(function(element) {
            return element.id !== task.id;
        });

        var worker = task.worker;
        var new_task = this.tasks.shift();

        // there are tasks, pick one and stay busy
        if(new_task) {
            new_task.worker = worker;
            this.assignTask(worker, new_task, this.onDone.bind(this));
        } else { // no tasks, not busy anymore
            task.worker.busy = false;
        }
        
    }
}



module.exports=workersManager;
