const crypto = require('crypto');

// use to check if password is valid given the hash and salt
// return true if valid
function checkPasswordHash(password, passwordSalt, passwordHash) {
    const hmac = crypto.createHmac('sha1', passwordSalt);
    const validHash = hmac.update(password).digest('hex');
    return validHash === passwordHash;
}

module.exports = {
    checkPasswordHash: checkPasswordHash,
}