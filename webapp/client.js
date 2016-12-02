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
		response = JSON.parse(response);
		console.log("log", response);
		this.renderer.flashMessage("Result is " + response, "success");
	}

	operation(operation) { 
		var dataset_id = 1; // TODO actual dataset number
		var scope = "dataset"; // TODO row/col/ + index

		// TOOD if scope => jina adresa
		this.sendRequest(
			"get", 
			"/user/dataset/" + dataset_id + "?action=" + operation,
			null,
			this.log.bind(this)
		);
	}

	selected() {
		var tableHeaders = document.getElementsByClassName("table-header selected");
		
		if(tableHeaders.length == 0) { //none
			return {scope: "all"};
		}

		var cell = tableHeaders[0];

		if(cell.parentNode.rowIndex == 0) {
			return {scope: "column", index: cell.cellIndex};
		}

		return {scope: "row", index: cell.parentNode.rowIndex};

	}

	operationInput(operation) {
		var scalar = prompt("Set value");
		var dataset_id = 1; // TODO actual dataset number
		var scope = "dataset"; // TODO row/col/ + index

		// TOOD if scope => jina adresa
		this.sendRequest(
			"get", 
			"/user/dataset/" + dataset_id + "?action=" + operation + "&scalar=" + scalar,
			null,
			this.renderTable.bind(this)
		);
	}

	transpose() {
		var dataset_id = 1; // TODO actual dataset number
		this.sendRequest(
			"get", 
			"/user/dataset/" + dataset_id + "?action=transpose",
			null,
			function(response) {
				this.datasource.setData(JSON.parse(response));
				this.renderer.renderItems();
			}.bind(this)
		);
	}

	datasetGet() {
		this.sendRequest("get", "/user/dataset/1", null, this.renderTable.bind(this));
	}

	datasetUpdate() {
		var data = this.datasource.toArray();
		this.sendRequest("post", "/user/dataset/1", data, this.flashMessage.bind(this, "Dataset saved", "success"));
	}

	renderTable(response) {
		var data = JSON.parse(response);
		this.datasource.setData(data);
		this.renderer.renderItems();
	}

	flashMessage(text, type) {
		this.renderer.flashMessage(text, type);
	}
}


