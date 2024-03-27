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

// import actions

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { CheckboxInput } from '../../../global/components/forms';
import CloseWrapper  from '../../../global/components/helpers/CloseWrapper.js.jsx'

// import components
import SingleRequestTaskOptions from './SingleRequestTaskOptions.js.jsx';

class RequestTaskTableListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            singleRequestTaskOptionsOpen: false
        }
        this._bind(
            '_handleCloseRequestTaskOption'
        );
    }

    _handleCloseRequestTaskOption(e) {
        e.stopPropagation();
        this.setState({
            singleRequestTaskOptionsOpen: false
        })
    }

    render() {
        const {
            location
            , checked
            , requestTask = {}
            , handleSelectRequestTask
            , clearSelectedRequestIds
            , userMap
            , handleUpdateRequestTask
            , match
            , isViewing
        } = this.props;

        const {
            singleRequestTaskOptionsOpen
        } = this.state;
        
        const pathElements = location.pathname.split('/');
        const clientId = pathElements[2];
        const requestListId = pathElements[4];

        let linkToTaskURL = '';
        if(isViewing === "portal") {
            linkToTaskURL = `/portal/${clientId}/request/${requestListId}/requestTask/${requestTask._id}`;
            //`/portal/${clientId}/request-task/${requestTask._id}`;
        }
        else {
            linkToTaskURL = `${match.url.includes("task-activity") ? match.url.substr(0, match.url.lastIndexOf('/task-activity')) : match.url}/task-activity/${requestTask._id}/detail`;
        }
        return (
            <div className="table-row -file-item -request-list-table">
                {
                    isViewing === "portal" ? null :
                    <div className="table-cell">
                        <CheckboxInput
                            // disabled={!checked}
                            name="requestTask"
                            value={checked}
                            change={() => handleSelectRequestTask(requestTask._id)}
                            checked={checked}
                        />
                    </div>
                }
                <div className="table-cell">
                    <div className="-options"
                        onClick={() => this.setState({ singleRequestTaskOptionsOpen: true })}>
                        <div style={{position: "relative", height: "100%", width: "100%"}}>
                            <CloseWrapper
                                isOpen={singleRequestTaskOptionsOpen}
                                closeAction={this._handleCloseRequestTaskOption}
                            />
                            <i className="far fa-ellipsis-v"></i>
                            <SingleRequestTaskOptions
                                isOpen={singleRequestTaskOptionsOpen}
                                closeAction={this._handleCloseRequestTaskOption}
                                requestTask={requestTask}
                                handleUpdateRequestTask={handleUpdateRequestTask}
                                isViewing={isViewing}
                            />
                        </div>
                    </div>
                </div>
                <div className="table-cell">
                    <div className="-file-info">
                        <Link className="-name" to={linkToTaskURL}>
                            {requestTask.category}
                        </Link>
                        {/*<Link className="-name" to={`${match.url.includes("task-activity") ? match.url.substr(0, match.url.lastIndexOf('/task-activity')) : match.url}/task-activity/${requestTask._id}/detail`}>
                            {requestTask.category}
                        </Link>*/}
                    </div>
                </div>
                <div className="table-cell">{DateTime.fromISO(requestTask.dueDate).toLocaleString(DateTime.DATE_SHORT)}</div>
                <div className="table-cell">{requestTask.description}</div>
                <div className="table-cell">
                    {
                        requestTask.assignee.length ? 
                        requestTask.assignee.map((user, i) =>
                            <div key={i}>
                                {
                                    user && user._id ? userMap[user._id] ?
                                    <small>{`${_.startCase(userMap[user._id].firstname)} ${_.startCase(userMap[user._id].lastname)}`}</small>
                                    : <small>{`${_.startCase(user.firstname)} ${_.startCase(user.lastname)}`}</small> : null
                                }
                            </div>
                        )
                        : "N/A"
                    }
                </div>
                <div className="table-cell -tags">
                    <div className="-status-count">
                        <span>{requestTask._returnedFiles.length}</span>
                    </div>
                </div>
            </div>
        )
    }
}

RequestTaskTableListItem.propTypes = {}

RequestTaskTableListItem.defaultProps = {}

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
    )(RequestTaskTableListItem)
);
