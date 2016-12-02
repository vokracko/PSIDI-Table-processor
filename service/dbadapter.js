"use strict";

class DbAdapter {
	constructor(config) {
		this.result;
		this.mysql = require("mysql");
		this.util = require("util");
		this.connection = this.mysql.createConnection(config);

		this.connection.connect(function(err) {
			if(err) {
				console.log(err);
			}
		});
	}

	terminate() {
		this.connection.end();
	}

	cellInsertPrepare(dataset_id, data) {
		var sql = 'INSERT INTO cell VALUES ';
		var values = [];

		for(var i = 0; i < data.length; ++i) {
			for(var j = 0; j < data[i].length; ++j) {
				var cell = data[i][j];
				values.push(this.util.format('(%d, %d, %d, %d)', dataset_id, i, j, cell));
			}
		}

		sql += values.join(', ');
		return sql;
	}

	datasetCreate(user_id, name, data, callback) {
		this.connection.query('INSERT INTO dataset VALUES (NULL, ?, ?)', [user_id, name], function(err, result) {
			if(err) {
				callback(err, false);
			} else {
				var dataset_id = result.insertID;
				this.connection.query(this.cellInsertPrepare(dataset_id, data), function(err, result) {
					callback(err, result);
				});
			}

		});
	}

	datasetUpdate(dataset_id, data, callback) {
		// delete and reinsert is simpler than updating every row
		this.connection.query('DELETE FROM cell WHERE dataset_id = ?', [dataset_id], function(err, result) {
			if(err) {
				callback(err, false);
			} else {
				this.connection.query(this.cellInsertPrepare(dataset_id, data), function(err, result) {
					callback(err, result);
				});
			}
		}.bind(this));
	}

	datasetGetFlat(id, callback) {
		this.connection.query('SELECT data FROM cell WHERE dataset_id = ?', [id], function(err, rows, fields) {
			rows = rows.map(x => x.data);
			callback(err, rows);
		});
	}

	datasetGet(id, callback) {
		this.connection.query('SELECT GROUP_CONCAT(data ORDER BY col ASC) as res FROM cell WHERE dataset_id = ? GROUP BY row ORDER BY row ASC', [id], function(err, rows, fields) {
			rows = rows.map(x => x.res.split(',').map(y => parseFloat(y)));
			callback(err, rows);
		});
	}

	datasetRow(id, row, callback) {
		this.connection.query('SELECT data FROM cell WHERE dataset_id = ? AND row = ?', [id, row], function(err, rows, fields) {
			rows = rows.map(x => x.data);
			callback(err, rows);
		});
	}

	datasetCol(id, col, callback) {
		this.connection.query('SELECT data FROM cell WHERE dataset_id = ? AND col = ?', [id, col], function(err, rows, fields) {
			rows = rows.map(x => x.data);
			callback(err, rows);
		});
	}

	datasetOwns(id, email, callback) {
		this.connection.query('SELECT COUNT(*) as res FROM dataset LEFT JOIN user ON user.id = dataset.user_id WHERE dataset.id = ? AND user.email = ?', [id, email], function(err, rows, fileds) {
			callback(err, rows[0].res);
		});
	}

 
	userCreate(email, password, callback) {
		this.connection.query('INSERT INTO user VALUES (NULL, ?, sha1(?))', [email, password], function(err, result) {
			callback(err, result.insertID);
		});
	}

	userValidate(email, password, callback) {
		this.connection.query('SELECT COUNT(*) as res FROM user WHERE email = ? AND password = sha1(?)', [email, password], function(err, rows, fields) {
			callback(err, rows[0].res);
		});
	}

	operationInsertPrepare(macro_id, operations) {
		var sql = 'INESRT INTO operation VALUES ';
		var values = [];

		for(var i = 0; i < operations.length; ++i) {
			var op = operations[i];
			values.push(this.util.format('(NULL, ?, ?, ?) ', macro_id, op.url, op.data));
		}

		sql += values.join(', ');
		return sql;
	}

	macroCreate(user_id, name, operations, callback) {
		this.connection.query('INSERT INTO macro VALUES (NULL, ?, ?)', [user_id, name], function(err, result) {
			if(err) {
				callback(err, false);
			} else {
				var macro_id = result.insertID;
				this.connection.query(this.operationInsertPrepare(macro_id, operations), function(err, result) {
					callback(err, result);
				});
			}
		});
	}

	macroList(user_id, callback) {
		this.connection.query('SELECT id, name FROM macro WHERE user_id = ?', [user_id], function(err, rows, fields) {
			callback(err, rows);
		});
	}

	macroOperations(macro_id, callback) {
		this.connection.query('SELECT url, data FROM operation WHERE macro_id = ? ORDER BY id ASC', [macro_id], function(err, rows, fields) {
			callback(err, rows);
		});
	}
}

module.exports = DbAdapter;
