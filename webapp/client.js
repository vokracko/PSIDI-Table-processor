"use strict";

class Client {
	constructor(ip, port, renderer, datasource) {
		this.address = "http://" + ip + ":" + port;
		this.renderer = renderer;
		this.datasource = datasource;
	}

	sendRequest(method, url, data, onReply) {
		console.log("client.sendRequest", method, this.address + url, data);
		var request = new XMLHttpRequest();
		request.open(method, this.address + url, true);
		request.onreadystatechange = function() {
			if(this.readyState == 4) { //done 
				console.log("client.sendRequest.done", this.responseText);
				onReply(this.responseText);
			}
		}
		request.setRequestHeader("Content-Type", "application/json");
		request.send(JSON.stringify(data));
	}

	log(response) {
		console.log("log", response);
		this.renderer.flashMessage(response, "success");
	}

	simpleOperation(operation) { 
		var dataset_id = 1; // TODO výber aktuálního datasetu
		var shope = "dataset"; // TODO row/col/id

		// TOOD if scope => jina adresa

		this.sendRequest(
			"get", 
			"/user/dataset/" + dataset_id + "?action=" + operation,
			null,
			this.log.bind(this)
		);
	}

	datasetGet() {
		this.sendRequest("get", "/user/dataset/1", null, this.renderTable.bind(this));
	}

	datasetUpdate() {
		var data = this.datasource.toArray(); // TOOD dataset/col/row
		this.sendRequest("post", "/user/dataset/1", data, this.flashMessage.bind(this, "Dataset saved", "success"));
	}

	renderTable(response) {
		console.log("client.renderTable", response);
		var data = JSON.parse(response);
		console.log(data, this.datasource);
		this.datasource.setData({"data": data});
		this.renderer.renderItems();
	}

	flashMessage(text, type) {
		this.renderer.flashMessage(text, type);
	}
}


