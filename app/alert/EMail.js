var nodemailer = require('nodemailer');

module.exports = class EMail {
    constructor(config) {
        this.transporter = nodemailer.createTransport(config.nodemailer);
        this.from = config.nodemailer.auth.user;
    }
    send(event) {
        console.log('send Email', event);
        event.from = this.from;
        this.transporter.sendMail(event);
    }
}
