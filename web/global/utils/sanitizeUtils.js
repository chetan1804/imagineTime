import _ from 'lodash';

const sanitizeUtils = {

    sanitizeDisplayColumns(selectedDisplayColumns, allDisplayColumns) {
        let allDisplayColumnsMap = {};
        allDisplayColumns.forEach((column, index) => {
            allDisplayColumnsMap[column.key] = index;
        });

        let sanitizedList = [];
        selectedDisplayColumns.forEach((column) => {
            if(typeof allDisplayColumnsMap[column.key] === 'number') {
                sanitizedList.push(allDisplayColumns[allDisplayColumnsMap[column.key]]);
            }
        });
        return sanitizedList;
    }
}

export default sanitizeUtils;