"use strict";

class Client {
	constructor(ip, port, renderer, datasource) {
		this.address = "http://" + ip + ":" + port;
		this.renderer = renderer;
		this.datasource = datasource;
		this.btnUpload = null;
		this.token = null;
	}

	/*createLoginForm() {
		this.renderer.overlay.setData({text: "", type: "success"});
		var form = new Form("overlay", {id: "form"}, function(e) {e.stopPropagation();});
		var email = new Input("form", {type:"text"}, null);
		var password = new Input("form", {type:"password"}, null);
		var submit = new Input("form", {type:"submit", value: "Login"}, this.login.bind(this));

		overlay.render();
		form.render();
		email.render();
		password.render();
		submit.render();
	}
*/
	login(e) {
		e.preventDefault();

		var form = document.forms[0];
		var email = form.children[0].value;
		var password = form.children[1].value;
		var client = this;

		this.sendRequest(
			"post",
			"/user/",
			{email:email, password: password},
			function(response) {
				if(!response) {
					alert("Invalid credentials");
					return;
				}

				client.token = JSON.parse(response).token;
				client.flashMessage("Login successful", "success");
				client.datasetGet();
			}
		);
	}

	buildAddress(url) {
		var res = this.address + url; 

		if(url.indexOf('?') == -1) {
			res += "?token=" + this.token;
		} else {
			res += "&token=" + this.token;
		}

		return res;
	}

	sendRequest(method, url, data, onReply) {
		var address = this.buildAddress(url);
		console.log("client.sendRequest", method, address, data);
		var request = new XMLHttpRequest();
		request.open(method, address, true);
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

		// TOOD if scope => diferent uri
		this.sendRequest(
			"get", 
			"/user/dataset/" + dataset_id + "?action=" + operation,
			null,
			this.log.bind(this)
		);
	}

	import() {
		this.btnUpload = new Input("overlay", {type:"file", onchange: this.upload.bind(this)}, null);
		this.renderer.overlay.setData({text: "", type: "success"});
		this.renderer.overlay.render();
		this.btnUpload.render();
	}

	upload() {
		var file = this.btnUpload.element.files.item(0);
		var cb = this.log.bind(this);
		var reader = new FileReader();
		var client = this;
		reader.onload = function(){
			console.log("reading");
			if(reader.readyState == 2) {// DONE
				console.log(reader.result);
				client.sendRequest(
					"put",
					"/user/dataset/",
					{data:reader.result, filename: file.name},
					function(result) {
						var json = JSON.parse(result);
						// TODO result.status code has error info too
						if(json.errors) {
							client.flashMessage("Bad format", "erorr");
						} else {
							client.flashMessage("Dataset saved");
							// TODO Get ID
							// TODO show that dataset
						}
					}
				);
			}
		};

		reader.readAsText(file);
	}

	export(format) {
		var dataset_id = 1; // TODO actual dataset number
		this.sendRequest(
			"get",
			"/user/dataset/" + dataset_id + "?format=" + format,
			null,
			this.save.bind(this)
		);
	}

	save(result) {
		result = JSON.parse(result);
		var mimeType;
		var ext;
		var filename = "dataset";

		switch(result.format) {
			case 'xml': mimeType = 'text/xml'; ext = 'xml'; break;
			case 'json': mimeType = 'application/json'; ext = 'json'; break;
			case 'csv': mimeType = 'text/csv'; ext = 'csv'; break;
		}

		var blob = new Blob([result.data], {type: mimeType + ";charset=utf-8"});
		saveAs(blob, filename + '.' + ext);
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


	registrationForm(){

		var x = document.getElementById("formNewUser");
		var createform = document.createElement('form'); // Create New Element Form
		createform.setAttribute("class", "formUser")

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



	}
	createNewUser(){

	console.log("=======================================");
		var textEmail = document.getElementById("emailid").value;
		var textPassword = document.getElementById("passwordid").value;

		console.log(textEmail);
		console.log(textPassword);

		var data = [textEmail, textPassword];
		this.sendRequest("post", "/user/", data, this.flashMessage.bind(this, "User created", "success"));
		var x = document.getElementById("formNewUser");
		x.innerHTML=" "





	}

}


