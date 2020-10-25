const config = require('config');
const NodeGeocoder = require('node-geocoder');

const options = {
  provider: config.get('geocoderProvider'),
  httpAdapter: 'https',
  apiKey: config.get('geocoderApiKey'),
  formatter: null,
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
