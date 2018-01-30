'use strict';

const {
	connect
} = require('./common');

const request = Promise.coroutine(function*(method, url, body = null) {
	const client = yield connect();

	const requestId = Date.now();
	const payload = {
		method,
		url,
		body
	};

	client.publish(`requests/${requestId}`, payload);
	const response = yield client.awaitMessage(`responses/${requestId}`);
	client.end();
	return response;
});

module.exports = {
	request: request,
	handler: function(event) {
		request('GET', event.url)
			.then(function(data) {
				console.log('got data!');
				console.log(data);
			});
	}
};

if (!module.parent) {
	request('GET', 'https://jsonplaceholder.typicode.com/posts/1')
		.then(function(data) {
			console.log('got data!');
			console.log(data);
		});
}
