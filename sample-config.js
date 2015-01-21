module.exports = {
    interval: 10000,
    timeout: 10000,
    monitors: [
        {
            enabled: true,
            name: 'Silex API',
            url: 'http://editor.silex.me/api/v1.0/dropbox/connect',
            interval: 20000,
            timeout: 20000,
            type: 'ping'
        },
        {
            enabled: true,
            name: 'Silex website',
            url: 'http://www.silex.me/',
            interval: 2000,
            timeout: 2000,
            type: 'page-load'
        }
    ]
}