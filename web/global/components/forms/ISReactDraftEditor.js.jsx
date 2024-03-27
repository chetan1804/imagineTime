import React from 'react'

import PropTypes from 'prop-types'

import Binder from '../Binder.js.jsx';

import { EditorState, convertToRaw, ContentState, Modifier, RichUtils } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import ColorPicker, { colorPickerPlugin } from 'draft-js-color-picker';
import '../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import rgbHex from 'rgb-hex';
// import ReactHtmlParser from 'react-html-parser';
import {
  toggleCustomInlineStyle,
  getSelectionCustomInlineStyle,
} from 'draftjs-utils';
import MergeFieldOptions from '../../../resources/documentTemplate/components/MergeFieldOptions.js.jsx';
import CloseWrapper from '../helpers/CloseWrapper.js.jsx';

// Add preset colors to the picker
const presetColors = [
  '#ff00aa',
  '#F5A623',
  '#F8E71C',
  '#8B572A',
  '#7ED321',
  '#417505',
  '#BD10E0',
  '#9013FE',
  '#4A90E2',
  '#50E3C2',
  '#B8E986',
  '#000000',
  '#4A4A4A',
  '#9B9B9B',
  '#FFFFFF',
];

import RichTextEditor, {
  getTextAlignClassName,
  getTextAlignStyles,
  getTextAlignBlockMetadata,
} from 'react-rte';

class ISReactDraftEditor extends Binder {
  constructor(props) {
    super(props)

    this.state = {
        editorState: EditorState.createEmpty()
        , mergeFieldOptionsOpen: false
    }

    this._bind(
      'onChange'
      , '_handleColorChange'
      , '_handleSaveColor'
      , '_handleInsertMergeField'
      , '_handleCloseMergeFieldOption'
    );

    // Step 1: Create the functions to get and update the editorState
    this.updateEditorState = editorState => this.setState({ editorState });
    this.getEditorState = () => this.state.editorState;
  
    // Step 2: run the colorPickerPlugin function
    this.picker = colorPickerPlugin(this.updateEditorState, this.getEditorState);
    this.color = null;
    this.saveColor = null;
  }

  componentDidMount() {
    const { defaultValue } = this.props;

    const contentBlock = htmlToDraft(defaultValue);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      const editorState = EditorState.createWithContent(contentState);
      this.setState({
        editorState
      });
    }
  }

  onChange(editorState) {
    this.setState({editorState});
    if (this.props.onChange) {
      const rawContentState = convertToRaw(editorState.getCurrentContent());
      this.props.onChange(
        draftToHtml(rawContentState)
      );
    }
  }

  _handleColorChange(color) {
    // color = rgbHex(color);
    this.picker.addColor(color);
    this.color = color;
  }

  _handleSaveColor() {
    if (this.color && this.saveColor !== this.color) {
      this.saveColor = this.color;
      let color = '#' + rgbHex(this.color);
      color = color ? color.substr(0, 7) : color;
      const editorState = _.cloneDeep(this.state.editorState);
      const newState = toggleCustomInlineStyle(editorState, 'color', color);
      this.onChange(newState);
    }
  }

  _handleInsertMergeField(textToInsert) {
    textToInsert = `{{${textToInsert}}}`;
    const editorState = _.cloneDeep(this.state.editorState);
    const currentContent = editorState.getCurrentContent();
    const currentSelection = editorState.getSelection();

    const newContent = Modifier.replaceText(
      currentContent,
      currentSelection,
      textToInsert
    );

    const newEditorState = EditorState.push(
      editorState,
      newContent,
      "insert-characters"
    );

    this.onChange(newEditorState);
  }

  _handleCloseMergeFieldOption(e) {
    console.log("hello world close me")
    e.stopPropagation();
    this.setState({ mergeFieldOptionsOpen: false });
  }

  render() {

    const {
      title
      , mergeFieldListItems
    } = this.props;
    
    const {
        editorState
        , mergeFieldOptionsOpen
    } = this.state;

    const customControls = mergeFieldListItems && mergeFieldListItems.length ? [
      // merge tags
      <div className="custom-save-button ButtonGroup__root___3lEAn" key='-csb'>
          <div className="ButtonWrap__root___1EO_R">
              <button type="button" title="Bold"
                  className="yt-btn x-small link info IconButton__root___3tqZW Button__root___1gz0c"
                  onClick={() => this.setState({ mergeFieldOptionsOpen: !mergeFieldOptionsOpen })}
              >
                  INSERT MERGE FIELD
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
    ] : [];

    return (
      <div>
        <div><strong>{title}</strong></div>
        <div className="rdw-color-picker-wrapper" onClick={this._handleSaveColor}>
          <ColorPicker
              toggleColor={this._handleColorChange}
              // toggleColor={(color) => this.picker.addColor(color)}
              presetColors={presetColors}
              color={this.picker.currentColor(editorState)}
            />
        </div>
        <Editor
          customStyleFn={this.picker.customStyleFn}
          editorState={editorState}
          wrapperClassName="IS-react-draft-editor"
          editorClassName="demo-editor"
          onEditorStateChange={this.onChange}
          toolbar={{
            options: [
              "inline",
              "blockType",
              "fontSize",
              "fontFamily",
              "list",
              "textAlign",
              // "remove",
              "image",
              "link",
              "history"
            ]
          }}
          toolbarCustomButtons={customControls}
        />
      </div>

    )
  }
}

ISReactDraftEditor.propTypes = {
  onChange: PropTypes.func,
  title: PropTypes.string,
  defaultValue: PropTypes.string,
  mergeFieldListItems: PropTypes.array
}

export default ISReactDraftEditor;