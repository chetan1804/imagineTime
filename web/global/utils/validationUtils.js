
const validationUtils = {
  /**
   * NOTE: This method is very strict. It will return false if the passed object
   * contains ANY falsy values. 
   */
  // Recursively loops through an object.
  // Returns true if EVERY key has a truthy value.
  // Return false if ANY key has a falsy value. Very strict. This includes: "" (empty string), 0 (but not '0'), false (but not 'false'), undefined, null, NaN etc...
  // Accepts an object with nested objects or an array of objects.
  checkObjectHasValues(object) {
    for (const key in object) {
      if (!object[key]) {
        return false;
      } else if (typeof object[key] === 'object') {
        // This key has an object, pass this nested object into this function.
        if (!validationUtils.checkObjectHasValues(object[key])) {
          return false;
        }
      }
    }
    // Every object key has a truthy value
    return true;
  }

  , stripEmailComment(email) {
    // This regex will match anything in a set of parentheses including the parentheses. More info here: https://www.regextester.com/?fam=115211
    const matchInParentheses = /\([^)]*\)/gi;
    // Return a new version of the email with the comment stripped out.
    return email.replace(matchInParentheses, '');
  }

  , checkFilenameIsValid(filename) {

    if (filename.includes('\\') ||
      filename.includes('/') ||
      filename.includes(':') ||
      filename.includes('*') ||
      filename.includes('?') ||
      filename.includes('"') ||
      filename.includes('<') ||
      filename.includes('>') ||
      filename.includes('|')) {
      return false;
    } else {
      return true;
    }
  },
      // '^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$'

  checkIfEmailIsValid(email) {
    const validEmail = new RegExp(
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,15}/g
    );

    return validEmail.test(email)
  },

  checkIfPasswordIsValid(password) {
    const validPassword = new RegExp(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+-=`~{},<.>/?;:'"])[A-Za-z\d][A-Za-z\d!@#$%^&*()_+-=`~{},<.>/?;:'"]{8,15}$/);

    return validPassword.test(password)
  }
}

export default validationUtils;
