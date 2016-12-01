"use strict";

var serviceConfig = require("./service/config.json")
var workerConfig = require('./worker/config.json');

serviceConfig.workers = workerConfig;

var Service = require("./service/service.js");
var Worker = require('./worker/worker.js');

var service = new Service(serviceConfig);
service.start();

for(var i = 0; i < workerConfig.length; ++i) {
	var worker = new Worker(workerConfig[i]);
	worker.listen();
}
