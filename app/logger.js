
// check that newrelic can be initilized
if(!process.env.NEW_RELIC_LICENSE_KEY) console.warn('NEW_RELIC_LICENSE_KEY is missing, no monitoring today!');
else {
  if(!process.env.NEW_RELIC_LOG) process.env.NEW_RELIC_LOG = 'stdout';
  if(!process.env.NEW_RELIC_APP_NAME) process.env.NEW_RELIC_APP_NAME = 'Monitoshi';
  require ('newrelic');
}

module.exports = Logger = function() {
}
