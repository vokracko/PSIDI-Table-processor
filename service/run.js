"use strict";

var config = require("./config.json");
var workerConfig = require("../worker/config.json");
config.workers = workerConfig;

var Service = require("./service.js");
var service = new Service(config);

service.start();
