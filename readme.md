# Monitoshi, website uptime monitoring

## How to install

With node installed ([download](http://nodejs.org/download)), checkout this repository and do

    $ npm install
    $ node app/index.js

The `MT_CONFIG` environment variable may contain a config json string, like the provided sample [default-config.js](https://github.com/lexoyo/Monitoshi/blob/master/default-config.js) but without line breaks. If you use Heroku for hosting, see [how to set environment variables on your VM](https://devcenter.heroku.com/articles/config-vars), and this [useful plugin to handle config](https://github.com/ddollar/heroku-config).

This config allows you to configure URLs to monitor and web hooks to raise alerts.

Web hooks are great to use in conjuction with [Zapier](https://zapier.com/) to send emails or take actions in case of an URL changing status (service up or down). Please share with us if you find other services.

## Contributions and road map

Let's [talk about it in this thread](https://github.com/lexoyo/Monitoshi/issues/1).

## License

license: GPL v2

