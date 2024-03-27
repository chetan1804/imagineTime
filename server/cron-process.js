// import libraries
const async = require('async');
const cron = require('node-cron');
const moment = require('moment');
let DateTime = require('luxon').DateTime;
const { raw } = require('objection');

// import model 
const File = require('./resources/file/FileModel');
const Firm = require('./resources/firm/FirmModel');
const ViewDownload = require('./resources/viewdownload/ViewDownloadModel');
const ShareLink = require('./resources/shareLink/ShareLinkModel');
const notificationsCtrl = require('./resources/notification/notificationsController');
const logger = require('./logger');

const {
        signatureRequestReminderEmails, signatureRequestExpiryEmails
    } = require('./cronJobs/signatureRequestExpiry');
const User = require('./resources/user/UserModel');
const RequestTask = require('./resources/requestTask/RequestTaskModel');

exports.allCronJobs = () => {
    deletion();
    // signatureRequestReminderEmails();
    // signatureRequestExpiryEmails();
}

function deletion() {
    // deletion function

    // trigger every monday at 03:00 AM
    cron.schedule('0 3 * * MON', () => {

        // SIGNATURE REMINDER
        ShareLink.query().from('sharelinks as sharelink')
        .innerJoin('users as u', 'u._id', 'sharelink._createdBy')
        .innerJoin('quicktasks as quicktask', 'quicktask._id', 'sharelink._quickTask')
        .innerJoin('firms as firm', 'firm._id', 'sharelink._firm')
        .innerJoin('subscriptions as subscription', 'subscription._firm', 'firm._id')
        .leftJoin('clients as client', 'client._id', 'sharelink._client')
        .leftJoin('staff', 'staff._firm', 'sharelink._firm')
        .leftJoin('staffclients as staffclient', 'staffclient._client', 'client._id')
        .whereIn('subscription.status', ['active', 'trialing'])
        .where({
            'quicktask.type': 'signature'
            , 'quicktask.status': 'open'
            , 'quicktask.visibility': 'active'
        })
        .where('sharelink.created_at', '>', '2022-11-09T20:34:59.122Z') // where created_at greater than the date I created it
        .select([
            'sharelink.*'
            , raw('row_to_json(u) as linkcreator')
            , raw('row_to_json(quicktask) as quicktask')
            , raw('row_to_json(firm) as firm')
            , raw('row_to_json(client) as client')
            , raw('json_agg(staff) as staff')
            , raw('json_agg(staffclient) as staffclient')
        ])
        .groupBy([
            'sharelink._id'
            , 'quicktask._id'
            , 'firm._id'
            , 'client._id'
            , 'u._id'
        ])
        .orderBy('sharelink.created_at', 'desc')
        .then(shareLinks => {
            async.mapSeries(shareLinks, (shareLink, callback) => {
                const userName = shareLink && shareLink.quicktask && shareLink.quicktask.signingLinks.filter(item => !item.responseDate).map(item => item.signatoryEmail);
                if (shareLink && shareLink.client && shareLink.client.status != 'visible') {
                    // needs to respect the client too
                    logger.error("Found share link but client is not visible")
                    callback();
                } else if (shareLink && shareLink.expireDate && DateTime.fromISO(shareLink.expireDate) < DateTime.local()) {
                    // needs to respect the expiration too
                    logger.error("Found share link but it's expired")
                    callback();
                } else if (shareLink && shareLink._client && shareLink.quicktask && userName && userName.length) {
                    // related to a client
                   
                    const staffclient = shareLink.staffclient && shareLink.staffclient.filter(item => item._user === shareLink._createdBy);
                    const staff = staffclient && staffclient[0] && staffclient[0]._user
                        ? shareLink.staff && shareLink.staff.length && shareLink.staff.filter(item => staffclient[0]._user === item._user && item.status === "active")
                        : [];
                    if (staff && staff.length && staff[0]) {
                        shareLink.dontNotifyTheCreator = !staffclient[0].sN_autoSignatureReminder;
                    } else {
                        shareLink.dontNotifyTheCreator = !shareLink.sN_creatorAutoSignatureReminder;
                    }
                    shareLink.dontNotifyTheSigner = !shareLink.client.sN_autoSignatureReminder;
                    notificationsCtrl.signatureReminder(shareLink);
                    callback();
                } else if (shareLink && shareLink.quicktask && userName && userName.length) {
                    // not related to a client
    
                    shareLink.dontNotifyTheSigner = !shareLink.sN_clientAutoSignatureReminder;
                    shareLink.dontNotifyTheCreator = !shareLink.sN_creatorAutoSignatureReminder;
                    notificationsCtrl.signatureReminder(shareLink);
                    callback();
                } else {
                    callback();
                }
            });
        });

        // REQUEST LIST TASK REMINDER
        RequestTask.query()
        .innerJoin('clients as client', 'client._id', 'requesttask._client')
        .innerJoin('firms as firm', 'firm._id', 'client._firm')
        .innerJoin('subscriptions as subscription', 'subscription._firm', 'firm._id')
        .whereIn('subscription.status', ['active', 'trialing'])
        .where({ 'client.status': 'visible', 'requesttask.status': 'published' })
        .where('requesttask.created_at', '>', '2023-03-01T20:34:59.122Z')
        .select(
            'requesttask.*'
            , raw('row_to_json(firm) as firm')
        )
        .groupBy(['requesttask._id', 'firm._id'])
        .then(requestTasks => {
            requestTasks.map(requestTask => {
                notificationsCtrl.requestTaskReminder(requestTask);
            })
        })
    });
    
    // trigger every 12:01 AM
    cron.schedule('1 0 * * *', () => {
    //cron.schedule('*/10 * * * * *', () => {
        // deletion of link
        logger.debug('About to run deletion cron job.');

        Firm.query()
        .innerJoin('subscriptions as subscription', 'subscription._firm', 'firms._id')
        .whereIn('subscription.status', ['active', 'trialing'])
        .whereNot('firms.archiveFile', 'None')
        .select('firms._id', 'firms.archiveFile')
        .asCallback((err, firms) => {

            if (err) {
                // do nothing
            } else {
                async.map(firms, (firm, callback) => {

                    // get date ${firm.archiveFile} days ago
                    let timeDeletion = moment();
                    timeDeletion = timeDeletion.subtract(firm.archiveFile, 'days');
                    timeDeletion = timeDeletion.format();

                    // global time
                    const dateISO = DateTime.fromISO(timeDeletion);

                    File.query()
                        .where({ _firm: firm._id })
                        .where('created_at', '<', dateISO)
                        .whereNot('status', 'archived')
                        .whereNot('status', 'deleted')
                        .update({ status: 'archived' })
                        .asCallback((err, files) => {
                            console.log(err, files.length);
                        });
                });
            }
        });

        // for: auto-expiring 
        Firm.query()
        .innerJoin('subscriptions as subscription', 'subscription._firm', 'firms._id')
        .whereIn('subscription.status', ['active', 'trialing'])
        .whereNot('firms.expireLinks', 'None')
        .select('firms._id', 'firms.expireLinks')
        .asCallback((err, firms) => {

            if (err) {
                // do nothing
            } else {
                async.map(firms, (firm, callback) => {

                    // get date ${firm.archiveFile} days ago
                    let timeDeletion = moment();
                    timeDeletion = timeDeletion.subtract(firm.expireLinks, 'days');
                    timeDeletion = timeDeletion.format();

                    // global time
                    const dateISO = DateTime.fromISO(timeDeletion);

                    ShareLink.query()
                        .where({ _firm: firm._id, expireDate: null, type: "share" })
                        .where('created_at', '<', dateISO)
                        .update({ expireDate: DateTime.local() })
                        .asCallback((err, links) => {
                            console.log(err, links.length);
                        });
                });
            }
        });

        // view download delete data that save 7 days ago
        let timetoRemove = moment();
        timetoRemove = timetoRemove.subtract(7, 'days');
        timetoRemove = timetoRemove.format();
        ViewDownload.query()
            .where('created_at', '<', timetoRemove).del();        
    });
}