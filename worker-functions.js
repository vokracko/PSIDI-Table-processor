function sum(data) {
	var flatArray = flatten(data);
	return flatArray.reduce((total, item) => total + item);
}

function count(data) {
	var flatArray = flatten(data);
	return flatArray.length;
}

function mean(data) {
	var flatArray = flatten(data);
	var product = flatArray.reduce((total, item) => total * item);
	return Math.pow(product, 1/count(data));
}

function median(data) {
	var flatArray = flatten(data);
	var meanIndex = Math.ceil(flatArray.length / 2);
	flatArray.sort(numericSort);

	return flatArray[meanIndex];
}

function mode(data) {
	var flatArray = flatten(data).sort(numericSort);
	var counts = flatArray.reduce((acc, num) => { // construct array of objects {number, count}
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

function scale(data, scalar) {
	return data.map(x => x.map(y => y * scalar));
}

function add(data, scalar) {
	return data.map(x => x.map(y => y + scalar));
}

function midrange(data) {
	var sorted = flatten(data).sort(numericSort);
	return sorted[sorted.length - 1] / sorted[0];
}

function variance(data) {
	var flatArray = flatten(data);
	var mean = aritmeticMean(data);
	var items = flatArray.map(x => Math.pow(x - mean, 2));

	return sum(items) / (items.length - 1);
}

function stdev(data) {
	return Math.sqrt(variance(data));
}


// helpers
function numericSort(a, b) {
	return a - b;
}

function flatten(arr) {
  return arr.reduce((flat, item) => flat.concat(item), []);
}

function aritmeticMean(data) {
	return sum(data) / count(data);
}

var arr = [[5,6,9],[3,3,3]];
console.log(arr);
console.log(count(arr));