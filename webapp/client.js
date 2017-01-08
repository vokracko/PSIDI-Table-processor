"use strict";

class Client {
	constructor(ip, port, renderer, datasource) {
		this.address = "http://" + ip + ":" + port;
		this.renderer = renderer;
		this.datasource = datasource;
		this.token = null;
		this.dataset_id = 1;
	}

	createRegisterForm(e) {
		e.preventDefault();
		this.renderer.overlay.setData({text: "", type: "success"});
		var form = new Form("overlay", {id: "form"}, function(e) {e.stopPropagation();});
		var email = new Input("form", {type:"text"}, null);
		var password = new Input("form", {type:"password"}, null);
		var submit = new Input("form", {type:"submit", value: "New user"}, this.registerUser.bind(this));

		overlay.render();
		form.render();
		email.render();
		password.render();
		submit.render();
	}


	registerUser(e) {
		e.preventDefault();

		var form = document.forms[0];
		var email = form.children[0].value;
		var password = form.children[1].value;
		var client = this;

		this.sendRequest(
			"post",
			"/user",
			{email:email, password: password},
			function(token) {
				if(token) {
					client.token = token;
					client.flashMessage("User successful created", "success");
					client.datasetSelect();
				} else {
					client.flashMessage("Failed", "fail");
				}
			}
		);
	}

	createDefaultOverlay() {
		this.renderer.overlay.setData({text: "", type: "success"});
		var form = new Form("overlay", {id: "form"}, function(e) {e.stopPropagation();});
		var login = new Input("form", {type:"submit", value:"Login"}, this.createLoginForm.bind(this));
		var register = new Input("form", {type:"submit", value: "Register"}, this.createRegisterForm.bind(this));

		overlay.render();
		form.render();
		login.render();
		register.render();
	}

	createLoginForm(e) {
		e.preventDefault();
		this.renderer.overlay.setData({text: "", type: "success"});
		var form = new Form("overlay", {id: "form"}, function(e) {e.stopPropagation();});
		var email = new Input("form", {type:"text", id: "email"}, null);
		var password = new Input("form", {type:"password", id:"password"}, null);
		var submit = new Input("form", {type:"submit", value: "Login"}, this.login.bind(this));

		overlay.render();
		form.render();
		email.render();
		password.render();
		submit.render();
	}

	logout() {
		this.token = null;
		this.dataset_id = null;
		this.createLoginForm();
	}

	login(e) {
		e.preventDefault();
        var form = document.forms[0];

		var email = document.getElementById("email").value;
		var password = document.getElementById("password").value;
		var client = this;
		//console.log(email);
		//console.log(password);
		this.sendRequest(
			"put",//"post",
			"/user/" ,//+email+"?password="+password,
			{email:email, password: password},
			function(response) {
				if(!response) {
					alert("Invalid credentials");
					return;
				}

				client.token = JSON.parse(response).token;
				client.flashMessage("Login successful", "success");
				client.datasetSelect();
			}
		);
	}

	createImportForm() {
		var form = new Form("overlay", {id: "form-import"}, function(e) {e.stopPropagation();});
		var btnUpload = new Input("form-import", {type:"file", id:"file"}, null);
		var datasetName = new Input("form-import", {type:"text", id:"dataset_name"}, null);
		var submit = new Input("form-import", {type:"submit", value: "Import"}, this.import.bind(this));
		
		this.renderer.overlay.setData({text: "", type: "success"});
		this.renderer.overlay.render();
		form.render();
		datasetName.render();
		btnUpload.render();
		submit.render();
	}

	import(e) {
		e.preventDefault();
		var file = document.getElementById("file").files.item(0);
		var name = document.getElementById("dataset_name").value;
		var cb = this.log.bind(this);
		var reader = new FileReader();
		var client = this;
		var arr = file.name.split('.');
		var format = arr[arr.length - 1];
		reader.onload = function(){
			console.log("reading");
			if(reader.readyState == 2) {// DONE
				console.log(reader.result);
				client.sendRequest(
					"put",
					"/user/dataset/",
					{data:reader.result, format: format, name: name},
					function(result) {
						var json = JSON.parse(result);
						// TODO result.status code has error info too
						if(json.errors) {
							client.flashMessage("Bad format", "erorr");
						} else {
							client.flashMessage("Dataset saved");
							client.dataset_id  = json.id;
							client.datasetGet();
						}
					}
				);
			}
		};

		reader.readAsText(file);
	}

	export(format) {
		this.sendRequest(
			"get",
			"/user/dataset/" + this.dataset_id + "?format=" + format,
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
		this.renderer.flashMessage("Result is " + response.result, "success");
	}

	operation(operation) { 
		var selected = this.determineSelected();
		var address = "/user/dataset/" + this.dataset_id;
		var action = "?action=" + operation;
		var address_scope = "";
		
		switch(selected.scope) {
			case "all": break;
			case "column": address_scope = "/col/" + selected.index; break;
			case "row": address_scope = "/row/" + selected.index; break;
		}

		this.sendRequest(
			"get", 
			address + address_scope + action,
			null,
			this.log.bind(this)
		);
	}

	determineSelected() {
		var tableHeaders = document.getElementsByClassName("table-header selected");
		
		if(tableHeaders.length == 0) { //none
			return {scope: "all"};
		}

		var cell = tableHeaders[0];

		if(cell.parentNode.rowIndex == 0) {
			return {scope: "column", index: cell.cellIndex - 1};
		}

		return {scope: "row", index: cell.parentNode.rowIndex - 1};

	}

	operationInput(operation) {
		var scalar = prompt("Set value");

		this.sendRequest(
			"get", 
			"/user/dataset/" + this.dataset_id + "?action=" + operation + "&scalar=" + scalar,
			null,
			this.renderTable.bind(this)
		);
	}

	transpose() {
		this.sendRequest(
			"get", 
			"/user/dataset/" + this.dataset_id + "?action=transpose",
			null,
			function(response) {
				this.datasource.setData(JSON.parse(response).result);
				this.renderer.renderItems();
			}.bind(this)
		);
	}

	datasetGet(id) {
		if(id) {
			this.dataset_id = id;
		}
		
		this.sendRequest("get", "/user/dataset/" + this.dataset_id, null, this.renderTable.bind(this));
	}

	datasetUpdate() {
		var data = this.datasource.toArray();
		this.sendRequest("post", "/user/dataset/" + this.dataset_id, {data:data}, this.flashMessage.bind(this, "Dataset saved", "success"));
	}

	renderTable(response) {
		var data = JSON.parse(response).data;
		this.datasource.setData(data);
		this.renderer.renderItems();
	}

	flashMessage(text, type) {
		this.renderer.flashMessage(text, type);
	}

	macroList(){
		this.sendRequest('get', '/user/macro', null, this.log.bind(this));
	}

	macroCreate(){
		console.log('macro create');
		//console.log(JSON.parse('"/user/dataset/1?action=count"'));
		var name= prompt('macro name', 'dsf');
		var ops= prompt('macro operations list ex:[\"count\" ,\"sum\"]', ['["count","sum"]']);
		//var obj={'name':name, 'operations':'/user/dataset/1?action=count'};

        var obj={'name':name, 'operations':JSON.parse(ops)};
        console.log(obj.operations);
		this.sendRequest(
        	"post", //bc joel said so XD
        	"/user/macro",
   			obj,
   			this.log.bind(this)

			);

	}

	macroExecute(){
		var dataset= prompt('what dataset do you want to operate on?');
		var macroId= prompt('what macro Id do you want to execute?');
		var obj={'dataset': dataset, 'macroId':macroId};
		this.sendRequest(
			"put",
			"/user/macro",
			obj,
			this.treat.bind(this)
	);		
        }

	treat(result) {
        result = JSON.parse(result);
        var string = JSON.stringify(result);
		console.log(string);
        var json = JSON.parse(string);
        console.log(json);
        for (var i = 0; i < json.length; i++) {

            var tmp=json[i].url;
            //var tmp1=tmp.split('=')[1];
            console.log(tmp);
            this.operation(tmp);

        }
    }

	datasetSelect(){
		this.sendRequest(
			"get",
			"/user/dataset/",
			null,
			this.datasetList.bind(this)
		);
	}

	datasetList(data) {
		if(!data || JSON.parse(data).data.length == 0) {
			this.renderer.flashMessage("No dataset yet, import one", "notice");
			return;
		}

		this.renderer.overlay.setData({text: "", type: "success"});
		var form = new Form("overlay", {id: "form"}, function(e) {e.stopPropagation();});
		var select = new Select("form", {type:"text", options:JSON.parse(data).data}, function(id) {
			this.renderer.overlay.hide();
			this.datasetGet(id);
		}.bind(this));

		overlay.render();
		form.render();
		select.render();
	}
}
