
exports.buildArrayContainsQuery = (key, values) => {
  // TODO: do we need to do input safety checks here?
  // console.log("buildArrayContainsQuery");

  // build the postgres 'contains' query to compare arrays
  // ex: to fetch files by the list of tags

  //WORKS:
  //select * from files where _tags @> '{2}';
  //query.whereRaw('_tags @> ?', '{2}')

  let returnQueryParams = [];
  returnQueryParams.push(`${key} @> ?`);
  returnQueryParams.push(exports.buildArrayString(values));
  // console.log(returnQueryParams);
  return returnQueryParams;
}

// exports.buildTextSearchVectorQuery = ()

exports.buildArrayString = jsArray => {
  // postgres has some different array syntax
  // [1,2] => '{1,2}'
  let arrayString = '{';
  for(let i = 0; i < jsArray.length; i++) {
    arrayString += jsArray[i];
    if(i + 1 < jsArray.length) {
      arrayString += ','
    }
  }
  arrayString += '}';
  return arrayString;
}