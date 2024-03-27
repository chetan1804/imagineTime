/**
 * Helper component to display PDFs.
 * Utilizes react-pdf github: https://github.com/wojtekmaj/react-pdf/blob/v3.x/README.md
 */

// import primary libraries
import React from 'react';
import PropTypes, { element } from 'prop-types';
import { connect } from 'react-redux';

// import third party libraries
import classNames from 'classnames';
import { Document, Page } from 'react-pdf/dist/entry.noworker';
import Draggable, {DraggableCore} from 'react-draggable';

// import global components
import Binder from '../Binder.js.jsx';
import { displayUtils } from '../../utils';
import { ToggleSwitchInput, TextInput, SelectFromObject, SignatureTouchPad, SelectFromArray } from '../forms';

// import component 

class PDFEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      numPages: []
    }
    this._bind(
        '_onDocumentLoad'
        // , '_handleInsertElement'
        // , '_handleOnMouseDown'
        // , 'onMouseUp'
        // , 'onMouseMove'
    )

    // this.child = React.createRef();
  }

  _onDocumentLoad = ({ numPages }) => {
    // ??ND
    this.setState({ numPages });

    // const { elementType, resetElementType } = this.props;
    // let newNumPages = []; // _.cloneDeep(this.state.numPages);
    // if (numPages) {
    //     for (let i = 1; i <= numPages; i++) {
    //         newNumPages.push(
    //           <ElementContainer
    //             key={i}
    //             index={i}
    //             elementType={elementType}
    //             resetElementType={resetElementType}
    //           />
    //         );
    //     }
    //     this.setState({ numPages: newNumPages });
    // }
  }

  render() {
    const { numPages, pageNumber } = this.state;
    const {
      autoScroll
      , controls
      , filePath
      , hidden
      , pdfClasses
      , selectedSignerIndex
      , signers
      , handleSelectedJotblock
      , handleElements
      , handleSignatureStyle
      , handleAttachment
    } = this.props;

    const pdfWrapperClass = classNames(
      'pdf-wrapper'
      , {
        '-hidden': hidden
      }
    )

    const isEmpty = (
      numPages === null
    )

    return (
      <div className={pdfWrapperClass + " " + pdfClasses} id={autoScroll ? 'pdf-top': null}>
        <Document
          className="-pdf-document"
          file={filePath}
          onLoadSuccess={this._onDocumentLoad}
        >
          {
            // numPages
            !numPages ? null :
            Array(numPages).fill().map((decoy, index) => 
              <ElementContainer
                ref={`element${index}`}
                key={index}
                index={index + 1}
                signers={signers}
                selectedSignerIndex={selectedSignerIndex}
                handleSelectedJotblock={handleSelectedJotblock}
                handleElements={handleElements}
                handleSignatureStyle={handleSignatureStyle}
                handleAttachment={handleAttachment}
              />
            )
          }
        </Document>
      </div>
    )
  }
}

PDFEditor.propTypes = {
  autoScroll: PropTypes.bool
  , controls: PropTypes.bool
  , dispatch: PropTypes.func
  , filePath: PropTypes.string.isRequired
  , pdfClasses: PropTypes.string
  , hidden: PropTypes.bool
}

PDFEditor.defaultProps = {
  autoScroll: false
  , controls: true
  , file: ''
  , styles: ''
  , hidden: false
}

export default connect()(PDFEditor);


class ElementContainer extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      elements: []
      , elIndex: 0
      , activeDrags: 0
      , selectedElement: {}
      , resizing: false
      , originalMouse: { x: 0, y: 0, jbClassName: null }
      , jotblockSettingShow: false
    }
    this._bind(
      '_handleOnMouseDown'
      , '_handleRemoveElement'
      , '_handleCopyElement'
      , '_handleResizeMouseDown'
      , '_handleClose'
      , '_handleSaveChanges'
    )

    this.fields = {
      borderSides: { bottom: true, left: true, right: true, top: true },
      certified: true,
      inputType: "signer",
      name: "",
      pageIndex: 0,
      position: { x: 0.1, y: 0.3 },
      required: true,
      hidden: false,
      signer: "",
      size: { height: 0.05, width: 0.3 },
      fixedText: "",
      options: [],
      isMultipleChoice: false,
      multipleChoiceDefaultValues: [],
      penColor: "black",
      fontName: "courier_New",
      fontSize: "10",
      horizontalAlignment: "center",
      verticalAlignment: "middle"
    }
  }


  componentDidUpdate(props, state) {

    const { handleElements, index } = this.props;
    handleElements(index, this.state.elements);

    if (this.state.resizing && !state.resizing) {
        document.addEventListener('mousemove', this.onMouseMove)
        document.addEventListener('mouseup', this.onMouseUp)
    } else if (!this.state.resizing && state.resizing) {
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('mouseup', this.onMouseUp)
    }
  }

  onDragOver = (ev) => {
    ev.preventDefault();
  }

  onDrop = (ev, cat) => {
    ev.preventDefault();
    const { index, signers, selectedSignerIndex, handleAttachment } = this.props;
    const currentbgColor = displayUtils.getColor(selectedSignerIndex);

    let elements = _.cloneDeep(this.state.elements);
    let element = _.cloneDeep(this.fields);
    let dataTransfer = ev.dataTransfer.getData("text");
    dataTransfer = JSON.parse(dataTransfer);
    let jotblockId = dataTransfer.id; // ev.dataTransfer.getData("id");
    let icon =  dataTransfer.icon; // ev.dataTransfer.getData("icon");
    let elIndex = elements.length;
    let xPosition =  dataTransfer.xPosition; // ev.dataTransfer.getData("xPosition");
    let yPosition =  dataTransfer.yPosition; // ev.dataTransfer.getData("yPosition");
    xPosition -= 20;
    yPosition -= 16;

    if (jotblockId == 7) {
      handleAttachment();
      return;
    }

    // get left margin width 
    const elementWidth = jotblockId == 6 ? 30 : 250;
    const elementHeight = jotblockId == 6 ? 30 : 40;
    const _body = document.querySelector("body");
    const windowInnerWidth = window.innerWidth; // document.querySelector(".outlook-layout.custom-template-plugin") ? document.querySelector(".outlook-layout.custom-template-plugin").offsetWidth ? document.querySelector("body") ;    
    const _modalBody = document.querySelector(".card-body");
    const _previewBody = document.querySelector(".-preview-content.-pdf-editor");
    const _previewDocument = document.querySelector(".share-link-layout.-signature-request .react-pdf__Page__canvas");
    const pages = document.querySelectorAll(".share-link-layout.-signature-request .react-pdf__Page__canvas"); // get difference between top and selected page
    const outlookModal = document.getElementById("outlook-main-yote");
    // const _outsideModal = outlookModal && windowInnerWidth ?  (windowInnerWidth - outlookModal.offsetWidth) / 2 : ((_body ? _body.offsetWidth : 0) - (_modalBody ? _modalBody.offsetWidth : 0)) / 2;
    const _outsideModal = outlookModal && windowInnerWidth ?  (windowInnerWidth - outlookModal.offsetWidth) / 2 : _body && _modalBody ? ((_body ? _body.offsetWidth : 0) - (_modalBody ? _modalBody.offsetWidth : 0)) / 2 : 0;
    const _insideModal = ((_previewBody ? _previewBody.offsetWidth : 0) - (_previewDocument ? _previewDocument.offsetWidth : 0)) / 2; 
    const _differenceWidth = _outsideModal + _insideModal + (outlookModal ? 18 : 24);
    const pageWidth = pages ? [...pages][index-1] ? ([...pages][index-1].offsetWidth - elementWidth) : 0 : 0;
    const validXposition = (ev.pageX - _differenceWidth) < 0 ? 0 : (ev.pageX - _differenceWidth) > pageWidth ? pageWidth : (ev.pageX - _differenceWidth);

    // for height computation 
    const _differenceHeight = pages ? [...pages][index-1] ? [...pages][index-1].getBoundingClientRect().top : 0 : 0;
    const _bodyScroll = document.querySelector("body").getBoundingClientRect().top;
    const pageHeight = pages ? [...pages][index-1] ? ([...pages][index-1].offsetHeight - elementHeight) : 0 : 0;
    const validYposition = ((ev.pageY - (_differenceHeight + 20)) + _bodyScroll) < 0 ? 0 : ((ev.pageY - (_differenceHeight + 20)) + _bodyScroll) > pageHeight ? pageHeight : ((ev.pageY - (_differenceHeight + 20)) + _bodyScroll);

    // add specific details for new element
    element["pos"] = { x: ((jotblockId==6 ? (validXposition + 45) : validXposition) - xPosition), y: validYposition } // need to remove before submit
    element["pageIndex"] = index - 1;
    element["name"] = `Jotblock ${elIndex}`;
    element["elIndex"] = elIndex; // need to remove before submit
    element["currentbgColor"] = currentbgColor; // need to remove before submit
    element["signerIndex"] = selectedSignerIndex; // need to remove before submit
    element["wdt"] = jotblockId == 6 ? 30 : 250; // need to remove before submit
    element["hgt"] = jotblockId == 6 ? 30 : 40; // need to remove before submit
    element["display"] = "unset"; // need to remove before submit
    element["icon"] = icon; // need to remove before submit
    element["jotblockId"] = jotblockId;
  
    // group jotblock properties
    switch (jotblockId) {
      case "0": // Signature
      case "1": // Initials
        element["fieldType"] = "signature";
        element["signatureType"] = "signature";
        element["signatureStyle"] = "selectable";
      break;
      case "2": // Date
      case "4": // Text
        element["fieldType"] = "typed";
        element["fixedText"] = "";
        element["signerInputType"] = "free_Text";
        element["fontDecoration"] = { bold: false, italic: false, underline: false };
        element["wordWrap"] = "false";
      break;
    }

    // solo jotblock preperties
    switch (jotblockId) {
      case "0": // Signature
        element["instructions"] = 'Click "Apply Signature" to apply your adopted signature to the document.  This is legally equivalent to signing with a pen on paper.';
      break;
      case "1": // Initials
        element["instructions"] = 'Click "Apply Initials" to apply your adopted initials to the document.  This is legally equivalent to signing with a pen on paper.';
        element["signatureType"] = "initials";
      break;
      case "2": // Date
        element["instructions"] = "Please enter the current date in MM/DD/YYYY format.";
        element["validationID"] = "f6f119c9-d307-dd11-8735-00065b8ce99b";
      break;
      case "3": // Timestamp
        element["fontDecoration"] = { bold: false, italic: false, underline: false };
        element["signerInputType"] = "timestamp";
        element["fieldType"] = "typed";
        element["wordWrap"] = "false";
      break;
      case "4": // Text
        element["instructions"] = 'Please enter the appropriate text.  This is legally equivalent to applying this information with a pen on paper.';
      break;
      case "5":
        element["fieldType"] = "typed";
        element["instructions"] = "";
        element["wordWrap"] = "false";
        element["fontDecoration"] = { bold: false, italic: false, underline: false };
        element["signerInputType"] = "multiple_Choice_Text"
      break;
      case "6":
        element["fieldType"] = "typed";
        element["instructions"] = "";
        element["wordWrap"] = "false";
        element["fontDecoration"] = { bold: false, italic: false, underline: false };
        element["signerInputType"] = "multiple_Choice_Checkbox";
        element["options"] = [{
          graphicRenderType: "none"
          , pageIndex: index - 1
          , text: ""
          , value: ""
          , position: element.pos
        }]
      break;
      case "8":
        element["required"] = false;
        element["certified"] = false;
        element["fieldType"] = "signature";
        element["fixedDrawn"] = [];
        element["fontDecoration"] = { bold: false, italic: false, underline: false };
        element["inputType"] = "fixed";
        element["isMultipleChoice"] = false;
        element["signatureStyle"] = "drawn";
        element["signatureType"] = "signature";
        element["timing"] = "on_Document_Start";
        element["wordWrap"] = "false";
        element["penColor"] = "black";
      break;
      case "9":
        element["certified"] = false;
        element["fieldType"] = "typed";
        element["fontDecoration"] = { bold: false, italic: false, underline: false };
        element["timing"] = "on_Document_Start";
        element["inputType"] = "fixed";
        element["wordWrap"] = "false";
        element["fixedText"] = "";
      break;
    }

    elements.push(element);
    if (jotblockId == 6) {
      this.setState({ elements, selectedElement: element, jotblockSettingShow: true }, () => {
        this.refs.JotBlockSetting.setState({ isEditOptions: true, isAddOptions: false, isEditOptionIndex: 0 });
      });
    } else {
      this.setState({ elements, selectedElement: element });
    }
  }

  onStart = () => {
    if (!this.state.resizing) {
      this.setState({activeDrags: ++this.state.activeDrags});
    }
  };

  onStop = () => {
    if (!this.state.resizing) {
      this.setState({activeDrags: --this.state.activeDrags});
    }
  };

  _handleOnMouseDown(element) {
    const { selectedSignerIndex, handleSelectedJotblock } = this.props;
    const { selectedElement, elements } = this.state;
    if (selectedElement.elIndex !== element.elIndex || selectedSignerIndex !== element.signerIndex) {
      this.setState({ selectedElement: element }, () => {
        if (selectedSignerIndex !== element.signerIndex && handleSelectedJotblock) {
          handleSelectedJotblock(element.signerIndex);
        }
      });
    }
  }
  
  /** start: Handle jotblocks setting  */
  _handleRemoveElement(index) {
    let { elements } = this.state;
    if (elements[index]) {
      // elements.splice(index, 1);
      elements[index].display = "none";
      this.setState({ elements, jotblockSettingShow: false, selectedElement: {} });
    }
  }

  _handleCopyElement(element, ev) {
    const elements = _.cloneDeep(this.state.elements);
    const elIndex = elements.length;
    let newElement = _.cloneDeep(element);
    if (elements && newElement) {

      // set index for new element
      newElement.elIndex = elIndex;

      // get default position for new element
      const parent = ev.target.parentElement.parentElement.parentElement;
      if (parent.className.includes("-jotblock-draggable")) {
        let matrix = parent.style.transform || parent.style.webkitTransform || parent.style.mozTransform;
        matrix = matrix.split(" ");
        newElement.pos.x = matrix[0] ? (parseFloat(matrix[0].replace(/[^\d.-]/g, '')) - 10) : newElement.pos.x;  
        newElement.pos.y = matrix[1] ? (parseFloat(matrix[1].replace(/[^\d.-]/g, '')) - 10) : newElement.pos.y;
      }

      elements.push(newElement);
      this.setState({ elements, selectedElement: newElement });
    }
  }
  /** end: Handle jotblocks setting  */


  /** start: Handle jotblocks resising  */
  _handleResizeMouseDown(classname, ev) {
    if (!this.state.resizing && ev.button === 0) {
      let originalMouse = {};
      originalMouse.x = ev.pageX;
      originalMouse.y = ev.pageY;
      originalMouse.jbClassName = classname;
      this.setState({ resizing: true, originalMouse });
    }
    ev.stopPropagation();
    ev.preventDefault();
  }

  onMouseMove = (ev) => {
    const { originalMouse, resizing, selectedElement } = this.state;
    const { index } = this.props;
    if (resizing) {
      const pages = document.querySelectorAll(".share-link-layout.-signature-request .react-pdf__Page__canvas");
      const page = [...pages][index-1];
      const maximum = page.getBoundingClientRect();

      const minumum = {
        width: selectedElement.jotblockId == 6 ? ((page.offsetWidth / 100) * 2) : ((page.offsetWidth / 100) * 15)
        , height: selectedElement.jotblockId == 6 ? ((page.offsetHeight / 100) * 1.5) : ((page.offsetHeight / 100) * 1.5)
      }

      const target = document.querySelector(`.-jotblock-resizable-handle.${originalMouse.jbClassName}`);  // ev.target;
      const targetParent = target.parentElement;
      const element = targetParent.parentElement; // target jotblock

      const targetMaximum = targetParent.getBoundingClientRect();
      const original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      const original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
      const original_mouse_x = originalMouse.x;
      const original_mouse_y = originalMouse.y;
      const width = original_width + (ev.pageX - original_mouse_x);
      const height = original_height + (ev.pageY - original_mouse_y);
      targetParent.style.background = "#00000069";
      targetParent.style.border = "1px dashed black";

      if (maximum.right >= targetMaximum.right && (width < (maximum.right - targetMaximum.left))) {
        targetParent.style.width = Math.max(width, minumum.width) + 'px';
      } else {
        targetParent.style.width = (maximum.right - targetMaximum.left) + 'px';
      }
      if (maximum.bottom >= targetMaximum.bottom && (height < (maximum.bottom - targetMaximum.top))) {
        targetParent.style.height = Math.max(height, minumum.height) + 'px';
      } else {
        targetParent.style.height = (maximum.bottom - targetMaximum.top) + 'px';
      }
    } else {
      this.setState({ resizing: false });
    }
    ev.stopPropagation()
    ev.preventDefault()
  }

  onMouseUp = (ev) => {
    const { originalMouse, resizing, selectedElement, elements } = this.state;
    const { index } = this.props;
    if (resizing) {
      const target = document.querySelector(`.-jotblock-resizable-handle.${originalMouse.jbClassName}`); // ev.target;
      const targetParent = target.parentElement;
      const element = targetParent.parentElement; // target jotblock
      const original_width = parseFloat(getComputedStyle(targetParent, null).getPropertyValue('width').replace('px', ''));
      const original_height = parseFloat(getComputedStyle(targetParent, null).getPropertyValue('height').replace('px', ''));

      targetParent.style.background = "transparent";
      targetParent.style.border = 0;
      element.style.width = original_width + 'px';
      element.style.height = original_height + 'px';

      // change height and width
      // selectedElement.wdt = original_width;
      // selectedElement.hgt = original_height;
      this.setState({ resizing: false });
    }
    ev.stopPropagation()
    ev.preventDefault()
  }
  /** end: Handle jotblocks resising  */


  /** start: Handle jotblocks setting  */
  _handleClose() {
    this.setState({ jotblockSettingShow: false });
  }

  _handleSaveChanges(element) {
    const { handleSignatureStyle } = this.props;
    const { elements } = this.state;

    if (elements[element.elIndex].signatureStyle !== element.signatureStyle && element.fieldType === "signature") {
      handleSignatureStyle(element);
    }

    if (element.jotblockId == 8) {
      var tmpthis = this;
      var png = null;
      var svgElement = document.querySelector('svg.drawing');
      var parent = svgElement.parentElement;
      var svgString = new XMLSerializer().serializeToString(svgElement);
      var canvas = document.getElementById("canvas");
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      var ctx = canvas.getContext("2d");
      var DOMURL = self.URL || self.webkitURL || self;
      var img = new Image();
      var svg = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
      var url = DOMURL.createObjectURL(svg);
      img.onload = function() {
          ctx.drawImage(img, 0, 0);
          png = canvas.toDataURL("image/png");
          element.imgSrc = png;
          elements[element.elIndex] = element;
          tmpthis.setState({ elements, jotblockSettingShow: false, selectedElement: element });
      };
      img.src = url;
    } else {
      elements[element.elIndex] = element;
      this.setState({ elements, jotblockSettingShow: false, selectedElement: element });
    }
  }
  
  render() {
    const { index, selectedSignerIndex, handleSelectedJotblock, signers } = this.props;
    const { elements, selectedElement } = this.state;
    const dragHandlers = {onStart: this.onStart, onStop: this.onStop};

    return (
      <div className="-pdf-file-editor-container"
        onDragOver={(e) => this.onDragOver(e)}
        onDrop={(e) => this.onDrop(e, "complete")}
        style={{ position: "relative" }}>
        {
            elements.map((element, i) => 
              signers[element.signerIndex].deleted ? null :
              element.jotblockId != 6 ? 
              <Draggable bounds="parent" {...dragHandlers} key={i}
                defaultPosition={{ x: element.pos.x, y: element.pos.y }}>
                  <div className={`-jotblock-draggable -jotblock-${index}-${element.elIndex} ${element.jotblockId == 6 ? "-checkbox-jb" : ""}`}
                    onMouseDownCapture={this._handleOnMouseDown.bind(this, element)} // () => element.signerIndex === selectedSignerIndex ? null : handleSelectedJotblock(element.signerIndex)}
                    style={{ 
                      zIndex: selectedElement.elIndex === element.elIndex ? 2000 : 1000
                      , position: "absolute"
                      , width: element.wdt
                      , height: element.hgt
                      , background: element.currentbgColor
                      , opacity: (selectedSignerIndex === element.signerIndex ? 1 : 0.3)
                      , display: element.display }}>
                        <div className="-jotblock-resizable-container">
                          <div className={`-jotblock-resizable-handle -jotblock-${index}-${i}`} 
                            onMouseDown={this._handleResizeMouseDown.bind(this, `-jotblock-${index}-${i}`)}
                            ></div>
                        </div>
                        {
                          element.jotblockId == 8 && element.imgSrc ? 
                          <img style={{ padding: "px", width: "inherit", height: "inherit" }}
                            src={element.imgSrc} />
                          : <div className="-jotblock-icon" style={
                            element.fixedText ? {
                              padding: "0px 5px"
                              , display: "table-cell"
                              , fontWeight: `${element.fontDecoration.bold ? "bold" : "normal"}`
                              , fontStyle: `${element.fontDecoration.italic ? "italic" : "normal"}`
                              , fontSize: `${element.fontSize}px`
                              , fontFamily: element.fontName
                              , textDecoration: `${element.fontDecoration.underline ? "underline" : "unset"}`
                              , textAlign: element.horizontalAlignment
                              , verticalAlign: element.verticalAlignment
                              , lineBreak: element.wordWrap == "true" ? "anywhere" : "normal"
                              } : {}
                            }>
                              {
                                element.fixedText ? element.fixedText
                                : <i className={element.icon} style={element.jotblockId == 6 ? { color: element.currentbgColor } : {}}></i>
                              }
                            </div>                          
                        }
                        {
                          selectedElement.elIndex === element.elIndex ? 
                          <div className="-setting-jotblock">
                            <div onClick={this._handleCopyElement.bind(this, element)}>
                              <i className="far fa-copy"></i>
                            </div>
                            <div onClick={this._handleRemoveElement.bind(this, i)}>
                              <i className="fas fa-trash"></i>
                            </div>
                            <div onClick={() => this.setState({ jotblockSettingShow: true, selectedElement: element })}>
                              <i className="fas fa-cog"></i>
                            </div>
                          </div> : null
                        }
                        
                    </div>
              </Draggable>
              : 
              element.options.map((option, optionIndex) => 
                <Draggable bounds="parent" {...dragHandlers} key={optionIndex}
                defaultPosition={option.position ? { x: option.position.x, y: option.position.y } : null}>
                  <div className={`-jotblock-draggable -jotblock-${index}-${element.elIndex} -checkbox-jb -option-${optionIndex}`}
                    onMouseDownCapture={this._handleOnMouseDown.bind(this, element)} // () => element.signerIndex === selectedSignerIndex ? null : handleSelectedJotblock(element.signerIndex)}
                    style={{ 
                      zIndex: selectedElement.elIndex === element.elIndex ? 2000 : 1000
                      , position: "absolute"
                      , width: element.wdt
                      , height: element.hgt
                      , background: element.currentbgColor
                      , opacity: (selectedSignerIndex === element.signerIndex ? 1 : 0.3)
                      , display: element.display }}>
                        <div className="-jotblock-resizable-container">
                          <div className={`-jotblock-resizable-handle -jotblock-${index}-${i}-${optionIndex}`} 
                            onMouseDown={this._handleResizeMouseDown.bind(this, `-jotblock-${index}-${i}-${optionIndex}`)}
                            ></div>
                        </div>
                        <div className="-jotblock-icon" style={
                          element.fixedText ? {
                            padding: "0px 5px"
                            , display: "table-cell"
                            , fontWeight: `${element.fontDecoration.bold ? "bold" : "normal"}`
                            , fontStyle: `${element.fontDecoration.italic ? "italic" : "normal"}`
                            , fontSize: `${element.fontSize}px`
                            , fontFamily: element.fontName
                            , textDecoration: `${element.fontDecoration.underline ? "underline" : "unset"}`
                            , textAlign: element.horizontalAlignment
                            , verticalAlign: element.verticalAlignment
                            , lineBreak: element.wordWrap == "true" ? "anywhere" : "normal"
                          } : {}
                        }>
                          {
                            element.fixedText ? element.fixedText
                            : <i className={element.icon} style={{ color: element.currentbgColor }}></i>
                          }
                        </div>
                        {
                          selectedElement.elIndex === element.elIndex ? 
                          <div className={`-setting-jotblock ${optionIndex}`}>
                            {/* <div onClick={this._handleCopyElement.bind(this, element)}>
                              <i className="far fa-copy"></i>
                            </div> */}
                            <div onClick={this._handleRemoveElement.bind(this, i)}>
                              <i className="fas fa-trash"></i>
                            </div>
                            <div onClick={() => this.setState({ jotblockSettingShow: true, selectedElement: element })}>
                              <i className="fas fa-cog"></i>
                            </div>
                          </div> : null
                        }
                        {
                          option.value ? 
                          <div className="-setting-jotblock -option-label" style={ selectedElement.elIndex === element.elIndex ? {top: "-45px"} : { top: "-20px" }}>
                            <label>{ option.value }</label>
                          </div> : null
                        }
                  </div>
                </Draggable>    
              )
            )
        }
        <Page
          className={`-pdf-page`}
          pageNumber={index}
          renderTextLayer={false}
          renderAnnotations={false}
          scale={2}
        />
        <JotBlockSetting parent={this} ref="JotBlockSetting" />
      </div>
    )
  }
}

class JotBlockSetting extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isCommon: true
      , element: {}
      , borderSides: "all"
      , isAddOptions: true
      , OptionProperty: {
        graphicRenderType: "none"
        , selected: false
        , text: ""
        , value: ""
        , position: {}
      }
      , isEditOptions: false
      , isEditOptionIndex: 0
      , selectedDisplayAs: "none" 
      , optionDefaultValue: ""
      , optionDefaultValueError: ""
    }

    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleChangeBorder'
      , '_handleChangeDecoration'
      , '_handleAlignment'
      , '_handleStartedCompleted'
      , '_handleSubmitOption'
      , '_handleOptionChange'
      , '_handleOptionReset'
      , '_handleDeleteOption'
      , '_handleMultpleDefaultValue'
      , '_handleRemoveMultpleDefaultValue'
      , '_handlePenColorChange'
      , '_handleGetResult'
    );

    this.dateValidator = {
      "f5f119c9-d307-dd11-8735-00065b8ce99b": "YYYY/MM/DD"
      , "f6f119c9-d307-dd11-8735-00065b8ce99b": "MM/DD/YYYY"
      , "fcf119c9-d307-dd11-8735-00065b8ce99b": "MM/DD/YYYY"
      , "fff119c9-d307-dd11-8735-00065b8ce99b": "DD/MM/YYYY"
      , "fdf119c9-d307-dd11-8735-00065b8ce99b": "MMMM DD, YYYY"
    }
  }
  
  componentWillReceiveProps(nextProps) {
    const { selectedElement, jotblockSettingShow } = nextProps.parent.state;
    const { isCommon } = this.state;
    if (selectedElement.borderSides) {
      
      // current selected border
      let borderSides = "all"
      if (!selectedElement.borderSides.bottom && !selectedElement.borderSides.right && !selectedElement.borderSides.left && !selectedElement.borderSides.top) {
        borderSides = "none";
      } else if (selectedElement.borderSides.bottom && !selectedElement.borderSides.right && !selectedElement.borderSides.left && !selectedElement.borderSides.top) {
        borderSides = "bottom";
      }

      this.setState({ element: selectedElement, borderSides });
    } else if (!jotblockSettingShow && !isCommon) {
      this.setState({ isCommon: true });
    }
  }

  _handleFormChange(e) {
    const fixedElement = _.cloneDeep(this.state.element);
    const element = _.cloneDeep(this.state.element);
    if (e.target.name === "mergeField") {
      element["fixedText"] = `${element.fixedText}${e.target.value}`;
    } else {
      // update target field
      element[e.target.name] = e.target.value;

      if (e.target.name === "validationID") {

        // update signerInputType optional
        if (e.target.value === "f9f119c9-d307-dd11-8735-00065b8ce99b" || e.target.value === "faf119c9-d307-dd11-8735-00065b8ce99b" || e.target.value === "f5f119c9-d307-dd11-8735-00065b8ce99b"
        || e.target.value === "fcf119c9-d307-dd11-8735-00065b8ce99b" || e.target.value === "fff119c9-d307-dd11-8735-00065b8ce99b" || e.target.value === "fdf119c9-d307-dd11-8735-00065b8ce99b") {
          element["signerInputType"] = "prefill";
        } else {
          element["signerInputType"] = "free_Text";      
        }

        // update instructions optional
        const dateFormat = ["YYYY/MM/DD", "MM/DD/YYYY", "MM/DD/YYYY", "DD/MM/YYYY", "MMMM DD, YYYY"];
        if (dateFormat.some(format => element.instructions.includes(format))) {
          function preg_quote (str, delimiter) {
            return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&')
          }
          element["instructions"] = element.instructions.replace(new RegExp("(" + preg_quote(this.dateValidator[fixedElement.validationID]) + ")", 'gi'), this.dateValidator[e.target.value])
        }
      }
    }


    this.setState({ element });
  }

  _handleFormSubmit() {

  }

  _handleChangeBorder(val) {
    let element = _.cloneDeep(this.state.element);
    let borderSides = {
      bottom: true,
      left: true,
      right: true,
      top: true
    }

    if (val === "none") {
      borderSides.bottom = false
      borderSides.left = false
      borderSides.right = false
      borderSides.top = false
    } else if (val === "bottom") {
      borderSides.bottom = true
      borderSides.left = false
      borderSides.right = false
      borderSides.top = false
    }

    element.borderSides = borderSides;
    this.setState({ borderSides: val, element  });
  }

  _handleChangeDecoration(name, val) {
    let element = _.cloneDeep(this.state.element);
    element.fontDecoration[name] = !val;
    this.setState({ element });
  }

  _handleAlignment(name, val) {
    let element = _.cloneDeep(this.state.element);
    element[name] = val;
    this.setState({ element });
  }

  _handleStartedCompleted(val) {
    let element = _.cloneDeep(this.state.element);
    element["timing"] = val;
    this.setState({ element });
  }

  

  _handleSubmitOption() {

    // const elements = _.cloneDeep(this.state.elements);
    // const elIndex = elements.length;
    // let newElement = _.cloneDeep(element);
    // if (elements && newElement) {

    //   // set index for new element
    //   newElement.elIndex = elIndex;

    //   // get default position for new element
    //   const parent = ev.target.parentElement.parentElement.parentElement;
    //   if (parent.className.includes("-jotblock-draggable")) {
    //     let matrix = parent.style.transform || parent.style.webkitTransform || parent.style.mozTransform;
    //     matrix = matrix.split(" ");
    //     newElement.pos.x = matrix[0] ? (parseFloat(matrix[0].replace(/[^\d.-]/g, '')) - 10) : newElement.pos.x;  
    //     newElement.pos.y = matrix[1] ? (parseFloat(matrix[1].replace(/[^\d.-]/g, '')) - 10) : newElement.pos.y;
    //   }

    //   elements.push(newElement);
    //   this.setState({ elements, selectedElement: newElement });
    // }

    const { element, OptionProperty, isAddOptions, isEditOptions, isEditOptionIndex } = this.state;
    
    OptionProperty.pageIndex = element.pageIndex;
    if (isAddOptions && !isEditOptions) {
      if (element.jotblockId == 6) {
        OptionProperty.position = {};
        const parent = document.querySelector(`.-jotblock-draggable.-jotblock-${element.pageIndex + 1}-${element.elIndex}.-checkbox-jb.-option-0`);
        let matrix = parent.style.transform || parent.style.webkitTransform || parent.style.mozTransform;
        matrix = matrix.split(" ");
        OptionProperty.position.x = matrix[0] ? (parseFloat(matrix[0].replace(/[^\d.-]/g, '')) - 10) : element.pos.x;  
        OptionProperty.position.y = matrix[1] ? (parseFloat(matrix[1].replace(/[^\d.-]/g, '')) - 10) : element.pos.y;  
      }
      element.options.push(OptionProperty);
    } else if (!isAddOptions && isEditOptions) {
      element.options[isEditOptionIndex] = OptionProperty;
    }
    
    this.setState({ element }, () => {
      this._handleOptionReset();
    });
  }

  _handleOptionReset() {
    this.setState({
      OptionProperty: {
        graphicRenderType: "none"
        , selected: false
        , text: ""
        , value: ""
        , position: {}
      }
      , isAddOptions: false
      , isEditOptions: false
      , isEditOptionIndex: 0
    })
  }

  _handleOptionChange(e) {  
    let OptionProperty = _.cloneDeep(this.state.OptionProperty);
    if (e.target.name === "text" && OptionProperty.value == OptionProperty.text) {
      OptionProperty.value = e.target.value;
    }
    OptionProperty[e.target.name] = e.target.value;
    this.setState({ OptionProperty });
  }

  _handleDeleteOption() {
    const { element, isEditOptionIndex } = this.state;
    const deletedOption = element.options.splice(isEditOptionIndex, 1);    
    // element.multipleChoiceDefaultValues = element.multipleChoiceDefaultValues.filter(val => val === deletedOption.value);
    this.setState({ element }, () => {
      this._handleOptionReset();
    });
  }

  _handleMultpleDefaultValue() {
    const { element, optionDefaultValue } = this.state;
    if (element.multipleChoiceDefaultValues.length && element.jotblockId == 5) {
      this.setState({ optionDefaultValueError: "Only one default value allowed" });
    } else if (element.multipleChoiceDefaultValues.includes(optionDefaultValue)) {
      this.setState({ optionDefaultValueError: "Unable to add. Value already exists" });
    } else if (element.options.some(option => option.value === optionDefaultValue)) {
      element.multipleChoiceDefaultValues.push(optionDefaultValue);
      this.setState({ element, optionDefaultValue: "" });
    } else {
      this.setState({ optionDefaultValueError: `${optionDefaultValue} is not a given value in the multiple choice options` });
    }
  }

  _handleRemoveMultpleDefaultValue(index) {
    const { element } = this.state;
    element.multipleChoiceDefaultValues.splice(index, 1);
    this.setState({ element });
  } 

  _handlePenColorChange(val) {
    const element = _.cloneDeep(this.state.element);
    element["penColor"] = val;
    this.setState({ element });
  }

  _handleGetResult(result) {
    const element = _.cloneDeep(this.state.element);
    element.lines = result;
    element.fixedDrawn = result;
    this.setState({ element });
  }

  render () {
      const { state, _handleClose, props, _handleSaveChanges, _handleRemoveElement } = this.props.parent;
      const { signers } = props;
      const { jotblockSettingShow, selectedElement, } = state;
      const { element, isCommon, borderSides, isAddOptions, OptionProperty, isEditOptions, isEditOptionIndex, selectedDisplayAs, optionDefaultValue
        , optionDefaultValueError } = this.state;
      const fixedElement = selectedElement ? selectedElement : {};
      const signerLabel = signers[fixedElement.signerIndex] ? `(${signers[fixedElement.signerIndex].label})` : "unknown";
      const fontDecoration = element.fontDecoration ? element.fontDecoration : {};

      // HEADER JOTBLOCK TYPE   
      const fieldTypeItem = [
        "Signature", "Initials", "Date", "Timestamp", "Text", "Dropdown", "Multiple Choice",
        "Signer Attachment", "Fixed (Signature)", "Fixed (Text)"
      ];

      // SIGNATURE TYPE
      const signatureStyleItem = [
        { _display: "Let the signer choose", _value: "selectable", _desc: ""  }
        , { _display: "Drawn with touch, mouse, or stylus", _value: "drawn", _desc: ""  }
        , { _display: "Typed with a keyboard", _value: "typed", _desc: ""  }
      ];

      // TEXT MASKS FORMAT
      const textMaskItem = [
        { _display: "No Mask", _value: "", _desc: "" }
        , { _display: "Alphanumeric Mask (*************)", _value: "alphanumeric", _desc: "" }
        , { _display: "Credit Card Mask (xxxx xxxx xxxx 1234)", _value: "creditcard", _desc: "" }
        , { _display: "SSN Mask (xxx-xx-1234)", _value: "ssn", _desc: "" }
      ];

      // TEXT VALIDATION
      const textValidatorItem = [
        { _display: "No Validation", _value: "", _desc: "" }
        , { _display: "Alphanumeric with full name prefill", _value: "f9f119c9-d307-dd11-8735-00065b8ce99b", _desc: "" }
        , { _display: "Alphanumeric with email address prefill", _value: "faf119c9-d307-dd11-8735-00065b8ce99b", _desc: "" }
        , { _display: "Numeric only", _value: "fbf119c9-d307-dd11-8735-00065b8ce99b", _desc: "" }
        , { _display: "10 digit phone number", _value: "fef119c9-d307-dd11-8735-00065b8ce99b", _desc: "" }
      ];

      // FONT FAMILY
      const fontFamilyItem = [
        { _display: "Courier New", _value: "courier_New", _desc: ""  }
        , { _display: "Times New Roman", _value: "times_New_Roman", _desc: ""  }
        , { _display: "Arial", _value: "arial", _desc: ""  }
        , { _display: "Bradley Hand ITC", _value: "bradley_Hand_ITC", _desc: ""  }
        , { _display: "Brush Script BT", _value: "brush_Script_BT", _desc: ""  }
        , { _display: "My Handwriting", _value: "my_Handwriting", _desc: ""  }
        , { _display: "Otto", _value: "otto", _desc: ""  }
      ];

      // DATE VALIDATION
      const dateValidatorItem = [
        { _display: "Date in YYYY/MM/DD format with current date prefill", _value: "f5f119c9-d307-dd11-8735-00065b8ce99b", _desc: ""  }
        , { _display: "Date in MM/DD/YYYY format", _value: "f6f119c9-d307-dd11-8735-00065b8ce99b", _desc: ""  }
        , { _display: "Date in MM/DD/YYYY format with current date prefill", _value: "fcf119c9-d307-dd11-8735-00065b8ce99b", _desc: ""  }
        , { _display: "Date in DD/MM/YYYY format with current date prefill", _value: "fff119c9-d307-dd11-8735-00065b8ce99b", _desc: ""  }
        , { _display: "Date in MMMM DD, YYYY format with current date prefill", _value: "fdf119c9-d307-dd11-8735-00065b8ce99b", _desc: ""  }
      ];

      // MERGE FIELD
      const mergeFieldItem = [
        { _display: "Account Display Name", _value: "[Company Name]", _desc: "" }
        , { _display: "Username", _value: "[Username]", _desc: "" }
        , { _display: "User Full Name", _value: "[UserFullName]", _desc: "" }
        , { _display: "eSignature Platform Name", _value: "[eSignature Platform Name]", _desc: "" }
        , { _display: "Envelope ID", _value: "[Envelope ID]", _desc: "" }
        , { _display: "Envelope AuthToken", _value: "[Envelope AuthToken]", _desc: "" }
        , { _display: "Envelope Name", _value: "[Envelope Name]", _desc: "" }
        , { _display: "Envelope Order Number", _value: "[Envelope Order ID]", _desc: "" }
        , { _display: "Envelope Creation Date", _value: "[Envelope Creation Date]", _desc: "" }
        , { _display: "Envelope Start Date", _value: "[Envelope Start Date]", _desc: "" }
        , { _display: "Envelope Completion Date", _value: "[Envelope Completion Date]", _desc: "" }
        , { _display: "Document ID", _value: "[Document ID]", _desc: "" }
        , { _display: "Document Auth Token", _value: "[Document AuthToken]", _desc: "" }
        , { _display: "Document Name", _value: "[Document Name]", _desc: "" }
        , { _display: "Document Order Number", _value: "[Order ID]", _desc: "" }
        , { _display: "Document Creation Date", _value: "[Document Creation Date]", _desc: "" }
        , { _display: "Document Start Date", _value: "[Document Start Date]", _desc: "" }
        , { _display: "Document Completion Date", _value: "[Completion Date]", _desc: "" }
        , { _display: "Transaction Name", _value: "[Transaction Name]", _desc: "" }
        , { _display: "Transaction Type Name", _value: "[Transaction Type Name]", _desc: "" }
        , { _display: "Transaction Creation Date", _value: "[Transaction Creation Date]", _desc: "" }
        , { _display: "Transaction Start Date", _value: "[Transaction Start Date]", _desc: "" }
        , { _display: "Transaction Completion Date", _value: "[Transaction Completion Date]", _desc: "" }
        , { _display: "Signatory Knowlegde-based Authentication Summary", _value: "[Signatory KBA Summary]", _desc: "" }
      ];

      // OPTION DISPLAY AS 
      const optionsDisplayAsItem = [
        { _display: "Value", _value: "none", _desc: "" }
        , { _display: "Text", _value: "text", _desc: "" }
        , { _display: "Checkmark", _value: "no_Box_Check", _desc: "" }
        , { _display: "X-Mark", _value: "no_Box_X", _desc: "" }
        , { _display: "Empty Box", _value: "empty", _desc: "" }
        , { _display: "Checkmark Box", _value: "check", _desc: "" }
        , { _display: "X-Mark Box", _value: "x", _desc: "" }
        , { _display: "Nothing", _value: "no_Box_Empty", _desc: "" }
      ];

      // DISABLED OPTION BUTTON
      const addOptionBtnDisabled = !OptionProperty.text || !OptionProperty.value;
    
      // const { signerLabel } = this.state;
      return jotblockSettingShow ?
           (
              <div className="-jotblock-setting-modal-container">
                <div> 
                  <div className="-jotblock-setting-header">
                    { `Edit JotBlock '${fixedElement.name}' - ${fieldTypeItem[fixedElement.jotblockId]} ${signerLabel}` }
                  </div>

                  <div className="-jotblock-setting-body">
                    <div className="-jb-setting-option-nav">
                      <div className={`-jb-setting-option-common ${isCommon ? "-active" : ""}`} 
                        onClick={() => isCommon ? null : this.setState({ isCommon: true })}>Common</div>
                      <div className={`-jb-setting-option-display ${isCommon ? "" : "-active"}`} 
                        onClick={() => !isCommon ? null : this.setState({ isCommon: false })}>Display</div>
                    </div>

                    {
                      isCommon ?
                      <div>

                        {/** ALWAYS DISPLAY */}
                        <div className="-jb-setting-three-switch">
                          {
                            /** NOT DISPLAY IN TIMESTAMP JOTBLOCK */
                            ![ "3", "8" ].includes(fixedElement.jotblockId) ?
                            <div className="-jb-required">
                              <ToggleSwitchInput
                                label=""
                                change={this._handleFormChange}
                                name="required"
                                rounded={true}
                                value={element.required}
                              />
                              <label>Required</label>
                            </div> : null
                          }
                          {
                            /** NOT DISPLAY IN FIXED TEXT */
                            ![ "5", "6", "8", "9" ].includes(fixedElement.jotblockId) ?
                            <div className="-jb-certified">
                              <ToggleSwitchInput
                                label=""
                                change={this._handleFormChange}
                                name="certified"
                                rounded={true}
                                value={element.certified}
                              />
                              <label>Certified</label>
                            </div> : null
                          }
                          <div className="-jb-hidden">
                            <ToggleSwitchInput
                              label=""
                              change={this._handleFormChange}
                              name="hidden"
                              rounded={true}
                              value={element.hidden}
                            />
                            <label>Hidden</label>
                          </div>
                          {
                            /** NOT DISPLAY IN FIXED TEXT */
                            [ "9" ].includes(fixedElement.jotblockId) ?
                            <div className="-jb-certified">
                              <label>Enter the text you would like to appear on the document</label>
                            </div> : null
                          }
                        </div>

                        {
                           /** NOT DISPLAY IN FIXED TEXT JOTBLOCK */
                          ![ "3", "8", "9" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-instruction -text-field">
                            <TextInput
                              change={this._handleFormChange}
                              label="Enter some brief Instructions for the Signer"
                              name="instructions"
                              value={element.instructions}
                            />
                          </div> : null                          
                        }

                        {
                          /** DISPLAY ONLY FOR FIXED SIGNATURE JOTBLOCK */
                          [ "8" ].includes(fixedElement.jotblockId) ?
                          <div className="-signature-touchpad">
                            <label>Provide the signature or initials that will appear on the document</label>
                            <canvas id="canvas"></canvas>
                            <SignatureTouchPad element={element} handleGetResult={this._handleGetResult} />
                          </div>
                            
                          : null
                        }

                        {
                          /** DISPLAY ONLY FOR FIXED TEXT JOTBLOCK */
                          [ "9" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-signature-style -text-field">
                            <SelectFromObject 
                              change={this._handleFormChange}
                              display="_display"
                              label="Insert Merger Fields"
                              name="mergeField"
                              value="_value"
                              items={mergeFieldItem}
                              placeholder=""
                              selected={element.mergeField}
                            />
                          </div> : null 
                        }

                        {
                          /** DISPLAY ONLY FOR FIXED TEXT JOTBLOCK */

                          [ "9" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-tag -text-field">
                            <TextInput
                              change={this._handleFormChange}
                              label="Edit fixed text"
                              name="fixedText"
                              value={element.fixedText}
                            />
                          </div> : null
                        }

                        {
                          /** DISPLAY ONLY FOR FIXED TEXT JOTBLOCK */
                          
                          [ "8", "9" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-signature-style -text-field">
                            <div className="input-group">
                              <label>Apply when the document is...</label>
                              <div className="box-list -started-completed">
                                <div>
                                  <button className={element.timing === "on_Document_Start" ? "-active" : ""} onClick={this._handleStartedCompleted.bind(this, "on_Document_Start")}>STARTED</button>
                                </div>
                                <div>
                                  <button className={element.timing === "on_Document_Complete" ? "-active" : ""} onClick={this._handleStartedCompleted.bind(this, "on_Document_Complete")}>COMPLETED</button>
                                </div>
                              </div>
                            </div>
                          </div> : null 
                        }

                        {
                          /** DISPLAY ONLY FOR DATE JOTBLOCK */
                          
                          [ "2" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-signature-style -text-field">
                            <SelectFromObject 
                              change={this._handleFormChange}
                              display="_display"
                              label="Validators"
                              name="validationID"
                              value="_value"
                              items={dateValidatorItem}
                              selected={element.validationID}
                            />
                          </div> : null 
                        }

                        {
                          /** DISPLAY ONLY FOR SIGNATURE, INITIALS JOTBLOCK */
                          
                          [ "0", "1" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-signature-style -text-field">
                            <SelectFromObject 
                              change={this._handleFormChange}
                              display="_display"
                              label={`Style of ${fixedElement.jotblockId == 0 ? "Signature" : "Initials"}`}
                              name="signatureStyle"
                              value="_value"
                              items={signatureStyleItem}
                              selected={element.signatureStyle}
                            />
                          </div> : null
                        }

                        {/** ALWAYS DISPLAY */}
                        <div className="-jb-setting-jotblock-name -text-field">
                          <TextInput
                            change={this._handleFormChange}
                            label="JotBlock name"
                            name="name"
                            value={element.name}
                          />
                        </div>

                        {
                          /** DISPLAY ONLY FOR TEXT JOTBLOCK */

                          [ "4" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-tag -text-field">
                            <TextInput
                              change={this._handleFormChange}
                              label="Enter text to prefill the JotBlock (optional)"
                              name="fixedText"
                              value={element.fixedText}
                            />
                          </div> : null
                        }

                        {/** ALWAYS DISPLAY */}
                        <div className="-jb-setting-tag -text-field">
                          <TextInput
                            change={this._handleFormChange}
                            label="Tag"
                            name="tag"
                            value={element.tag}
                          />
                        </div>
                        

                        {
                          // DISPLAY ONLY FOR DROPDOWN JOTBLOCK 

                          [ "5", "6" ].includes(fixedElement.jotblockId) ?
                            <div className="-jb-setting-options -text-field">
                              <div className="input-group">
                                <label>Options</label>
                                {
                                  element.options.length ? 
                                  <div className="-option-list">
                                    {
                                      element.options.map((option, i) => 
                                        <div key={i}>
                                          <div className="-option-icon-container" style={{ background: element.currentbgColor }}>
                                            <i className={element.icon}></i>
                                          </div>
                                          <label>{option.text}</label>
                                          <div onClick={() => this.setState({ isEditOptions: true, OptionProperty: option, isAddOptions: false, isEditOptionIndex: i })}
                                            className="-signer-option-button"><svg viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg></div>
                                        </div>
                                      )
                                    }
                                  </div> : null
                                }
                                {
                                  isAddOptions || isEditOptions ? 
                                  <div className="-option-container">
                                    <TextInput
                                      change={this._handleOptionChange}
                                      label="Display text"
                                      name="text"
                                      value={OptionProperty.text}
                                    />
                                    <TextInput
                                      change={this._handleOptionChange}
                                      label="Value to save"
                                      name="value"
                                      value={OptionProperty.value}
                                    />
                                    <SelectFromObject 
                                      change={this._handleOptionChange}
                                      display="_display"
                                      label="Display As"
                                      name="graphicRenderType"
                                      value="_value"
                                      items={optionsDisplayAsItem}
                                      selected={OptionProperty.graphicRenderType}
                                    />                                    
                                    <div className="-option-btn-container">
                                      { isEditOptions && !isAddOptions ? <button className="-jotblock-link-button -left" onClick={this._handleDeleteOption}>DELETE OPTION</button> : null }
                                      <button className="-jotblock-link-button" onClick={this._handleOptionReset}>CANCEL</button>
                                      <button className="-jotblock-link-button" onClick={this._handleSubmitOption} disabled={addOptionBtnDisabled}>{ isEditOptions ? "UPDATE OPTION" : "SAVE OPTION" }</button>
                                    </div>
                                  </div>
                                  : 
                                  <div className="-addnew-option">
                                    <button className="-jotblock-link-button -left" onClick={() => this.setState({ isAddOptions: true, isEditOptions: false })}>NEW OPTION</button>
                                  </div>
                                }
                              </div>
                            </div>
                          : null
                        }

                        {
                          /** DISPLAY ONLY FOR TEXT JOTBLOCK */

                          [ "5", "6" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-option-value -text-field">
                            <div className="input-group">
                              <label>Default Value</label>
                              <div className="input-add-on -option-default">
                                {
                                  element.multipleChoiceDefaultValues.map((val, i) => 
                                    <div className="-option-default-value" key={i}>
                                      {val}
                                      <i className="fal fa-times-circle" onClick={this._handleRemoveMultpleDefaultValue.bind(this, i)}></i>
                                    </div>    
                                  )
                                }
                                <input className="-option-default-value-input" type="text" name="optionDefaultValue" value={optionDefaultValue}
                                  onChange={(e) => this.setState({ optionDefaultValue: e.target.value, optionDefaultValueError: "" })} />
                              </div>
                              <small className="help-text">
                                  <em>{optionDefaultValueError}</em>
                                </small>
                            </div>
                            <button 
                              onClick={this._handleMultpleDefaultValue}
                              className="-circle-plus-button" disabled={optionDefaultValue ? false : true}><i className="far fa-plus"></i></button>
                          </div> : null
                        } 
                      </div>
                      : 
                      <div>

                        {
                          /** DISPLAY ONLY FOR FIXED SIGNATURE JOTBLOCK */
                          [ "8" ].includes(fixedElement.jotblockId) ?
                          <div className="-signature-touchpad" style={{ position: "absolute", top: "1000px" }}>
                            <label>Provide the signature or initials that will appear on the document</label>
                            <canvas id="canvas"></canvas>
                            <SignatureTouchPad element={element} handleGetResult={this._handleGetResult} />
                          </div>
                            
                          : null
                        }

                        {
                          /** DISPLAY ONLY FOR TEXT, DATE JOTBLOCK */
                          
                          [ "2", "4", "5", "6", "9" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-signature-style -text-field">
                            <SelectFromObject 
                              change={this._handleFormChange}
                              display="_display"
                              label="Text Masks"
                              name="formatterType"
                              value="_value"
                              items={textMaskItem}
                              selected={element.formatterType}
                            />
                          </div> : null
                        }

                        {
                          /** DISPLAY ONLY FOR TEXT JOTBLOCK */
                        
                          [ "4" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-signature-style -text-field">
                            <SelectFromObject 
                              change={this._handleFormChange}
                              display="_display"
                              label="Validators"
                              name="validationID"
                              value="_value"
                              items={textValidatorItem}
                              selected={element.validationID}
                            />
                          </div> : null
                        }

                        {
                          [ "2", "3", "4", "5", "6", "9" ].includes(fixedElement.jotblockId)  || ![ "8" ].includes(fixedElement.jotblockId) ? 
                          <div className="-jb-setting-fontsize -text-field">
                            {
                              /** NOT DISPLAY ONLY FOR FIXED SIGNATURE JOTBLOCK */
                              ![ "8" ].includes(fixedElement.jotblockId) ?
                              <SelectFromObject 
                                change={this._handleFormChange}
                                display="_val"
                                label="Font size"
                                name="fontSize"
                                value="_val"
                                items={[{ _val: 6 }, { _val: 8 }, { _val: 10 }, { _val: 12 }, { _val: 14 }]}
                                selected={element.fontSize}
                              /> : null
                            }
                            {
                              /** DISPLAY ONLY FOR TEXT, DATE JOTBLOCK */
                              
                              [ "2", "3", "4", "5", "6", "9" ].includes(fixedElement.jotblockId) ?
                              <SelectFromObject 
                                change={this._handleFormChange}
                                display="_display"
                                label="Font Name"
                                name="fontName"
                                value="_value"
                                items={fontFamilyItem}
                                selected={element.fontName}
                              /> : null
                            }
                          </div> : null               
                        }

                        {
                          /** DISPLAY ONLY FOR TEXT, DATE JOTBLOCK */
                          [ "2", "3", "4", "5", "6", "9" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-box -text-field">
                            <div className="input-group">
                              <label>Style</label>
                              <div className="box-list">
                                <div 

                                  className={`-box ${fontDecoration.bold ? "-active" : ""}`}
                                  onClick={this._handleChangeDecoration.bind(this, "bold", fontDecoration.bold)}>
                                    <i className="far fa-bold" style={{ fontWeight: 700 }}></i>
                                </div>
                                <div 
                                  className={`-box ${fontDecoration.italic ? "-border -active" : "-border"}`}
                                  onClick={this._handleChangeDecoration.bind(this, "italic", fontDecoration.italic)}>
                                    <i className="far fa-italic"></i>
                                </div>
                                <div 
                                  className={`-box ${fontDecoration.underline ? "-active" : ""}`}
                                  onClick={this._handleChangeDecoration.bind(this, "underline", fontDecoration.underline)}>
                                    <i className="far fa-underline"></i>
                                </div>
                              </div>
                            </div>
                            <div className="input-group -alignment">
                              <label>Alignment</label>
                              <div className="box-list -alignment-left">
                                <div 
                                  className={`-box ${element.horizontalAlignment === "left" ? "-active" : ""}`}
                                  onClick={this._handleAlignment.bind(this, "horizontalAlignment", "left")}>
                                    <i className="far fa-align-left"></i>
                                </div>
                                <div 
                                  className={`-box ${element.horizontalAlignment === "center" ? "-border -active" : "-border"}`}
                                  onClick={this._handleAlignment.bind(this, "horizontalAlignment", "center")}>
                                    <i className="far fa-align-center"></i>
                                </div>
                                <div 
                                  className={`-box ${element.horizontalAlignment === "right" ? "-active" : ""}`}
                                  onClick={this._handleAlignment.bind(this, "horizontalAlignment", "right")}>
                                    <i className="far fa-align-right"></i>
                                </div>
                              </div>
                              <div className="box-list -alignment-right">
                                <div 
                                  className={`-box ${element.verticalAlignment === "top" ? "-active" : ""}`}
                                  onClick={this._handleAlignment.bind(this, "verticalAlignment", "top")}  style={{ padding: "7px 11px" }}>
                                    <i className="far fa-arrow-to-top"></i>
                                </div>
                                <div 
                                  className={`-box ${element.verticalAlignment === "middle" ? "-active" : ""}`}
                                  onClick={this._handleAlignment.bind(this, "verticalAlignment", "middle")} style={{ padding: "5px 8px" }}>
                                    <svg viewBox="0 0 24 24"><path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z"></path></svg>
                                </div>
                                <div 
                                  className={`-box ${element.verticalAlignment === "bottom" ? "-active" : ""}`}
                                  onClick={this._handleAlignment.bind(this, "verticalAlignment", "bottom")} style={{ padding: "7px 11px" }}>
                                    <i className="far fa-arrow-to-bottom"></i>
                                </div>
                              </div>
                            </div>
                          </div> : null
                        }

                        {
                          /** DISPLAY ONLY FOR FIXED SIGNATURE JOTBLOCK */
                          [ "8" ].includes(fixedElement.jotblockId) ?
                          <div className="-jb-setting-box -text-field">
                            <div className="input-group">
                              <label>Border</label>
                              <div className="box-list -border">
                                <div 
                                  className={`-box -penColor ${element.penColor === "black" ? "-active" : ""}`}
                                  onClick={this._handlePenColorChange.bind(this, "black")}>
                                    BLACK
                                </div>
                                <div 
                                  className={`-box -penColor ${element.penColor === "blue" ? "-active" : ""}`}
                                  onClick={this._handlePenColorChange.bind(this, "blue")}>
                                    BLUE
                                </div>
                              </div>
                            </div>
                          </div> : null
                        }

                        {/** ALWAYS DISPLAY */}
                        <div className="-jb-setting-box -text-field">
                          <div className="input-group">
                            <label>Border</label>
                            <div className="box-list -border">
                              <div 
                                className={`-box ${borderSides === "none" ? "-active" : ""}`}
                                onClick={this._handleChangeBorder.bind(this, "none")}>
                                  <i className="far fa-border-none"></i>
                              </div>
                              <div 
                                className={`-box ${borderSides === "bottom" ? "-active" : ""}`}
                                onClick={this._handleChangeBorder.bind(this, "bottom")}>
                                  <i className="far fa-border-bottom"></i>
                              </div>
                              <div 
                                className={`-box ${borderSides === "all" ? "-active" : ""}`}
                                onClick={this._handleChangeBorder.bind(this, "all")}>
                                  <i className="far fa-border-all"></i>
                              </div>
                            </div>
                          </div>
                          {
                            /** DISPLAY ONLY FOR TEXT, DATE JOTBLOCK */
                            [ "2", "3", "4", "5", "6", "9" ].includes(fixedElement.jotblockId) ?
                            <SelectFromObject 
                              change={this._handleFormChange}
                              display="_display"
                              label="Word Wrap"
                              name="wordWrap"
                              value="_value"
                              items={[{ _display: "Yes", _value: "true" }, { _display: "No", _value: "false" }]}
                              selected={element.wordWrap}
                            /> : null
                          }
                        </div>
                      </div>
                    }


                  </div>
                  <div className="-jotblock-setting-footer">
                      <button className="-jotblock-link-button -left" onClick={() => _handleRemoveElement(fixedElement.elIndex)}>DELETE JOTBLOCK</button>
                      <button type="button" className="yt-btn small link info" onClick={_handleClose}>Cancel</button>
                      <button type="button" className="yt-btn small info" onClick={() => _handleSaveChanges(element)}>Save</button>
                  </div>
                </div>
              </div>
          )
          :   null;
  }
}