"use strict";

class Renderable {
	constructor(element, location) {
		this.element = document.createElement(element);
		this.location = location;
		this.toRender = true;
		this.timeoutID = null;
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
		target.appendChild(this.element);
		this.toRender = false;
	}

	setData(data) {
		this.data = data;
		this.toRender = true;
	}

	hide(element) {
		element.style.display = "none";
	}

	flash(interval) {
		this.render();
		this.timeoutID = setTimeout(this.hide, interval, this.element);
	}
}

class Button extends Renderable {
	constructor(location, data, callback) {
		super("input", location);
		this.element.type = "button";
		this.element.onclick = callback;
		this.element.value = data.text;
	}
}

class Table extends Renderable {
	constructor(location, data, callback) {
		super("table", location);
		this.element.setAttribute("cellspacing", 0);
		this.element.setAttribute("cellpadding", 0);
		this.data = data;
		this.toRender = false;
	}

	render() {
		if(!this.toRender) {
			return;
		}

		var rowHeader = document.createElement("tr");

		for(var i = 0; i < this.data.data[0].length + 1; ++i) { // +1 => table header col
			rowHeader.appendChild(this.createHeader(i, i == 0));
		}

		this.element.appendChild(rowHeader);

		for(var i = 0; i < this.data.data.length; ++i) {
			var row = document.createElement("tr");
			row.appendChild(this.createHeader(i+1));

			for(var j = 0; j < this.data.data[i].length; ++j) {
				var cell = document.createElement("td");
				cell.setAttribute("contenteditable", "true");
				cell.innerHTML = this.data.data[i][j];
				row.appendChild(cell);
			}

			this.element.appendChild(row);
		}

		super.render();
	}

	createHeader(index, blank = false) {
		// TODO - make selectable for row/col 
		var cell = document.createElement("td");
		cell.setAttribute("class", "table-header");

		if(!blank) {
			cell.innerHTML = index;
		}
		return cell;
	}

	toArray() {
		var result = [];

		// 1 => first row/col is header
		for(var i = 1; i < this.element.children.length; ++i) {
			var row = this.element.children[i];
			var rowResult = [];

			for(var j = 1; j < row.children.length; ++j) {
				var cell = row.children[j];
				rowResult.push(parseFloat(cell.innerHTML));
			}

			result.push(rowResult);
		}

		return result;
	}

}

class Overlay extends Renderable {
	constructor(location, data) {
		super("div", location);
		this.data = data;
	}

	render() {
		this.element.innerHTML = this.data.text;
		super.render();
	}
}