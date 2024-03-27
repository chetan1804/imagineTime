
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import jsPDF from "jspdf";
import RichTextEditor from 'react-rte';
import { EditorState, Modifier } from 'draft-js';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { TextInput } from '../../../global/components/forms';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

// import utilities
import filterUtils from '../../../global/utils/filterUtils';
import ISReactDraftEditor from '../../../global/components/forms/ISReactDraftEditor.js.jsx';

// import resource components
import MergeFieldOptions from './MergeFieldOptions.js.jsx';
// import PracticeFolderTemplateTableListItem from './PracticeFolderTemplateTableListItem.js.jsx';

class DocumentEditor extends Binder {
  constructor(props) {
    super(props);
        this.state = {
            name: ''
            // , content: RichTextEditor.createEmptyValue()
            , content: ''
            , mergeFieldOptionsOpen: false
        }
        this._bind(
            '_handleClose'
            , '_handleRTEChange'
            , '_handleFormChange'
            , '_handleSubmit'
            , '_handleCloseMergeFieldOption'
            , '_handleInsertMergeField'
        )
    }

    componentDidMount() {
        // const { defaultValue } = this.props;
        // if (defaultValue) {
        //     this.setState({
        //         content: RichTextEditor.createValueFromString(defaultValue, 'html')
        //     });    
        // }
    }

    _handleClose() {

    }

    _handleRTEChange(value) {
        console.log("rte value: ", value)
        // this.setState({ content: value }, () => {
        //     if (this.props.handleChange) {
        //         this.props.handleChange(this.state);
        //     }
        // });

        this.setState({ content: value });
    }

    _handleFormChange(e) {
        let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
          return e.target.value;
        });
        this.setState(newState);
        // this.setState(newState, () => {
        //     if (this.props.handleChange) {
        //         this.props.handleChange(this.state);
        //     }
        // });
    }

    _handleSubmit() {
        console.log('state', this.state);
        
        const name = _.cloneDeep(this.state.name);
        const content = _.cloneDeep(this.state.content);
    }

    _handleInsertMergeField(textToInsert) {
        console.log("textToInsert", textToInsert)
        textToInsert = `[${textToInsert}]`;
        const content = this.state.content;
        const editorState  = content.getEditorState();

        const currentContent = editorState.getCurrentContent();
        const currentSelection = editorState.getSelection();
        let newContent = Modifier.replaceText(
            currentContent,
            currentSelection,
            textToInsert
        );

        const textToInsertSelection = currentSelection.set('focusOffset', currentSelection.getFocusOffset() + textToInsert.length);
        const inlineStyles = editorState.getCurrentInlineStyle();

        inlineStyles.forEach(inLineStyle => newContent = Modifier.applyInlineStyle(newContent, textToInsertSelection, inLineStyle));

        let newState = EditorState.push(editorState, newContent, 'insert-characters');
        newState = EditorState.forceSelection(newState, textToInsertSelection.set('anchorOffset', textToInsertSelection.getAnchorOffset() + textToInsert.length));

        if (content && content._editorState) {
            content._editorState = newState;
        }
        this.setState({ content }, () => {
            if (this.props.handleChange) {
                this.props.handleChange(this.state);
            }
        });
    }

    _handleCloseMergeFieldOption(e) {
        e.stopPropagation();
        this.setState({ mergeFieldOptionsOpen: false });
    }

    render() {
        const {
            match
            , mergeFieldListItems
        } = this.props;
                  
        const {
            name
            , content
            , mergeFieldOptionsOpen
        } = this.state;

        // console.log("debug", content.toString('html'), this.state);

        const customControls = [
            <div className="custom-save-button ButtonGroup__root___3lEAn" key='-csb'>
                <div className="ButtonWrap__root___1EO_R">
                    <button type="button" title="Bold"
                        className="yt-btn x-small link info IconButton__root___3tqZW Button__root___1gz0c"
                        onClick={() => this.setState({ mergeFieldOptionsOpen: !mergeFieldOptionsOpen })}
                    >
                        Add merge field
                    </button>
                </div>
                {
                    mergeFieldOptionsOpen ? 
                    <div className="-merge-field-option-list">
                        <CloseWrapper
                            isOpen={true}
                            closeAction={this._handleCloseMergeFieldOption}
                        />
                        <MergeFieldOptions
                            isOpen={true}
                            mergeFieldListItems={mergeFieldListItems}
                            handleInsertMergeField={this._handleInsertMergeField}
                        />
                    </div>
                    : null
                }
            </div>
        ];

        return (
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
                    />
                </div>
            </div>
        )
    }
}

DocumentEditor.propTypes = {
  dispatch: PropTypes.func.isRequired
}

DocumentEditor.defaultProps = {
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
    return {}
}

export default withRouter(
    connect(
    mapStoreToProps
  )(DocumentEditor)
);