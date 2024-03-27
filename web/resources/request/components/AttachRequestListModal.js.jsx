/**
 * A reusable component to attach existing files to any resource.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';

// import file components;
import AttachRequestList from './AttachRequestList.js.jsx';

// import utils
import routeUtils from '../../../global/utils/routeUtils';

// import actions
import * as requestActions from '../requestActions';
import * as userActions from '../../user/userActions';

class AttachRequestListModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
        requestListArgsObj: { _firm: props.match.params.firmId }
        , requestId: null
    }
    this._bind(
      '_close'
      , '_handleFormSubmit'
      , '_handleSelectRequest'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(requestActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.requestListArgsObj)));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    this._handleSetPagination({page: 1, per: 50});
  }
  
  _handleSelectRequest(requestId) {
    this.setState({ requestId });

  }

  _handleFormSubmit(e) {
    const { onSubmit } = this.props;
    console.log('submit')
    if(e) {
      e.preventDefault();
    }
    onSubmit(this.state.requestId)
    this._close();
  }

  _close() {
    this.props.close()
  }

  _handleSetFilter(e) {
    // let nextFileListArgsObj = { ...this.state.requestListArgsObj }
    // nextFileListArgsObj[e.target.name] = e.target.value;

    // // console.log("next obj: ", nextFileListArgsObj)
    // // console.log(routeUtils.listArgsFromObject(nextFileListArgsObj))
    // this.setState({ requestListArgsObj: nextFileListArgsObj }
    // , () => this._handleSetPagination({page: 1, per: this.state.per})
    // )
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const requestListArgsObj = routeUtils.listArgsFromObject(this.state.requestListArgsObj);
    dispatch(requestActions.setPagination(newPagination, ...requestListArgsObj));
  }

  _setPerPage(per) {
    // var newPagination = {}
    // newPagination.per = parseInt(per);
    // newPagination.page = 1;
    // this._handleSetPagination(newPagination)
    // this.setState({per: per});
  }


  render() {
    const { 
      requestStore
      , isOpen
      , match
    } = this.props;
    const { 
      requestId
      , submitting 
    } = this.state;

    const requestList = requestStore.util.getListInfo(...routeUtils.listArgsFromObject(this.state.requestListArgsObj));
    const requestListItems = requestStore.util.getList(...routeUtils.listArgsFromObject(this.state.requestListArgsObj));

    const isEmpty = (
      !requestList
      || !requestList.items
      || requestStore.selected.didInvalidate
    );

    const isFetching = (
      !requestStore
      || requestStore.selected.isFetching
    );

    return (
      <Modal
        cardSize="jumbo"
        closeAction={this._close}
        closeText="Cancel"
        confirmAction={requestId ? this._handleFormSubmit : null}
        confirmText={submitting ? "Submitting..." : "Done" }
        disableConfirm={submitting || !requestId}
        fixed={true}
        isOpen={isOpen}
        modalClasses="folder-template-modal"
        modalHeader={this.props.multiple ? "Select files" : "Select a file" }
      >
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          {isEmpty ?
            (isFetching ? 
              <div className="-loading-hero hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div>  
              : 
              <h2>Empty.</h2>
            )
            :
            <AttachRequestList
              requestList={requestList}
              handleFilter={this._handleSetFilter}
              handleSelectRequest={this._handleSelectRequest}
              handleQuery={() => console.log('handle queery')}
              handleSetPagination={this._handleSetPagination}
              handleSort={() => console.log('handle sort')}
              multiple={false}
              selectedRequestId={requestId}
              setPerPage={this._setPerPage}
              showActions={false}
              sortedAndFilteredList={requestListItems.sort((a,b) => a.updated_at > b.updated_at ? -1 : 1)} // TODO: update this
              viewingAs={this.props.viewingAs}
              totalListInfo={requestList}
            />
          }
        </div>
      </Modal>
    )
  }
}

AttachRequestListModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
}

AttachRequestListModal.defaultProps = {
  multiple: true
  , viewingAs: "staff" // or "client" to hide files.
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    requestStore: store.request
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AttachRequestListModal)
);
