const OPERATOR_OR = 'OR';

const operators = {
    '=': '='
    , '<': '<'
    , '>': '>'
    , '<=': '<='
    , '>=': '>='
    , '!=': '!='
    , '<>': '<>'
    , 'between': 'between'
    , 'notbetween': 'not between'
    , 'in': 'in'
    , 'notin': 'not in'
    , 'null': 'is null'
    , 'notnull': 'is not null'
    , 'like': 'like'
    , 'ilike': 'ilike'
};

exports.getSearchObject = (requestBody) => {
  let searchObj = {
    ...requestBody
    , firmId: null
    //, criteria: []
    , group: {}
    , orderBy: 'id'
    , sortOrderAscending: true
    , pageSize: 50
    , pageNumber: 1
    , includeCount: true
    , distinct: false
    , columns: null
    , ignoreLimit: false
  };
  searchObj.firmId = (!!requestBody.firmId ? requestBody.firmId : searchObj.firmId);
  searchObj.group = (!!requestBody.group ? requestBody.group : searchObj.group);
  searchObj.orderBy = (!!requestBody.orderBy ? requestBody.orderBy : searchObj.orderBy);
  searchObj.sortOrderAscending = (requestBody.sortOrderAscending === false ? false : true);
  searchObj.pageSize = (!!requestBody.pageSize ? requestBody.pageSize : searchObj.pageSize);
  searchObj.pageNumber = (!!requestBody.pageNumber ? requestBody.pageNumber : searchObj.pageNumber);
  searchObj.distinct = (!!requestBody.distinct ? requestBody.distinct : searchObj.distinct);
  searchObj.columns = (!!requestBody.columns ? requestBody.columns : searchObj.columns);
  searchObj.ignoreLimit = (!!requestBody.ignoreLimit ? requestBody.ignoreLimit : searchObj.ignoreLimit);

  return searchObj;
}

exports.setLimits = (pageSize, pageNumber, knexObj) => {
  //logger.debug('pageSize: ', pageSize);
  //logger.debug('pageNumber: ', pageNumber);
  if(!pageSize || pageSize > 1000) {
    pageSize = 50;
  }
  if(!pageNumber) {
    pageNumber = 1;
  }

  knexObj.limit(pageSize).offset(((pageNumber - 1) * pageSize));
}

exports.setOrderBy = (orderBy, sortOrderAscending, knexObj, orderByFields) => {
  //logger.debug('orderByFields: ', orderByFields);

  // setting the default order by if none is provided.
  orderBy = orderBy || 'id';

  let sortOrder = 'asc';
  if(!!sortOrderAscending === false) {
    sortOrder = 'desc';
  }

  let orderByParts = orderBy.split(",");
  orderByParts.forEach(orderByFieldKey => {
    //logger.debug('orderByField: ', orderByField);
    let orderByField = orderByFields[orderByFieldKey.trim()];
    if(!!orderByField) {
      if(Array.isArray(orderByField)) {
        orderByField.forEach(orderBySingleField => {
          knexObj.orderBy(orderBySingleField, sortOrder, getShowNulls(sortOrder));
        });
      }
      else {
        knexObj.orderBy(orderByField, sortOrder, getShowNulls(sortOrder));
      }
    }
  });
}

exports.setGroupCriteria = (group, knexObj, criteriaFields) => {
  //logger.debug('criteriaFields: ', criteriaFields);
  if(!!group && ((!!group.criteria && group.criteria.length > 0) || (!!group.groups && group.groups.length > 0))) {
    knexObj.where((builder) => {
      setGroupCriteriaInternal(group, builder, criteriaFields);
    });
  }
}

/**
 * Given the list of exposed names of the columns and list of objects
 * representing all columns, it returns the list of objects of the columns whose
 * exposed names are found in the givenColumns list.
 * If no exposed name is found in the givenColumns list, allColumns list is
 * returned.
 * @param {Array<string>} givenColumns List of exposed column names (as strings)
 * @param {Array<object>} allColumns List of objects of all the supported column
 * names. Each object is the list has the exposed name as property and database
 * internal name as value.
 * @returns {Array<object>} List of objects of the columns whose exposed names
 * are in the givenColumns list or allColumns list.
 */
exports.getColumnsList = (givenColumns, allColumns) => {
  if(!givenColumns) {
    return allColumns;
  }

  let columnsObj = {};

  // make a map of exposed column names pointing to their index in the
  // allColumns array.

  allColumns.forEach((item, index) => {
    columnsObj[Object.keys(item)[0]] = index;
  });

  let returnList = [];

  givenColumns.forEach((item) => {
    // given column found in columnsObj
    let columnIndex = columnsObj[item];
    if(columnIndex !== 'undefined') {
      returnList.push(allColumns[columnIndex])
    }
  });

  if(!returnList || returnList.length < 1) {
    return allColumns;
  }
  return returnList;
}

function setGroupCriteriaInternal(group, knexWhereClauseBuilder, criteriaFields) {
  //logger.debug('criteriaFields: ', criteriaFields);
  if(!group) {
    return;
  }

  if(!!group.criteria && !!group.criteria.length && group.criteria.length > 0) {
    setCriteria(group.criteria, knexWhereClauseBuilder, group.operator, criteriaFields);
  }
  if(!!group.groups && !!group.groups.length && group.groups.length > 0) {
    group.groups.forEach(nestedGroup => {
      if(group.operator === OPERATOR_OR) {
        knexWhereClauseBuilder.orWhere(function() {
          setGroupCriteriaInternal(nestedGroup, this, criteriaFields);
        });
      }
      else {
        knexWhereClauseBuilder.where(function() {
          setGroupCriteriaInternal(nestedGroup, this, criteriaFields);
        });
      }
    });
  }
}

function setCriteria(criteria, knexWhereClauseBuilder, operator, criteriaFields) {
  //logger.debug('criteriaFields: ', criteriaFields);
  if(!!criteria) {
    criteria.forEach(criterion => {
      if(!operator) {
        console.log('Operator is required in criteria.');
        return;
      }
      //logger.debug('criterion: ', criterion);
      //logger.debug(criterion.fieldName, ': ', criteriaFields[criterion.fieldName], ', value: ', );
      let value = getCriterionValue(criteriaFields[criterion.fieldName], criterion.value);
      //logger.debug('value: ', value);
      switch(criterion.operator) {
        case '=':
        case '!=':
        case '<>':
        case '>':
        case '>=':
        case '<':
        case '<=':
          if(operator === OPERATOR_OR) {
            knexWhereClauseBuilder.orWhere(criteriaFields[criterion.fieldName].name, criterion.operator, value);
          }
          else {
            knexWhereClauseBuilder.where(criteriaFields[criterion.fieldName].name, criterion.operator, value);
          }
          break;
        case 'null':
          if(operator === OPERATOR_OR) {
            knexWhereClauseBuilder.orWhereNull(criteriaFields[criterion.fieldName].name);
          }
          else {
            knexWhereClauseBuilder.whereNull(criteriaFields[criterion.fieldName].name);
          }
          break;
        case 'notnull':
          if(operator === OPERATOR_OR) {
            knexWhereClauseBuilder.orWhereNotNull(criteriaFields[criterion.fieldName].name);
          }
          else {
            knexWhereClauseBuilder.whereNotNull(criteriaFields[criterion.fieldName].name);
          }
          break;
        case 'in':
          if(!!value && Array.isArray(value)) {
            if(operator === OPERATOR_OR) {
              knexWhereClauseBuilder.orWhereIn(criteriaFields[criterion.fieldName].name, value);
            }
            else {
              knexWhereClauseBuilder.whereIn(criteriaFields[criterion.fieldName].name, value);
            }
          }
          break;
        case 'notin':
          if(!!value && Array.isArray(value)) {
            if(operator === OPERATOR_OR) {
              knexWhereClauseBuilder.orWhereNotIn(criteriaFields[criterion.fieldName].name, value);
            }
            else {
              knexWhereClauseBuilder.whereNotIn(criteriaFields[criterion.fieldName].name, value);
            }
          }
          break;
        case 'between':
          if(!!value && Array.isArray(value) && value.length == 2) {
            if(operator === OPERATOR_OR) {
              knexWhereClauseBuilder.orWhereBetween(criteriaFields[criterion.fieldName].name, value);
            }
            else {
              knexWhereClauseBuilder.whereBetween(criteriaFields[criterion.fieldName].name, value);
            }
          }
          break;
        case 'notbetween':
          if(!!value && Array.isArray(value) && value.length == 2) {
            if(operator === OPERATOR_OR) {
              knexWhereClauseBuilder.orWhereNotBetween(criteriaFields[criterion.fieldName].name, value);
            }
            else {
              knexWhereClauseBuilder.whereNotBetween(criteriaFields[criterion.fieldName].name, value);
            }
          }
          break;
        case 'like':
          if(operator === OPERATOR_OR) {
            knexWhereClauseBuilder.orWhereLike(criteriaFields[criterion.fieldName].name, value);
          }
          else {
            knexWhereClauseBuilder.whereLike(criteriaFields[criterion.fieldName].name, value);
          }
          break;
        case 'ilike':
          if(operator === OPERATOR_OR) {
            knexWhereClauseBuilder.orWhereILike(criteriaFields[criterion.fieldName].name, value);
          }
          else {
            knexWhereClauseBuilder.whereILike(criteriaFields[criterion.fieldName].name, value);
          }
          break;
        default:
          return;
      }
    });
  }
}

function stringToDateTime(strValue) {
    if(!strValue) {
      return null;
    }
    if(Array.isArray(strValue)) {
  
    }
    return datetime(strValue,"Format","yyyy-MM-dd'T'HHmmss");
}
  
function getCriterionValue(fieldObj, value) {
    //logger.debug('value: ', value, ' criteriaField: ', fieldObj);
    if(fieldObj.dataType == 'Integer') {
      return value;
    }
    else if(fieldObj.dataType == 'DateTime') {
      if(!!value && Array.isArray(value)) {
        //logger.debug('Converted Date from Array: ', new Date(value[0]));
        return [new Date(value[0]), new Date(value[1])];
      }
      
      //logger.debug('Converted Date 1: ', new Date(value[0]).toString());
      return new Date(value);
    }
    
    // TODO Other types e.g. List etc.
    return value;
}
  
function getShowNulls(sortOrder) {
  return sortOrder === 'desc' ? 'last' : 'first';
}