"use strict";

class Worker {

	constructor(config) {
		var express = require('express');
		var sleep = require('sleep'); 
		var bodyParser = require('body-parser');

		this.app = express();
		this.sleep = sleep.sleep.bind(null, config.sleep);
		this.port = config.port;

		this.app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});
		this.app.use(bodyParser.json());
	}

	execute(operation, req, res) {
		this.sleep();

		if(!req.body || !req.body.data) {
			res.send("Invalid data");
			return;
		}

		var func = operation.bind(this); // bind "this == Worker" context to func
		var f_res = func(req.body);
		res.json(f_res);
	}

	listen() {
		// execute.bind(this, function_name) - set callback to "execute", 
		// set "execute"'s context to "this"
		// set operation callback to "function_name"
		this.app.post('/operation/sum', this.execute.bind(this, this.sum));
		this.app.post('/operation/count', this.execute.bind(this, this.count));
		this.app.post('/operation/mean', this.execute.bind(this, this.mean));
		this.app.post('/operation/median', this.execute.bind(this, this.median));
		this.app.post('/operation/mode', this.execute.bind(this, this.mode));
		this.app.post('/operation/scale', this.execute.bind(this, this.scale));
		this.app.post('/operation/add', this.execute.bind(this, this.add));
		this.app.post('/operation/variance', this.execute.bind(this, this.variance));
		this.app.post('/operation/stdev', this.execute.bind(this, this.stdev));
		this.app.post('/operation/midrange', this.execute.bind(this, this.midrange));

		this.app.post('/operation/addSets', this.execute.bind(this, this.addSets));
		this.app.post('/operation/multiplySets', this.execute.bind(this, this.multiplySets));
		this.app.post('/operation/transpose', this.execute.bind(this, this.transpose));
	
		this.app.listen(this.port);
	}

	sum(json) {
		return json.data.reduce((total, item) => total + item, 0);
	}

	count(json) {
		return json.data.length;
	}

	mean(json) {
			var product = json.data.reduce((total, item) => total * item, 1);
		return Math.pow(product, 1/this.count(json));
	}

	median(json) {
		var meanIndex = Math.ceil(json.data.length / 2);
		json.data.sort(this.numericSort);

		return json.data[meanIndex];
	}

	mode(json) {
		json.data.sort(this.numericSort);
		var counts = json.data.reduce((acc, num) => { // construct array of objects {number, count}
			var index = acc.findIndex(e => e.num == num);

			if(index == -1) {
				acc.push({num: num, count: 1});
			} else {
				acc[index].count++;
			}

			return acc;
		}, []);

		counts.sort((x, y) => y.count - x.count);

		return counts[0].count > 1 ? counts[0].num : null;
	}

	scale(json) { // [[]]
		return json.data.map(x => x.map(y => y * json.scalar));
	}

	add(json) { // [[]]
		return json.data.map(x => x.map(y => y + json.scalar));
	}

	midrange(json) {
		json.data.sort(this.numericSort);
		return (json.data[data.length - 1] - json.data[0]) / 2;
	}

	variance(json) {
		var mean = this.aritmeticMean(json);
		var varianceSum = json.data.reduce((total, item) => total + Math.pow(item - mean, 2), 0);

		return varianceSum / (json.data.length - 1);
	}

	stdev(json) {
		return Math.sqrt(this.variance(json));
	}

	// not implemented ===========================================================
	transpose(json) { // [[]]
		var result = []
		var data = json.data;
		var columnCount = data[0].length;

		for(var i = 0; i < columnCount; ++i) {
			var column = this.extractColumn(data, i);
			result.push(column);
		}

		return result;
	}

	addSets(json) { // [[]]
		return json.data;
	}

	multiplySets(json) { // [[]]
		return json.data;
	}

	// helpers ===================================================================
	numericSort(a, b) {
		return a - b;
	}

	flatten(arr) {
	  return arr.reduce((flat, item) => flat.concat(item), []);
	}

	aritmeticMean(json) {
		return this.sum(json) / this.count(json);
	}

	extractColumn(data, index) {
		return data.reduce((acc, row) => this.push(acc, row[index]), []);
	}

	push(array, item) {
		array.push(item);
		return array;
	}
}

module.exports = Worker;

