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

// import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';

const ClientWorkflowGridListItem = ({
 clientWorkflow
 , match
 , tagStore 
}) => {
  // let foundComment = _.find(commentMap, { '_file': clientWorkflow._id });

  const clientWorkflowTags = clientWorkflow._tags.map(tagId => tagStore.byId[tagId] || '')

  return (
    <Link to={`${match.url}/${clientWorkflow._id}`} className="portal-workflow-list-item">
      <div className="-info">
        <div className="-title">
          {clientWorkflow.title}
        </div>
        <div className="-description">
          {clientWorkflow.description}
        </div>
        <div className="-items">
          {clientWorkflow.items.length} items 
        </div>
        {/* <div className="-tags">
          { clientWorkflowTags.map((tag, i) => 
            <span className="-tag" key={tag._id + i}>{i > 0 ? " | " : ""}{tag.name}</span>
          )}
        </div> */}
      </div>
      <div className="-arrow">
        <i className="-i fal fa-chevron-right"/>
      </div>
    </Link>
  )
}

ClientWorkflowGridListItem.propTypes = {
  dispatch: PropTypes.func.isRequired
  , isSelected: PropTypes.bool
  , clientWorkflow: PropTypes.object.isRequired
}

ClientWorkflowGridListItem.defaultProps = {
  isSelected: false
}

const mapStoreToProps = (store) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
  }
}

export default withRouter(connect(
  mapStoreToProps
)(ClientWorkflowGridListItem));
