/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
const async = require('async');

// import actions 
import * as staffClientActions from '../../staffClient/staffClientActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'
import Modal from '../../../global/components/modals/Modal.js.jsx';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';

class ActiveStaffListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            submitting: false
            , selectedStaffIds: []
            , progress: null
        }
        this._bind(
            '_handleToggleSelectAll'
            , '_handleSelectStaff'
        );
    }

    componentDidMount() {
        const { socket } = this.props;
        socket.on('assgined_staff_progress', (progress) => {
            this.setState({ progress });
        });
    }

    componentWillUnmount() {
        const { socket, match } = this.props;
        // Remove the event listeners defined in the constructor since they will be attached every time the modal is opened.
        this.setState({
            submitting: false
            , selectedStaffIds: []
            , progress: null
        }, () => {
            socket.off('assgined_staff_progress');
        });
      }

    _handleToggleSelectAll(allStaffSelected) {
        const staffListItems = _.cloneDeep(this.props.staffListItems);
        const selectedStaffIds = _.cloneDeep(this.state.selectedStaffIds);
        if(selectedStaffIds.length > 0 && allStaffSelected) {
            this.setState({
                selectedStaffIds: []
            }, () => {
                if (this.props.handleSelectStaff) {
                    this.props.handleSelectStaff([]);
                }
            });
        } else if(staffListItems) {
            let newSelectedStaff = _.cloneDeep(selectedStaffIds); 
            staffListItems.map(item => newSelectedStaff.indexOf(item._id) < 0 ? newSelectedStaff.push(item._id) : null);
            this.setState({selectedStaffIds: newSelectedStaff}, () => {
                if (this.props.handleSelectStaff) {
                    this.props.handleSelectStaff(newSelectedStaff);
                }
            });
        };
    }

    _handleSelectStaff(staffId) {
        const newStaffIds = _.cloneDeep(this.state.selectedStaffIds);
        if(newStaffIds.indexOf(staffId) === -1) {
            newStaffIds.push(staffId)
        } else {
            newStaffIds.splice(newStaffIds.indexOf(staffId), 1);
        }
        this.setState({ selectedStaffIds: newStaffIds }, () => {
            if (this.props.handleSelectStaff) {
                this.props.handleSelectStaff(newStaffIds);
            }
        });
    }

    render() {
        const {
            close
            , isOpen
            , staffListItems
        } = this.props;

        const {
            submitting
            , selectedStaffIds
            , progress
        } = this.state;

        const allStaffSelected = selectedStaffIds && selectedStaffIds.length ? staffListItems.every(p => selectedStaffIds.indexOf(p._id) > -1) : false; 

        staffListItems.sort((a, b) => a.fullName.localeCompare(b.fullName))

        return (
            <div className="file-list-wrapper">
                {submitting && progress ? <ProgressBar progress={progress} /> : null}
                <table className="yt-table firm-table -workspace-table truncate-cells">
                    <thead>
                        <tr>
                            <th>
                                { true ? 
                                    <CheckboxInput
                                        name="file"
                                        value={allStaffSelected}
                                        change={this._handleToggleSelectAll.bind(this, allStaffSelected)}
                                        checked={allStaffSelected}
                                        disabled={submitting}
                                    />
                                    :
                                    null 
                                }
                            </th>
                            <th className="_40" onClick={null}>Name</th>
                            <th className="_40">Email</th>
                            <th className="_20">Permissions</th>
                            <th className="_10">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        { staffListItems.length ? 
                            staffListItems.map((staff, i) => 
                                <tr key={i}>
                                    <td>
                                        <CheckboxInput
                                            name="file"
                                            value={selectedStaffIds.indexOf(staff._id) > -1}
                                            change={this._handleSelectStaff.bind(this, staff._id)}
                                            disabled={submitting}
                                        />
                                    </td>
                                    <td>{staff && staff.fullName}</td>
                                    <td>{staff && staff.userName}</td>
                                    <td>{staff && staff.owner ? "Owner" : "Standard"}</td>
                                    <td>{staff && staff.status}</td>
                                </tr>
                            )
                            : 
                            <tr className="empty-state">
                                <td colSpan="5">
                                <em>No staffs</em>
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}

ActiveStaffListItem.propTypes = {
  // allFilesSelected: PropTypes.bool 
  dispatch: PropTypes.func.isRequired
}

ActiveStaffListItem.defaultProps = {
  // allFilesSelected: false 
  staffListItems: []
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
    
    return {
        // paginatedList: paginatedList
        loggedInUser: store.user.loggedIn.user
        , socket: store.user.socket
    }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ActiveStaffListItem)
);
