"use strict";

class Worker {
	constructor(config) {
		if(!config.ip) {
			config.ip = "localhost";
		}
		var isBusy_var=false;
		
		this.address = "http://" + config.ip + ':' + config.port;
	}

	execute(url, data, onReply) {

		if (isBusy()===false){
			this.isBusy=true;
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
			request.send(JSON.stringify(data));

		}else {
			console.log("worker is doing somesing");
		}

	}

	 isBusy(){

		if(this.isBusy===false){
			return true;

		}else {
			return false
		}
	}

}

module.exports = Worker;