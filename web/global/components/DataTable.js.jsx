/**
 * Helper component to let the user select (and order) a list from the given
 * source list.
 * First usage is to let the user select which columns to display on a list
 * screen in what order.
 */

import React from 'react';
import PropTypes from 'prop-types';

import * as constants from '../../config/constants.js'

import Binder from './Binder.js.jsx';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { DateTime } from 'luxon';

// import helper components
import TableHeaderCell from './TableHeaderCell.js.jsx'

// import styles
import Styles from './DataTable.css'

class DataTable extends Binder {
  constructor(props) {
    super(props);
    this.state = {};
    this._bind(
      'renderTable'
      , 'renderHeaderCell'
      , 'renderData'
      , 'renderDataCell'
      , 'renderRowAction'
      , 'formatCellData'
      , 'getColumnCount'
    )
  }

  getColumnCount(displayColumns, columnVisibility, rowActions) {
    let columnCount = displayColumns.length;
    columnCount += (columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] ? 1 : 0);
    columnCount += (columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] ? 1 : 0);
    displayColumns.forEach(column => {
      if(!columnVisibility[column.key]) {
        columnCount--;
      }
    });
    if(!!rowActions && rowActions.length > 0) {
      columnCount++;
    }
    return columnCount;
  }

  renderTable(data, displayColumns, columnVisibility, checkboxesState
    , checkboxNamePrefix, onSelectAllCheckboxStateChange, onCheckboxStateChange
    , checkboxDisplayCriteriaFunction, rowActions, onSort, currentSortOrderAttribute
    , isCurrentSortOrderAscending, isSelectAllChecked, emptyTableMessage
    , isProcessing) {

    let columnCount = this.getColumnCount(displayColumns, columnVisibility, rowActions);

    return (
      <table className='yt-table  truncate-cells'>
        <thead>
          <tr key="hrow">
            <TableHeaderCell display={columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION]} style={{width: 25, textAlign: 'left'}} key={constants.SPECIAL_COLUMN_NOTIFICATION} />

            <TableHeaderCell display={columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX]} style={{width: 25, textAlign: 'left'}} key={constants.SPECIAL_COLUMN_CHECKBOX}>
              <input
                checked={isSelectAllChecked}
                name='note_SelectAll'
                onChange={() => onSelectAllCheckboxStateChange()}
                type="checkbox"
                value='__selectAll'
              />
            </TableHeaderCell>

            {
              displayColumns.map((displayColumn) => this.renderHeaderCell(displayColumn, columnVisibility, onSort, currentSortOrderAttribute, isCurrentSortOrderAscending))
            }
            <TableHeaderCell display={!!rowActions && rowActions.length > 0} style={{maxWidth: 25, textAlign: 'left'}} key={constants.SPECIAL_COLUMN_ROWACTIONS} />
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ?
            data.map((row) => this.renderData(row, displayColumns, columnVisibility
              , checkboxesState, checkboxNamePrefix, onCheckboxStateChange
              , checkboxDisplayCriteriaFunction, rowActions))
            :
            isProcessing ? null :
            <tr><td colSpan={columnCount} className='no-data'><i className='fal fa-frown' />{emptyTableMessage}</td></tr>
          }
        </tbody>
      </table>
    );
  }

  renderHeaderCell(displayColumn, columnVisibility, onSort, currentSortOrderAttribute, isCurrentSortOrderAscending) {
    let label = displayColumn.label || null;
    let style = displayColumn.headerStyle || {};
    let isSortable = displayColumn.isSortable || false;
    currentSortOrderAttribute = currentSortOrderAttribute || null;

    return (
      <TableHeaderCell label={label} display={columnVisibility[displayColumn.key]}
      style={style} isSortable={isSortable} sortAttribute={displayColumn.key}
      onSort={onSort} currentSortOrderAttribute={currentSortOrderAttribute}
      isCurrentSortOrderAscending={isCurrentSortOrderAscending}
      key={displayColumn.key}
      />
    )
  }

  renderData(row, displayColumns, columnVisibility, checkboxesState
    , checkboxNamePrefix, onCheckboxStateChange, checkboxDisplayCriteriaFunction
    , rowActions) {

    checkboxNamePrefix = checkboxNamePrefix || '';
    const isChecked = checkboxesState[row.id] || false;
    return (
      <tr key={row.id}>
        {columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] === true ?
          <td style={{width: 25, textAlign: 'left'}} key={`${constants.SPECIAL_COLUMN_NOTIFICATION}_${row.id}`}>
            {!!row.errorMessage ?
            <i className='fas fa-exclamation-triangle' style={{color: 'red', fontSize: '1em', ariaHidden:true}} title={row.errorMessage}></i>
            : null
            }
          </td>
          :
          null
        }

        {columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] === true ?
          <td style={{width: 25, textAlign: 'left'}} key={`${constants.SPECIAL_COLUMN_CHECKBOX}_${row.id}`}>
            {(!checkboxDisplayCriteriaFunction || checkboxDisplayCriteriaFunction(row) === true) ?
            <input
              checked={isChecked}
              name={`${checkboxNamePrefix}_SelectSingle`}
              onChange={() => {onCheckboxStateChange(row.id);}}
              type="checkbox"
              value={row.id}
              id={row.id}
            />
            :
            null
            }
          </td>
          :
          null
        }
        
        {
          displayColumns.map((displayColumn, i) => this.renderDataCell(displayColumn, i, row, columnVisibility))
        }
        {!!rowActions && rowActions.length > 0 ?
        <td className={Styles['rowActions']} key={`${constants.SPECIAL_COLUMN_ROWACTIONS}_${row.id}`}>
          {
            rowActions.map((rowAction, i) => this.renderRowAction(rowAction, i, row))
          }
          </td>
        :
          null
        }
    </tr>
    );
  }

  renderRowAction(rowAction, i, row) {
    let style = rowAction.style || {};
    return (
        (!rowAction.displayCriteriaFunction || rowAction.displayCriteriaFunction(row) === true) ?
          <div onClick={(event) => {rowAction.eventHandler(event, row)}} title={rowAction.tooltipText} key={`${constants.SPECIAL_COLUMN_ROWACTIONS}_${row.id}_${rowAction.label}`}>{rowAction.label}</div>
          :
          null
    );
  }

  renderDataCell(displayColumn, i, row, columnVisibility) {
    let isColumnVisible = columnVisibility[displayColumn.key] || false;
    let style = displayColumn.style || {};
    if(isColumnVisible) {
      return (
        <td style={style} key={`${displayColumn.key}_${row.id}`}>
          {!!displayColumn.valueFunction ?
            displayColumn.valueFunction(row[displayColumn.key], row, displayColumn.params)
            :
            this.formatCellData(displayColumn, row[displayColumn.key])
          }
        </td>
      );
    }
    return null;
  }

  formatCellData(displayColumn, obj) {
    if(!obj) {
      return '';
    }
    if(!displayColumn.dataType || !displayColumn.format) {
      return obj;
    }
    if(displayColumn.dataType === constants.DATATYPE_DATE) {
      if(!displayColumn.format) {
        return DateTime.fromISO(obj).toFormat('LL/dd/yyyy');
      }
      else {
        return DateTime.fromISO(obj).toFormat(displayColumn.format);
      }
    }
    if(displayColumn.dataType === constants.DATATYPE_TIME) {
      if(!displayColumn.format) {
        return DateTime.fromISO(obj).toFormat('hh:mm:ss a');
      }
      else {
        return DateTime.fromISO(obj).toFormat(displayColumn.format);
      }

    }
    if(displayColumn.dataType === constants.DATATYPE_DATETIME) {
      if(!displayColumn.format) {
        return DateTime.fromISO(obj).toFormat('LL/dd/yyyy hh:mm:ss a');
      }
      else {
        return DateTime.fromISO(obj).toFormat(displayColumn.format);
      }
    }
  }

  render() {
    const {
      displayColumns
      , columnVisibility
      , data
      , onSort
      , currentSortOrderAttribute
      , isCurrentSortOrderAscending
      , onSelectAllCheckboxStateChange
      , checkboxesState
      , checkboxNamePrefix
      , onCheckboxStateChange
      , isSelectAllChecked
      , checkboxDisplayCriteriaFunction
      , rowActions
      , animate
      , emptyTableMessage
      , isProcessing
    } = this.props;

    const btnClass = classNames(
      'yt-btn x-small -action-btn'
    )
    return (
        <TransitionGroup >
          {animate ?
          <CSSTransition
            classNames="fade"
            timeout={250}>
              {
                this.renderTable(data, displayColumns, columnVisibility
                  , checkboxesState, checkboxNamePrefix
                  , onSelectAllCheckboxStateChange, onCheckboxStateChange
                  , checkboxDisplayCriteriaFunction, rowActions, onSort
                  , currentSortOrderAttribute, isCurrentSortOrderAscending
                  , isSelectAllChecked, emptyTableMessage, isProcessing)
              }
          </CSSTransition>
            :
            this.renderTable(data, displayColumns, columnVisibility
              , checkboxesState, checkboxNamePrefix
              , onSelectAllCheckboxStateChange, onCheckboxStateChange
              , checkboxDisplayCriteriaFunction, rowActions, onSort
              , currentSortOrderAttribute, isCurrentSortOrderAscending
              , isSelectAllChecked, emptyTableMessage, isProcessing)
        }
        </TransitionGroup>
    )
  }
}

DataTable.propTypes = {
  // The columns to be displayed. Must at least have label and value attributes.
  // Value attribute must be the name of the value attribute in data array
  // objects and attribute name in columnVisibility object.
  displayColumns: PropTypes.array.isRequired
  , columnVisibility: PropTypes.object.isRequired
  , data: PropTypes.array.isRequired
  , onSort: PropTypes.func
  , currentSortOrderAttribute: PropTypes.string
  , isCurrentSortOrderAscending: PropTypes.bool
  , checkboxesState: PropTypes.object
  , checkboxNamePrefix: PropTypes.string
  , onSelectAllCheckboxStateChange: PropTypes.func
  , onCheckboxStateChange: PropTypes.func
  , isSelectAllChecked: PropTypes.bool
  , checkboxDisplayCriteriaFunction: PropTypes.func
  , rowActions: PropTypes.array
  , animate: PropTypes.bool
  , emptyTableMessage: PropTypes.string
  , isProcessing: PropTypes.bool
  , link: PropTypes.bool
  , getLinkURLFunction: PropTypes.func
  , getLinkURLFunctionParams: PropTypes.object
}

DataTable.defaultProps = {
  onSort: null
  , currentSortOrderAttribute: ''
  , isCurrentSortOrderAscending: true
  , checkboxesState: {}
  , checkboxNamePrefix: ''
  , onSelectAllCheckboxStateChange: null
  , onCheckboxStateChange: null
  , isSelectAllChecked: false
  , checkboxDisplayCriteriaFunction: null
  , rowActions: null
  , animate: false
  , emptyTableMessage: 'No data found'
  , isProcessing: false
  , link: false
  , getLinkURLFunction: null
  , getLinkURLFunctionParams: null
}

export default DataTable;