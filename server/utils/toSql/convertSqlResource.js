
let _ = require('lodash');
let fs = require('fs');
// let pluralize = require('pluralize');
let shell = require('shelljs');

console.log("Convert existing resource to sql")

let resourceName = 
// "client";
// "clientUser";
// "file";
// "firm";
// "staff";
// "staffClient";
// "notification";
// "task";
// "clientTaskResponse";
// "note";
// "clientWorkflow";
// "clientWorkflowTemplate";
// "phoneNumber";
// "tag";
// "contactNote";
// "address";
// "activity";
// "subscription"
"NULL";

if(resourceName == "NULL") {
  console.log("DON'T RUN THIS UNLESS YOU KNOW WHAT YOU'RE DOING");
  process.exit(1);
  return;
}

/**
 * this util should, for each resource:
 * 
 * 1. move existing 'controller' and 'model' files into new dir
 * 2. load template and create new controller and model files
 * 3. create a sql migration for the new resource
 * 
 * once done, we will need to manually update the schemas for each
 * 
 */

 //__PascalName__
 //__camelName__

let PascalName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
let camelName = resourceName; // redundant, but easier laster

const resourceFolderPath = `./resources/${resourceName}`;
if(!fs.existsSync(resourceFolderPath)) {
  console.log("RESOURCE PATH DOESNT EXIST")
  process.exit(1);
  return;
}

// 1a. make new folder for old files
shell.mkdir('-p', `${resourceFolderPath}/old`)
// 1b. move existing files into it
shell.mv(`${resourceFolderPath}/${resourceName}sController.js`, `${resourceFolderPath}/old/${resourceName}sController.js`)
shell.mv(`${resourceFolderPath}/${PascalName}Model.js`, `${resourceFolderPath}/old/${PascalName}Model.js`)


// // sed doesn't replace everything? not sure why, not worth debugging
// // 2a. copy new templates
// shell.cp(`./utils/toSql/controllerTemplate.js`, `${resourceFolderPath}/${resourceName}sController.js`)
// shell.cp(`./utils/toSql/modelTemplate.js`, `${resourceFolderPath}/${PascalName}Model.js`)
// // 2b. replace strings

// shell.sed('-i', '__PascalName__', PascalName, `${resourceFolderPath}/${resourceName}sController.js`);
// shell.sed('-i', '__camelName__', camelName, `${resourceFolderPath}/${resourceName}sController.js`);
// shell.sed('-i', '__PascalName__', PascalName, `${resourceFolderPath}/${PascalName}Model.js`);
// shell.sed('-i', '__camelName__', camelName, `${resourceFolderPath}/${PascalName}Model.js`);

// 2. replace strings in the file
let nextModel = fs.readFileSync(`./utils/toSql/modelTemplate.js`, 'utf8');
nextModel = nextModel.split('__PascalName__').join(PascalName);
nextModel = nextModel.split('__camelName__').join(camelName);
fs.writeFileSync(`${resourceFolderPath}/${PascalName}Model.js`, nextModel);

let nextController = fs.readFileSync(`./utils/toSql/controllerTemplate.js`, 'utf8');
nextController = nextController.split('__PascalName__').join(PascalName);
nextController = nextController.split('__camelName__').join(camelName);
fs.writeFileSync(`${resourceFolderPath}/${resourceName}sController.js`, nextController);

// 3. new sql migration
shell.exec(`knex migrate:make create_${camelName}s`)