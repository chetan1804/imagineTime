const localStorageUtils = {
  getJSONValue(key, defaultValue) {
    let localStorageValue = localStorage.getItem(key);
    let localStorageValueParsed = null;
    if(!!localStorageValue) {
      try {
        localStorageValueParsed = JSON.parse(localStorageValue);
      }
      catch(err) {
        console.error('error while reading display columns from local storage:', err);
      }
    }
    return localStorageValueParsed || defaultValue;
  }

  , setJSONValue(key, valueObj) {
    localStorage.setItem(key, JSON.stringify(valueObj));
  }
}

export default localStorageUtils;
