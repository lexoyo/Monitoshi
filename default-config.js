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
            "enabled": false,
            "url": "https://zapier.com/hooks/catch/ogk8oq/",
            "method": "get",
            "params": "status=%s&message=%s",
            "upStatus": "{{name}} is UP",
            "upMessage": "System is now operational (status is {{status}}). \n{{url}}",
            "downStatus": "{{name}} is DOWN",
            "downMessage": "{{name}} failed (status is {{status}}). \n{{url}}",
            "type": "webhook"
        },
        {
            "name": "huginn webhook",
            "enabled": true,
            "url": "https://huginnlexoyo.herokuapp.com/users/1/web_requests/7/lexoro",
            "post_options": {
                "host": "huginnlexoyo.herokuapp.com",
                "path": "XXXXXXXXXXXXXXXXXXXXX",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
            "method": "post",
            "upStatus": "{{name}} is UP",
            "upMessage": "System is now operational (status is {{status}}). \n{{url}}",
            "downStatus": "{{name}} is DOWN",
            "downMessage": "{{name}} failed (status is {{status}}). \n{{url}}",
            "type": "webhook"
        }
    ]
}
