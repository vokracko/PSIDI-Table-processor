"use strict";

class Worker {

	constructor(config) {
		var express = require('express');
	//	var sleep = require('sleep');
		var bodyParser = require('body-parser');

		this.app = express();
	//	this.sleep = sleep.sleep.bind(null, config.sleep);
		this.port = config.port;

		this.app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});
		this.app.use(bodyParser.json());
	}

	execute(operation, req, res) {
	//	this.sleep();

		if(!req.body) {
			res.status(400).send("Invalid data");
			return;
		}

		var data = Object.assign(req.query, {values: req.body.data});
		var func = operation.bind(this); // bind "this == Worker" context to func
		var f_res = func(data);
		res.json({result: f_res});
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
		this.app.post('/operation/variance', this.execute.bind(this, this.variance));
		this.app.post('/operation/stdev', this.execute.bind(this, this.stdev));
		this.app.post('/operation/midrange', this.execute.bind(this, this.midrange));
		this.app.post('/operation/add', this.execute.bind(this, this.add));
		this.app.post('/operation/scale', this.execute.bind(this, this.scale));
		this.app.post('/operation/transpose', this.execute.bind(this, this.transpose));

		this.app.post('/operation/addSets', this.execute.bind(this, this.addSets));
		this.app.post('/operation/multiplySets', this.execute.bind(this, this.multiplySets));
		
	
		this.app.listen(this.port);
	}

	sum(data) {
		return data.values.reduce((total, item) => total + item, 0);
	}

	count(data) {
		return data.values.length;
	}

	mean(data) {
			var product = data.values.reduce((total, item) => total * item, 1);
		return Math.pow(product, 1/this.count(data));
	}

	median(data) {
		var meanIndex = Math.ceil(data.values.length / 2);
		data.values.sort(this.numericSort);

		return data.values[meanIndex];
	}

	mode(data) {
		data.values.sort(this.numericSort);
		var counts = data.values.reduce((acc, num) => { // construct array of objects {number, count}
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

	scale(data) { // [[]]
		return data.values.map(x => x.map(y => parseFloat(y) * parseFloat(data.scalar)));
	}

	add(data) { // [[]]
		return data.values.map(x => x.map(y => parseFloat(y) + parseFloat(data.scalar)));
	}

	midrange(data) {
		data.values.sort(this.numericSort);
		return (data.values[data.values.length - 1] - data.values[0]) / 2;
	}

	variance(data) {
		var mean = this.aritmeticMean(data);
		var varianceSum = data.values.reduce((total, item) => total + Math.pow(item - mean, 2), 0);

		return varianceSum / (data.values.length - 1);
	}

	stdev(data) {
		return Math.sqrt(this.variance(data));
	}

	// not implemented ===========================================================
	transpose(data) { // [[]]
		var result = []
		var columnCount = data.values[0].length;

		for(var i = 0; i < columnCount; ++i) {
			var column = this.extractColumn(data, i);
			result.push(column);
		}

		return result;
	}

	addSets(data) { // [[]]
		return data;
	}

	multiplySets(data) { // [[]]
		return data;
	}

	// helpers ===================================================================
	numericSort(a, b) {
		return a - b;
	}

	flatten(arr) {
	  return arr.reduce((flat, item) => flat.concat(item), []);
	}

	aritmeticMean(data) {
		return this.sum(data) / this.count(data);
	}

	extractColumn(data, index) {
		return data.values.reduce((acc, row) => this.push(acc, row[index]), []);
	}

	push(array, item) {
		array.push(item);
		return array;
	}
}

module.exports = Worker;

