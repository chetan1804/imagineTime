/**
 * Reusable component for editing details of a clientTaskTemplate
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
// import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import { SingleDatePickerInput, TextInput, FileInput } from '../../../global/components/forms';
import ToggleSwitchInput from '../../../global/components/forms/ToggleSwitchInput.js.jsx';

// import resource components 
import ClientTaskOptionsMenu from '../../clientTask/components/ClientTaskOptionsMenu.js.jsx';

// import utils 
import { displayUtils } from '../../../global/utils/index.js';

// import actions 
import * as clientTaskTemplateActions from '../clientTaskTemplateActions';

class ClientTaskTemplateEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newTaskTemplate: _.cloneDeep(props.clientTaskTemplate)
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {
        ...props.clientTaskTemplateStore.formHelpers
        , edited: false
      }
      , taskOptionsOpen: false
    }
    this._bind(
      '_handleChange'
      , '_handleCreate'
      , '_handleDelete'
      , '_handleSave'
      , '_reorderItem'
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if(!prevState.newTaskTemplate && this.props.clientTaskTemplate) {
      this.setState({
        newTaskTemplate: _.cloneDeep(this.props.clientTaskTemplate)
      })
    }
  }

  _handleChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    newState.formHelpers.edited = true;

    if(e.target.name !== 'newTaskTemplate.dueDate' && e.target.name !== 'newTaskTemplate.needsApproval') {
      this.setState(newState)
    } else {
      // if this was a dueDate or needsApproval change we need to save the clientTaskTemplate AFTER we update state.
      // The other fields save on blur.
      this.setState(newState, () => {
        this._handleSave();
      });
    }
  }

  _handleCreate(args) {
    this.setState({taskOptionsOpen: false})
    this.props.handleCreate(...args);
  }

  _handleDelete(args) {
    this.props.handleDelete(...args);
  }

  _handleSave() {
    const { dispatch } = this.props;

    if(this.state.formHelpers.edited) {
      let newClientTaskTemplate = _.cloneDeep(this.state.newTaskTemplate);
      if(newClientTaskTemplate.dueDate) {
        newClientTaskTemplate.dueDate = new Date(newClientTaskTemplate.dueDate);
      }
      dispatch(clientTaskTemplateActions.sendUpdateClientTaskTemplate(newClientTaskTemplate)).then(taskTemplateRes => {
        if(taskTemplateRes.success) {
          this.setState({
            newTaskTemplate: taskTemplateRes.item
            , formHelpers: {
              ...this.state.formHelpers 
              , edited: false 
            }
          });
        } else {
          alert("ERROR - Check logs");
        }
      });
    } else {
      console.log("No edits to save.")
    }
  }

  _reorderItem(fromIndex, toIndex) {    
    this.props.reorderItem(fromIndex, toIndex)
  }

  render() {
    const { newTaskTemplate } = this.state;
    const { index, clientTaskTemplate, clientWorkflowTemplate, isEditable } = this.props;

    const taskEditorClass = classNames(
      '-task-editor'
      , {'-draft': clientTaskTemplate && clientTaskTemplate.status === 'draft'}
    )
    
    return (
      <div className={taskEditorClass}>
        { clientTaskTemplate && newTaskTemplate ?
          <div>
            <CloseWrapper
              isOpen={(this.state.taskOptionsOpen )}
              closeAction={() => this.setState({taskOptionsOpen: false})}
            />
            { isEditable ?
            <div>
              <button type="button" onClick={() => this._handleDelete(['taskTemplate', index])} className="yt-btn link xx-small u-pullRight"><i className="far fa-times"></i></button>

              { index > 0 ?
                <button type="button" onClick={() => this._reorderItem(index, index - 1)} className="yt-btn link xx-small"><i className="far fa-arrow-up"></i></button>
                :
                null
              }
              { index < clientWorkflowTemplate.items.length -1 ?
                <button type="button" onClick={() => this._reorderItem(index, index + 1)} className="yt-btn link xx-small"><i className="far fa-arrow-down"></i></button>
                :
                null
              }
            </div>
            :
            null
            }
            <div className="-task-title">
              <div className={`-task-type -${clientTaskTemplate.type}`}>
                <span className="-icon"><i className={displayUtils.getTaskIcon(clientTaskTemplate.type)}/></span><span className="-index">{index + 1}</span>
              </div>
              <div className="-task-input">
                <TextInput
                  blur={this._handleSave}
                  change={this._handleChange}
                  disabled={!isEditable}
                  name="newTaskTemplate.title"
                  placeholder={displayUtils.getTaskPlaceholder(clientTaskTemplate.type)}
                  value={newTaskTemplate.title || ''}
                />
              </div>
              <div className="yt-col">
                <ToggleSwitchInput
                  change={this._handleChange}
                  disabled={!isEditable}
                  label={'Needs Approval'}
                  name={'newTaskTemplate.needsApproval'}
                  required={false}
                  rounded={true}
                  styles={{textAlign: 'center', paddingLeft: '12px', paddingRight: '12px', whiteSpace: 'nowrap'}}
                  value={newTaskTemplate.needsApproval}
                />
              </div>
              <div className="-editor-due-date">
                <SingleDatePickerInput
                  anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                  change={this._handleChange}
                  disabled={!isEditable}
                  initialDate={DateTime.fromISO(newTaskTemplate.dueDate).toMillis() || ''} // epoch/unix time in milliseconds
                  label="Due Date"
                  name='newTaskTemplate.dueDate'
                  numberOfMonths={1}
                  placeholder={""}
                />
              </div>
            </div>
            { isEditable ?
              <div>
                <div className="add-new-task" onClick={() => this.setState({taskOptionsOpen: true})}>
                  <span className="-icon">
                    <i className="far fa-plus"/>
                  </span>
                </div>
                <div className="dropdown">
                  <ClientTaskOptionsMenu
                    handleCreate={this._handleCreate}
                    index={index + 1}
                    isOpen={this.state.taskOptionsOpen}
                  />
                </div>
              </div>
              :
              null
            }
          </div>
          :
          null 
        }
      </div>
    )
  }
}


ClientTaskTemplateEditor.propTypes = {
  clientTaskTemplate: PropTypes.object
  , dispatch: PropTypes.func.isRequired
  , handleCreate: PropTypes.func
  , handleDelete: PropTypes.func
  , index: PropTypes.number 
  , reorderItem: PropTypes.func
}

ClientTaskTemplateEditor.defaultProps = {
  index: null 
  , clientTaskTemplate: null 
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientTaskTemplateStore: store.clientTaskTemplate
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientTaskTemplateEditor)
);