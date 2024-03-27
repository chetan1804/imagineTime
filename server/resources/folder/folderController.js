const Folder = require('./FolderModel');

const folderDao = require('./folderDAO');

exports.list = (req, res) => {
    Folder.query()
        .then(json => {
            res.send({success: true, json});
        });
}


exports.listByValues = (req, res) => {
    res.send({success: false, message: "Not implemented for Postgres yet"});
    return;
}
  
exports.listByRefs = (req, res) => {
    logger.error("error listByRefs")
    /**
     * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
     * TODO: server side pagination
     */
  
     // build query
    let query = {
        [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
    }
    logger.error("error listByRefs", query)
    // test for optional additional parameters
    const nextParams = req.params['0'];
    if (nextParams.split("/").length % 2 == 0) {
        // can't have length be uneven, throw error
        // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
        res.send({success: false, message: "Invalid parameter length"});
    } else {
        if (nextParams.length !== 0) {
            for(let i = 1; i < nextParams.split("/").length; i+= 2) {
                query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
            }
        }
        Folder.query()
            .where(query)
            // Changing the default sort order to avoid sorting this list on the front end every time it's fetched.
            .orderBy('_id', 'desc')
            .then(json => {
                res.send({ success: true, data: json })
        })
    }
}
  
exports.search = (req, res) => {
    res.send({success: false, message: "Not implemented for Postgres yet"});
    return;
}
  
// exports.getById = (req, res) => {
//     logger.info('get folder by id');
//     Folder.query().findById(req.params.id)
//         .then(json => {
//             if(json) {
//                 res.send({success: true, json})
//             } else {
//                 res.send({success: false, message: "Folder not found"})
//             }
//     });
// }
  
exports.getSchema = (req, res) => {
    // TODO: need to figure out how/if this can work with the existing yote stuff
    /**
     * This is admin protected and useful for displaying REST api documentation
     */
    logger.info('get folder schema ');
    res.send({success: true, schema: Activity.jsonSchema});
}
  
exports.getDefault = (req, res) => {
    /**
     * This is an open api call by default (see what I did there?) and is used to
     * return the default object back to the Create components on the client-side.
     *
     * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
     * will otherwise return null. 
     */
    logger.info('get folder default object');
    res.send({success: true, defaultObj: Folder.defaultObject});
    // res.send({success: false})
}

exports.create = (req, res) => {
    logger.info('creating new folder');
    console.log(req.body)

    Folder.query().insert(req.body)
    .returning('*')
    .then(folder => {
        if(folder) {
            res.send({success: true, folder});
        } else {
            res.send({ success: false, message: "Could not save folder"})
        }
    });
}

exports.getById = (req, res) => {

    const id = req.params.id;

    folderDao.getFolderById(id)
    .then(folder => {
        if(!!folder) {
            res.send({success: true, folder})
        } else {
            res.send({success: false, message: "Unable to fetch folder"})
        }
    })
    .catch(err => {
        res.send({success: false, message: 'Internal server error'});
    })
}