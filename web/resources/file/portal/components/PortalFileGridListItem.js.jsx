// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms/';
import { displayUtils } from '../../../../global/utils';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

class PortalFileGridListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      hasViewedLog: true
    }
    this._bind(
      // '_goToFile'
    )
  }

  componentDidMount() {
    const { file, loggedInUser, fileActivityListItems } = this.props;
    if (file && loggedInUser && fileActivityListItems) {
      this.setState({
        hasViewedLog: fileActivityListItems && loggedInUser ? fileActivityListItems.some(item => item &&
          item._file === file._id && loggedInUser._id === item._user && item.text && item.text.includes("Viewed")) : true
      });  
    }
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.file && this.props.file._id && nextProps.file && nextProps.file._id) {
  //     return true;
  //   }
  //   return false;
  // }

  // _goToFile() {
  //   const { file, history, match } = this.props;
  //   history.push(`${match.url}/${file._id}`)
  // }

  render() {
    const { file, match, tagStore, checked, handleSelectFile, disabled } = this.props;
    const { hasViewedLog } = this.state;
    // let foundComment = _.find(commentMap, { '_file': file._id });

    const fileTags = file._tags.map(tagId => tagStore.byId[tagId] || '')

    let icon = displayUtils.getFileIcon(file.category, file.contentType, file);
    // let icon = 'icon' // for testing.
    
    return (
      <div className="yt-col full s_50 m_33 l_25 xl_25 file-list-item">
        <div className="card -hoverable -grid">
          <div className="card-header -file-card">
            <CheckboxInput
              disabled={(disabled && !checked)}
              name="file"
              value={checked}
              change={() => handleSelectFile(file._id)}
              checked={checked}
            />
          </div>
          {file.status === 'locked' ? 
            <Link to={`${match.url}/${file._id}`}>
              <div className="-icon">
                <img src={`/img/icons/locked_file.png`} />
              </div>
            </Link>
          :
            <Link to={`${match.url}/${file._id}`}>
              <div className="-icon">
                <img src={brandingName.image[icon] || `/img/icons/${icon}.png`} />
              </div>
            </Link>
          }
          <div className="card-body">
            <div className="-info">
              <div className="-title">
                <Link to={`${match.url}/${file._id}`}>
                  {file.filename}
                  {
                    (file.category === "folder" || hasViewedLog) ? null :
                    <span className="-new-file-status">
                      <b>(</b>New<b>)</b>
                    </span>
                  }
                </Link>
                {/** NOTE: We should do this in {brandingName.title.toLowerCase()} too 
                <Link to={`${match.url}/${file._id}`}>
                  <UserClickEvent
                    description="Open Preview File"
                    eventAction="click"
                    eventType="file"
                    refKey="_file"
                    refId={file._id}
                  >
                    {file.filename}
                  </UserClickEvent>
                </Link>
                */}
              </div>
              <div className="-date">{DateTime.fromISO(file.updated_at).toLocaleString(DateTime.DATETIME_MED)}</div>
            </div>
          </div>
        </div>
        <div className="-tags">
          { fileTags.map((tag, i) =>
            tag.name ?
            <span className="tag-pill" key={tag._id + i}>{tag.name}</span>
            :
            null
          )}
        </div>
      </div>
    )
  }

}

PortalFileGridListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , isSelected: PropTypes.bool
  , file: PropTypes.object.isRequired
}

PortalFileGridListItem.defaultProps = {
  isSelected: false
}

const mapStoreToProps = (store) => {

  // set isAdmin and isSuperAdmin
  // const loggedInUser = store.user.loggedIn.user;
  // const isSuperAdmin = (
  //   loggedInUser
  //   && loggedInUser.roles
  //   && loggedInUser.roles.includes('super-admin')
  // )
  // const isAdmin = (
  //   loggedInUser
  //   && loggedInUser.roles
  //   && loggedInUser.roles.includes('admin')
  //   || isSuperAdmin
  // )

  return {
    // commentMap: store.comment.byId
    // , isAdmin
    // , isSuperAdmin
    // , loggedInUser: store.user.loggedIn.user
    loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
  }
}

export default withRouter(connect(
  mapStoreToProps
)(PortalFileGridListItem));
