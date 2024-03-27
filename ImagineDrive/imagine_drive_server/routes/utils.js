var express = require('express');
var router = express.Router();
const db = require('../file_sync/db').instance;
const { onFileUpdated } = require('../file_sync/syncing/fileDirectory');

if (process.env.NODE_ENV !== 'production' || process.env.STAGING === 'true') {
    /* 
        For Debugging purposes only since this is unsafe.
        able to query data via post request
    */
    router.post('/utils/db', async function (req, res, next) {
        try {
            const result = await db.raw(req.body.sql);
            if (result && result.rows)
                res.json(result.rows);
            else
                res.send(result)
        } catch (error) {
            res.json({ error: 'Query failed', message: error.message });
        }
    });
}

/*
    Api access that notify the file share sync when a file was 
    updated( added/deleted/modified)
*/
router.post('/v1/file/:fileid/notify', async (req, res, next) => {
    console.log("Notify System: ", req.params.fileid);
    const id = req.params.fileid;
    const result = await onFileUpdated(id);
    res.json(result);
});


module.exports = router;
