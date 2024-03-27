/*
    This file handle if the file is selected or not
*/

const knex = require('../db').instance;
const constants = require('../constants');
const { epochToKnexRaw } = require("../utils");

async function retrieveSelections(client, data, callback) {
    try {
        const { from, device, limit = 20} =  data
        let dateFrom;
        if (from)
            dateFrom = new Date(from)
        let query = knex('filesynchronization')
            .select(
                'filesynchronization.*', 
                'files.uri',
                knex.raw('(extract(epoch from filesynchronization.updated_at) * 1000) as \"updatedAt\"'))
            .innerJoin('syncdevice', 'syncdevice.user', 'filesynchronization._user')
            .innerJoin('files', 'files._id', 'filesynchronization._file')
            .where('syncdevice.deviceId', '=', device)
            .orderBy('filesynchronization.updated_at')
            .limit(limit);
        if (from) 
            query = query.andWhere('filesynchronization.updated_at', '>', dateFrom);
        const res = await query;
        callback({ data: res, code: constants.CODE_RESPONSE_SUC})
    } catch( err ) {
        callback({ message: err.message, code: constants.CODE_RESPONSE_ERR})
    }
}

async function uploadSelections(client, data, callback) {
    const { files = []} =  data
    const userId = client.userId
    try {
        await knex.transaction( async trx => {
            const trans = [] // all transactions
            for (const file of files) {
                let tran
                const res = await knex("filesynchronization")
                    .select("files._id")
                    .innerJoin("files", "files._id", "filesynchronization._file")
                    .where("files.uri", "=", file.uri)
                if (res.length > 0) {
                    const rawEpoch = epochToKnexRaw(knex, file.updated_at)
                    tran = knex("filesynchronization")
                        .transacting(trx)
                        .update({ison:file.ison, updated_at: rawEpoch})
                        .where("updated_at", "<", rawEpoch)
                        .andWhere("_file", "=", res[0]._id)
                } else {
                    tran = knex("filesynchronization")
                        .transacting(trx)
                        .insert({ 
                            _file: knex("files").select("_id").where("uri", "=", file.uri).limit(1),
                            _user: userId,
                            //updated_at: file.updated_at,
                            ison: file.ison === 1 ? true: false
                        })
                }
                trans.push(tran)
            }
            await Promise.all(trans).then(trx.commit).catch(trx.rollback)
        })
        callback({ message: 'synced', code: constants.CODE_RESPONSE_SUC}) 
    } catch (err) {
        callback({ message: err.message, code: constants.CODE_RESPONSE_ERR}) 
    }
}

module.exports = {
    retrieveSelections: retrieveSelections,
    uploadSelections: uploadSelections,
}