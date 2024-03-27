import 'package:imagine_drive/file_sync/fileRecords.dart';

class DatabaseUtil {
  static Future<List<Map<String, Object>>> queryWhereIn(
    String table, {
    String whereInColumn,
    List<Object> inValues,
    String andWhere = "",
    String orderBy,
    List columns,
    int limit = -1,
    int offset = -1,
  }) async {
    String inString = '';
    String select = '*';
    String orderByQuery = '';
    String limitQuery = '';
    String offsetQ = '';
    var args = List.empty(growable: true);

    // select string
    if (columns != null) {
      select = '';
      for (var i = 0; i < columns.length; i++) {
        select += columns[i];
        if (i < columns.length - 1) select += ',';
      }
    }

    args.addAll(inValues);

    // where in
    for (var i = 0; i < inValues.length; i++) {
      inString += '?';
      if (i < inValues.length - 1) inString += ',';
    }

    // orderBy
    if (orderBy != null && orderBy.isNotEmpty) {
      orderByQuery = ' order by ?';
      args.add(orderBy);
    }

    // limit query
    if (limit > 0) {
      limitQuery = ' limit ?';
      args.add(limit);
    }

    // offset
    if (offset > 0) {
      offsetQ = ' offset ?';
      args.add(offset);
    }

    if (andWhere != "") andWhere = "and " + andWhere;
    var query = 'select ' +
        select +
        ' from ' +
        table +
        ' where ' +
        whereInColumn +
        ' in (' +
        inString +
        ')' +
        andWhere +
        orderByQuery +
        limitQuery +
        offsetQ;
    return FileRecords.database.rawQuery(query, args);
  }
}
