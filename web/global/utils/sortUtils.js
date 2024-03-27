var _type = "";
const sortUtils = {
    _object(arr, type) {
        _type = type;
        return arr ? arr.sort(_ObjCompare) : null;
    }
}

function _ObjCompare(a, b) {
    const objA = a[_type].toUpperCase();
    const objB = b[_type].toUpperCase();
  
    let comparison = 0;
    if (objA > objB) {
      comparison = 1;
    } else if (objA < objB) {
      comparison = -1;
    }
    return comparison;
}

export default sortUtils;