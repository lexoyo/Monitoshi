# Monitoshi, Free and open source website uptime monitoring

#How to install

With node installed ([download](http://nodejs.org/download)), checkout this repository and do

    $ npm install
    $ node app/index.js

The `MT_CONFIG_FILE` environment variable may contain a path to a config file like the provided sample `/sample-config.js`.

This config file will let you configure URLs to monitor and web hooks to raise alerts.

Web hooks are great to use in conjuction with [Zapier](https://zapier.com/) to send emails or take actions in case of an URL changing status (service up or down). Please share with us if you find other services.

#License

license: GPL v2

