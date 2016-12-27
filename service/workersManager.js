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

    workerSelect() {
        for (var i = 0; i < this.workers.length; i++) {
            // Check if worker is available
            if(!this.workers[i].busy) {
                this.workers[i].busy = true;
                return this.workers[i];

            }
        }

        return null;
    }

    taskSelect() {
        return this.tasks.shift();
    }

    taskSubmit(action, scalar, rows, res) {
        console.log("service.workerManager.submitTask enter");
        var worker = this.workerSelect();
        var task = this.taskCreate(action, scalar, rows, res, worker);

        if(worker) {
            this.taskAssign(worker, task, this.onDone.bind(this));
        } else {
            this.tasks.push(task);    
            console.log("pushing task"); 
        }
        console.log("service.workerManager.submitTask exit");

        // console.log("service.workerManager.submitTask:tasks", this.tasks);
        // console.log("service.workerManager.submitTask:workers", this.workers);
    }

    taskCreate(action, scalar, rows, res, worker){
        return {id: +new Date(), action: action, scalar: scalar, rows: rows, res: res, worker: worker};
    }

    taskAssign(worker, task, onDone) {
        console.log("service.workerManager.assignTask enter");

        worker.execute(
            "/operation/" + task.action + task.scalar,
            task.rows,
            function (response) {
                task.res.send(response);  // send -> response is already json
                onDone(task);
                console.log("task done");
            }
        );
        console.log("service.workerManager.assignTask exit");
    }

    onDone(task) {
        // console.log("service.workerManager.onDone:tasks", this.tasks);
        // console.log("service.workerManager.onDone:workers", this.workers);
        
        var worker = task.worker; // reuse worker
        var new_task = this.taskSelect();

        // there are tasks, pick one and stay busy
        if(new_task) {
            new_task.worker = worker;
            this.taskAssign(worker, new_task, this.onDone.bind(this));
        } else { // no tasks, not busy anymore
            task.worker.busy = false;
        }
        
    }
}



module.exports=workersManager;
