
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import * as docx from "docx";

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';

// import utilities
import filterUtils from '../../../global/utils/filterUtils';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as mergeFieldActions from '../../mergeField/mergeFieldActions';
import * as documentTemplateActions from '../documentTemplateActions';

// import resource components
import DocumentEditor from './DocumentEditor.js.jsx';
import ISReactDraftEditor from '../../../global/components/forms/ISReactDraftEditor.js.jsx';
import { TextInput } from '../../../global/components/forms';
import MergeFieldOptions from './MergeFieldOptions.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
// import PracticeFolderTemplateTableListItem from './PracticeFolderTemplateTableListItem.js.jsx';

class CreateDocumentTemplateForm extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false
      , name: ''
      , content: ''
    }
    this._bind(
        '_handleClose'
        , '_handleSubmit'
        , '_handleRTEChange'
        , '_handleFormChange'
    );

    this.documentTemplate = {};
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(documentTemplateActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(mergeFieldActions.fetchListIfNeeded('_firm', match.params.firmId));
  }

  _handleClose() {
    this.setState({ name: "", content: "", submitting: false }, () => {
      if (this.props.close) {
        this.props.close();
      }
    });
  }

  _handleSubmit() {
    console.log("theeee", this.state)
    const { dispatch, match } = this.props;
    const { name, content } = this.state;
    if (name && name.trim()) {
      this.setState({ submitting: true });
      const data = { name, content, firmId: match.params.firmId }
      dispatch(documentTemplateActions.sendCreatedocumentTemplate(data)).then(json => {
        console.log('eyy result', json)
        if (json && json.success) {
          dispatch(documentTemplateActions.addDocumentTemplateToList(json.item, ...['_firm', match.params.firmId]));
          this._handleClose();
        } else {
          this.setState({ submitting: false });
        }
      });
    }
  }

  _handleRTEChange(value) {
    console.log("rte value: ", value)
    this.setState({ content: value });
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }


  render() {
    const {
      match
      , mergeFieldStore
    } = this.props;
    
    const {
      submitting
    } = this.state;

    const name = _.cloneDeep(this.state.name);
    const content = _.cloneDeep(this.state.content);
    const mergeFieldListItems = mergeFieldStore.util.getList('_firm', match.params.firmId);
    const disableConfirm = submitting || !(content && content.trim()) || !(name && name.trim())

    return (
        <Modal
            cardSize="jumbo_90"
            closeAction={this._handleClose}
            isOpen={true}
            modalHeader="Prepare document template"
            // showButtons={false}
            closeText="Cancel"
            confirmAction={this._handleSubmit}
            confirmText={submitting ? 'Creating template...' : 'Create template'}
            disableConfirm={disableConfirm}
        >
          <div className="Document-Editor">
            <div className="-file-cared">
                <TextInput
                    change={this._handleFormChange}
                    label="Template Name"
                    name="name"
                    placeholder="Template Name"
                    value={name}
                    required={false}
                    autoFocus={true}
                />
            </div>
            <div>
                <ISReactDraftEditor
                    onChange={this._handleRTEChange}
                    defaultValue={content}
                    title={null}
                    placeholder=""
                    mergeFieldListItems={mergeFieldListItems}
                />
            </div>
        </div>
        </Modal>
    )
  }
}

CreateDocumentTemplateForm.propTypes = {
  dispatch: PropTypes.func.isRequired
}

CreateDocumentTemplateForm.defaultProps = {
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
    return {
      mergeFieldStore: store.mergeField
    }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(CreateDocumentTemplateForm)
);