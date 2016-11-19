var nodemailer = require('nodemailer');

module.exports = class EMail {
    constructor(config) {
        this.transporter = nodemailer.createTransport(config.nodemailer);
        this.from = config.nodemailer.auth.user;
    }
    send(event) {
        event.from = this.from;
        event.to = event.email;
        console.log('send Email', event.to, event.email, event.subject);
        this.transporter.sendMail(event);
    }
}
