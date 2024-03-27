import React from 'react';
import { Link } from 'react-router-dom';
import { displayUtils } from '../../utils';
import * as constants from '../../../config/constants.js';

const links = {

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * client messages list screen of the client whose unique database id is
   * given. Otherwise it returns the given client name or null.
   * @param {*} clientId Unique database id of a client.
   * @param {*} clientName Name of the client to be displayed as link text.
   * @param {*} firmId Unique id of the firm the client belongs to.
   * @returns A <Link> object pointing to the client messages list screen of the
   * client or the given clientName.
   */
  getClientPostsLink(clientId, clientName, firmId) {
    if(!clientId || !clientName || !firmId) {
      return clientName || null;
    }
    return <Link to={`/firm/${firmId}/workspaces/${clientId}/messages`}>{clientName}</Link>
  }
  ,

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * client message whose unique database id is given. Otherwise it returns the
   * given linkText.
   * @param {*} clientPostId Unique database id of a client message.
   * @param {*} clientId Unique database id of a client.
   * @param {*} linkText Text to be displayed as link text. Could be subject or
   * message.
   * @param {*} firmId Unique id of the firm the client belongs to.
   * @returns A <Link> object pointing to the client message screen or the given
   * linkText.
   */
   getClientPostLink(clientPostId, clientId, linkText, firmId) {
    if(!clientPostId || !clientId || !linkText || !firmId) {
      return linkText || null;
    }
    return <Link to={`/firm/${firmId}/workspaces/${clientId}/messages/${clientPostId}`}>{linkText}</Link>
  }
  ,

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * client files list screen of the client whose unique database id is
   * given. Otherwise it returns the given clientName or null.
   * @param {*} clientId Unique database id of a client.
   * @param {*} clientName Name of the client to be displayed as link text.
   * @param {*} firmId Unique id of the firm the client belongs to.
   * @returns A <Link> object pointing to the client files list screen of the
   * client or the given clientName.
   */
   getClientFilesLink(clientId, clientName, firmId) {
    if(!clientId || !clientName || !firmId) {
      return clientName || null;
    }
    return <Link to={`/firm/${firmId}/workspaces/${clientId}/files`}>{clientName}</Link>
  }
  ,

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * file screen whose unique database id is given. Otherwise it returns the
   * given fileName or fileExtension if fileName is empty.
   * @param {integer} fileId - Unique database id of the file.
   * @param {string} fileName - Name of the file including extension.
   * @param {string} fileExtension - Extension of the file including the dot.
   * @param {string} fileCategory - Type i.e. 'file' or 'folder'.
   * @param {boolean} isDeleted - Whether or not the file has been deleted.
   * @param {integer} clientId - Unique database id of the client.
   * @param {integer} firmId - Unique database id of the firm.
   * @returns A <Link> object pointing to the client message screen or the given
   * linkText.
   */
  getFileLink(fileId, fileName, fileExtension, fileCategory, isDeleted, clientId, firmId) {
    let folderPath = fileCategory === constants.DB_FILE_CATEGORY_FOLDER ? '/folder' : '';
    return (
      <div>
        {isDeleted || !fileName ?
          (fileName ? fileName : ' ' + (fileExtension ? fileExtension : ' '))
          :
          !!clientId ?
          <Link className="-filename" to={`/firm/${firmId}/workspaces/${clientId}/files/${fileId}${folderPath}`}>{fileName ? fileName : ' ' + (fileExtension ? fileExtension : ' ')}</Link>
          : <Link className="-filename" to={`/firm/${firmId}/files/public/${fileId}${folderPath}`}>{fileName ? fileName : ' ' + (fileExtension ? fileExtension : ' ')}</Link>
        }
      </div>
    )    
  }

  , getFileLinkWithIcon(fileId, fileName, fileExtension, fileContentType, fileCategory, isDeleted, fileObj, clientId, firmId) {
    return (
      <div>
        <div style={{float: 'left'}}>
          <img src={`/img/icons/${displayUtils.getFileIcon(fileCategory, fileContentType, fileObj)}.png`} style={{ width: 24, marginRight: 5 }} />
        </div>
        {links.getFileLink(fileId, fileName, fileExtension, fileCategory, isDeleted, clientId, firmId)}
      </div>
    )    
  }
  ,

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * client request lists screen of the client whose unique database id is
   * given. Otherwise it returns the given client name or null.
   * @param {*} clientId Unique database id of a client.
   * @param {*} clientName Name of the client to be displayed as link text.
   * @param {*} firmId Unique id of the firm the client belongs to.
   * @returns A <Link> object pointing to the client request lists list screen
   * of the client or the given clientName.
   */
   getClientRequestListsLink(clientId, clientName, firmId) {
    if(!clientId || !clientName || !firmId) {
      return clientName || null;
    }
    return <Link to={`/firm/${firmId}/workspaces/${clientId}/request-list`}>{clientName}</Link>
  }
  ,

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * screen displaying request tasks matching the given requestTaskStatus in the
   * request list, whose id is given, of the client whose id is given.
   * Otherwise it returns the given client name or null.
   * @param {*} requestListId Unique id of the request list.
   * @param {*} requestListName Name of the request list to be displayed as link text.
   * @param {*} requestTaskStatus Status of the request task.
   * @param {*} clientId Unique database id of a client.
   * @param {*} firmId Unique id of the firm the client belongs to.
   * @returns A <Link> object pointing to the screen displaying request tasks
   * of the given status inside the given request list.
   */
   getClientRequestListLink(requestListId, requestListName, requestTaskStatus, clientId, firmId) {
    if(!clientId || !requestListName || !firmId || !requestListId || !requestTaskStatus) {
      return requestListName || null;
    }
    return <Link to={`/firm/${firmId}/workspaces/${clientId}/request-list/${requestListId}/${requestTaskStatus}`}>{requestListName}</Link>
  }
  ,

  /**
   * Given the required inputs, it returns a <Link> object pointing to the
   * screen displaying request task detail of the given request task. Otherwise
   * it returns the given linkText.
   * @param {*} requestTaskId Unique database id of a request task.
   * @param {*} linkText Text to be displayed as link text.
   * @param {*} requestTaskStatus Status of the request task.
   * @param {*} requestListId Unique id of the request list the request task
   * belongs to.
   * @param {*} clientId Unique database id of a client.
   * @param {*} firmId Unique id of the firm the client belongs to.
   * @returns A <Link> object pointing to the screen displaying request task
   * detail.
   */
   getClientRequestTaskLink(requestTaskId, linkText, requestTaskStatus, requestListId, clientId, firmId) {
    if(!requestTaskId || !linkText || !requestTaskStatus || !requestListId || !clientId || !firmId) {
      return linkText || null;
    }
    // http://localhost:3030/firm/2/workspaces/325/request-list/4/unpublished/task-activity/5/detail
    return <Link to={`/firm/${firmId}/workspaces/${clientId}/request-list/${requestListId}/${requestTaskStatus}/task-activity/${requestTaskId}/detail`}>{linkText}</Link>
  }

}

export default links;
