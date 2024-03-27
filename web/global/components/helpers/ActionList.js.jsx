import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../Binder.js.jsx';

import CloseWrapper from './CloseWrapper.js.jsx';
import AlertModal from '../modals/AlertModal.js.jsx';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * Single row inside the drop down list
 */
const ListItem = ({
  selectHandler
  , label
  , item
}) => {

  return (
    <div className="-filter-item" style={{padding: '8px 8px'}} onClick={() => selectHandler(item)}>
      <span className=" -content" style={{whiteSpace: 'nowrap'}}> {label}  </span>
    </div>
  )
}

const defaultState = {
  isOpen: false // controls if the drop down list is visible or not
  , confirmModalOpen: false // controls if the confirm dialog is visible or not
  , confirmModalMessage: '' // confirm message displayed inside the confirm dialog
  , confirmModalTitle: '' // title of the confirm dialog
  , confirmModalSelectedItem: {} // selected action item. Used to return the value after the user has given confirmation.
  , confirmModalConfirmText: 'OK' // Confirm button on the confirm dialog
  , confirmModalDeclineText: 'Cancel' // cancel button the confirm dialog
};

class ActionList extends Binder {
  constructor(props) {
    super(props);
    this.state = defaultState;
    this._bind(
      'onListOpen'
      , 'onListClose'
      , 'onItemSelected'
      , 'renderListItem'
      , 'onConfirmModalConfirm'
    )
  }

  onListOpen() {
    if(this.props.isEnabled) {
      this.setState({
        ...this.state
        , isOpen: true
      });
    }
  }

  onListClose() {
    this.setState({
        ...this.state
        , isOpen: false
        , confirmModalOpen: false
    });
  }

  onItemSelected(item) {
    const {selectedRowCount, valueKey} = this.props;
    item['confirmModalConfirmText'] = item['confirmModalConfirmText'] || 'OK'
    if(item.showConfirmModal) {
      this.setState({
        ...this.state
        , isOpen: false
        , confirmModalOpen: true
        , confirmModalMessage: "Are you sure you want to delete the selected " + (this.props.selectedRowCount > 1 ?  selectedRowCount + " " + item.confirmModalLabelPlural : item.confirmModalLabel) + "? This can not be undone. Click '" + item.confirmModalConfirmText + "' to continue."
        , confirmModalTitle: item.confirmModalTitle
        , confirmModalSelectedItem: item
        , confirmModalConfirmText: item.confirmModalConfirmText
        , confirmModalDeclineText: item['confirmModalDeclineText'] || 'Cancel'
      });
    }
    else {
      this.setState(defaultState);
      this.props.select(item[valueKey]);
    }
  }

  onConfirmModalConfirm(value) {
    this.setState(defaultState);
    this.props.select(value);
  }

  renderListItem(item, i) {
    const {
      displayKey
      , valueKey
    } = this.props;

    if(!displayKey || !valueKey) {
      console.error("ERROR in ActionList! Must supply 'valueKey' and 'displayKey' props when 'items' is an array of objects.")            
    } else {
      return (
        <ListItem 
          selectHandler={this.onItemSelected}
          label={item[displayKey]}
          item={item}
          key={item[valueKey] + '_' + i}
        />
      )
    }
  }

  render() {
    const {
      items
      , label
      , valueKey
    } = this.props;

    const { 
      isOpen
      , confirmModalOpen
      , confirmModalMessage
      , confirmModalTitle
      , confirmModalSelectedItem
      , confirmModalConfirmText
      , confirmModalDeclineText
    } = this.state;

    const btnClass = classNames(
      'yt-btn x-small -action-btn'
    )
    return (
      <div className="-filter-wrapper">
        <CloseWrapper
          isOpen={isOpen}
          closeAction={this.onListClose}
        />
        <button 
          className={btnClass} 
          onClick={() => this.onListOpen()}
          disabled={this.props.isEnabled !== true}
        >
          {label}
        </button>
        <TransitionGroup >
          {isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
              <div className="-filter-menu" style={{minWidth: 50, overflow: 'auto', right: '0', left: 'initial', padding: '4px 10px'}}>
                { 
                  items.map((item, i) => this.renderListItem(item, i))
                }
              </div>
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>
        <AlertModal
            alertMessage={confirmModalMessage}
            alertTitle={confirmModalTitle}
            closeAction={this.onListClose}
            confirmAction={() => this.onConfirmModalConfirm(confirmModalSelectedItem[valueKey])}
            confirmText={confirmModalConfirmText}
            declineAction={this.onListClose}
            declineText={confirmModalDeclineText}
            isOpen={confirmModalOpen}
            type={'danger'}
          >
        </AlertModal>
      </div>
    )
  }
}

ActionList.propTypes = {
  displayKey: PropTypes.string // key to display on objects
  , items: PropTypes.array.isRequired // all possible items
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , valueKey: PropTypes.string // key to return as selected
  , select: PropTypes.func.isRequired
  , selectedRowCount: PropTypes.number
  , isEnabled: PropTypes.bool
}

ActionList.defaultProps = {
  displayKey: null 
  , label: 'Actions'
  , valueKey: null
  , selectedRowCount: 0
  , isEnabled: false
}

export default ActionList;