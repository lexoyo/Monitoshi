module.exports = {
    "interval": 10000,
    "timeout": 10000,
    "attempts": 3,
    "nodemailer": {
        comment: 'gmail is complicated since https://nodemailer.com/using-gmail/ you will probably need smtp'
        service: 'gmail',
        auth: {
            user: 'sender@gmail.com',
            pass: 'password'
        }
    }
};
