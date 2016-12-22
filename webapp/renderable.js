"use strict";

class Renderable {
	constructor(element, location) {
		this.element = document.createElement(element);
		this.location = location;
		this.toRender = true;
		this.timeoutID = null;
		this.defaultDisplay = "inline-block";
	}

	render() {
		if(!this.toRender) {
			return;
		}

		if(!this.location) {
			throw Exception("Location not set");
		}

		if(this.timeoutID) {
			clearInterval(this.timeoutID);
			this.timeoutID = null;
		}

		var target = document.getElementById(this.location);
		this.element.style.display = this.defaultDisplay;
		target.appendChild(this.element);
		this.toRender = false;
	}

	setData(data) {
		this.data = data;
		this.toRender = true;
	}

	hide() {
		this.element.style.display = "none";
	}

	flash(interval) {
		this.render();
		this.timeoutID = setTimeout(this.hide.bind(this), interval, this.element);
	}
}

class Button extends Renderable {
	constructor(location, data, callback) {
		super("button", location);
		this.element.type = "button";
		this.element.onclick = callback;
		this.element.innerHTML = data.text;
		this.defaultDisplay = "block";
		this.element.style.display = "block";
		this.element.classList.add("btn-default");
		this.element.classList.add("btn");

		if(data.class) {
			this.element.classList.add(data.class);
		}
	}
}

class Table extends Renderable {
	constructor(location, data, callback) {
		super("table", location);
		this.element.appendChild(document.createElement("tbody"));
		this.element.setAttribute("cellspacing", 0);
		this.element.setAttribute("cellpadding", 0);
		this.element.classList.add("table");
		this.element.classList.add("table-bordered");
		this.element.classList.add("table-striped");

		this.data = data;
		this.toRender = false;
	}

	render() {
		if(!this.toRender) {
			return;
		}

		while(this.element.rows[0]) this.element.deleteRow(0);

		var rowHeader = document.createElement("tr");

		for(var i = 0; i < this.data[0].length + 1; ++i) { // +1 => table header col
			rowHeader.appendChild(this.createHeader(i, i == 0 ? "dataset" : "column"));
		}

		this.element.tBodies[0].appendChild(rowHeader);

		for(var i = 0; i < this.data.length; ++i) {
			var row = document.createElement("tr");
			row.appendChild(this.createHeader(i+1, "row"));

			for(var j = 0; j < this.data[i].length; ++j) {
				var cell = document.createElement("td");
				cell.setAttribute("contenteditable", "true");
				cell.innerHTML = this.data[i][j];
				row.appendChild(cell);
			}

			this.element.tBodies[0].appendChild(row);
		}

		super.render();
	}

	createHeader(index, type) {
		// TODO - make selectable for row/col 
		var cell = document.createElement("td");
		cell.classList.add("table-header");

		if(type == "dataset") {
			cell.innerHTML = "Dataset";
			cell.onclick = this.select.bind(this, "none", null);
		} else {
			cell.innerHTML = index;
			cell.onclick = type == "row" 
				? this.select.bind(this, "row", index) 
				: this.select.bind(this, "column", index);
		}

		return cell;
	}

	selectRow(index) {
		var row = Array.from(this.element.rows[index].cells);
		row.map(cell => cell.classList.add("selected"));
	}

	selectColumn(index) {
		var rows = Array.from(this.element.rows);
		rows.map(row => row.cells[index].classList.add("selected"));
	}

	select(type, index, e) {

		if(e.target.classList.contains("selected")) {
			this.selectNone();
			return;
		}

		this.selectNone();

		switch(type) {
			case "row": this.selectRow(index); break;
			case "column": this.selectColumn(index); break;
			case "none": this.selectNone(); break;
		}
	}

	selectNone() {
		var rows = Array.from(this.element.rows);
		rows.map(row => {
			var cells = Array.from(row.cells);
			cells.map(cell => cell.classList.remove("selected"));
		});
	}

	toArray() {
		var result = [];

		// 1 => first row/col is header
		for(var i = 1; i < this.element.rows.length; ++i) {
			var row = this.element.rows[i];
			var rowResult = [];

			for(var j = 1; j < row.cells.length; ++j) {
				var cell = row.cells[j];
				rowResult.push(parseFloat(cell.innerHTML));
			}

			result.push(rowResult);
		}

		return result;
	}

}

class Overlay extends Renderable {
	constructor(location, data, callback) {
		super("div", location);
		this.data = data;
		this.toRender = false;
		this.element.onclick = this.hide.bind(this);
		this.hide();
		this.element.setAttribute("id", this.data.id);
	}

	render() {
		console.log("rendering overlay");
		this.element.innerHTML = this.data.text;
		this.element.setAttribute("class", this.data.type);
		super.render();
	}
}

class Input extends Renderable {
	constructor(location, data, callback) {
		super("input", location);
		this.element.onchange = data.onchange;
		this.element.type = data.type;
		this.element.onclick = callback;
	}
}