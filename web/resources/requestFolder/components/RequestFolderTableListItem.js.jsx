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
import * as requestFolderActions from '../requestFolderActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { TextInput } from '../../../global/components/forms';
import CloseWrapper  from '../../../global/components/helpers/CloseWrapper.js.jsx'

// import components
import SingleRequestFolderOptions from './SingleRequestFolderOptions.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

class RequestTableListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            singleOptionOpen: false
            , updateName: false
            , newName: ""
            , nameErrorMessage: false
            , submitting: false
        }
        this._bind(
            'singleOptionClosed'
            , '_handleToggleUpdateName'
            , '_handleUpdateName'
            , '_handleFormChange'
        );
    }

    singleOptionClosed(e) {
        e.stopPropagation();
        this.setState({
            singleOptionOpen: false
        });
    }

    _handleUpdateName() {
        const newName = _.cloneDeep(this.state.newName);
        console.log("test", newName)
        const { match, dispatch, listArgs, requestFolder } = this.props;
        requestFolder.name = newName;
        this.setState({ submitting: true });
        dispatch(requestFolderActions.sendUpdateRequestFolder(requestFolder)).then(json => {
            console.log("res", json)
            if (json.success) {
                this.setState({ 
                    updateName: false
                    , newName: ""
                    , submitting: false
                });
            } else {
                this.setState({ 
                    nameErrorMessage: json.error
                    , submitting: false
                });
            }
        });
    }

    _handleFormChange(e) {
        /**
         * This let's us change arbitrarily nested objects with one pass
         */
        let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
            return e.target.value;
        });
        this.setState(newState);
    }

    _handleToggleUpdateName(e) {
        e.stopPropagation();
        const { requestFolder } = this.props;
        this.setState({ 
            singleOptionOpen: false
            , updateName: true
            , newName: requestFolder.name 
        });
    }

    render() {
        const {
            checked
            , requestFolder
            , handleSelectRequest
            , clearSelectedRequestIds
            , userMap
            , handleUpdateRequest
            , match
            , isViewing
        } = this.props;

        const {
            singleOptionOpen
            , updateName
            , newName
            , nameErrorMessage
            , submitting
        } = this.state;


        const isInvalidName = submitting || !newName || (requestFolder && requestFolder.name.trim() === newName.trim());

        return (
            <div className="table-row -file-item -requestFolder-list-table">
                {
                    isViewing === "portal" ? null :
                    <div className="table-cell">
                        <div className="-options"
                            onClick={() => this.setState({ singleOptionOpen: true })}>
                            <div style={{position: "relative", height: "100%", width: "100%"}}>
                                <CloseWrapper
                                    isOpen={singleOptionOpen}
                                    closeAction={this.singleOptionClosed}
                                />
                                <i className="far fa-ellipsis-v"></i>
                                <SingleRequestFolderOptions
                                    isOpen={singleOptionOpen}
                                    closeAction={this.singleOptionClosed}
                                    requestFolder={requestFolder}
                                    handleUpdateName={this._handleToggleUpdateName} 
                                />
                            </div>
                        </div>
                    </div>
                }
                <div className="table-cell -title">
                    <div className="yt-row center-vert">
                        <span className="-icon">
                            <img src={brandingName.image['folder-empty']} />
                        </span>
                        {
                        updateName ?
                            <div className="-file-info">
                                <div className="yt-row center-vert">
                                <div style={{paddingBottom: 10}}> 
                                    <TextInput
                                        change={this._handleFormChange}
                                        name="newName"
                                        suffix=""
                                        value={newName}
                                        onSubmit={this._handleUpdateName}
                                    />
                                    </div>
                                    <div className="center-vert">
                                        <button className="yt-btn x-small link" onClick={() => this.setState({ updateName: false, newName: "" })} disabled={submitting}>cancel</button>
                                        <button disabled={isInvalidName} className="yt-btn x-small success" onClick={this._handleUpdateName}>save</button>
                                    </div>
                                </div>
                                <p style={{margin: "0.3em 0", color: "#FF2900"}}>{nameErrorMessage}</p>
                            </div>
                            :
                            <div className="-file-info">
                                <Link className="-name" to={`${match.url}/${requestFolder._id}/request-list`} onClick={clearSelectedRequestIds}>
                                    {requestFolder.name}
                                </Link>
                                <br/>
                                {
                                    requestFolder._createdBy && userMap ?
                                    <small>
                                        { userMap[requestFolder._createdBy] ? <span>by {userMap[requestFolder._createdBy].firstname} {userMap[requestFolder._createdBy].lastname}</span>: null }
                                    </small> : null
                                }
                            </div>
                        }
                    </div>
                </div>
                {/* <div className="table-cell">
                    {
                        requestFolder.delegatedAdmin.length ? 
                        requestFolder.delegatedAdmin.map(id =>
                            userMap[id] ?                            
                            <div key={id}>
                                <small>{`${_.startCase(userMap[id].firstname)} ${_.startCase(userMap[id].lastname)}`}</small>
                            </div> : null
                        )
                        : "N/A"
                    }
                </div> */}
                <div className="table-cell">{requestFolder.requests}</div>
                <div className="table-cell">{requestFolder.tasks}</div>
                <div className="table-cell">{requestFolder.uploadedFiles}</div>                
                <div className="table-cell -date">{DateTime.fromISO(requestFolder.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
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
