// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import Binder from './Binder.js.jsx';

/**
 * Returns a <th> element based on the given input parameter values.
 * @param {boolean} display Whether or not to return the HTML element.
 * @param {string} label Header text/label
 * @param {object} style Style object to be applied to the header element.
 * @param {boolean} isSortable Whether or not this table is sortable.
 * @param {string} sortAttribute Attribute value to be returned in the onSort
 * handler.
 * @param {string} currentSortOrderAttribute Attribute(s) by which the table
 * data is currently sorted.
 * handler.
 * @param {boolean} isCurrentSortOrderAscending Whether or not the currently
 * sorted column sorted in ascending order.
 * @param {boolean} onSort Handler to call when a sortable column header is
 * clicked upon.
 * @returns {*} A table header HTML element based on the given input parameter
 * values.
 */
 class TableHeaderCell extends Binder {
    constructor(props) {
      super(props);
    }

    render() {
        const {
            display, label, style, isSortable, sortAttribute
            , currentSortOrderAttribute, isCurrentSortOrderAscending
            , onSort, classNames
            , children
        } = this.props;
        
        if(display === true) {
            if(isSortable === true) {
                return (
                    <th className={`${classNames} sortable`} onClick={() => onSort(sortAttribute)} style={style}
                    >{label}
                    { !!currentSortOrderAttribute && currentSortOrderAttribute == sortAttribute ?
                        isCurrentSortOrderAscending === true ?
                        <i className="fad fa-sort-up"></i>
                        : 
                        <i className="fad fa-sort-down"></i>
                    : 
                    <i className="fad fa-sort"></i>
                    }
                    </th>
                )
            }
            else {
                if(!!children) {
                    return (
                        <th className={classNames} style={style}>{children}</th>
                    )
                }
                return (
                    <th className={classNames} style={style}>{label}</th>
                )
            }
        }
        return null;
    }
}

TableHeaderCell.propTypes = {
    display: PropTypes.bool
  , style: PropTypes.object
  , isSortable: PropTypes.bool
  , sortAttribute: PropTypes.string
  , currentSortOrderAttribute: PropTypes.string
  , isCurrentSortOrderAscending: PropTypes.bool
  , onSort: PropTypes.func
  , classNames: PropTypes.string
}

TableHeaderCell.defaultProps = {
    display: true
    , label: ''
    , style: {}
    , isSortable: false
    , sortAttribute: ''
    , currentSortOrderAttribute: ''
    , isCurrentSortOrderAscending: false
    , onSort: null
    , classNames: '-title'
  }

export default TableHeaderCell;
