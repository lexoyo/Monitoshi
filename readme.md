# Monitoshi, website uptime monitoring

## About

Ping URLs and send email alerts when it is down or goes up again.

I have [an instance online here](https://monitoshi.herokuapp.com/), feel free to use it - I use it myself to monitor my websites.

More details on how it works: you submit an URL to Monitoshi, along with your email adress, to receive a confirmation link by email. Then Monitoshi will send emails when the URL goes down or up again. In the emails you also have a link to remove your URL and email from Monitoshi's list.

[Roadmap is here](https://github.com/lexoyo/Monitoshi/issues/1) and [feature requests can be done here](https://github.com/lexoyo/Monitoshi/issues/).

## Routes

You can use monitoshi as is, reaching the routes listed bellow with a web browser or use it as an API with `&format=json` at the end of the URLs in order to have JSON responses instead of HTML messages.

Here are the app routes

* POST /monitor => add a monitor
* GET /monitor/:id/enable => enable a monitor, has to be called after a new monitor is added
* GET /monitor/:id/disable => disable a monitor, for tests
* GET /monitor/:id/del => remove a monitor, for tests
* GET /monitor => debug only (when the env var `MONITOSHI_DEBUG` is defined), displays all monitors

## How to install

With node installed ([download](http://nodejs.org/download)), checkout this repository and do

    $ npm install
    $ node app

The `MT_CONFIG` environment variable may contain a config json string, like the provided sample [default-config.js](https://github.com/lexoyo/Monitoshi/blob/master/default-config.js) but without line breaks. Alternatively you can provide the path of a json file (also like [default-config.js](https://github.com/lexoyo/Monitoshi/blob/master/default-config.js)) in the environment variable `MT_CONFIG_FILE`. Last method you can use for the config: if you use [Heroku](https://www.heroku.com) for hosting, see [how to set environment variables on your VM](https://devcenter.heroku.com/articles/config-vars), and this [useful plugin to handle config](https://github.com/ddollar/heroku-config).

Example of config:

```
{
    "interval": 10000,
    "timeout": 10000,
    "attempts": 3
}
```

## Alert types

Email

Web hooks are great to use in conjuction with [Zapier](https://zapier.com/) to send emails or take actions in case of an URL changing status (service up or down). Please share with us if you find other services.

## Contributions and road map

Let's [talk about it in this thread](https://github.com/lexoyo/Monitoshi/issues/1).

## License

license: GPL v2

## Roadmap

todo: move these ideas to https://github.com/lexoyo/Monitoshi/issues/1

dev

* /index.html has a title set to "test"
* does not warn when http://01silex.com/tests/monitoshi/ goes down
* !! /del deletes the wrong monitor
  https://github.com/lexoyo/Monitoshi/issues/2
* i should have the status (up/down) in the email to confirm a monitor started
* cleanup index.js, create Router, use email aert...
* check if exist before add
* badge "http://...........com is UP"
* remove unconfirmed monitors
* on "/" display how many urls are tracked and the medium tracking interval
* list all URLs monitored by a given email adress
* Concurrent HTTP requests in node.js - doduck http://doduck.com/concurrent-requests-node-js/
* monitoshi.org ?
* embed on monitoshi's home page
* embed in silex?

emails

* better design
* footer with links: to the badge, github issues, home page, list of monitored urls
* call to contribution or ads for free software

more features

* captcha
* webhook, ifttt ...
* Trace route https://www.npmjs.com/package/traceroute
* handle post requests, ftp ...
* host instances in multiple locations

___

com

* pub pour silex dans les mails (du même auteur que monitoshi), ou pour arvixe...
* partage FB / Twitter /...? Pour supporter le projet ? Garantir ping 30 min ? PayPal pour dons ?
    => Share to unlock www.vikaskbh.com/tweet-post-facebook-like-unlock-content-using-jquery/

- limiter à 100 users ?
Et/Ou, sur le site
- subscribe to the closed beta for free (100 users only)

  Si 1s par url en moyenne et ping toutes les heures, alors 3600 urls par serveur / worker ? Paralléliser 10 pings => 36000 urls par serveur.

* pubs ciblées dans les mails => geoloc http://stackoverflow.com/questions/409999/getting-the-location-from-an-ip-address

* Pour envoyer des SMS gratuits, mettre un device qui fait tourner une application qui poll monitoshi et qui envoie des SMS
