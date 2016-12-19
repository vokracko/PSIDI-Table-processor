"use strict";

class Worker {
	constructor(config) {
		console.log('service worker constructor');
		if(!config.ip) {
			config.ip = "localhost";
		}
		this.isBusy_var=false;
		
		this.address = "http://" + config.ip + ':' + config.port;
	}

	execute(url, data, onReply) {
console.log('worker executed');
		if (this.isBusy_var===false){
			this.isBusy_var=true;
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
	 	console.log('is busy');
		 this.isBusy_var = !this.isBusy_var;
		return this.isBusy_var;
	}

}

module.exports = Worker;