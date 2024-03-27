import _ from 'lodash';
import { DateTime } from 'luxon';

const routeUtils = {

  objectFromQueryString(queryString) {
    // console.log("OBHET FRIN QYERT ATURB"); // "Object From Query String" typed really fast
    // convert search string into object notation
    // ex: ?page=1&per=20 to { page: '1', per: '20' }
    return queryString.replace("?","").split("&")
      .map(item => item.split("="))
      .map(item => [_.camelCase(item[0]), item[1]]) // convert kebab case to camel case, ie. "end-date" => "endDate"
      // .map(item => {
      //   // debugging
      //   console.log(item);
      //   return item;
      // })
      // if "" dont add it, otherwise add key:value to return object
      .reduce((returnObj, item) => {return item[0].length > 0 ? {...returnObj, [item[0]]:item[1]}: returnObj}, {})
  }

  , queryStringFromObject(queryObject) {
    // console.log("QUERY STRING FROM OBJECT")
    // convert object to query string, much easier than above
    // ex: { page: '1', per: '20' } to ?page=1&per=20
    return "?" + Object.entries(queryObject)
      // remove empties
      .filter(entry => entry[1] && entry[1].length > 0)
      .map(entry => [_.kebabCase(entry[0]), entry[1]]) // convert camel case to kebab case, ie. "endDate" => "end-date"
      // .map(item => {
      //   // debugging
      //   console.log(item);
      //   return item;
      // })
      // if value is array, convert to string, otherwise just add the string
      .map(entry => Array.isArray(entry[1]) ? [entry[0], entry[1].join(",")]: entry)
      // map to string
      .map(entry => entry.join("="))
      .join("&")
  }

  , listArgsFromObject(queryObject) {
    // console.log("LIST ARGS FROM OBJECT")
    // console.log(queryObject)
    return Object.entries(queryObject)
    // breaks for numbers, try converting to string before doing checks
    .filter(entry => entry[1] && entry[1].toString().length > 0)
    .map(entry => Array.isArray(entry[1]) ? [entry[0], '' + entry[1].join(',')]: entry)
    // .map(entry => [`${entry[0]}`, `${entry[1]}`])
    .reduce((acc, entry) => acc.concat(entry), [])
  }


}

export default routeUtils;