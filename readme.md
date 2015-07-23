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

## todo

links

  Juste un formulaire avec
  - e-mail / URL
  - confirmation par mail pour abonnement
  - lien vers désabonnement dans tous les mails, pour 1 alerte, pour toutes les alertes (suppression du compte)
  - pub pour silex dans les mails (du même auteur que monitoshi), ou pour arvixe...
  - partage FB / Twitter /...? Pour supporter le projet ? Garantir ping 30 min ? PayPal pour dons ?
    => Share to unlock www.vikaskbh.com/tweet-post-facebook-like-unlock-content-using-jquery/
  - limiter à 100 users ?

  Et/Ou, sur le site
  - subscribe to the closed beta for free (100 users only)

  Si 1s par url en moyenne et ping toutes les heures, alors 3600 urls par serveur / worker ? Paralléliser 10 pings => 36000 urls par serveur.

* pubs ciblées dans les mails => geoloc http://stackoverflow.com/questions/409999/getting-the-location-from-an-ip-address
* Concurrent HTTP requests in node.js - doduck http://doduck.com/concurrent-requests-node-js/
* MongoDB as a queue service? http://stackoverflow.com/questions/9274777/mongodb-as-a-queue-service
routes  
  /item/add (POST)
    => add()
    => send email https://codeforgeek.com/2014/07/send-e-mail-node-js/
       link to del and confirm
  /item/:id/del => removeItem = remove http://docs.mongodb.org/manual/tutorial/remove-documents/
  /item/:id/confirm => confirmItem = update http://docs.mongodb.org/manual/tutorial/modify-documents/


features

* Trace route https://www.npmjs.com/package/traceroute
* Pour envoyer des SMS gratuits, mettre un device qui fait tourner une application qui poll monitoshi et qui envoie des SMS
* Proposer de mettre une url pour hook/ittt ...
