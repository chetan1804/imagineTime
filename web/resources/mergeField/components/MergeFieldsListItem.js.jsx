// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { DateTime } from 'luxon';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
// import SingleFolderTemplateOptions from './SingleFolderTemplateOptions.js.jsx';
import { CheckboxInput } from '../../../global/components/forms';
import Binder from '../../../global/components/Binder.js.jsx';

import displayUtils from '../../../global/utils/displayUtils';

class MergeFieldsListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            mergeFieldOptionsOpen: false
            , copySuccess: false
        }
        this._bind(
            '_handleCloseMergeFieldOptions'
            , '_copyToClipboard'
        )
    }

    _handleCloseMergeFieldOptions(e) {
        e.stopPropagation();
        this.setState({ mergeFieldOptionsOpen: false });
    }

    _copyToClipboard() {
        this.linkInput.select();
        document.execCommand('copy');
        this.setState({ copySuccess: true }, () => {
            setTimeout(() => {
                this.setState({ copySuccess: false });
            }, 2000);
        });
    }

    render() {
        const {
            mergeField
            , firmStore
            , addressMap
            , loggedInUser
            , phoneNumberMap
        } = this.props;

        const {
            mergeFieldOptionsOpen
            , copySuccess
        } = this.state;

        const isEmpty = (
            !mergeField
            || !mergeField._id
        )

        const selectedFirm = firmStore.selected.getItem();
        const value = displayUtils.getMergeFieldValue(mergeField.name, {
            firm: selectedFirm || {}
            , user: loggedInUser || {}
            , addressMap: addressMap || {}
            , phoneNumberMap: phoneNumberMap || {}
        });

        return isEmpty ?
            (<div>
                <div className="table-cell"><i className="far fa-spinner fa-spin"/>  Loading...</div>
            </div>)
            :
            (<div className="table-row -file-item">
                <div className="table-cell">
                    <input ref={(input) => this.linkInput = input} value={`{{${mergeField.name}}}`} readOnly={true} className="input-view-text" />
                </div>
                <div className="table-cell">{value || "n/a"}</div>
                <div className="table-cell" style={{ textAlign: "right" }}>
                    <i  className={"fas fa-copy " + (copySuccess ? "-active" : "")} onClick={this._copyToClipboard} style={{ cursor: "pointer" }} />
                </div>
            </div>)
    }
}

MergeFieldsListItem.propTypes = {
    mergeField: PropTypes.object.isRequired
}

MergeFieldsListItem.defaultProps = {
    mergeField: {}
}

const mapStoreToProps = (store) => {
    /**
    * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
    * differentiated from the React component's internal state
    */
    return {
      firmStore: store.firm
      , addressMap: store.address.byId
      , loggedInUser: store.user.loggedIn.user
      , phoneNumberMap: store.phoneNumber.byId
    }
  }
  
  export default withRouter(
    connect(
      mapStoreToProps
    )(MergeFieldsListItem)
  );
  