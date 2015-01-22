module.exports = {
    "interval": 10000,
    "timeout": 10000,
    "monitors": [
        {
            "name": "Silex API",
            "enabled": true,
            "url": "http://editor.silex.me/api/v1.0/dropbox/connect",
            "interval": 5000,
            "timeout": 5000,
            "alerts": ["zapier.com webhook"],
            "type": "ping"
        },
        {
            "name": "Silex website",
            "enabled": true,
            "url": "http://www.silex.me/",
            "interval": 5000,
            "timeout": 5000,
            "alerts": ["zapier.com webhook"],
            "type": "page-load"
        },
        {
            "name": "local file",
            "enabled": false,
            "url": "http://0.0.0.0:8080",
            "interval": 2000,
            "timeout": 2000,
            "type": "page-load"
        }
    ],
    "alerts": [
        {
            "name": "zapier.com webhook",
            "enabled": true,
            "url": "https://zapier.com/hooks/catch/ogk8oq/",
            "method": "get",
            "params": "status=%s&message=%s",
            "upStatus": "{{name}} is UP",
            "upMessage": "System is now operational (status is {{status}})",
            "downStatus": "{{name}} is DOWN",
            "downMessage": "{{name}} failed (status is {{status}})",
            "type": "webhook"
        }
    ]
}
