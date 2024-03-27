let converter = require('json-2-csv');

exports.toCSV = (data) => {
    return converter.json2csvAsync(data, {excelBOM: true, emptyFieldValue: ''});
}