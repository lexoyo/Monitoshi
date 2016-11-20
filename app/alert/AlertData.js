const AlertType = {
    CONFIRM: 'CONFIRM',
    START: 'START',
    STOP: 'STOP',
    DOWN: 'DOWN',
    UP: 'UP',
}
module.exports = class AlertData {
    constructor(config) {
    }
    /**
     * @return the a copy of the `data` objet with added fields `text` and `subject`
     */
    createEvent(type, data) {
        const event = JSON.parse(JSON.stringify(data));
        const actionUrl = this.getActionUrl(type, data);
        const badgeUrl = `${data.serverUrl}/badge/${data.__badgeId}`;
        switch(type) {
            case AlertType.CONFIRM:
                event.subject = 'Confirm monitor creation';
                event.text = `Click the link bellow to allow Monitoshi to warn you by email when your site (${data.url}) is down.

${actionUrl}`;
                break;
            case AlertType.START:
                event.subject = 'Monitor Created';
                event.text = `This is an email to confirm that Monitoshi will warn you by email when ${data.url} is down.

If you want TO DELETE it one day, and prevent Monitoshi to monitor this website, follow this link: ${actionUrl}

And if you need a badge to display the state of your site (up or down), use this image: ${badgeUrl}`;
                break;
            case AlertType.STOP:
                event.subject = 'Monitor Deleted';
                event.text = `This is an email to confirm the deletion of a monitor. Monitoshi will not warn you anymore when ${data.url} is down.`;
                break;
            case AlertType.DOWN:
                event.subject = '[Alert]Your website is DOWN';
                event.text = `This is an email to warn you that ${data.url} is down.

If you want me to stop monitoring this website, follow this link: ${actionUrl}`;
                break;
            case AlertType.UP:
                event.subject = '[Alert]Your website is UP';
                event.text = `This is an email to inform you that ${data.url} is up again.

If you want me to stop monitoring this website, follow this link: ${actionUrl}`;
                break;
            default:
                throw('unknown type: ' + type);
        }
        console.log('created event', event.subject, event.actionUrl);
        return event;
    }
    getActionUrl(type, data) {
        const id = data._id;
        const serverUrl = data.serverUrl;
        switch(type) {
            case AlertType.CONFIRM:
                return `${serverUrl}/monitor/${id}/enable`;
            case AlertType.START:
                return `${serverUrl}/monitor/${id}/del`;
            case AlertType.STOP:
                return null;
            case AlertType.DOWN:
                return `${serverUrl}/monitor/${id}/del`;
            case AlertType.UP:
                return `${serverUrl}/monitor/${id}/del`;
            default:
                throw('AlertType:: unknown type: ' + type);
        }
    }
}
module.exports.AlertType = AlertType;
