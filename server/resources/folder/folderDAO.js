const File = require('../file/FileModel');
const { raw } = require('objection');

exports.getFolderById = (id) => {

  return File.query()
    .from('files as f')
    .findById(id)
    .leftJoin('folderpermission as fp', 'fp._folder', 'f._id')
    .select('f.*', raw('row_to_json(fp) as permission'))
    
}

exports.getFoldersByFirm = (firmId, columns = ['*']) => {

  return File.query()
    .where({
      _firm: firmId,
      category: 'folder'
    })
    .whereNot({
      status: 'deleted'
    })
    .select([...columns])
}

exports.getFoldersByFirmIds = (firmIds, columns = ['*']) => {

  return File.query()
    .whereIn('_firm', [...firmIds])
    .where({
      category: 'folder'
    })
    .whereNot({
      status: 'deleted'
    })
    .select([...columns])
    .orderBy('_firm', 'asc')
}