// model
const Firm = require('../firm/FirmModel');
const Client = require('../client/ClientModel');
const File = require('../file/FileModel');
const FileSynchronization = require('./FileSynchronizationModel');

// ctrls
const filesController = require('../file/filesController');
const shareLinksController = require('../shareLink/shareLinksController');
const quickTasksController = require('../quickTask/quickTasksController');
const fileActivityController = require('../fileActivity/fileActivityController');

// device os
const os = require( 'os' );
const permissions = require('../../global/utils/permissions')
const async = require('async');
const emailUtil = require('../../global/utils/email');
const networkInterfaces = os.networkInterfaces();
const assureSign = require('../../global/utils/assureSign');
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const Staff = require('../staff/StaffModel');
const User = require('../user/UserModel');
const StaffClient = require('../staffClient/StaffClientModel');


exports.fileSynchronize = (req, res) => {
    const userId = req.user ? req.user._id : null;
    const isOn = req.body.isOn;
    const fileIds = req.body.fileIds;

    if (req && req.body && !req.body.hasOwnProperty('isOn')) {
        res.send({ success: false, message: "Synchronize process cannot identify." });
    } else if (isOn && userId) {
        // file synchronize On

        // delete: remove from sync
        filesController.getAllConnectedFileId(fileIds, [], response => {
            const newFileIds = response;
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId })
                .update({ ison: true }).returning("*").asCallback((err, delSyncs) => {
                if (err && !delSyncs) {
                    console.log("err", err);
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    res.send({ success: true, isOn: true, fileIds: newFileIds, message: 'fileIds returned is ON' });
                }
            });
        });
    } else if (userId) {
        // file synchronize Off

        // insert: add file to sinc
        filesController.getAllConnectedFileId(fileIds, [], response => {
            FileSynchronization.query().whereIn('_file', response).andWhere({ _user: userId }).update({ ison: false }).returning("*").asCallback((err, syncs) => {
                if (err && !syncs) {
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    const syncFileIds = syncs.map(sync => sync._file);
                    const sendSyncs = response.flatMap(item => !syncFileIds.includes(item) ? { _file: item, _user: userId, ison: false } : []);
                    FileSynchronization.query().insert(sendSyncs).returning("*").asCallback((err, newSyncs) => {
                        if(err || !newSyncs) {
                            res.send({ success: false, message: "File synchronize failed." });
                        } else {
                            res.send({ success: true, isOn: false, fileIds: response, message: 'fileIds returned is OFF' });
                        }
                    });
                }
            });
        });
    } else {
        res.send({ success: false, message: "User not found." });
    }
}

exports.clientSynchronize = (req, res) => {
    const userId = req.user ? req.user._id : null;
    const isOn = req.body.isOn;
    const clientId = req.body.clientId;

    if (req && req.body && !req.body.hasOwnProperty('isOn')) {
        res.send({ success: false, message: "Synchronize process cannot identify." });
    } else if (isOn && userId && clientId) {
        // file synchronize On

        // delete: remove from sync
        File.query().where({ _client: clientId })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId })
            .update({ ison: true }).returning("*").asCallback((err, delSyncs) => {
                if (err && !delSyncs) {
                    console.log("err", err);
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    res.send({ success: true, isOn: true, clientId });
                }
            });
        });
    } else if (userId && clientId) {
        // file synchronize Off

        // delete
        // insert: add file to sinc
        File.query().where({ _client: clientId })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId }).update({ ison: false }).returning("*").asCallback((err, syncs) => {
                if (err && !syncs) {
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    const syncFileIds = syncs.map(sync => sync._file);
                    const sendSyncs = newFileIds.flatMap(item => !syncFileIds.includes(item) ? { _file: item, _user: userId, ison: false } : []);
                    FileSynchronization.query().insert(sendSyncs).returning("*").asCallback((err, newSyncs) => {
                        if(err || !newSyncs) {
                            res.send({ success: false, message: "File synchronize failed." });
                        } else {
                            res.send({ success: true, isOn: false, clientId });
                        }
                    });
                }
            });
        });
    } else if (!userId && clientId) {
        res.send({ success: false, message: "user not found." });
    } else if (userId && !clientId) {
        res.send({ success: false, message: "client not found." });
    } else {
        res.send({ success: false, message: "file synchronize failed." });
    }
}

exports.firmSynchronize = (req, res) => {
    const userId = req.user ? req.user._id : null;
    const isOn = req.body.isOn;
    const firmId = req.body.firmId;

    if (req && req.body && !req.body.hasOwnProperty('isOn')) {
        res.send({ success: false, message: "Synchronize process cannot identify." });
    } else if (isOn && userId && firmId) {
        // file synchronize On

        // delete: remove from sync
        File.query().where({ _firm: firmId })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId })
            .update({ ison: true }).returning("*").asCallback((err, delSyncs) => {
                if (err && !delSyncs) {
                    console.log("err", err);
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    res.send({ success: true, isOn: true, firmId });
                }
            });
        });
    } else if (userId && firmId) {
        // file synchronize Off

        // delete
        // insert: add file to sinc
        File.query().where({ _firm: firmId })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId }).update({ ison: false }).returning("*").asCallback((err, syncs) => {
                if (err && !syncs) {
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    const syncFileIds = syncs.map(sync => sync._file);
                    const sendSyncs = newFileIds.flatMap(item => !syncFileIds.includes(item) ? { _file: item, _user: userId, ison: false } : []);
                    FileSynchronization.query().insert(sendSyncs).returning("*").asCallback((err, newSyncs) => {
                        if(err || !newSyncs) {
                            res.send({ success: false, message: "File synchronize failed." });
                        } else {
                            res.send({ success: true, isOn: false, firmId });
                        }
                    });
                }
            });
        });
    } else if (!userId && firmId) {
        res.send({ success: false, message: "user not found." });
    } else if (userId && !firmId) {
        res.send({ success: false, message: "firm not found." });
    } else {
        res.send({ success: false, message: "file synchronize failed." });
    }
}

exports.publicSynchronize = (req, res) => {
    const userId = req.user ? req.user._id : null;
    const isOn = req.body.isOn;
    const firmId = req.body.firmId;

    if (req && req.body && !req.body.hasOwnProperty('isOn')) {
        res.send({ success: false, message: "Synchronize process cannot identify." });
    } else if (isOn && userId && firmId) {
        // file synchronize On

        // delete: remove from sync
        File.query().where({ _firm: firmId, _client: null })
        .where(builder => {
            builder.where({ _personal: null }).orWhere({ _personal: "" }) // _personal datatype is string so we can assume that _personal is not null but empty
        })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId }).update({ ison: true }).returning("*").asCallback((err, delSyncs) => {
                if (err && !delSyncs) {
                    console.log("err", err);
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    res.send({ success: true, isOn: true, firmId });
                }
            });
        });
    } else if (userId && firmId) {
        // file synchronize Off

        // delete
        // insert: add file to sinc
        File.query().where({ _firm: firmId, _client: null })
        .where(builder => {
            builder.where({ _personal: null }).orWhere({ _personal: "" }) // _personal datatype is string so we can assume that _personal is not null but empty
        })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId }).update({ ison: false }).returning("*").asCallback((err, syncs) => {
                if (err && !syncs) {
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    const syncFileIds = syncs.map(sync => sync._file);
                    const sendSyncs = newFileIds.flatMap(item => !syncFileIds.includes(item) ? { _file: item, _user: userId, ison: false } : []);
                    FileSynchronization.query().insert(sendSyncs).returning("*").asCallback((err, newSyncs) => {
                        if(err || !newSyncs) {
                            res.send({ success: false, message: "File synchronize failed." });
                        } else {
                            res.send({ success: true, isOn: false, firmId });
                        }
                    });
                }
            });
        });
    } else if (!userId && firmId) {
        res.send({ success: false, message: "user not found." });
    } else if (userId && !firmId) {
        res.send({ success: false, message: "firm not found." });
    } else {
        res.send({ success: false, message: "file synchronize failed." });
    }
}

exports.personalSynchronize = (req, res) => {
    const userId = req.user ? req.user._id : null;
    const isOn = req.body.isOn;
    const firmId = req.body.firmId;
    const personalId = req.body.personalId;

    if (req && req.body && !req.body.hasOwnProperty('isOn')) {
        res.send({ success: false, message: "Synchronize process cannot identify." });
    } else if (isOn && userId && firmId) {
        // file synchronize On

        // delete: remove from sync
        File.query().where({ _firm: firmId, _personal: personalId })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId })
            .update({ ison: true }).returning("*").asCallback((err, delSyncs) => {
                if (err && !delSyncs) {
                    console.log("err", err);
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    res.send({ success: true, isOn: true, firmId, personalId });
                }
            });
        });
    } else if (userId && firmId && personalId) {
        // file synchronize Off

        // delete
        // insert: add file to sinc
        File.query().where({ _firm: firmId, _personal: personalId })
        .andWhere(builder => {
            builder.whereNot('status', 'archived');
            builder.whereNot('status', 'deleted');
        }).then(files => {
            const newFileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', newFileIds).andWhere({ _user: userId }).update({ ison: false }).returning("*").asCallback((err, syncs) => {
                if (err && !syncs) {
                    res.send({ success: false, message: "File synchronize failed." });
                } else {
                    const syncFileIds = syncs.map(sync => sync._file);
                    const sendSyncs = newFileIds.flatMap(item => !syncFileIds.includes(item) ? { _file: item, _user: userId, ison: false } : []);
                    FileSynchronization.query().insert(sendSyncs).returning("*").asCallback((err, newSyncs) => {
                        if(err || !newSyncs) {
                            res.send({ success: false, message: "File synchronize failed." });
                        } else {
                            res.send({ success: true, isOn: false, firmId, personalId });
                        }
                    });
                }
            });
        });
    } else if (!userId && firmId) {
        res.send({ success: false, message: "user not found." });
    } else if (userId && !firmId) {
        res.send({ success: false, message: "firm not found." });
    } else {
        res.send({ success: false, message: "file synchronize failed." });
    }
}

exports.getFirmSynchronize = (req, res) => {
    console.log("synchronization check", req.params.firmId);
    const userId = req.user ? req.user._id : null;
    const firmId = req.params.firmId;
    let data = {
        success: true
        , isOn: false
        , personals: []
        , clients: []
        , public: false
    }

    const processPersonals = (staffs, callback) => {
        if (staffs && staffs.length) {
            async.map(staffs, (staff, cb) => {
                exports.checkPersonals(firmId, staff._user, userId, result => {
                    if (result.success && !result.isOn) {
                        data.personals.push(staff._user);
                    } else {
                        data.isOn = true;
                    }
                    cb(null);
                });
            }, err => {
                if (!err) {
                    callback();
                } else {
                    callback();
                }
            });
        } else {
            callback();
        }
    }

    const processClients = (clients, callback) => {
        if (clients && clients.length) {
            async.map(clients, (client, cb) => {
                exports.checkClients(client._id, userId, result => {
                    if (result.success && !result.isOn) {
                        data.clients.push(client._id);
                    } else {
                        data.isOn = true;
                    }
                    cb(null);
                });
            }, err => {
                if (!err) {
                    callback();
                } else {
                    callback();
                }
            });
        } else {
            callback();
        }
    }


    if (firmId && userId) {
        // check public
        permissions.utilCheckisStaffOwner(req.user, firmId, ownerpermissions => {
            console.log("ownerpermissions = ", ownerpermissions);
            if (ownerpermissions) {

                // get staff by firmId
                Staff.query().where({ _firm: firmId, status: "active" }).then(staffs => {
                    processPersonals(staffs, personalCallback => {

                        Client.query().from('clients as a')
                        .innerJoin('files as b', 'a._id', 'b._client')
                        .where({ 'a._firm': firmId, 'a.status': 'visible' })
                        .andWhere(builder => {
                            builder.whereNot('b.status', 'archived');
                            builder.whereNot('b.status', 'deleted');
                        })
                        .groupBy('a._id')
                        .then(clients => {
                            processClients(clients, clientCallback => {
                                exports.checkPublic(firmId, userId, response => {
                                    data.public = response.isOn;
                                    if (response.success && response.isOn) {
                                        data.publicFiles = response.fileIds;                                        
                                    }
                                    res.send(data);
                                });
                            });
                        });
                    });
                });
            } else {

                exports.checkPersonals(firmId, userId, userId, result => {
                    if (result.success && !result.isOn) {
                        data.personals.push(userId);
                    } else {
                        data.isOn = true;
                    }

                    console.log("result", result)

                    Client.query().from('clients as a')
                    .innerJoin('staffclients as b', 'a._id', 'b._client')
                    .where({ 'a._firm': firmId, 'a.status': 'visible', 'b._firm': firmId, 'b._user': userId })
                    .groupBy('a._id')
                    .then(clients => {
                        processClients(clients, clientCallback => {
                            exports.checkPublic(firmId, userId, response => {
                                data.public = response.isOn;
                                if (response.success && response.isOn) {
                                    data.publicFiles = response.fileIds;                                        
                                }
                                res.send(data);
                            });
                        });
                    });
                });
            }
        });
    } else {
        res.send({ success: false, message: "firm not found." });
    }
}

exports.getClientSynchronize = (req, res) => {
    console.log("synchronization check client", req.params.clientId);
    const userId = req.user ? req.user._id : null;
    const clientId = req.params.clientId;

    if (clientId && userId) {
        exports.checkClients(clientId, userId, response => {
            if (response.success) {
                res.send({ success: true, isOn: response.isOn, clientId, fileIds: response.fileIds });
            } else {
                res.send({ success: false, message: response.message });
            }
        });
    } else {
        res.send({ success: false, message: "Client not found." });
    }
}

exports.getPersonalSynchronize = (req, res) => {
    console.log("synchronization check personal", req.params.personalId);
    const userId = req.user ? req.user._id : null;
    const personalId = req.params.personalId;
    const firmId = req.params.firmId;

    if (firmId && personalId && userId) {
        exports.checkPersonals(firmId, personalId, userId, response => {
            if (response.success) {
                res.send({ success: true, isOn: response.isOn, personalId, fileIds: response.fileIds });
            } else {
                res.send({ success: false, message: response.message });
            }
        });
    } else {
        res.send({ success: false, message: "Personal not found." });
    }
}

exports.getPublicSynchronize = (req, res) => {
    console.log("synchronization check public");
    const userId = req.user ? req.user._id : null;
    const firmId = req.params.firmId;

    if (firmId && userId) {
        exports.checkPublic(firmId, userId, response => {
            if (response.success) {
                res.send({ success: true, isOn: response.isOn, firmId, fileIds: response.fileIds });
            } else {
                res.send({ success: false, message: response.message });
            }
        });
    } else {
        res.send({ success: false, message: "Firm not found." });
    }
}

exports.checkPublic = (firmId, userId, callback) => {
    File.query().where({ _firm: firmId, _client: null })
    .where(builder => {
        builder.where({ _personal: null }).orWhere({ _personal: "" }) // _personal datatype is string so we can assume that _personal is not null but empty
    })
    .andWhere(builder => {
        builder.whereNot('status', 'archived');
        builder.whereNot('status', 'deleted');
    }).then(files => {
        if (files && files.length) {
            const fileIds = files.map(file => file._id);
            FileSynchronization.query().whereIn('_file', fileIds).andWhere({ _user: userId, ison: false }).then(syncs => {
                const syncFileIds = syncs.map(sync => sync._file);
                const newFileIds = fileIds.filter(fileId => !syncFileIds.includes(fileId));

                if (newFileIds && !newFileIds.length) {
                    callback({ success: true, isOn: false });
                } else {
                    callback({ success: true, isOn: true, fileIds: syncFileIds });
                }
            });
        } else {
            callback({ success: true, isOn: true });
        }
    });
}

exports.checkClients = (clientId, userId, callback) => {
    Client.query().findById(clientId).then(client => {
        if (client) {
            File.query().where({ _client: client._id })
            .andWhere(builder => {
                builder.whereNot('status', 'archived');
                builder.whereNot('status', 'deleted')
            }).then(files => {
                if (files && files.length) {
                    const fileIds = files.map(file => file._id);
                    FileSynchronization.query().whereIn('_file', fileIds).andWhere({ _user: userId, ison: false }).then(syncs => {
                        const syncFileIds = syncs.map(sync => sync._file);
                        const newFileIds = fileIds.filter(fileId => !syncFileIds.includes(fileId));
    
                        if (newFileIds && !newFileIds.length) {
                            callback({ success: true, isOn: false });
                        } else {
                            callback({ success: true, isOn: true, fileIds: syncFileIds });
                        }
                    });
                } else {
                    callback({ success: true, isOn: true });
                }
            });
        } else {
            callback({ success: false, message: "Client not found."  });
        }
    });
}

exports.checkPersonals = (firmId, personalId, userId, callback) => {
    User.query().findById(personalId).then(user => {
        if (user) {
            File.query().where({  _personal: user._id, _firm: firmId })
            .andWhere(builder => {
                builder.whereNot('status', 'archived');
                builder.whereNot('status', 'deleted')
            }).then(files => {
                if (files && files.length) {
                    const fileIds = files.map(file => file._id);
                    console.log("fileIds1", fileIds.length)
                    FileSynchronization.query().whereIn('_file', fileIds).andWhere({ _user: userId, ison: false }).then(syncs => {
                        const syncFileIds = syncs.map(sync => sync._file);
                        const newFileIds = fileIds.filter(fileId => !syncFileIds.includes(fileId));

                        if (newFileIds && !newFileIds.length) {
                            callback({ success: true, isOn: false });
                        } else {
                            callback({ success: true, isOn: true, fileIds: syncFileIds });
                        }
                    });
                } else {
                    callback({ success: true, isOn: true });
                }
            });
        } else {
            callback({ success: false, message: "Personal not found."  });
        }
    });
}

