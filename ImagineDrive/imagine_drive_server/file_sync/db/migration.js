const log = require('../log');


// retrieve file data given the id. null if not found.
async function retrieveAllFiles(knex, limit=100, offset=0) {
    const result = await knex('files')
        .whereNotNull("_firm")
        .whereNull('uri')
        .limit(limit)
        .offset(offset)
        .orderBy('_id', 'desc')
        .select('_id as id', '_user as uploadBy',
            '_client as client', 'uri',
            'files._firm as firm',
            'files._personal as personal',
            'files.fileExtension',
            'files._folder as folder',
            'files.category',
            'available', 'totalSize', 'files.status',
            knex.raw('(extract(epoch from updated_at) * 1000) as \"updateAt\"'),
            knex.raw('(extract(epoch from \"lastModified\") * 1000) as \"lastModified\"'));
    return result
}

module.exports = async (knex) => {
    try {
        // migration
        // update files table for synchronization info
        // use case: if you want to fix all invalid uri remove the column uri and restart server
        if (!await knex.schema.hasColumn('files', 'uri')) {
            await knex.schema.table('files', table => {
                table.string('uri');
                table.integer('available');
                table.integer('totalSize');
                table.timestamp('lastModified', { useTz: true });
            });
        }

        const { normalizeMetaFile } = require('../cloudStorage');
        // STEP: populate values on additional columns
        log.writet('migration::files', 'normalizing column values');
        let count = 0;
        let results;
        const processCount = 300;
        do {
            results = await retrieveAllFiles(knex, processCount, count);
            count = count + results.length;
            for (const item of results) {
                await normalizeMetaFile(item)
            }
            console.log(`${count} files processed`);
        } while (results && results.length >=processCount);
        log.writet('migration::files', results.length , 'Finished migrating files');
    } catch (error) {
        log.writet('migration::files','Failure', error);
    }
    
}