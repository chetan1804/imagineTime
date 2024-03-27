/**
 * Helper component to let the user select (and order) a list from the given
 * source list.
 * First usage is to let the user select which columns to display on a list
 * screen in what order.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Binder from '../Binder.js.jsx';
import CloseWrapper from './CloseWrapper.js.jsx';
import Modal from '../modals/Modal.js.jsx';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import styles
import Styles from './SelectOrderedSubList.css'

/**
 * Single row inside the drop down list
 */
const AvailableListItem = ({
  selectHandler
  , label
  , value
  , item
}) => {

  return (
    <div className={Styles['available-list-item']}>
      <div style={{display: 'flex'}} onClick={() => selectHandler(item)}>
        <input type='checkbox' name='AvailableItem' value={value} checked={item.isSelected} disabled={item.isSelected ? 'disabled' : null} />
      </div>
      <div style={{paddingLeft: '10px'}}>{label}</div>
    </div>
  )
}

/**
 * Single row inside the drop down list
 */
 const SelectedListItem = ({
  unselectHandler
  , moveHandler
  , label
  , item
}) => {

  return (
    <div className={Styles['selected-list-item']}>
      <div style={{width: '100%'}}>{label}</div>
      <div style={{marginLeft: '10px', cursor: 'pointer', width: '50px', textAlign: 'center'}} className="fal fa-chevron-up" onClick={() => moveHandler(item, true)}> </div>
      <div style={{marginLeft: '10px', cursor: 'pointer', width: '50px', textAlign: 'center'}} className="fal fa-chevron-down" onClick={() => moveHandler(item, false)}> </div>
      <div style={{marginLeft: '10px', cursor: 'pointer', width: '50px', textAlign: 'center'}} className="fal fa-times" onClick={() => unselectHandler(item)}> </div>
    </div>
  )
}

class SelectOrderedSubList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      // controls if the modal dialog is visible or not
      isOpen: props.isOpen
      // list items to be displayed as available
      , availableItems: this.getAvailableItems(props.allItems, props.selectedItems, props.valueKey)
      // list items to be displayed as selected
      , selectedItems: props.selectedItems 
    };

    this._bind(
      'renderAvailableListItem'
      , 'renderSelectedListItem'
      , 'onItemSelected'
      , 'onItemUnselected'
      , 'onItemMoved'
      , 'handleDone'
      , 'handleCancelled'
      , 'getAvailableItems'
    )
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.isOpen !== this.state.isOpen) {
      this.setState({isOpen: nextProps.isOpen})
    }
  }

  getAvailableItems(allItems, selectedItems, valueKey) {
    // make a map of values in the selectedItems so that isSelected of
    // availableItems can be set to true.
    let selectedItemsObj = {};
    selectedItems.forEach(item => {
      selectedItemsObj[item[valueKey]] = 'y';
    });

    // loop over all items and set the isSelected to true for the already
    // selected items in the returned availableItems array.
    let availableItems = [];
    allItems.forEach(item => {
      availableItems.push(item);
      item['isSelected'] = !!selectedItemsObj[item[valueKey]];
    })
    return availableItems;
  }

  onItemSelected(selectedItem) {
    const {valueKey} = this.props;
    let {availableItems, selectedItems} = this.state;

    let availableItemIndex = _.findIndex(availableItems, (item) => { return item[valueKey] == selectedItem[valueKey]; });
    if(availableItemIndex < 0) { // item not found in the available items array. Should never happen.
      return;
    }
    
    availableItems[availableItemIndex].isSelected = true;

    let selectedItemIndex = _.findIndex(selectedItems, (item) => { return item[valueKey] == selectedItem[valueKey]; });
    if(selectedItemIndex > -1) { // item already selected. Should never happen
      this.setState({selectedItems, availableItems});
      return;
    }

    selectedItems.push(selectedItem);
    this.setState({selectedItems, availableItems});
  }

  onItemUnselected(unselectedItem) {
    const {valueKey} = this.props;
    let {availableItems, selectedItems} = this.state;

    let availableItemIndex = _.findIndex(availableItems, (item) => { return item[valueKey] == unselectedItem[valueKey]; });
    if(availableItemIndex >= 0) { // item found in the available items array.
      availableItems[availableItemIndex].isSelected = false;
    }
    
    let selectedItemIndex = _.findIndex(selectedItems, (item) => { return item[valueKey] == unselectedItem[valueKey]; });
    if(selectedItemIndex < 0) { // item not found in selectedItems array. Should never happen
      this.setState({selectedItems, availableItems});
      return;
    }

    selectedItems.splice(selectedItemIndex, 1);
    this.setState({selectedItems, availableItems});
  }

  onItemMoved(movedItem, isMovedUp) {
    let {selectedItems} = this.state;
    const {valueKey} = this.props;
    let currentIndex = _.findIndex(selectedItems, function(selecteItem) { return selecteItem[valueKey] == movedItem[valueKey]; });
    if(currentIndex < 0) { // item not found. Should never happen
      return;
    }
    if(currentIndex === 0 && isMovedUp) { // can not move the first item up
      return;
    }
    if(currentIndex === (selectedItems.length - 1) && isMovedUp === false) { // can not move the last item down
      return;
    }

    let toIndex = currentIndex + (isMovedUp ? -1 : 1);
    // move the item in the selectedItems
    selectedItems.splice(currentIndex, 1);
    selectedItems.splice(toIndex, 0, movedItem);

    this.setState({selectedItems});
  }

  handleCancelled() {
    this.setState({
        isOpen: false
    });
    this.props.onCancelled();
  }

  handleDone() {
    this.setState({
        isOpen: false
    });
    this.props.onDone(this.state.selectedItems);
  }

  renderAvailableListItem(item, i) {
    const {
      displayKey
      , valueKey
    } = this.props;

    if(!displayKey || !valueKey) {
      console.error("ERROR in OrderedSubList! Must supply 'valueKey' and 'displayKey' props when 'allItems' is an array of objects.")            
    } else {
      return (
        <AvailableListItem 
          selectHandler={this.onItemSelected}
          label={item[displayKey]}
          item={item}
          key={item[valueKey] + '_' + i}
        />
      )
    }
  }

  renderSelectedListItem(item, i) {
    const {
      displayKey
      , valueKey
    } = this.props;

    if(!displayKey || !valueKey) {
      console.error("ERROR in OrderedSubList! Must supply 'valueKey' and 'displayKey' props when 'allItems' is an array of objects.")            
    } else {
      return (
        <SelectedListItem 
          unselectHandler={this.onItemUnselected}
          moveHandler={this.onItemMoved}
          label={item[displayKey]}
          item={item}
          key={item[valueKey] + '_' + i}
        />
      )
    }
  }

  render() {
    const {
      title
      , availableListLabel
      , selectedListLabel
    } = this.props;

    const { 
      isOpen
      , availableItems
      , selectedItems
    } = this.state;

    const btnClass = classNames(
      'yt-btn x-small -action-btn'
    )
    return (
      <Modal
      isOpen={isOpen}
      cardSize="large"
      modalHeader={title}
      showButtons={false}
      showClose={true}
      closeAction={this.handleCancelled}
      >
        <TransitionGroup >
          {isOpen ?
          <CSSTransition
            classNames="dropdown-anim"
            timeout={250}>
            <div style={{paddingTop: '20px'}}>
              <div style={{display: 'flex', width: '100%'}}>
                <div className={this.props.availableListItem} style={{paddingLeft: '8px', width: '45%'}}>
                  <div style={{display: 'block', fontSize: '24px', paddingLeft: '8px', paddingBottom: '15px'}}>{availableListLabel}</div>
                  { 
                    availableItems.map((item, i) => this.renderAvailableListItem(item, i))
                  }
                </div>
                <div style={{marginLeft: '20px'}}>
                  <div style={{display: 'block', fontSize: '24px', paddingBottom: '15px'}}>{selectedListLabel}</div>
                  { 
                    selectedItems.map((item, i) => this.renderSelectedListItem(item, i))
                  }
                </div>
              </div>
              <div style={{display: 'block', padding: '15px 10px'}}>
                <button 
                  className={btnClass} 
                  onClick={() => this.handleDone()}
                  disabled={!selectedItems || selectedItems.length < 1}>
                  Done
                </button>
                <button 
                  style={{marginLeft: '20px'}}
                  className={btnClass} 
                  onClick={() => this.handleCancelled()}
                  disabled={!selectedItems || selectedItems.length < 1}>
                  Cancel
                </button>
              </div>
            </div>
          </CSSTransition>
            :
            null
          }
        </TransitionGroup>
      </Modal>
    )
  }
}

SelectOrderedSubList.propTypes = {
  title: PropTypes.string // title of the modal
  , allItems: PropTypes.array.isRequired // all possible items
  , selectedItems: PropTypes.array // already selected items
  , displayKey: PropTypes.string // attribute of objects in the allItems used to retrieve the labels for the list items
  , valueKey: PropTypes.string // attribute of objects in the allItems used to retrieve the values for the list items
  , availableListLabel: PropTypes.string // label for the list showing the available items for selection
  , selectedListLabel: PropTypes.string // label for the list showing the selected items
  , onDone: PropTypes.func.isRequired // handler to call when the user is done selecting the items, with selectedItems list passed as input parameter
  , onCancelled: PropTypes.func.isRequired // handler to call when the user cancels and does not want the selected items.
}

SelectOrderedSubList.defaultProps = {
  title: 'Select Columns to Display'
  , selectedItems: []
  , displayKey: null 
  , valueKey: null
  , availableListLabel: 'Available'
  , selectedListLabel: 'Selected'
}

export default SelectOrderedSubList;