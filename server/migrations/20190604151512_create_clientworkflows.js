// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addWorkflowIndex = `
ALTER TABLE clientworkflows ADD "document_vectors" tsvector;
CREATE FUNCTION clientworkflows_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.description || ' ' || NEW.title || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_clientWorkflows_trigger
BEFORE INSERT OR UPDATE ON clientworkflows
FOR EACH ROW
EXECUTE PROCEDURE clientworkflows_index_trigger();
CREATE INDEX idx_fts_clientWorkflows ON clientworkflows USING gin(document_vectors);
`;

// todo: this works on an "add" migration, but what about a "create" migration?
const removeWorkflowIndex = `
  DROP FUNCTION IF EXISTS clientworkflows_index_trigger() CASCADE;
  ALTER TABLE clientworkflows DROP COLUMN document_vectors;
`;

exports.up = knex => Promise.all([
  knex.schema.createTable('clientworkflows', table => {
    table.increments('_id').primary()
    table.timestamps(false, true)
    table.string('description')
    table.string('title')
    table.enu('status', ['archived', 'deleted', 'draft', 'published']).defaultTo('draft')

    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')
    
    table.specificType('_tags', 'INT[]').defaultTo('{}')

    // table.specificType('_tasks', 'INT[]').defaultTo('{}')
    table.json('items').defaultTo(JSON.stringify([]))
    /**
     * json — table.json(name)
      Adds a json column, using the built-in json type in PostgreSQL, MySQL and SQLite, defaulting to a text column in older versions or in unsupported databases.
      For PostgreSQL, due to incompatibility between native array and json types, when setting an array (or a value that could be an array) as the value of a json or jsonb column, you should use JSON.stringify() to convert your value to a string prior to passing it to the query builder, e.g.
      knex.table('users')
        .where({id: 1})
        .update({json_data: JSON.stringify(mightBeAnArray)});
     */

  }).then(() => {
    return knex.schema.raw(addWorkflowIndex)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTable('clientworkflows')
  .then(() => {
    return knex.schema.raw(removeWorkflowIndex)
  })
]);