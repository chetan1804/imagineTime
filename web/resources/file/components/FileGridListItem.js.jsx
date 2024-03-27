// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import moment from 'moment';
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils, fileUtils } from '../../../global/utils';

// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

class FileGridListItem extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      // '_goToFile'
    )
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
    const { file, match, tagStore } = this.props;
    // let foundComment = _.find(commentMap, { '_file': file._id });

    const fileTags = file._tags.map(tagId => tagStore.byId[tagId] || '')

    let icon = displayUtils.getFileIcon(file.category, file.contentType, file);
    // let icon = 'icon' // for testing.
    
    return (
      <div className="yt-col full xs_50 s_33 m_25 l_20 xl_20 file-list-item">
        <div className="card -hoverable -grid">
          {file.category === 'image' ? 
            <div className="-image" style={{backgroundImage: `url(${fileUtils.getDownloadLink(file)})`}}/>
            :
            <div className="-icon">
              <img src={`/img/icons/${icon}.png`} />
            </div>
          }
          <div className="card-body">
            <div className="-info">
              <div className="-title">
                <Link to={`${match.url}/${file._id}`}>
                  {file.filename}
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
            <span className="tag-pill" key={tag._id + i}>{tag.name}</span>
          )}
        </div>
      </div>
    )
  }

}

FileGridListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , isSelected: PropTypes.bool
  , file: PropTypes.object.isRequired
}

FileGridListItem.defaultProps = {
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
)(FileGridListItem));
