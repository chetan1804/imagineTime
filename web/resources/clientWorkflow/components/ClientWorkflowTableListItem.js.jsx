/**
 * TODO: @ffugly
 * open clientWorkflow preview instead of download link
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
// import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils } from '../../../global/utils';


// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

class ClientWorkflowTableListItem extends Binder {
  constructor(props) {
    super(props);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.clientWorkflow && this.props.clientWorkflow._id && nextProps.clientWorkflow && nextProps.clientWorkflow._id) {
  //     return true;
  //   }
  //   return false;
  // }

  render() {
    const { clientWorkflow, match, tagStore, userStore } = this.props;

    // let foundComment = _.find(commentMap, { '_file': clientWorkflow._id });
    let foundComment = true;
    const clientWorkflowTags = clientWorkflow._tags ? clientWorkflow._tags.map(tagId => tagStore.byId[tagId] || '' ) : []

    let icon = displayUtils.getFileIcon(clientWorkflow.category, clientWorkflow.contentType);

    return (
      <tr className="-client-workflow-item">
        <td className="-title">
          <div className="yt-row">
            <div className="-client-workflow-info">
              <Link className="-filename" to={`${match.url}/${clientWorkflow._id}`}>
                {clientWorkflow.title}
              </Link>
              <br/>
              <small>
                {userStore.byId[clientWorkflow._createdBy] ? <span>created by {userStore.byId[clientWorkflow._createdBy].firstname} {userStore.byId[clientWorkflow._createdBy].lastname}</span> : null }        
              </small>
            </div>
          </div>
        </td>
        {/* <td className="-tags">
          { clientWorkflowTags.map((tag, i) => 
            <span className="tag-pill" key={tag._id + '_' + i}>{tag.name}</span>
          )}
        </td> */}
        <td className="-date">{clientWorkflow.dueDate ? DateTime.fromISO(clientWorkflow.dueDate).toLocaleString(DateTime.DATE_SHORT) : 'n/a'}</td>
        <td className="-status">{_.startCase(clientWorkflow.status)}</td>
        <td className="-comments">
          {foundComment ?
            <i className="fal fa-comment-lines" />
            :
            null
          }
        </td>
      </tr>
    )
  }

}

ClientWorkflowTableListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , clientWorkflow: PropTypes.object.isRequired
  , isSelected: PropTypes.bool
}

ClientWorkflowTableListItem.defaultProps = {
  isSelected: false
}

const mapStoreToProps = (store) => {
  // set isAdmin and isSuperAdmin
  const loggedInUser = store.user.loggedIn.user;
  const isSuperAdmin = (
    loggedInUser
    && loggedInUser.roles
    && loggedInUser.roles.includes('super-admin')
  )
  const isAdmin = (
    loggedInUser
    && loggedInUser.roles
    && loggedInUser.roles.includes('admin')
    || isSuperAdmin
  )
  return {
    noteMap: store.note.byId
    , isAdmin
    , isSuperAdmin
    , loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
    , userStore: store.user 
  }
}

export default withRouter(connect(
  mapStoreToProps
)(ClientWorkflowTableListItem));


// save for later
// <a href={`/api/files/download/${clientWorkflow._id}/${clientWorkflow.filename}`} target="_blank">{clientWorkflow.filename}</a>
