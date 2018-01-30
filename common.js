'use strict';

const AWS = require('aws-sdk');
const AWSMqtt = require('aws-mqtt');
const WebSocket = require('ws');
const AWS_REGION = process.env.AWS_REGION;
const AWS_THING_ENDPOINT = process.env.AWS_THING_ENDPOINT;

const Promise = global.Promise = require('bluebird');
AWS.config.setPromisesDependency(Promise);
AWS.config.update({ region: AWS_REGION });

function connect() {
	return new Promise(function(resolve) {
		const mqtt = AWSMqtt.connect({
			WebSocket: WebSocket,
			region: AWS.config.region,
			credentials: AWS.config.credentials,
			endpoint: AWS_THING_ENDPOINT,
			clientId: `mqtt-client- ${(Math.floor((Math.random() * 100000) + 1))}` // clientId to register with MQTT broker. Need to be unique per client
		});

		mqtt.on('connect', function() {
			console.log('Connected!');
			resolve(wrapMqtt(mqtt));
		});
	});
}

function wrapMqtt(mqtt) {
	return {
		publish: function(topic, payload) {
			return mqtt.publish(topic, JSON.stringify(payload));
		},
		awaitMessage: function(subscriptionTopic) {
			mqtt.subscribe(subscriptionTopic);
			return new Promise((resolve) => {
				mqtt.on('message', function(eventTopic, message) {
					if (subscriptionTopic === eventTopic) {
						mqtt.unsubscribe(subscriptionTopic);
						resolve(message.toString());
					}
				});
			});
		},
		end: mqtt.end.bind(mqtt),
		_mqtt: mqtt
	};
}

module.exports = {
	connect: connect
};
