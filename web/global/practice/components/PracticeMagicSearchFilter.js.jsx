/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as firmActions from '../../../resources/firm/firmActions';

// import global components
import Binder from '../../components/Binder.js.jsx';
import CloseWrapper from '../../components/helpers/CloseWrapper.js.jsx';
import { routeUtils } from '../../utils';

import { 
  SearchInput 
  , SelectFromObject
  , ToggleSwitchInput 
  , SingleDatePickerInput
  , CheckboxInput
  , DateRangePickerInput
  , TextInput
} from '../../components/forms';

// import resource components 
import ClientTaskSearchItem from '../../../resources/clientTask/components/ClientTaskSearchItem.js.jsx';
import ClientWorkflowSearchItem from '../../../resources/clientWorkflow/components/ClientWorkflowSearchItem.js.jsx';
import FileSearchItem from '../../../resources/file/components/FileSearchItem.js.jsx';
import QuickTaskSearchItem from '../../../resources/quickTask/components/QuickTaskSearchItem.js.jsx';
import _ from 'lodash';

class PracticeMagicSearchFilter extends Binder {
  constructor(props) {
    super(props);
        this.state = {
            advanceSearch: true
            , filter: {
                dateCreated: {
                    startDate: DateTime.local().minus({ days: 30 }).toMillis()
                    , endDate: DateTime.local().toMillis()
                }
                , clientName: ""
                , creatorName: ""
                , status: {
                    visible: true
                    , hidden: true
                    , archived: true
                }
                , typeName: ""
            }
        }
        this._bind(
            '_handleFormChange'
            , '_handleClear'
        )
    }

    componentDidMount() {
        const { dispatch, match } = this.props;
        // fire actions
    }

    _handleClear() {
        this.setState({
            filter: {
                dateCreated: {
                    startDate: DateTime.local().minus({ days: 30 }).toMillis()
                    , endDate: DateTime.local().toMillis()
                }
                , clientName: ""
                , creatorName: ""
                , status: {
                    visible: true
                    , hidden: true
                    , archived: true
                }
                , typeName: ""
            }
        }, () => {
            const filter = _.cloneDeep(this.state.filter);
            this.props.handleFilterChange(filter);
        });
    }

    componentWillUnmount() {
        this._handleClear();
    }

    _handleFormChange(e) {
        let newState = _.update( this.state, e.target.name, function() {
            return e.target.value;
        });
        this.setState(newState, () => {
            if (this.props.handleFilterChange) {
                const filter = _.cloneDeep(this.state.filter);
                this.props.handleFilterChange(filter);
            }
        });
    }

  render() {

    const {
        handleSearch
    } = this.props;
    const {
        advanceSearch
        , filter
    } = this.state;
    const {
        dateCreated
        , clientName
        , creatorName
        , status
        , typeName
    } = filter;
    return (
        <div className="-share-link-configuration -advance-search">
            <div className="-header title" onClick={() => this.setState({ advanceSearch: !advanceSearch })} style={advanceSearch ? {} : { marginBottom: 0 }}>
                <label >Advanced Search</label>
            </div>
            <div className="-advance-search-field" style={advanceSearch ? {} : { display: "none" }}>
                <div className="yt-row">
                    <div className="yt-col">
                    <div>
                        <CheckboxInput
                            name="filter.dateCreated.enable"
                            label="Date created:"
                            value={false}
                            change={this._handleFormChange}
                            checked={false}
                            classes="-label-field"
                        />
                        <DateRangePickerInput
                            startDatePlaceholderText="from"
                            endDatePlaceholderText="to"
                            dateRange={dateCreated}
                            change={this._handleFormChange}
                            minDate={0}
                            disabled={false}
                            name="filter.dateCreated"
                        />
                    </div>
                    </div>
                    <div className="yt-col">
                    <div>
                        <CheckboxInput
                            name="filter.client.enable"
                            label="Client name:"
                            value={false}
                            change={this._handleFormChange}
                            checked={false}
                            classes="-label-field"
                        />
                        <TextInput
                            change={this._handleFormChange}
                            name="filter.clientName"
                            value={clientName}
                            disabled={false}
                            classes="-input-field"
                        />
                    </div>
                    </div>
                </div>
                <hr className="-desktop-only" />
                <div className="yt-row" style={{ height: "55px" }}>
                    <div className="yt-col">
                        <div>
                            <CheckboxInput
                                name="filter.creator.enable"
                                label="Uploaded by:"
                                value={false}
                                change={this._handleFormChange}
                                checked={false}
                                classes="-label-field"
                            />
                            <TextInput
                                change={this._handleFormChange}
                                name="filter.creatorName"
                                value={creatorName}
                                disabled={false}
                                classes="-input-field"
                            />
                        </div>
                    </div>
                    <div className="yt-col">
                        <div>
                            <CheckboxInput
                                name="filter.type.enable"
                                label="File type:"
                                value={false}
                                change={this._handleFormChange}
                                checked={false}
                                classes="-label-field -file-type"
                            />
                            <TextInput
                                change={this._handleFormChange}
                                name="filter.typeName"
                                value={typeName}
                                disabled={false}
                                classes="-input-field"
                                helpText="eg. pdf, doc, image,(or img type: png)"
                            />
                        </div>
                </div>
                </div>
                <hr className="-desktop-only" />
                <div className="yt-row" style={{ height: "20px" }}>
                    <div className="-file-status">
                    <label></label>
                    <CheckboxInput
                        name="filter.status.visible"
                        label="visible"
                        value={status.visible}
                        change={this._handleFormChange}
                        checked={status.visible}
                    />
                    <CheckboxInput
                        name="filter.status.hidden"
                        label="hidden"
                        value={status.hidden}
                        change={this._handleFormChange}
                        checked={status.hidden}
                    />
                    <CheckboxInput
                        name="filter.status.archived"
                        label="archived"
                        value={status.archived}
                        change={this._handleFormChange}
                        checked={status.archived}
                    />
                    </div>
                </div>
                <hr className="-desktop-only" />
                <div className="yt-row" style={{ display: "flow-root" }}>
                    <div style={{ float: "right" }}>
                        <button className="yt-btn x-small link info" onClick={this._handleClear}>Clear Filter</button>
                        <button className="yt-btn x-small rounded info" style={{ marginLeft: "10px" }} onClick={handleSearch}>Apply Filter</button>
                    </div>
                </div>
            </div>
        </div>
    )
  }
}

PracticeMagicSearchFilter.propTypes = {
}

PracticeMagicSearchFilter.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeMagicSearchFilter)
);
