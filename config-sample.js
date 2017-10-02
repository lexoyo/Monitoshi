module.exports = {
    "num_runners": 10,
    "interval": 10000,
    "timeout": 10000,
    "attempts": 3,
    "verbose": false,
    "nodemailer": {
        "comment": 'gmail is complicated since https://nodemailer.com/using-gmail/ you will probably need smtp',
        "service": 'gmail',
        "auth": {
            "user": 'sender@gmail.com',
            "pass": 'password'
        }
    },
    "webHook": {
        url: 'https://maker.ifttt.com/trigger/monitoshi_event/with/key/YOUR IFTTT ID FOR THE MAKER TRIGGER (see https://ifttt.com/maker)',
        method: 'get',
        params: '',
        post_options: {},
        titleFieldName: 'value1',
        urlFieldName: 'value2',
        emailFieldName: 'value3',
        detailsFieldName: 'value4'
    }
};
