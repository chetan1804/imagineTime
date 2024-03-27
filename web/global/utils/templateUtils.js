/**
 * To avoid duplicating logic everywhere. 
 */
 const async = require('async');

 const templateUtils = {
   getDownloadLink(template) {
     if(!template) {
       return ''
     } else {
       let templateUrl = `/api/document-templates/download/${template._firm}/${template._id + '/'}`;
       templateUrl += encodeURIComponent(template.filename);
       return templateUrl;
     }
   }
 }
 
 export default templateUtils;