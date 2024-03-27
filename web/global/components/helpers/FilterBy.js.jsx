import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../Binder.js.jsx';

import CloseWrapper from './CloseWrapper.js.jsx';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';


const CheckBox = ({
  change
  , checked
  , display 
  , value 
}) => {

  const inputClass = classNames(
    "-item-input-display -checkbox"
    , {
      '-selected': checked
    }
  )
  return (
    <div className="-filter-item" onClick={() => change(value, checked)}>
      <input
        checked={checked}
        onChange={() => console.log('change')}
        className="-item-input"
        name={value}
        type="checkbox"
        value={value}
      />
      <div className={inputClass}>
        <div className='-icon -unchecked '>
          <div className="fal fa-square fa-lg"/>
        </div>
        <div className='-icon -checked'>
          <div className=" fas fa-check-square fa-lg"/>
        </div>
      </div>
      <span htmlFor={value} className=" -content"> {display}  </span>
    </div>
  )
}

class FilterBy extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
      , selected: [...this.props.selected] || []
      , newSelected: [...this.props.selected] || []
    }
    this._bind(
      '_handleApply'
      , '_handleChange'
      , '_renderCheck'
    )
  }

  _handleApply() {
    console.log("APPLY FILTER");
    let returnEvent = {
      target: {
        name: this.props.name
        , value: this.state.newSelected
      }
    } // this will let us generalize it later, for example if year tags are split out
    this.props.applyFilter(returnEvent);
    this.setState({isOpen: false, selected: [...this.state.newSelected]})
  }

  _handleChange(value, checked) {
    // console.log('handlechange')
    let newState = {...this.state}
    console.log(newState)

    if(checked) {
      // un-select this item (remove from selected array)
      console.log('uncheck', value)
      newState.newSelected.splice(this.state.newSelected.indexOf(value), 1)
    } else {
      // add this to selected array 
      console.log('check', value)
      newState.newSelected.push(value)
    }
    console.log(newState)
    this.setState(newState);
  }

  _renderCheck(item, i) {
    const {
      displayKey
      , valueKey
    } = this.props;
    if(typeof(item) === 'object') {
      if(!displayKey || !valueKey) {
        console.error("ERROR in FilterBy! Must supply 'value' and 'display' props when 'items' is an array of objects.")            
      } else {
        return (
          <CheckBox 
            change={this._handleChange}
            checked={this.state.newSelected && this.state.newSelected.indexOf(item[valueKey]) > -1}
            display={item[displayKey]}
            key={item[valueKey] + '_' + i}
            value={item[valueKey]}
          />
        )
      }
    } else if(typeof(item) === 'string') {
      return (
        <CheckBox 
          change={this._handleChange}
          checked={this.state.newSelected && this.state.newSelected.indexOf(item) > -1}
          display={item}
          key={item + '_' + i}
          value={item}
        />
      )
    }
  }

  render() {
    const {
      displayKey
      , items
      , label 
      , valueKey
    } = this.props;

    const btnClass = classNames(
      'yt-btn x-small -filter-btn'
      , { '-filter-applied': this.state.selected.length > 0 }
    )
    // console.log(this.state.selected)
    return (
      <div className="-filter-wrapper">
        <CloseWrapper
          isOpen={this.state.isOpen}
          closeAction={this._handleApply}
        />
        <button 
          className={btnClass} 
          onClick={() => this.setState({isOpen: true})}
        >
          {label} 
          { this.state.selected.length > 0 ? 
            <span> &mdash; {this.state.selected.length}</span> 
            : 
            null 
          }
        </button>
        <TransitionGroup >
          {this.state.isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
              <div className="-filter-menu">
                { Array.isArray(items) ? 
                  items.map((item, i) => this._renderCheck(item, i))
                  : 
                  Object.keys(items).map((key, i) => this._renderCheck(items[key], i))
                }
                <hr/>
                <div className="yt-row space-between -filter-button-tray">
                  <button className="yt-btn x-small link muted" onClick={() => this.setState({newSelected: []})}>Clear</button>
                  <button className="yt-btn x-small link info" onClick={this._handleApply}>Apply</button>
                </div>
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

FilterBy.propTypes = {
  applyFilter: PropTypes.func.isRequired 
  , displayKey: PropTypes.string // key to display on objects
  , items: PropTypes.oneOfType([
    PropTypes.array
    , PropTypes.object
  ]).isRequired // all possible items
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , selected: PropTypes.arrayOf(PropTypes.number) // array of [valueKey's]
  , valueKey: PropTypes.string // key to return as selected
}

FilterBy.defaultProps = {
  displayKey: null 
  , label: 'Filter'
  , selected: []
  , valueKey: null 
}

export default FilterBy;