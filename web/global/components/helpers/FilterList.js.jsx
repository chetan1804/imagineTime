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
}) => {

  return (
    <div className="-filter-item" style={{padding: '8px 8px'}} onClick={() => select(value)}>
      <span htmlFor={value} className=" -content" style={{whiteSpace: 'nowrap'}}> {display}  </span>
    </div>
  )
}

class FilterList extends Binder {
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

  componentWillReceiveProps(nextProps) {
    if (nextProps.selected !== this.state.selected) {
      this.setState({ selected: nextProps.selected });
    }
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
    });
  }

  onItemSelected(value) {
    this.setState({...this.state, isOpen: false, selected: value});
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
        console.error("ERROR in FilterList! Must supply 'valueKey' and 'displayKey' props when 'items' is an array of objects.")            
      } else {
        return (
          <ListItem 
            select={this.onItemSelected}
            display={item[displayKey]}
            value={item[valueKey]}
            key={label + '_' + item[valueKey] + '_' + i}
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
    } = this.props;

    const btnClass = classNames(
      'yt-btn x-small -filter-btn'
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
          onClick={() => this.onListOpen()}
          disabled={this.props.isEnabled !== true}
        >
          {label} 
          <span> ({this.state.selected ? this._getLabel(this.state.selected) : 'None Selected'})</span>
        </button>
        <TransitionGroup >
          {this.state.isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
              <div className="-filter-menu" style={{minWidth: 50, overflow: 'auto', right: 'initial', left: '0', padding: '4px 10px'}}>
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

FilterList.propTypes = {
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
  , isEnabled: PropTypes.bool
}

FilterList.defaultProps = {
  displayKey: null
  , label: 'Filter'
  , selected: null
  , valueKey: null
  , isEnabled: false
}

export default FilterList;