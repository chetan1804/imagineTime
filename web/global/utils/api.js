/**
 * This is a utility to handle default API requests with the Yote server
 */

import _ from 'lodash';
import fetch from 'isomorphic-fetch';
const async = require('async');
import queryString from 'query-string';

import * as fileActions from '../../resources/file/fileActions';
import * as shareLinkActions from '../../resources/shareLink/shareLinkActions';

const baseUrl = ""; //later required for server rendering

const linkPathnames = [
  '/link/request-file',
  '/link/share-file',
  '/link/request-signature'
]

const apiUtils = {
  callAPI(route, method = 'GET', body, headers = {
    'Accept': 'application/json', 'Content-Type': 'application/json'
  }) {
    const { vendorapitoken } = queryString.parse(decodeURIComponent(window.location.search));
    console.log('window.location', window.location);
    const pathname = !!window.location.pathname ? window.location.pathname : '';

    if(!!vendorapitoken && !!pathname && linkPathnames.some(i => i == pathname)) {
      route += `?vendorapitoken=${vendorapitoken}`
    }

    let options = {
      headers
      , method
      , credentials: 'same-origin'
    };
    if(!!body) {
      options.body = JSON.stringify(body);
    }
    return fetch(baseUrl + route, options)
    .then(response => response.json())
    .catch(err => {
      return {success:false, message: 'Unxpected server error', err};
    })
  }
  , downloadFile(route, method = 'POST', body, headers = {
    'Accept': 'text/csv', 'Content-Type': 'application/json'
  }) {
    return fetch(baseUrl + route, {
      headers
      , method
      , credentials: 'same-origin'
      , body: JSON.stringify(body)
    })
    // .then(response => {
    //   if (response.status === 403) {
    //     window.location.replace(window.location.origin);
    //   }
    //   return response.json();
    // })
    .then(response => response.blob())
  }
  , defaultFromSchema(schema) {
    let obj = {};
    for(const key in schema) {
      switch(schema[key].instance) {
        case "Date":
          if(key === 'created' || key === 'updated') {
            // ignore, these are set on server
            break;
          } else {
            obj[key] = new Date()
            console.log(obj)
            break;
          }
        case "String":
          obj[key] = schema[key].defaultValue ? schema[key].defaultValue : '';
          break;
        case "ObjectID":
          if(key === "_id") {
            // ignore, this is set by mongo
            break;
          } else {
            obj[key] = null;
            break;
          }
        case "Number":
          if(key === '__v') {
            // ignore, this is a mongo default;
            break;
          } else {
            obj[key] = schema[key].defaultValue ? schema[key].defaultValue : 0;
            break;
          }
        case "Boolean":
          obj[key] = schema[key].defaultValue ? schema[key].defaultValue : false;
          break;
        default:
          obj[key] = null;
      }
    }
    return obj;
  }
  , upload(props, fileList, folders, params, callback) {
    const { dispatch, match, listArgs } = props;
    if (params) {

      const files = fileList.filter(file => file.type !== "folder");
      const filePointers = {
        status: "visible"
      };

      if (params._firm) {
        filePointers._firm = params._firm;
      }
      if (params.status) {
        filePointers.status = params.status;
      }
      if (params._client) {
        filePointers._client = params._client;
      }
      if (params._personal) {
        filePointers._personal = params._personal;
      }
      if (params._folder) {
        filePointers._folder = params._folder;
      }
      if (params.viewingAs) {
        filePointers.viewingAs = params.viewingAs;
      }
      if (params.uploadName) {
        filePointers.uploadName = params.uploadName;
      }
      if (params.ParentID) {
        filePointers.ParentID = params.ParentID;
      }
      if (params.YellowParentID) {
        filePointers.YellowParentID = params.YellowParentID;
      }
      if (!!params.uuid) {
        filePointers.uuid = params.uuid;
      }

      if (!!params._createdBy) {
        filePointers.requestedBy = params._createdBy;
      }

      if (params.client) {
        filePointers.mangoCompanyID = params.client.mangoCompanyID;
        filePointers.mangoClientID = params.client.mangoClientID;
      }
      if (params.uploadEmailAddress) {
        filePointers.uploadEmailAddress = params.uploadEmailAddress;
      }
      if (params.uploadCompanyName) {
        filePointers.uploadCompanyName = params.uploadCompanyName;
      }
      if (params.receivers && params.receivers.length) {
        let count = 0;
        params.receivers.map(item => {          
          if (item && item.email && item.email.trim()) {
            filePointers["file-request-receiver-" + count] = item.email.trim();
            count++;
          }
        })
      }
      
      // build formdata to upload file
      let formData = new FormData();

      // add file pointers 
      Object.keys(filePointers).forEach(key => {
        formData.append(key, filePointers[key]);
      });

      if (folders && folders.length) {
        // apiUtils.sendUpload(formData, files, result => {
        //   callback(result);
        // });
        dispatch(fileActions.sendCreateBulkFolders(filePointers, folders)).then(json => {
          if (json && json.success && json.data) {
            
            // for staff user
            async.map(json.data, (file, cb) => {
              dispatch(fileActions.addSingleFileToMap(file));
              cb(null, file._id);
            }, (err, fileIds) => {
              if (!err && listArgs) {
                // dispatch(fileActions.addFilesToList(fileIds, this.props.listArgs));
                dispatch(fileActions.addFilesToList(fileIds, ...listArgs));  
              } else if (listArgs) {
                dispatch(fileActions.addFilesToList(fileIds, ...listArgs));  
              }
            });

            apiUtils.sendUpload(props, filePointers, params, files, json, result => {
              callback(result);
            });
          } else {
            alert("File could not be saved.")
          }
        });
      } else {
        Object.keys(files).forEach(key => {
          const file = files[key];
          formData.append(key, new Blob([file], { type: file.type }), file.name || 'file');
        });

        if (params.type === "file-request") {
          dispatch(shareLinkActions.sendUploadFiles(match.params.hex, formData)).then(result => {
            callback(result);
          });
        } else {
          dispatch(fileActions.sendCreateFiles(formData)).then(result => {
            callback(result);
          });
        }
      }
    } else {
      callback({ success: false, message: "something error happened, pls contact the admin." });
    }
  }

  , sendUpload(props, filePointers, params, _files, json, _callback) {
    const { dispatch, match, listArgs } = props;
    const filesChunk = _.chunk(_files, 200);
    let countChunk = 0;
    async.mapSeries(filesChunk, (files, callback) => {
      countChunk++;

      // build formdata to upload file
      let formData = new FormData();

      // add file pointers 
      Object.keys(filePointers).forEach(key => {
        formData.append(key, filePointers[key]);
      });

      if (filesChunk.length > 1) {
        formData.append('chunk', filesChunk.length);
        formData.append('countChunk', countChunk);
      }

      Object.keys(files).forEach(key => {
        const file = files[key];
        const parentId = json.data.filter(folder => folder._oldId === file._folder);
        if (parentId && parentId[0]) {
          formData.append(`${key}_parentId`, parentId[0]._id);
        }
        formData.append(key, new Blob([file], { type: file.type }), file.name || 'file');
      });
      if (params.type === "file-request") {
        dispatch(shareLinkActions.sendUploadFiles(match.params.hex, formData)).then(result => {
          callback(null, result);
        });
      } else { 
        dispatch(fileActions.sendCreateFiles(formData)).then(result => {
          callback(null, result);
        });
      }
    }, (err, result) => {
      if (err && !result) {
        _callback({ success: true });
      } else {
        _callback({ success: true });
      }
    });
  }
}

export default apiUtils;


