"use strict";

var config = require("./config.json");
var Worker = require('./worker.js');

for(var i = 0; i < config.length; ++i) {
	var worker = new Worker(config[i]);
	worker.listen();
}
