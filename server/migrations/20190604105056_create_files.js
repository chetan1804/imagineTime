// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

// ok so the vector creation breaks on periods. meaning an example filename like "test_2_df0c1.jpg"
// will NOT match on "test". we need to remove the jpg from this, which is going to require some
// (fun) postgres string manipulation

// https://www.postgresql.org/docs/9.1/functions-matching.html#FUNCTIONS-POSIX-REGEXP
// maybe because of https://www.postgresql.org/docs/9.6/plpgsql-overview.html ?
// https://www.tutorialspoint.com/plsql/plsql_strings.htm

// select position('.' in 'test_2_df0c1.jpg'); // 13
// select substring('test_2_df0c1.jpg' from 0 for 13); // test_2_df0c1
// DO IT IN ONE GO
// select regexp_replace('test_2_df0c1.jpg', '\..*$','')
// doesnt work
// this works in the cli though:
// update files set document_vectors = (to_tsvector(regexp_replace(filename, '\..*$','')) || ' ');
// working now. the plpsql language has differents internal funcs than regular psql

const addFileIndex = `
ALTER TABLE files ADD "document_vectors" tsvector;
CREATE FUNCTION files_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(REPLACE(NEW.filename, '.', ' ') || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_files_trigger
BEFORE INSERT OR UPDATE ON files
FOR EACH ROW
EXECUTE PROCEDURE files_index_trigger();
CREATE INDEX idx_fts_files ON files USING gin(document_vectors);
`;

// todo: this works on an "add" migration, but what about a "create" migration?
const removeFileIndex = `
  DROP FUNCTION IF EXISTS files_index_trigger() CASCADE;
  ALTER TABLE files DROP COLUMN document_vectors;
`;

exports.up = knex => Promise.all([
  knex.schema.createTable('files', table => {
    table.increments('_id').primary()
    table.timestamps(false, true)
    table.string('filename')
    table.string('fileExtension')
    table.string('category')
    table.string('contentType')
    table.string('rawUrl')
    table.string('status')
    // table.enu('status', ['visible', 'locked', 'none']).defaultTo('none')

    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_user')
    table.foreign('_user').references('_id').inTable('users')
    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')

    table.specificType('_tags', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value

  }).then(() => {
    return knex.schema.raw(addFileIndex)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTable('files')
  .then(() => {
    return knex.schema.raw(removeFileIndex)
  })
]);