// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addClientTaskResponseIndex = `
ALTER TABLE clienttaskresponses ADD "document_vectors" tsvector;
CREATE FUNCTION clienttaskresponses_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.content || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_clienttaskresponses_trigger
BEFORE INSERT OR UPDATE ON clienttaskresponses
FOR EACH ROW
EXECUTE PROCEDURE clienttaskresponses_index_trigger();
CREATE INDEX idx_fts_clienttaskresponses ON clienttaskresponses USING gin(document_vectors);
`;

const removeClientTaskResponseIndex = `
  DROP FUNCTION IF EXISTS clienttaskresponses_index_trigger() CASCADE;
  ALTER TABLE clienttaskresponses DROP COLUMN document_vectors;
`;

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('clienttaskresponses', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)

      table.string('content', 4095)

      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')
      table.specificType('_files', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
      // table.foreign('_files').references('_id').inTable('files')
      table.integer('_clientTask')
      table.foreign('_clientTask').references('_id').inTable('clienttasks')
      table.integer('_clientWorkflow')
      table.foreign('_clientWorkflow').references('_id').inTable('clientworkflows')

    })
  ]).then(() => {
    return knex.schema.raw(addClientTaskResponseIndex)
  })
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('clienttaskresponses')
    .then(() => {
      return knex.schema.raw(removeClientTaskResponseIndex)
    })
  ])
};

