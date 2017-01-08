"use strict";

class Worker {
	constructor(config) {
		if(!config.ip) {
			config.ip = "localhost";
		}

		this.address = "http://" + config.ip + ':' + config.port;
		this.busy = false;
	}

	execute(url, data, onReply) {
		console.log("service.worker.execute", url, data);
		var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
		var request = new XMLHttpRequest();
		request.open("POST", this.address + url, true);
		request.onreadystatechange = function() {
			if(this.readyState == 4) { //done
				console.log("service.worker.done", this.responseText);
				onReply(this.responseText);
			}
		}
		request.setRequestHeader("Content-Type", "application/json");
		request.send(JSON.stringify({data:data}));
		console.log("service.worker.execute exit")
	}
}

module.exports = Worker;