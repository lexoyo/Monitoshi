# Monitoshi, website uptime monitoring

## About

Ping URLs and send email alerts when it is down or goes up again.

I have [an instance online here](https://monitoshi.lexoyo.me/), feel free to use it - I use it myself to monitor my websites.

### How does it work?

You submit an URL to Monitoshi, along with your email adress, to receive a confirmation link by email. Then Monitoshi will send emails when the URL goes down or up again. In the emails you also have a link to remove your URL and email from Monitoshi's list.

### Links

[Roadmap is here](https://github.com/lexoyo/Monitoshi/issues/1) and [feature requests can be done here](https://github.com/lexoyo/Monitoshi/issues/).

### Badges

In the email you will receive upon creation of a new monitor, there will be the URL of a badge like this one:

![silexlabs.org status by monitoshi](http://monitoshi.lexoyo.me/badge/1477987707192-1847)

Use it with markdown to display if your service is up or down, on a status page or in the README of your project.

## Install locally

Requirements

* [Node.js](http://nodejs.org/)
* [MongoDB](https://www.mongodb.org/) installed and running (`npm run serve` or `mongod --dbpath ./data`)

1- Checkout this repository (`git clone https://github.com/lexoyo/Monitoshi.git && cd Monitoshi`)

2- copy `config-sample.js` to `sample.js`, and edit this file to **change at least the mail options to send emails**. Monitoshi uses [Nodemailer](https://nodemailer.com/) to send emails, and you have to define nodemailer's config in the `nodemailer` object of your config file. (Monitoshi does `nodemailer.createTransport(config.nodemailer)`. Check [nodemailer docs](https://nodemailer.com/) or [Using Gmail section](https://nodemailer.com/using-gmail/) (gmail is really a poor solution, I use SMTP).

Ask me any questions about this in the github issues of the project.

For production, see bellow the "Other way to change the config".

3- run this to install dependecies:

```
    $ npm install
```

4- Then start the server with this command (mongodb needs to be running)

```
    $ node app
```

Alternatively you can use the excellent [pm2 process manager](http://pm2.keymetrics.io/) to start the server:

```
    $ pm2 start .pm2.json
```

### Other way to change the config

The `MT_CONFIG` environment variable may contain a config json string, like the provided sample [config-sample.js](https://github.com/lexoyo/Monitoshi/blob/master/config-sample.js) but without line breaks. Alternatively you can provide the path of a json file (also like [config-sample.js](https://github.com/lexoyo/Monitoshi/blob/master/config-sample.js)) in the environment variable `MT_CONFIG_FILE`. Last method you can use for the config: if you use [Heroku](https://www.heroku.com) for hosting, see [how to set environment variables on your VM](https://devcenter.heroku.com/articles/config-vars), and this [useful plugin to handle config](https://github.com/ddollar/heroku-config).

Use `NUM_RUNNERS` env var or `"num_runners": 100,` in the config to set the number of monitors running simultanneously, each one checking 1 website at a time.

### Example of config

```
{
    "interval": 10000,
    "timeout": 10000,
    "attempts": 3
}
```

## Contributions and road map

Let's [talk about it in this thread](https://github.com/lexoyo/Monitoshi/issues/1).

## Notes for developers

### Routes

You can use monitoshi as is, reaching the routes listed bellow with a web browser or use it as an API with `&format=json` at the end of the URLs in order to have JSON responses instead of HTML messages.

Here are the app routes

* POST /monitor => add a monitor
* GET /monitor/:id/enable => enable a monitor, has to be called after a new monitor is added
* GET /monitor/:id/disable => disable a monitor, for tests
* GET /monitor/:id/del => remove a monitor, for tests
* GET /monitor/[MONITOSHI_ADMIN_PASS] => debug only (when the env var `MONITOSHI_ADMIN_PASS` is defined), displays all monitors

## License

license: GPL v2

## Roadmap

todo: move these ideas to https://github.com/lexoyo/Monitoshi/issues/1

dev

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

* pub pour silex dans les mails (du même auteur que monitoshi), ou pour d'autres projets foss...
* partage FB / Twitter /...? Pour supporter le projet ? Garantir ping 30 min ?
