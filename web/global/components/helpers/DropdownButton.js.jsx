import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../Binder.js.jsx';

import CloseWrapper from './CloseWrapper.js.jsx';

// import third-party libraries
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';


const ListItem = ({
  select
  , display 
  , value
  , disabled
}) => {

  return (
    <div className={`-filter-item ${disabled && "disabled"}`} style={{padding: '8px 8px'}} onClick={() => select(value)}>
      <span htmlFor={value} className=" -content" style={{whiteSpace: 'nowrap'}}> {display}  </span>
    </div>
  )
}

class DropdownButton extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
      , selected: this.props.selected
    }
    this._bind(
      'onListOpen'
      , 'onListClose'
      , 'onItemSelected'
      , '_renderItem'
      , '_getLabel'
    )
  }

  _getLabel(value) {
    const {
      items
      , displayKey
      , valueKey
    } = this.props;
   
    for(let i = 0; i < items.length; i++) {
      if(items[i][valueKey] == value) {
        return items[i][displayKey];
      }
    }
    return '';
  }

  onListOpen() {
    if(!this.props.disabled) {
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
    });
  }

  onItemSelected(value) {
    this.setState({ isOpen: false });
    this.props.select(value);
  }

  _renderItem(item, i) {
    const {
      displayKey
      , valueKey
      , label
    } = this.props;
    if(typeof(item) === 'object') {
      if(!displayKey || !valueKey) {
        console.error("ERROR in DropdownButton! Must supply 'valueKey' and 'displayKey' props when 'items' is an array of objects.")            
      } else {
        return (
          <ListItem 
            select={this.onItemSelected}
            display={item[displayKey]}
            value={item[valueKey]}
            key={label + '_' + item[valueKey] + '_' + i}
            disabled={item.disabled}
          />
        )
      }
    } else if(typeof(item) === 'string') {
      return (
        <ListItem 
            select={this.onItemSelected}
            display={item}
            value={item}
            key={label + '_' + item + '_' + i}
          />
      )
    }
  }

  render() {
    const {
      items
      , label
      , selectedCount
      , disabled
    } = this.props;

    const btnClass = classNames(
      'yt-btn x-small info'
      , { '-filter-applied': !!this.state.selected }
    )
    return (
      <div className="-filter-wrapper">
        <CloseWrapper
          isOpen={this.state.isOpen}
          closeAction={this.onListClose}
        />
        <button 
          className={btnClass} 
          onClick={this.onListOpen}
          disabled={disabled}
        >
          {label}{selectedCount > 0 && <span> — {selectedCount}</span>}
          {/* <span> ({this.state.selected ? this._getLabel(this.state.selected) : 'None Selected'})</span> */}
        </button>
        <TransitionGroup >
          {this.state.isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
              <div className="-filter-menu" style={{minWidth: 50, overflow: 'auto', right: 0, left: 'initial', padding: '4px 10px'}}>
                { Array.isArray(items) ? 
                  items.map((item, i) => this._renderItem(item, i))
                  : 
                  Object.keys(items).map((key, i) => this._renderItem(items[key], i))
                }
              </div>
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>
      </div>
    )
  }
}

DropdownButton.propTypes = {
  displayKey: PropTypes.string // key to display on objects
  , items: PropTypes.oneOfType([
    PropTypes.array
    , PropTypes.object
  ]).isRequired // all possible items
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  , valueKey: PropTypes.string // key to return as selected
  , select: PropTypes.func.isRequired
  , disabled: PropTypes.bool
}

DropdownButton.defaultProps = {
  displayKey: null
  , label: 'Filter'
  , selected: null
  , valueKey: null
  , disabled: false
}

export default DropdownButton;