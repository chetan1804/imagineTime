import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../Binder.js.jsx';

import CloseWrapper from './CloseWrapper.js.jsx';
import AlertModal from '../modals/AlertModal.js.jsx';

// import third-party libraries
import _, { defaults } from 'lodash';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * Single button inside the actions area
 */
 const ActionButton = ({
  selectHandler
  , label
  , item
  , disabled
  , selectedRowCount
}) => {

  return (
    <button
      disabled={disabled} 
      className={`yt-btn ${item['additionalButtonClasses'] ? item['additionalButtonClasses'] : ''}`}
      onClick={() => selectHandler(item)}
    >
      {label} { item['showCount'] && selectedRowCount > 0 ? <span> &mdash; {selectedRowCount}</span> : null} 
    </button>
  )
}

class ButtonList extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      confirmModalOpen: false // controls if the confirm dialog is visible or not
      , confirmModalMessage: '' // confirm message displayed inside the confirm dialog
      , confirmModalTitle: '' // title of the confirm dialog
      , confirmModalSelectedItem: {} // selected action item. Used to return the value after the user has given confirmation.
      , confirmModalConfirmText: 'OK' // Confirm button on the confirm dialog
      , confirmModalDeclineText: 'Cancel' // cancel button the confirm dialog
    };
    this._bind(
      'onConfirmModalClose'
      , 'onConfirmModalCancel'
      , 'onItemSelected'
      , 'renderButtonItem'
      , 'onConfirmModalConfirm'
    )
  }

  onConfirmModalClose() {
    this.setState({
        confirmModalOpen: false
    });
  }

  onConfirmModalCancel() {
    this.setState({
        confirmModalOpen: false
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
      this.setState({
        confirmModalOpen: false
        , confirmModalMessage: ''
        , confirmModalTitle: ''
        , confirmModalSelectedItem: {}
        , confirmModalConfirmText: 'OK'
        , confirmModalDeclineText: 'Cancel'        
      });
      this.props.select(item[valueKey]);
    }
  }

  onConfirmModalConfirm(value) {
    this.setState({
      confirmModalOpen: false
      , confirmModalMessage: ''
      , confirmModalTitle: ''
      , confirmModalSelectedItem: {}
      , confirmModalConfirmText: 'OK'
      , confirmModalDeclineText: 'Cancel'        
    });
    this.props.select(value);
  }

  renderButtonItem(item, i) {
    const {
      displayKey
      , valueKey
      , isEnabled
      , selectedRowCount
    } = this.props;

    if(!displayKey || !valueKey) {
      console.error("ERROR in ButtonList! Must supply 'valueKey' and 'displayKey' props when 'items' is an array of objects.")            
    } else {
      return (
        <ActionButton 
          selectHandler={this.onItemSelected}
          label={item[displayKey]}
          disabled={!isEnabled}
          item={item}
          key={item[valueKey] + '_' + i}
          selectedRowCount={selectedRowCount}
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
      confirmModalOpen
      , confirmModalMessage
      , confirmModalTitle
      , confirmModalSelectedItem
      , confirmModalConfirmText
      , confirmModalDeclineText
    } = this.state;

    return (
      <div className='bulk-actions'>
        <span>{label}</span>
        { 
          items.map((item, i) => this.renderButtonItem(item, i))
        }
        <AlertModal
            alertMessage={confirmModalMessage}
            alertTitle={confirmModalTitle}
            closeAction={this.onConfirmModalClose}
            confirmAction={() => this.onConfirmModalConfirm(confirmModalSelectedItem[valueKey])}
            confirmText={confirmModalConfirmText}
            declineAction={this.onConfirmModalCancel}
            declineText={confirmModalDeclineText}
            isOpen={confirmModalOpen}
            type={'danger'}
          >
        </AlertModal>
      </div>
    )
  }
}

ButtonList.propTypes = {
  displayKey: PropTypes.string // key to display on objects
  , items: PropTypes.array.isRequired // all possible items
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , valueKey: PropTypes.string // key to return as selected
  , select: PropTypes.func.isRequired
  , selectedRowCount: PropTypes.number
  , isEnabled: PropTypes.bool
}

ButtonList.defaultProps = {
  displayKey: null 
  , label: 'Actions'
  , valueKey: null
  , selectedRowCount: 0
  , isEnabled: false
}

export default ButtonList;