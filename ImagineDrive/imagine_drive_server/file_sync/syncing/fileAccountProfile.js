const knex = require('../db');
const auth = require('../account/authenticator');
const log = require('../log');
const fileutils = require('../utils')
let isAuthInitialized = false;
let socketIO;

const GENERAL = 'general'
const CLIENT = 'client'
const STAFF = 'staff'
/*
    Copyright © 2021. ImagineTime Inc. All Rights Reserved
    Created: 8/3/2021
    Created by: jhoemar.pagao@gmail.com
    
    fileAccountProfile.js
    This file handles retrieval of clients, firms, data initialization for specific defice
*/

async function retrieveClients(deviceId, from = null, limit = 0, offset = 0) {
    let query = knex.instance('clients')
        .whereIn('_firm',
            knex.instance.select('_firm')
                .from('staff')
                .join('syncdevice', 'user', '=', 'staff._user')
                .where('deviceId', '=', deviceId))
        .select('clients._id as id', 
            'clients.name as name', 
            'clients._firm as firm',
            knex.instance.raw('(extract(epoch from clients.updated_at) * 1000) as \"updateAt\"'),
        )
        .where("clients.status", "visible")
        .orderBy('updated_at');
    if (limit > 0)
        query = query.limit(limit);
    if (offset > 0) 
        query - query.offset(offset)
    if (from) 
       query = query.andWhere('clients.updated_at', '>', from);
    return await query;
}

async function retrieveAllFirms(deviceId, from = null) {
    let query = knex.instance('staff')
        .join('syncdevice', 'user', 'staff._user')
        .join('firms', 'firms._id', 'staff._firm')
        .where('deviceId', '=', deviceId)
        .select(
            'firms._id as id', 
            'firms.name as name',
            knex.instance.raw('(extract(epoch from firms.updated_at) * 1000) as \"updateAt\"'),)
        .orderBy('firms.name');
    if (from) 
        query = query.andWhere('firms.updated_at', '>', from);
    return await query;
}

async function retrieveStaff(deviceId, from = null) {
    let query = knex.instance('staff')
        .join('users', 'staff._user', 'users._id')
        .join('firms', 'firms._id', 'staff._firm')
        .join('syncdevice', 'user', 'staff._user')
        .where('deviceId', '=', deviceId)
        .andWhere('staff.owner', true)
        .andWhere('staff.status', 'active')
        .select(
            'staff._id as id', 
            'users._id as userid',
            'users.firstname',
            'users.lastname',
            'firms._id as firm',
            knex.instance.raw('(extract(epoch from firms.updated_at) * 1000) as \"updateAt\"'),)
        .orderBy('staff.updated_at');
    if (from) 
        query = query.andWhere('staff.updated_at', '>', from);
    return await query;
}


// retrieve all clients 
async function retrieveClientsByUserId(userId) {
    const results = await knex.instance('clientusers')
        .join('clients', 'clientusers._client', '=', 'clients._id')
        .where('clientusers._user', '=', userId)
        .select('clients._id as id', 'clients.name as name');
    return results;
}


// use to initialize data for device
// @param clientSocket: user socket who will connect
// @device: device of user that will be connected
// @selectedFirms: list of firms that will be selected. * if all is selected
async function setDeviceConnection(clientSocket, deviceId, toggle = true) {
    log.writet('fileAccountProfile', 'Device ' + deviceId + ' started listening to clients? ');
    // join user to client folders. so he can recieve specific updates
    try {
        const staffs = await retrieveStaff(deviceId)
        for (const staff of staffs) {
            if (toggle)
                clientSocket.join(STAFF + staff.id);
            else
                clientSocket.leave(STAFF + staff.id);
        }
        const firms = await retrieveAllFirms(deviceId)
        for (const firm of firms) {
            if (toggle)
                clientSocket.join(GENERAL + firm.id);
            else
                clientSocket.leave(GENERAL + firm.id);
        }
        const limit = 60
        let i = 0
        do {
            const clients = await retrieveClients(deviceId, null, limit, limit * i)
            for (const clientData of clients) {
                if (toggle)
                    clientSocket.join(CLIENT + clientData.id);
                else
                    clientSocket.leave(CLIENT + clientData.id);
            }
            i ++
            if (clients.length < limit) 
                break;
        } while (true);
    } catch (err) {
        log.writet("fileAccountProfile::setDeviceConnection", "error", err.message);
    }
}

// initialize this module
function initialize(socket, client) {
    socketIO = socket;
    if (!isAuthInitialized) {
        isAuthInitialized = true;
        auth.on('login', (data) => {
            setDeviceConnection(data.client, data.device);
        });
        auth.on('logout', (data) => {
            setDeviceConnection(data.client, data.device, false);
        });
        auth.on('reauthorize', (data) => {
            setDeviceConnection(data.client, data.device);
        });
    }
}

// use to notify users for any updated files
// @parentType: which parent/sub dir is the file(staff,client,general)
function notifyWithFiles(clientId, staffId, firmId , event, data, socketClient) {
    const parentType = fileutils.getParentType(clientId, staffId); 
    let id = firmId
    switch (parentType) {
        case CLIENT:
            id = clientId
            break;
        case STAFF:
            id = staffId;
            break
    }
    if (id >= 0)
        notifyUsers(parentType + id, event, data, socketClient)
    else 
        log.writet("fileAccountProfile::notifyWithFiles", "error", "id is invalid with file parent", parentType)
}

function notifyUsers(room ="" , event, data, socketClient) {
    if (socketClient) {
        socketClient.broadcast.to(room).emit(event, data);
        return
    }
    if (socketIO)
        socketIO.to(room).emit(event, data);
    else 
        log.writet("FileAccountProfile::notifyUsers", "socketio is not initialize" )
}

module.exports = {
    retrieveClients: retrieveClients,
    retrieveAllFirms: retrieveAllFirms,
    retrieveStaff: retrieveStaff,
    applyFirmSelection: setDeviceConnection,
    initialize: initialize,
    notifyUsers: notifyUsers,
    notifyWithFiles: notifyWithFiles
};