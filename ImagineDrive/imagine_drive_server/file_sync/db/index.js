const config = require('../constants');
const log = require('../log');
const migration = require('./migration');
const connection = config.DEBUG ?
    config.dbDebug :
    config.STAGING ? config.dbStage : config.dbProd;
const knex = require('knex').knex({
    client: 'pg',
    connection: connection,
    pool: { min: 10, max: 40 }
});
let migrating = false
log.writet('DB::connection', connection);

// remove this
async function initTemps() {
    if (! await knex.schema.hasTable('files')) {
        await knex.schema.createTable('users', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.string('username')
            table.unique('username')
            table.string('firstname').default('')
            table.string('lastname').default('')
            table.string('password_salt', 511) // longer to accomodate 256 bit salt
            table.string('password_hash');
            table.string('_personal');
        }).createTable('firms', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.string('name')
            table.string('subdomain') // replaced with 'domain' in separate migration
            table.string('logoUrl').defaultTo('')
        }).createTable('clients', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.integer('_firm')
            table.string('name')
            table.string('accountType').defaultTo('other')
        }).createTable('files', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.string('filename')
            table.string('fileExtension')
            table.string('category')
            table.string('contentType')
            table.string('rawUrl')
            table.string('status')
            table.integer('_user')
            table.foreign('_user').references('_id').inTable('users')
            table.integer('_client')
            table.foreign('_client').references('_id').inTable('clients')
            table.integer('_firm')
            table.foreign('_firm').references('_id').inTable('firms')
            table.string('_folder')
        }).createTable('clientusers', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.integer('_client')
            table.foreign('_client').references('_id').inTable('clients')
            table.integer('_user')
            table.integer('_firm')
            table.foreign('_user').references('_id').inTable('users')
            table.string('status').defaultTo('active')
        }).createTable('staff', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.integer('_firm')
            table.integer('_user')
            table.boolean('owner').defaultTo(true)
        });
    }
    if (!await knex.schema.hasTable("filesynchronization")){
        await knex.schema.createTable("filesynchronization", table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.boolean('ison').defaultTo(true)
            table.integer("_file")
            table.integer("_user")
        })
    }
}

async function init() {
    try{
        if (!await knex.schema.hasTable('syncdevice')) {
            await knex.schema.createTable('syncdevice', (table) => {
                table.string('deviceId').primary().notNullable();
                table.integer('user').notNullable();
                table.integer('status', 2).notNullable();
                table.timestamp('accessedAt', { useTz: true });
            });
        }
        await initTemps();
        migrating  = true
        await migration(knex);
        migrating = false
    }catch(e){
        log.writet('DB::init', e);
    }
}

module.exports = {
    init: init,
    instance: knex,
    isMigrating: () => migrating
};