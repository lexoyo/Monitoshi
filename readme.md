# Monitoshi, website uptime monitoring

## How to install

With node installed ([download](http://nodejs.org/download)), checkout this repository and do

    $ npm install
    $ node app/index.js

The `MT_CONFIG` environment variable may contain a config json string, like the provided sample [default-config.js](https://github.com/lexoyo/Monitoshi/blob/master/default-config.js) but without line breaks. Alternatively you can provide the path of a json file (also like [default-config.js](https://github.com/lexoyo/Monitoshi/blob/master/default-config.js)) in the environment variable `MT_CONFIG_FILE`. Last method you can use for the config: if you use [Heroku](https://www.heroku.com) for hosting, see [how to set environment variables on your VM](https://devcenter.heroku.com/articles/config-vars), and this [useful plugin to handle config](https://github.com/ddollar/heroku-config).

The config allows you to configure URLs to be monitored and web hooks to raise alerts.

Web hooks are great to use in conjuction with [Zapier](https://zapier.com/) to send emails or take actions in case of an URL changing status (service up or down). Please share with us if you find other services.

Example of config:

```
{
    "interval": 10000,
    "timeout": 10000,
    "attempts": 3,
    "monitors": [
        {
            "name": "Silex API",
            "enabled": true,
            "url": "http://editor.silex.me/api/v1.0/dropbox/connect",
            "interval": 5000,
            "timeout": 5000,
            "alerts": ["zapier.com webhook"],
            "attempts": 5,
            "type": "ping"
        }
    ],
    "alerts": [
        {
            "name": "zapier.com webhook",
            "enabled": false,
            "url": "https://zapier.com/hooks/catch/xxxxxx/",
            "method": "get",
            "params": "status=%s&message=%s",
            "upStatus": "{{name}} is UP",
            "upMessage": "System is now operational (status is {{status}}). \n{{url}}",
            "downStatus": "{{name}} is DOWN",
            "downMessage": "{{name}} failed (status is {{status}}). \n{{url}}",
            "type": "webhook"
        }
    ]
}
```

## Contributions and road map

Let's [talk about it in this thread](https://github.com/lexoyo/Monitoshi/issues/1).

## License

license: GPL v2

