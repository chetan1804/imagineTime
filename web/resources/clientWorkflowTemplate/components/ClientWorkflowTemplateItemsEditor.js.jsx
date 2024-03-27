/**
 * Reusable component for editing details and items on a clientWorkflowTemplate
 * Modified from ClientWorkflowItemsEditor
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import { TextInput, TextAreaInput } from '../../../global/components/forms';

// import resource components
import ClientWorkflowTemplateStatusMenu from './ClientWorkflowTemplateStatusMenu.js.jsx';
import ClientTaskTemplateEditor from '../../clientTaskTemplate/components/ClientTaskTemplateEditor.js.jsx';
// import { ClientWorkflowTemplateItemsEditor as SubClientWorkflowTemplateItemsEditor } from './ClientWorkflowTemplateItemsEditor.js.jsx';
import ClientTaskOptionsMenu from '../../clientTask/components/ClientTaskOptionsMenu.js.jsx';
import ClientWorkflowStatusIndicator from '../../clientWorkflow/components/ClientWorkflowStatusIndicator.js.jsx';

// import utils

// import actions 
import * as clientTaskTemplateActions from '../../clientTaskTemplate/clientTaskTemplateActions';
import * as clientWorkflowTemplateActions from '../clientWorkflowTemplateActions';

class ClientWorkflowTemplateItemsEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newClientWorkflowTemplate: _.cloneDeep(this.props.clientWorkflowTemplate)
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {
        ...this.props.clientWorkflowTemplateStore.formHelpers
        , edited: false
      }
      , taskTemplateOptionsOpen: false 

    }
    this._bind(
      '_createItem'
      , '_deleteItem'
      , '_reorderItem'
      , '_handleChange'
      , '_handleSave'
      , '_handleUpdateStatus'
    );
  }

  componentDidMount() {
    const { dispatch, clientWorkflowTemplate } = this.props;
    dispatch(clientTaskTemplateActions.fetchListIfNeeded('_clientWorkflowTemplate', clientWorkflowTemplate._id));
    // dispatch(clientTaskTemplateActions.fetchListIfNeeded('all')); // For testing. Remove once the migrations are updated and the above fetch actually works.
  }

  _handleChange(e) {

    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    newState.formHelpers.edited = true;
    this.setState(newState);
  }

  _handleUpdateStatus(newStatus) {
    const { dispatch } = this.props;
    this.setState({
      workflowTemplateOptionsOpen: false
    });
    let updatedClientWorkflowTemplate = _.cloneDeep(this.state.newClientWorkflowTemplate)
    updatedClientWorkflowTemplate.status = newStatus;
    dispatch(clientWorkflowTemplateActions.sendUpdateClientWorkflowTemplate(updatedClientWorkflowTemplate)).then(cwtRes => {
      if(cwtRes.success) {
        this.setState({
          newClientWorkflowTemplate: cwtRes.item
          , formHelpers: {
            ...this.state.formHelpers 
            , edited: false 
          }  
        })
      }
    });
  }

  _handleSave(e) {
    const { dispatch } = this.props;
    if(this.state.formHelpers.edited) {
      dispatch(clientWorkflowTemplateActions.sendUpdateClientWorkflowTemplate(this.state.newClientWorkflowTemplate)).then(cwtRes => {
        if(cwtRes.success) {
          // history.push(`/firm/${match.params.firmId}/clients/${match.params.clientId}/client-workflows/${tfRes.item._id}`)
          this.setState({
            newClientWorkflowTemplate: cwtRes.item
            , formHelpers: {
              ...this.state.formHelpers 
              , edited: false 
            }  
          });
        } else {
          alert("ERROR - Check logs");
        }
      });
    }
  }

  _createItem(creating, type, index) {
    // console.log('create item', creating, type, index);
    const { dispatch } = this.props;
    this.setState({taskTemplateOptionsOpen: false})
    if(creating === 'task') {
      let newTaskTemplate = {
        _clientWorkflowTemplate: this.state.newClientWorkflowTemplate._id
        , type: type 
      }
      dispatch(clientTaskTemplateActions.sendCreateClientTaskTemplate(newTaskTemplate)).then(taskTemplateRes => {
        if(taskTemplateRes.success) {
          let newClientWorkflowTemplate = _.cloneDeep(this.state.newClientWorkflowTemplate);
          console.log('newClientWorkflowTemplate', newClientWorkflowTemplate);
          
          if(!index) {
            newClientWorkflowTemplate.items.push({'_clientTaskTemplate': taskTemplateRes.item._id});
          } else {
            newClientWorkflowTemplate.items.splice(index, 0, {'_clientTaskTemplate': taskTemplateRes.item._id});
          }
          dispatch(clientWorkflowTemplateActions.sendUpdateClientWorkflowTemplate(newClientWorkflowTemplate)).then(cwtRes => {
            if(cwtRes.success) {
              this.setState({
                newClientWorkflowTemplate: cwtRes.item
              });
            }
          });
        }
      })
    } else {
      console.log('create sub-client-workflow');
      let newClientWorkflowTemplate = {
        _parent: this.props.clientWorkflowTemplate._id
        , items: []
      }
      dispatch(clientWorkflowTemplateActions.sendCreateClientWorkflowTemplate(newClientWorkflowTemplate)).then(cwtRes => {
        if(cwtRes.success) {
          let updatedClientWorkflowTemplate = _.cloneDeep(this.props.clientWorkflowTemplate);
          if(!index) {
            updatedClientWorkflowTemplate.items.push({'_clientWorkflowTemplate': cwtRes.item._id});
          } else {
            updatedClientWorkflowTemplate.items.splice(index, 0, {'_clientWorkflowTemplate': cwtRes.item._id});
          }
          dispatch(clientWorkflowTemplateActions.sendUpdateClientWorkflowTemplate(updatedClientWorkflowTemplate)).then(cwtRes2 => {
            if(cwtRes2.success) {
              this.setState({
                newClientWorkflowTemplate: cwtRes2.item
              });
            }
          });
        }
      })
    }
  }

  _deleteItem(deleting, index) {
    const { dispatch } = this.props;
    let updatedClientWorkflowTemplate = _.cloneDeep(this.state.newClientWorkflowTemplate)
    if(deleting === 'taskTemplate') {
      let clientTaskTemplateId = updatedClientWorkflowTemplate.items[index] ? updatedClientWorkflowTemplate.items[index]._clientTaskTemplate : null
      if(clientTaskTemplateId) {
        dispatch(clientTaskTemplateActions.sendStaffDelete(clientTaskTemplateId)).then(cttRes => {
          if(cttRes.success) {
            updatedClientWorkflowTemplate.items.splice(index, 1)
            dispatch(clientWorkflowTemplateActions.sendUpdateClientWorkflowTemplate(updatedClientWorkflowTemplate)).then(clientWorkflowTemplateRes => {
              if(clientWorkflowTemplateRes.success) {
                this.setState({
                  newClientWorkflowTemplate: clientWorkflowTemplateRes.item
                });
                dispatch(clientTaskTemplateActions.invalidateList('_clientWorkflowTemplate', clientWorkflowTemplateRes.item._id));
                dispatch(clientTaskTemplateActions.fetchListIfNeeded('_clientWorkflowTemplate', clientWorkflowTemplateRes.item._id));
              }
            });
          }
        })
      }
    } else {
      // deleting a sub clientWorkflowTemplate.
    }
  }

  _reorderItem(fromIndex, toIndex) {
    const { dispatch } = this.props;
    let updatedClientWorkflowTemplate = _.cloneDeep(this.state.newClientWorkflowTemplate)
    const item = updatedClientWorkflowTemplate.items.splice(fromIndex, 1);    
    updatedClientWorkflowTemplate.items.splice(toIndex, 0, item[0]);
    dispatch(clientWorkflowTemplateActions.sendUpdateClientWorkflowTemplate(updatedClientWorkflowTemplate)).then(clientWorkflowTemplateRes => {
      if(clientWorkflowTemplateRes.success) {
        this.setState({
          newClientWorkflowTemplate: clientWorkflowTemplateRes.item
        });
      }
    })
  }

  render() {
    const { newClientWorkflowTemplate } = this.state;
    const {
      cancelLink
      , clientTaskTemplateStore
      , clientWorkflowTemplateStore 
      , formTitle
      , formType
      , index
      , match
    } = this.props;
    const editorClass = classNames(
      '-client-workflow-editor'
      , { '-sub-tasks': index }
    )
    const header = <div className="formHeader"><h3> {formTitle || "Update Client Workflow Template"} </h3></div>
    const isEditable = newClientWorkflowTemplate && newClientWorkflowTemplate.status === "draft";
    return (
      <div className="yt-container">
        <div className="yt-row center-horiz">
          <div className="form-container">
            <form name="clientWorkflowTemplateForm" className="clientWorkflowTemplate-form" >
              <div className={editorClass}>
                <div className="yt-col full l_90">
                  <div className="yt-row space-between center-vert">
                    {header}
                    <div className="status-wrapper">
                      <div className="dropdown u-pullRight">
                        <span className="yt-btn link xx-small u-pullRight" onClick={() => this.setState({workflowTemplateOptionsOpen: true})}>
                          <i className="fas fa-ellipsis-h"/>
                        </span>
                        <ClientWorkflowTemplateStatusMenu 
                          handleUpdateStatus={(status) => this._handleUpdateStatus(status)}
                          index={index}
                          inserting={false}
                          isOpen={this.state.workflowTemplateOptionsOpen}
                        />
                      </div>
                      <ClientWorkflowStatusIndicator
                        status={newClientWorkflowTemplate.status}
                      />
                    </div>
                  </div>
                  <br/>
                  { isNaN(parseInt(index)) ? 
                    <div>
                      <TextAreaInput
                        blur={this._handleSave}
                        change={this._handleChange}
                        disabled={!isEditable}
                        label="Describe the purpose of this template"
                        name="newClientWorkflowTemplate.purpose"
                        required={true}
                        rows="4"
                        value={newClientWorkflowTemplate.purpose || ""}
                      />
                      <TextInput
                        blur={this._handleSave}
                        change={this._handleChange}
                        disabled={!isEditable}
                        label="Workflow title"
                        name="newClientWorkflowTemplate.title"
                        required={true}
                        value={newClientWorkflowTemplate.title || ''}
                      />
                      <TextAreaInput
                        blur={this._handleSave}
                        change={this._handleChange}
                        disabled={!isEditable}
                        helpText={<span><strong>NOTE: </strong>This will also appear in the body of the notification email</span>}
                        label="Workflow description"
                        name="newClientWorkflowTemplate.description"
                        required={true}
                        rows="4"
                        value={newClientWorkflowTemplate.description || ''}
                      />
                    </div>
                    :
                    <div className="-sub-task-title">
                      <div className={`-task-type sub-task`}>
                        <span className="-icon"><i className="far fa-indent"/></span><span className="-index">{index + 1}</span> 
                      </div>
                      <TextInput
                        blur={this._handleSave}
                        change={this._handleChange}
                        disabled={!isEditable}
                        name="newClientWorkflowTemplate.title"
                        placeholder={`Type the name of this ${index ? 'sub-':''}clientWorkflow here...`}
                        required={true}
                        value={newClientWorkflowTemplate.title || ''}
                      />
                    </div>
                  }
                  <span className="u-muted">Use the "+" button to add tasks to your workflow</span>
                  <hr/>
                  <div className="-task-list">
                    { newClientWorkflowTemplate.items ?
                      newClientWorkflowTemplate.items.map((item, i) => 
                        <div key={item._clientTaskTemplate ? item._clientTaskTemplate + '_' + i : item._clientWorkflowTemplate + '_' + i}>
                          { item._clientTaskTemplate ?
                            <ClientTaskTemplateEditor
                              handleCreate={this._createItem}
                              handleDelete={this._deleteItem}
                              reorderItem={this._reorderItem}
                              index={i}
                              isEditable={newClientWorkflowTemplate && newClientWorkflowTemplate.status === 'draft'}
                              clientTaskTemplate={clientTaskTemplateStore.byId[item._clientTaskTemplate]}
                              clientWorkflowTemplate={newClientWorkflowTemplate}
                            />
                            : this.props.clientWorkflowStore.byId[item._clientWorkflow] ? 
                            renderSubEditor({
                              dispatch: this.props.dispatch
                              , index: i
                              , clientWorkflowTemplate: this.props.clientWorkflowTemplateStore.byId[item._clientWorkflowTemplate]
                              , clientTaskTemplateStore
                              , clientWorkflowTemplateStore
                              , item // debugging
                            })
                            : `...loading clientWorkflowTemplate ${item._clientWorkflowTemplate}`
                          } 

                        </div>
                      )
                      :
                      null 
                    }
                  </div>
                </div>
                <CloseWrapper
                  isOpen={(this.state.taskTemplateOptionsOpen || this.state.workflowTemplateOptionsOpen )}
                  closeAction={() => this.setState({taskTemplateOptionsOpen: false, workflowTemplateOptionsOpen: false})}
                />
                { isEditable ?
                  <div>
                    <div className="dropdown">
                      <div className="add-new-task" onClick={() => this.setState({taskTemplateOptionsOpen: true})}>
                        <span className="-icon">
                          <i className="far fa-plus"/>
                        </span>
                        <strong>Add TaskTemplate</strong>
                      </div>
                      <ClientTaskOptionsMenu 
                        handleCreate={(args) => this._createItem(...args)}
                        index={index}
                        inserting={false}
                        isOpen={this.state.taskTemplateOptionsOpen}
                      />
                    </div>
                  </div>
                  :
                  null
                }
                <div style={{height: '100px'}}/>
                <div className="yt-tools space-between -toolbar-bottom">
                { typeof(cancelLink) === 'string' ? 
                  <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                  :
                  <span className="yt-btn link" onClick={cancelLink} type="button">Cancel</span>
                }
                  <Link to={`${match.url.substring(0, match.url.indexOf('/update'))}`} className="yt-btn">Done</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}

ClientWorkflowTemplateItemsEditor.propTypes = {
  cancelLink: PropTypes.oneOfType([
    PropTypes.string
    , PropTypes.func
  ]).isRequired
  , clientWorkflowTemplate: PropTypes.object.isRequired
  , dispatch: PropTypes.func.isRequired
  , index: PropTypes.number 
}

ClientWorkflowTemplateItemsEditor.defaultProps = {
  index: null 
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientTaskTemplateStore: store.clientTaskTemplate
    , clientWorkflowTemplateStore: store.clientWorkflowTemplate
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientWorkflowTemplateItemsEditor)
);


const renderSubEditor = props => {
  // NOTES:
  /**
   * this separates the render out so you can call it again. 
   * it doesn't do anything in its own right other than return the object
   * 
   * TODOS:
   * one drawback that i;m finding is that this does not have access to withRouter/connect/store
   * it would make a lot of sense to re-organise this componenet to pass all that stuff off to a wrapper component
   * to do the actual logic and have this component only have a few simple props
   * 
   * also, the sub flows are never fetched, nor do they have titles. i am hard fetching one in the didMount
   */

  // console.log("render sub list", props)
  // console.log(ClientWorkflowTemplateItemsEditor)
  return <ClientWorkflowTemplateItemsEditor
    {...props}
  />
  // return <span>sub-task</span>
  
}