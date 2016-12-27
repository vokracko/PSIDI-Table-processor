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


	createLoginForm(){

		var x = document.getElementById("formNewUser");
		var createform = document.createElement('form'); // Create New Element Form

		var label1=document.createElement("label");
		var label1Text=document.createTextNode("Email");
		label1.appendChild(label1Text);


		var inputEmail= document.createElement("input");
		inputEmail.setAttribute("name", "email");
		inputEmail.setAttribute("type", "text");
		inputEmail.setAttribute("id", "emailid");

		label1.appendChild(inputEmail);


		var xpto= document.createElement("div");//for change line
		var xptop=document.createElement("p");
		xpto.appendChild(xptop);

		createform.appendChild(label1);
		createform.appendChild(xpto);


		var label2=document.createElement("label");
		var label2Text=document.createTextNode("Password");
		label2.appendChild(label2Text);


		var inputPassword= document.createElement("input");
		inputPassword.setAttribute("name", "password");
		inputPassword.setAttribute("type", "password");
		inputPassword.setAttribute("id", "passwordid")
		label2.appendChild(inputPassword);
		createform.appendChild(label2);

		var xpto1= document.createElement("div");//for change line
		var xptop1=document.createElement("p");
		xpto.appendChild(xptop1);
		createform.appendChild(xpto1);


		var but=document.createElement("button");
		but.setAttribute("type", "button");

		//but.setAttribute("name", "login");
		but.setAttribute("onclick", "client.createNewUser()");
		var butText=document.createTextNode("Creat New User");

		but.appendChild(butText);

		createform.appendChild(but);

		x.appendChild(createform);

/*
		<label>Email</label><input name="email" type="text" required><br>
		<label>Password</label><input name="password" type="password" required><br>
		<button name="login"   onclick="client.createNewUser()">Creat New User</button>

 		<button type="button" onclick="alert('Hello world!')">Click Me!</button>

*/


	}
	createNewUser(){

	console.log("=======================================");
		var textEmail = document.getElementById("emailid").value;
		var textPassword = document.getElementById("passwordid").value;

		console.log(textEmail);
		console.log(textPassword);

		var data = [textEmail, textPassword];
		this.sendRequest("post", "/user/", data, this.flashMessage.bind(this, "User created", "success"));

/*
		if(DbAdapter.userValidate( textEmail, textPassword,callback)){
			DbAdapter.userCreate(textEmail, textPassword,callback);
		}
*/

		//alert(textEmail);



	}

	/*
	email
	password
	* - button create user -> shows form: (email, pass, pass repeat, submit button)
	 - button login -> show client.createLoginForm
	 - INSPIRATION: client.createLoginForm
	* */
}


