/**
 * View component for /files/new
 *
 * Creates a new file from a copy of the defaultItem in the file reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import moment from 'moment';
import { DateTime } from 'luxon';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { CheckboxInput } from '../../../global/components/forms';
import CloseWrapper  from '../../../global/components/helpers/CloseWrapper.js.jsx'

// import components
import SingleRequestOptions from './SingleRequestOptions.js.jsx';

class RequestTableListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            singleRequestOptionsOpen: false
        }
        this._bind(
            '_handleCloseRequestListOption'
        );
    }

    _handleCloseRequestListOption(e) {
        e.stopPropagation();
        this.setState({
            singleRequestOptionsOpen: false
        })
    }

    render() {
        const {
            checked
            , request
            , handleSelectRequest
            , clearSelectedRequestIds
            , userMap
            , handleUpdateRequest
            , match
            , isViewing
        } = this.props;

        const {
            singleRequestOptionsOpen
        } = this.state;

        return (
            <div className="table-row -file-item -request-list-table">
                {/* {
                    isViewing === "portal" ? null :
                    <div className="table-cell">
                        <CheckboxInput
                            // disabled={!checked}
                            name="request"
                            value={checked}
                            change={() => handleSelectRequest(request._id)}
                            checked={checked}
                        />
                    </div>
                } */}
                {
                    isViewing === "portal" ? null :
                    <div className="table-cell">
                        <div className="-options"
                            onClick={() => this.setState({ singleRequestOptionsOpen: true })}>
                            <div style={{position: "relative", height: "100%", width: "100%"}}>
                                <CloseWrapper
                                    isOpen={singleRequestOptionsOpen}
                                    closeAction={this._handleCloseRequestListOption}
                                />
                                <i className="far fa-ellipsis-v"></i>
                                <SingleRequestOptions
                                    isOpen={singleRequestOptionsOpen}
                                    closeAction={this._handleCloseRequestListOption}
                                    request={request}
                                    handleUpdateRequest={handleUpdateRequest}
                                />
                            </div>
                        </div>
                    </div>
                }
                <div className="table-cell -title">
                    <div className="yt-row center-vert">
                        <span className="-icon">
                            <i className="fas fa-list-alt"></i>
                        </span>
                        <div className="-file-info">
                            <Link className="-name" to={`${match.url}/${request._id}/${isViewing === 'portal' ? 'published': 'unpublished'}`} onClick={clearSelectedRequestIds}>
                                {request.name}
                            </Link>
                            <br/>
                        </div>
                    </div>
                </div>
                <div className="table-cell">
                    {
                        request.delegatedAdmin.length ? 
                        request.delegatedAdmin.map(id =>
                            userMap[id] ?                            
                            <div key={id}>
                                <small>{`${_.startCase(userMap[id].firstname)} ${_.startCase(userMap[id].lastname)}`}</small>
                            </div> : null
                        )
                        : "N/A"
                    }
                </div>
                <div className="table-cell">{request.tasks}</div>
                <div className="table-cell">{request.totalUploadedFiles || 0}</div>
                <div className="table-cell">
                    {
                        request._createdBy && userMap ?
                        <small>
                            { userMap[request._createdBy] ? <span>by {userMap[request._createdBy].firstname} {userMap[request._createdBy].lastname}</span>: null }
                        </small> : null
                    }
                </div>
                <div className="table-cell -date">{DateTime.fromISO(request.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
            </div>
        )
    }
}

RequestTableListItem.propTypes = {}

RequestTableListItem.defaultProps = {}

const mapStoreToProps = (store) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    return {
        loggedInUser: store.user.loggedIn.user
    }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(RequestTableListItem)
);
