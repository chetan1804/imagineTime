const mime = require('mime-types');

module.exports = {
    getFileCategory: (filename) => {
        const contentType = mime.lookup(filename);
        if (contentType) {
            if (contentType.includes('pdf') || contentType.includes('text')) {
                return 'document'
            } else if (contentType.includes('image')) {
                return 'image'
            } else if (contentType.includes('video')) {
                return 'video'
            } else
                return contentType;
        }
        return 'unknown';
    },
    // get file content type
    getContentType: (filename) => {
        const type = mime.lookup(filename);
        if (type) return type;
        else return 'unknown';
    },
    // identify files's parent type or which folder it is under (client/staff/general)
    getParentType: (clientId, staffId) => {
        if (staffId !== null && staffId >= 0) return 'staff'
        if (clientId !== null && clientId >= 0) return 'client'
        return 'general'
    },
    // use to convert epoch to timestamp for postgres
    epochToKnexRaw: (knex, epoch) => {
        return knex.raw('to_timestamp(' + (epoch / 1000) + ')');
    }
}