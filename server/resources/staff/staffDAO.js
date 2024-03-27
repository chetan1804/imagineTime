const { cat } = require('shelljs');
const Staff = require('./StaffModel');

let logger = global.logger;

exports.getStaff = async (userId, firmId) => {
    return Staff.query().where({_user: userId, _firm: firmId}).returning('*').first();
}

exports.getStaffByFirm = (firmId, column = ['*']) => {
    return Staff.query()
        .where({
            _firm: firmId
        })
        .select(column)
}

exports.isStaff = async (userId, firmId) => {
    try {
        let staff = await exports.getStaff(userId, firmId)
        return {success: !!staff._id, staff};
    }
    catch(error) {
        logger.error(getFileIdentifier(), 'Error -', error);
        return false;
    }
}

exports.getStaffUserByUser = (firmId, userId) => {
    return Staff.query()
        .where({
            "_firm": firmId,
            "_user": userId
        })
        .first()
        .then(staff => {
            if(!staff) {
                return {}
            } else {
                return staff;
            }
        })
}

exports.updateStaffUser = (staffUserBody, staffId) => {
    return Staff.query()
        .findById(staffId)
        .update({...staffUserBody})
        .returning('*')
}

exports.createStaffUser = (staffUserBody) => {
    return Staff.query().insert(staffUserBody).returning('*')
  }

function getFileIdentifier() {
    return 'staffDAO -';
}
  