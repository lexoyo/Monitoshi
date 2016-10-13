module.exports = {
    "interval": 10000,
    "timeout": 10000,
    "attempts": 3,
    "nodemailer": {
        service: 'gmail',
        auth: {
            user: 'sender@gmail.com',
            pass: 'password'
        }
    }
};
