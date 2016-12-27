"use strict";

class IOconverter {

	validate(json) {
		if(json.length == 0 || json[0].length == 0) {
			throw Error("Empty data");
		} 

		var rowLength = json[0].length;
		for(var row = 0; row < json.length; ++row) {
			if(json[row].length != rowLength) {
				return false;
			}

			for(var cell = 0; cell < json[row].length; ++cell) {
				if(!isNumber(json[row][cell])) {
					return false;
				}
			}
		}

		return true;
	}

	fromJSON(json) {
		var output = this.init;
		for(var row = 0; row < json.length; ++row) {
			output += this.beforeRow;
			for(var cell = 0; cell < json[row].length; ++cell) {
				output += this.beforeCell;
				output += json[row][cell].toString();
				output += this.afterCell;
			}
			output += this.afterRow;
		}

		output += this.finish;
		return output;
	}

	toJSON(data) {
		var json = [];
		var rowIndex = 0;
		var number;
		var position = 0;

		if(!data.startsWith(this.init)) {
			return false;
		} 

		data = data.substr(this.init.length);

		while(data.startsWith(this.beforeRow)) {
			data = data.substr(this.beforeRow.length);
			json.push([]);

			while(data.startsWith(this.beforeCell)) {
				data = data.substr(this.beforeCell.length);

				while(numberChar(data.charCodeAt(position++)));

				number = parseFloat(data.substr(0, position));
				json[rowIndex].push(number);

				data = data.substr(position - 1);
				position = 0;
				
				if(!data.startsWith(this.afterCell)) {
					return false;
				}

				data = data.substr(this.afterCell.length);

				if(!data || data.startsWith(this.afterRow)) {
					break;
				}
			}	


			if(!data.startsWith(this.afterRow)) {
				return false;
			}

			data = data.substr(this.afterRow.length);
			rowIndex++;

			if(!data) {
				break;
			}
		}

		if(!data.startsWith(this.finish)) {
			return false;
		}

		return this.validate(json) ? json : null;
	}

}

class XML extends IOconverter {
	constructor() {
		super();
		this.init = "<dataset>\n";
		this.beforeRow = "\t<row>\n";
		this.afterRow = "\t</row>\n";
		this.beforeCell = "\t\t<cell>";
		this.afterCell = "</cell>\n";
		this.finish = "</dataset>";
	}
}

class CSV extends IOconverter {
	constructor() {
		super();
		this.init = "";
		this.beforeRow = "";
		this.afterRow = "\n";
		this.beforeCell = "";
		this.afterCell = ";";
		this.finish = "";
	}
}

class JSON extends IOconverter {
	constructor() {
		super();
		this.init = "[\n";
		this.beforeRow = "\t[";
		this.afterRow = "]\n";
		this.beforeCell = "";
		this.afterCell = ",";
		this.finish = "]";
	}
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function numberChar(charCode) {
	// . or 0-9
	return charCode == 46 || (charCode >= 48 && charCode <= 57);
}

module.exports = {
	XML: XML,
	CSV: CSV,
	JSON: JSON
};