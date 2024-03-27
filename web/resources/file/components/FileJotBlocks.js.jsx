/**
 * Wraps all ShareLink components in a default container. If you want to
 * give all ShareLink views a sidebar for example, you would set that here.
 */
/**
 * Global DefaultTopNav component.
 */

// import primary libararies
import React from 'react';
import PropTypes, { element } from 'prop-types';
import { NavLink, Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import resources 
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';
import PreviewFile from './PreviewFile.js.jsx';

// import third-party libraries
import classNames from 'classnames';
// import Draggable, {DraggableCore} from 'react-draggable';

// import components
import Binder from '../../../global/components/Binder.js.jsx';
import { fileUtils, displayUtils } from '../../../global/utils';
import { ToggleSwitchInput, TextInput } from '../../../global/components/forms'
import templateUtils from '../../../global/utils/templateUtils.js';

// import actions 
// import * as fileActions from '../../file/fileActions';


// import * as htmlToImage from 'html-to-image';
// import html2PDF from "html-pdf-adaptive"
// import html2canvas from 'html2canvas';
// import { isLinearGradient } from 'html2canvas/dist/types/css/types/image';
const async = require('async');

class FileJotBlocks extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            signatureModalOpen: false
            , signerContainerShow: false
            , signers: [{
                email: "",
                label: "Signer 1",
                name: "",
                password: "",
                passwordPrompt: "Please enter the last 4 digits of your account number.",
                signatureStyle: "selectable",
                firstname: "Signer",
                lastname: "1",
                attachments: []
            }]
            , signerShowModal: false
            , selectedSignerIndex: 0
            , signerIsEditing: false
            , JotBlocksList: [
                { id: '0', icon: "far fa-file-signature", label: "Signature"}
                , { id: '1', icon: "", label: "Initials"}
                , { id: '2', icon: "far fa-calendar-day", label: "Date"}
                , { id: '3', icon: "far fa-clock", label: "Timestamp"}
                , { id: '4', icon: "far fa-keyboard", label: "Text"}
                , { id: '5', icon: "far fa-list", label: "Dropdown"}
                , { id: '6', icon: "far fa-check", label: "Multiple Choice"}
                , { id: '7', icon: "far fa-upload", label: "Signer Attachment"}
                , { id: '8', icon: "fas fa-file-signature", label: "Fixed (Signature)"}
                , { id: '9', icon: "fas fa-keyboard", label: "Fixed (Text)"}
            ]
            , jotblockContainerShow: true
            , activeDrags: 0
            , deltaPosition: {
              x: 0, y: 0
            }
            , controlledPosition: {
              x: -400, y: 200
            }
            , attachmentShowModal: false
            , attachmentIsEditing: false
            , attchmentSignerOption: false
            , attachmentIndex: 0
            , selectedAttachment: {}
            , submitErrorMessage: []
        }
        this._bind(
            '_handleSignerSubmit'
            , '_handleClose'
            , '_handleSelectedJotblock'
            , '_handleElements'
            , '_handleSignatureStyle'
            , '_handleAttachmentSubmit'
            , '_handleDeleteFromModal'
            , '_handleSubmitTemplate'
        );

        this.defaultSignerValue = {
            email: "",
            label: "",
            name: "",
            password: "",
            // passwordPrompt: "",
            signatureStyle: "selectable",
            firstname: "",
            lastname: "",
            attachments: []
        }
        this.elements = {};
    }

    _handleSignerSubmit(signerLabel) {
        let signer = _.cloneDeep(this.defaultSignerValue);
        let signers = _.cloneDeep(this.state.signers);
        let selectedSignerIndex = _.cloneDeep(this.state.selectedSignerIndex);
        const { signerIsEditing } = this.state;
        signer.label = signerLabel;
        if (signerLabel.split(" ")[0]) {
            signer.firstname = signerLabel.split(" ")[0];
        }
        if (signerLabel.split(" ")[1]) {
            signer.lastname = signerLabel.split(" ")[1];
        }
        if (signerIsEditing && signers[selectedSignerIndex]) {
            signers[selectedSignerIndex] = signer;
        } else {
            signers.push(signer);
            selectedSignerIndex = signers.length - 1;
        }
        this.setState({ signers, signerShowModal: false, selectedSignerIndex, signerIsEditing: false });
    }

    _handleClose() {
        this.setState({
            signerShowModal: false
            // , selectedSignerIndex: 0
            , signerIsEditing: false
            , attachmentShowModal: false
            , attachmentIsEditing: false
        });
    }

    onDragStart = (ev, type, data) => {
        if (type === "swap") {
            ev.dataTransfer.setData("text", data);
            try {
                if (document.querySelector(".-swap-signer-index")) {
                    ev.dataTransfer.setDragImage(document.querySelector(".-swap-signer-index"), 20, 20);
                }
            } catch (error) {
                console.log("error setDragImage isn't supported for this browser");
            }
        } else if (type === "jotblock") {
            const newId = data.id;
            const body = document.querySelector("body");
            const outlook = document.getElementById("outlook-main-yote");
            const rect = ev.target.getBoundingClientRect();
            const bodyRect = outlook ? { left: 0, top: 0 } : body.getBoundingClientRect();
            const x = newId == 6 ? 60 : (ev.pageX - rect.left) + bodyRect.left;
            const y = 45;

            let dataTransfer = {
                id: newId
                , icon: data.icon
                , xPosition: x
                , yPosition: y
            }
            dataTransfer = JSON.stringify(dataTransfer);
            ev.dataTransfer.setData("text", dataTransfer);
            try {
                if (document.querySelector(`.-jotblock-mirror-container.-jotblock-${newId}`)) {
                    ev.dataTransfer.setDragImage(document.querySelector(`.-jotblock-mirror-container.-jotblock-${newId}`), x, y);
                }
            } catch (error) {
                console.log("error setDragImage isn't supported for this browser");
            }
        }
    }

    onDragOver = (ev) => {
        ev.preventDefault();
        // ev.dataTransfer.dropEffect = "move";
    }

    onDrop = (ev, type, name) => {
        /**
         * name and swap variable is the index of signers state
         */

        if (type === "swap") {
            const signers = _.cloneDeep(this.state.signers);
            const swap = ev.dataTransfer.getData("text"); 
            if (signers[swap] && signers[name]) {
                const tmp = _.cloneDeep(signers[swap]);
                signers[swap] = signers[name];
                signers[name] = tmp;
                this.setState({ signers, selectedSignerIndex: name });
            }
        }
    }

    _handleSelectedJotblock(id) {
        this.setState({ selectedSignerIndex: id });
    }

    _handleElements(index, elements) {
        this.elements[index] = elements;
    }

    _handleSignatureStyle(element) {
        const signers = _.cloneDeep(this.state.signers);
        signers[element.signerIndex].signatureStyle = element.signatureStyle;
        this.setState({ signers });
    }

    _handleAttachmentSubmit(attachment) {
        const { signers, selectedSignerIndex, attachmentIsEditing, attachmentIndex } = this.state;
        let newAttachment = attachment;
        newAttachment.signer = signers[selectedSignerIndex].label;
        if (attachmentIsEditing) {
            signers[selectedSignerIndex].attachments[attachmentIndex] = attachment;
        } else {
            signers[selectedSignerIndex].attachments.push(newAttachment);
        }
        this.setState({ 
            signers
            , attachmentShowModal: false
        });
    }

    _handleDeleteFromModal() {
        const { signers, selectedSignerIndex, signerIsEditing, attachmentIsEditing, attachmentIndex } = this.state;
        let signerIndex = selectedSignerIndex;
        if (signerIsEditing) {
            signers[selectedSignerIndex].deleted = true;
            signerIndex = signers.findIndex(signer => !signer.deleted);
        } else if (attachmentIsEditing) {
            signers[selectedSignerIndex].attachments.splice(attachmentIndex, 1);
        }
        this.setState({ 
            signers
            , selectedSignerIndex: signerIndex
            , attachmentIndex: 0
            , selectedAttachment: {}
            , attachmentIsEditing: false
            , signerShowModal: false
            , attachmentShowModal: false });
    }

    _handleSubmitTemplate(action) {
        const signers = _.cloneDeep(this.state.signers);
        const elements = _.cloneDeep(this.elements);
        const forceToSubmit = action === "forceToSubmit";
        const submitErrorMessage = [];
        const { handleCustomTemplate } = this.props;
        // const results = { signers, elements: this.elements }
        // const { signers, elements } = result;

        let newElements = [];
        let newSigners = [];
        let objKeys = Object.keys(elements);
        let customeTemplate = {};
        let attachments = [];
        let nonJotblock = true;

        console.log("elements", elements)
    
        objKeys.map(k => {
            return elements[k].map(el => {
                console.log("test", k, elements[k], el);
                let element = _.cloneDeep(el);
                if (element.display !== "none" && !signers[element.signerIndex].deleted) {
                    
                    // get exact position and size by percentage
                    const pages = document.querySelectorAll(".share-link-layout.-signature-request .react-pdf__Page__canvas"); 
                    const page = [...pages][element.pageIndex];
                    const pageWidth = page ? page.offsetWidth : 0; 
                    const pageHeight = page ? page.offsetHeight : 0;
                    let jotblock = document.querySelector(`.-jotblock-draggable.-jotblock-${element.pageIndex+1}-${element.elIndex}`);
                    let jotblockWidth = jotblock ? jotblock.offsetWidth : 0;
                    let jotblockHeight = jotblock ? jotblock.offsetHeight : 0;
                    let jotblockX = 0;
                    let jotblockY = 0;
                    let matrix = jotblock.style.transform || jotblock.style.webkitTransform || jotblock.style.mozTransform;
                    matrix = matrix.split(" ");
                    jotblockX = matrix[0] ? parseFloat(matrix[0].replace(/[^\d.-]/g, '')) : element.elIndex;  
                    jotblockY = matrix[1] ? parseFloat(matrix[1].replace(/[^\d.-]/g, '')) : element.elIndex;
                    let left = (jotblockX / (pageWidth/100)) * 0.01;
                    let top = (jotblockY / (pageHeight/100)) * 0.01;
                    let width = (jotblockWidth / (pageWidth/100)) * 0.01;
                    let height = (jotblockHeight / (pageHeight/100)) * 0.01;
            
                    element.position = { x: left, y: top };
                    element.size = { width, height };
                    element.signer = signers[element.signerIndex].label; 
            
                    if (element.wordWrap === "true" || element.wordWrap === "false") {
                        element.wordWrap = element.wordWrap === "true";
                    }
            
                    if (element.fieldType === "signature") {
                        element.signatureStyle = signers[element.signerIndex].signatureStyle;
                    }
            
                    if (element.options.length && element.jotblockId == 6) {
                        element.options = element.options.map((option, i) => { 
                            jotblock = document.querySelector(`.-jotblock-draggable.-jotblock-${element.pageIndex+1}-${element.elIndex}.-checkbox-jb.-option-${i}`);
                            jotblockWidth = jotblock ? jotblock.offsetWidth : 0;
                            jotblockHeight = jotblock ? jotblock.offsetHeight : 0;
                            jotblockX = 0;
                            jotblockY = 0;
                            matrix = jotblock.style.transform || jotblock.style.webkitTransform || jotblock.style.mozTransform;
                            matrix = matrix.split(" ");
                            jotblockX = matrix[0] ? parseFloat(matrix[0].replace(/[^\d.-]/g, '')) : element.elIndex;  
                            jotblockY = matrix[1] ? parseFloat(matrix[1].replace(/[^\d.-]/g, '')) : element.elIndex;
                            left = (jotblockX / (pageWidth/100)) * 0.01;
                            top = (jotblockY / (pageHeight/100)) * 0.01;
                            width = (jotblockWidth / (pageWidth/100)) * 0.01;
                            height = (jotblockHeight / (pageHeight/100)) * 0.01;
                            option.position = { x: left, y: top };
                            option.size = { width, height };
                            return option;
                        })
                    }
            
                    if (element.multipleChoiceDefaultValues.length) {
                        if (!element.options.length) {
                        element.multipleChoiceDefaultValues = []; 
                        } else {
                        element.multipleChoiceDefaultValues = element.multipleChoiceDefaultValues.filter(val => element.options.some(option => option.value === val));
                        }
                    }
            
                    if (element.jotblockId == 8) {
                        element.signatureStyle = "drawn";
                        delete element.fontName;
                        delete element.signer;
                    }

                    // 
                    if (element.jotblockId == 5 && !element.options.length) {
                        // dropdown
                        submitErrorMessage.push(`${element.name}: Dropdown must have options`);
                    } else if (element.jotblockId == 6 && element.options && !element.options.length) {
                        // multiple choice
                        submitErrorMessage.push(`${element.name}: Multiple Choice must have options`);
                    } else if (element.jotblockId == 6 && element.options && element.options.some(option => !option.text.trim() || !option.value.trim())) {
                        // multiple choice
                        submitErrorMessage.push(`${element.name}: Multiple Choice has an option that has an empty text or value`);
                    } else if (element.jotblockId == 8 && element.fixedDrawn && !element.fixedDrawn.length) {
                        // fixed signature
                        submitErrorMessage.push(`${element.name}: Fixed (Signature) must have signature assigned prior to sending`);
                    } else if (element.jotblockId == 9 && !element.fixedText && !element.fixedText.trim()) {
                        // fixed text
                        submitErrorMessage.push(`${element.name}: Fixed (Text) must have text assigned prior to sending`);
                    } else {
                        
                        console.log("element", el, element, nonJotblock);

                        if (el.jotblockId >= 0 && el.jotblockId <= 7) {
                            nonJotblock = false;
                        }

                        // remove from obj
                        delete element.currentbgColor;
                        delete element.display;
                        delete element.elIndex;
                        delete element.hgt;
                        delete element.pos;
                        delete element.wdt;
                        delete element.signerIndex;
                        delete element.icon;
                        delete element.lines;
                        delete element.jotblockId;
                        newElements.push(element);
                    }
                }
                return k;
            });
        });
    
        const templateSigners = signers.filter(signer => {
          if (!signer.deleted) {
            newSigners.push({ firstname: "", lastname: "", username: "" });
            attachments = attachments.concat(signer.attachments);
            return signer;  
          }
        });

        customeTemplate["signers"] = templateSigners;
        customeTemplate["elements"] = newElements;
        customeTemplate["attachments"] = attachments;

        if (nonJotblock) {
            submitErrorMessage.unshift("Signer must have at least one JotBlock (not fixed JotBlock)");
        }
        
        if (submitErrorMessage.length && !forceToSubmit) {
            this.setState({ submitErrorMessage });
            console.log("submitErrorMessage", submitErrorMessage)
        } else if (handleCustomTemplate) {
            handleCustomTemplate(newSigners, customeTemplate);
        }
    }

    render() {
        const {
            selectedShareLink
            , selectedFile
            , handleCustomTemplate
            , modelName
        } = this.props;

        const {
            signatureModalOpen
            , signerContainerShow
            , signerShowModal
            , signers
            , selectedSignerIndex
            , signerIsEditing
            , JotBlocksList
            , jotblockContainerShow
            , attachmentShowModal
            , attachmentIsEditing
            , attchmentSignerOption
            , submitErrorMessage
        } = this.state;

        // const dragHandlers = {onStart: this.onStart, onStop: this.onStop};
        // const {deltaPosition, controlledPosition} = this.state;

        // height
        const signersList = signers.filter(signer => !signer.deleted);
        const signerCointainerHeight = !signerContainerShow ? 0 : 62 + (signersList.length*50);
        const currentbgColor = displayUtils.getColor(selectedSignerIndex);
        
        // signers and elements 
        
        return(
        <div style={{ width: "100%", height: "100%", backgroundColor: "#e0e0e0" }}>
            <div className={`share-link-layout -signature-request`}>
                {/* <ShareLinkNav/> */}
                <div className="-sidebar-icon">
                    <div className="-signer-upload">
                        <button style={{ background: (signers[selectedSignerIndex].attachments.length ? currentbgColor : "#e0e0e0") }}
                            onClick={() => signers[selectedSignerIndex].attachments.length ? 
                                signers[selectedSignerIndex].attachments.length === 1 ? this.setState({ attachmentShowModal: true, attachmentIsEditing: true, attachmentIndex: 0, selectedAttachment: signers[selectedSignerIndex].attachments[0] })
                                : this.setState({ attchmentSignerOption: !attchmentSignerOption })
                                : null}>
                            <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMi4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjQgMjQ7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQoJLnN0MHtmaWxsOm5vbmU7fQ0KCS5zdDF7ZmlsbDojRkZGRkZGO30NCjwvc3R5bGU+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMCwwaDI0djI0SDBWMHoiLz4NCjxnPg0KCTxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xNS4xLDEyYzIsMCwzLjYtMS44LDMuNi00cy0xLjYtNC0zLjYtNHMtMy42LDEuOC0zLjYsNFMxMy4xLDEyLDE1LjEsMTJ6IE0xNS4xLDE0Yy0yLjQsMC03LjIsMS4zLTcuMiw0djINCgkJaDE0LjR2LTJDMjIuMywxNS4zLDE3LjUsMTQsMTUuMSwxNHoiLz4NCgk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMy42LDE0LjJoMi44di0yLjloMS45TDUsNy45bC0zLjMsMy40aDEuOVYxNC4yeiBNMS43LDE1LjFoNi41djFIMS43VjE1LjF6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==" draggable="false" />
                            {
                                signers[selectedSignerIndex].attachments.length ?
                                <span>{signers[selectedSignerIndex].attachments.length}</span>
                                : null
                            }
                        </button>

                        {
                            attchmentSignerOption && signers[selectedSignerIndex].attachments.length ?
                            <div className="-attach-list">
                                {
                                    signers[selectedSignerIndex].attachments.map((attachment, i) => 
                                        <div key={i}>
                                            <i className="far fa-arrow-alt-to-top"></i>
                                            <label onClick={() => this.setState({ attachmentShowModal: true, attachmentIsEditing: true, attachmentIndex: i, selectedAttachment: attachment })}>
                                                {attachment.label}
                                            </label>
                                        </div>
                                    )    
                                }
                            </div> : null
                        }
                    </div>
                </div>

                <div className="file-preview-container -option">
                    <div className="-preview-content -pdf-editor">
                        <div style={{ position: "relative", width: "100%" }}>
                            {
                                selectedFile ?
                                <PreviewFile
                                    contentType={selectedFile.contentType}
                                    filePath={
                                        modelName === "documenttemplate" ? 
                                        `${templateUtils.getDownloadLink(selectedFile)}?viewingas=PDFFormat`
                                        : `${fileUtils.getDownloadLink(selectedFile)}?userLevel=staffclient&type=viewed&viewingas=PDFFormat`
                                    }
                                    isIE={false}
                                    file={selectedFile}
                                    isEditor={true}
                                    signers={signers}
                                    selectedSignerIndex={selectedSignerIndex}
                                    handleSelectedJotblock={this._handleSelectedJotblock}
                                    handleSignatureStyle={this._handleSignatureStyle}
                                    ref="previewFile"
                                    handleElements={this._handleElements}
                                    handleAttachment={() => this.setState({ attachmentShowModal: true, attachmentIsEditing: false })}
                                    viewingAs="PDFFormat"
                                /> : null
                            }
                        </div>
                    </div>
                </div>


                <div className="-preview-content-jotblocks -sidebar">
                    <div className="-submit-jotblock">
                        <button onClick={this._handleSubmitTemplate}>Finished</button>
                    </div>

                    <div className="-jotblock-signer-list">
                        <div className={`signers-container ${signerContainerShow ? "-active" : ""}`}>
                            <div className="title" >
                                <label>Signers</label>
                                <div className="-updown-arrow-icon" onClick={() => this.setState({ signerContainerShow: !signerContainerShow})}>
                                    <i className="fa fa-angle-down"></i>
                                </div>
                            </div>
                            <div className="-signer-list-container" style={{ height: signerCointainerHeight + "px" }}>
                                <div className="-signer-list">
                                    {
                                        signers.map((signer, index) => 
                                            signer.deleted ? null :
                                            <div className="-signer-item" key={index} 
                                                onDragOver={(e)=>this.onDragOver(e)}
                                                onDrop={(e)=>this.onDrop(e, "swap", index)}>
                                                <div className="-signer-item-container" style={selectedSignerIndex === index ? { background: displayUtils.getColor(index) } : { color: "#5c768d" }}>
                                                    <ProfilePic user={{ firstname: signer.firstname, lastname: signer.lastname }} isViewing={true} index={index} 
                                                        onClick={() => this.setState({ selectedSignerIndex: index })} />
                                                    <div className="-profile-info" onClick={() => this.setState({ selectedSignerIndex: index })}>
                                                        <small>{signer.label ? signer.label.length > 12 ? `${signer.label.substr(0, 12)}...` : signer.label : "Change me"}</small>
                                                    </div>
                                                    <div className="-signer-option-button" onClick={() => this.setState({ signerShowModal: !signerShowModal, selectedSignerIndex: index, signerIsEditing: true }) }>
                                                        <svg viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                                    </div>
                                                </div>
                                                <div className="-swap-signer-index">
                                                    <div onDragStart = {(e) => this.onDragStart(e, "swap", index)}>
                                                        <i className="far fa-long-arrow-alt-up"></i>
                                                        <i className="far fa-long-arrow-alt-down"></i>
                                                    </div>   
                                                </div>
                                            </div>
                                        )
                                    }
                                    <div className="-signer-item -add-signer">
                                        <button className="yt-btn small link info" onClick={() => this.setState({ signerShowModal: !signerShowModal })}>Add Signer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {
                            signers[selectedSignerIndex] ?  
                            <div className={`jotblocks-container ${jotblockContainerShow ? "-active" : ""}`}>
                                <div className="title" >
                                    <label style={{ fontSize: "13px" }}>Add JotBlocks for {signers[selectedSignerIndex].label ? signers[selectedSignerIndex].label.length > 11 ? 
                                        `${signers[selectedSignerIndex].label.substr(0, 11)}...` : signers[selectedSignerIndex].label : ""}</label>
                                    <div className="-updown-arrow-icon" onClick={() => this.setState({ jotblockContainerShow: !jotblockContainerShow })}>
                                        <i className="fa fa-angle-down"></i>
                                    </div>                        
                                </div>
                                <div className="-jotblock-list-container" style={jotblockContainerShow ? { height: (JotBlocksList.length * 48) + "px" } : {}}>
                                    <div className="-jotblock-list">
                                        {
                                            JotBlocksList.map((jotblock, index) => 
                                                <div className="-jotblock-item" key={index}
                                                    draggable={jotblock.id != 7}
                                                    onDragStart={(e) => this.onDragStart(e, "jotblock", jotblock)}
                                                    onClick={() => jotblock.id != 7 ? console.log("do nothing") : this.setState({ attachmentShowModal: true, attachmentIsEditing: false })}>
                                                    <div className={`-jotblock-item-icon ${jotblock.id == 1 ? "-initials-jotblock" : ""}`} style={{ background: currentbgColor }}>
                                                            { jotblock.id == 1 ? "S3" : "" }
                                                            <i className={jotblock.icon}></i>
                                                    </div>
                                                    <div className="-profile-info">
                                                        <small>{jotblock.label}</small>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                                <div className="-jotblock-mirror-container">
                                    {
                                        JotBlocksList.map((jotblock, index) => 
                                            <div className={`-jotblock-mirror-container -jotblock-${jotblock.id} ${jotblock.id == 6 ? "-checkbox-jb" : ""}`} style={{ background: currentbgColor }} key={index}>
                                                <div className="-setting-jotblock">
                                                    <div><i className="far fa-copy"></i></div>
                                                    <div><i className="fas fa-trash"></i></div>
                                                    <div><i className="fas fa-cog"></i></div>
                                                </div>
                                                <div className="-jotblock-icon">
                                                    <i className={jotblock.icon} style={jotblock.id == 6 ? { color: currentbgColor } : {}}></i>
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                            </div> : null
                        }
                    </div>
                </div>
                <JotblockForm parent={this} ref="JotblockForm" signersList={signersList} />
                {
                    submitErrorMessage.length ?
                    <div className="-jotblock-setting-modal-container">
                        <div>
                            <div className="-jotblock-setting-header">
                                Warning 
                            </div>
                            <div className="-jotblock-setting-body" style={{ color: "red", marginBottom: "2em" }}>
                                {
                                    submitErrorMessage.map((errMessage, i) => 
                                        <p key={i}>{errMessage}</p>
                                    )
                                }
                            </div>
                            <div className="-jotblock-setting-footer">
                                <button className="yt-btn small link info" onClick={() => this.setState({ submitErrorMessage: [] })}>Cancel</button>
                                <button className="yt-btn small info -auto-width" disabled={submitErrorMessage[0] === "Signer must have at least one JotBlock (not fixed JotBlock)"} 
                                    onClick={this._handleSubmitTemplate.bind(this, "forceToSubmit")}>Remove and Continue</button>
                            </div>
                        </div>
                    </div> : null
                }
            </div>    
        </div>
        )
    }

}

FileJotBlocks.propTypes = {
}

const mapStoreToProps = (store) => {
  return {
  }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(FileJotBlocks)
);

export class JotblockForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            signerLabel: "" // default 
            , attachment: {
                allowMultipleUploads: false
                , instructions: ""
                , label: ""
                , required: false
                , signer: ""
            }
        }

        this._bind(
            '_handleFormChange'
            , '_handleSignerSubmit'
            , '_handleAttachmentSubmit'
        );
    }

    componentWillReceiveProps(nextProps) {
        const { signers, signerIsEditing, selectedSignerIndex, signerShowModal, attachmentShowModal, attachmentIsEditing, attachmentIndex, selectedAttachment } = nextProps.parent.state;
        if (signerShowModal) {
            if (signerIsEditing) {
                this.setState({ signerLabel: signers[selectedSignerIndex].label });
            } else if (signers && !signerIsEditing) {
                this.setState({ signerLabel: `Signer ${signers.length + 1}`  });
            }    
        } else if (attachmentShowModal && signers.length) {
            if (attachmentIsEditing && signers[selectedSignerIndex].attachments.length) {
                this.setState({
                    attachment: {
                        allowMultipleUploads: selectedAttachment.allowMultipleUploads
                        , instructions: selectedAttachment.instructions
                        , label: selectedAttachment.label
                        , required: selectedAttachment.required
                        , signer: selectedAttachment.signer
                    }
                })
            } else {
                this.setState({
                    attachment: {
                        allowMultipleUploads: false
                        , instructions: ""
                        , label: ""
                        , required: false
                        , signer: ""
                    }
                });
            }
        }
    }

    _handleFormChange(e) {
        let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
          return e.target.value;
        });
        this.setState(newState);
    }

    _handleSignerSubmit() {
        const { _handleSignerSubmit } = this.props.parent;
        const signerLabel = _.cloneDeep(this.state.signerLabel);
        this.setState({ signerLabel: "" }, () => {
            _handleSignerSubmit(signerLabel.trim());
        });
    }

    _handleAttachmentSubmit() {
        const { _handleAttachmentSubmit } = this.props.parent;
        const newAttachment = _.cloneDeep(this.state.attachment);
        this.setState({ attachment: {
            allowMultipleUploads: false
            , instructions: ""
            , label: ""
            , required: false
            , signer: ""
        }}, () => {
            _handleAttachmentSubmit(newAttachment);
        });
    }

    render () {
        const { signersList , parent } = this.props;
        const { state, _handleClose, _handleDeleteFromModal } = parent;
        const { signerShowModal, selectedSignerIndex, signerIsEditing, signers
            , attachmentShowModal, attachmentIsEditing } = state;
        const { signerLabel, attachment } = this.state;

        let submitDisabled = true;
        let isEditing = false;
        let headerText = "";
        let deleteText = "";
        if (signerShowModal && !attachmentShowModal) {
            isEditing = signerIsEditing && signersList.length !== 1;
            submitDisabled =  signerLabel ? signerLabel.length < 3 : true;
            submitDisabled = submitDisabled ? submitDisabled : signers.some(signer => signer.label === signerLabel);
            headerText = signerIsEditing ? "Edit Signer" : "Add New Signer";
            deleteText = "Delete Signer";
        } else if (!signerShowModal && attachmentShowModal) {
            submitDisabled = attachment.instructions.trim() === "" &&  attachment.label.trim() === "";
            isEditing = attachmentIsEditing && signers[selectedSignerIndex].attachments.length > 0;
            headerText = isEditing ? "Edit Attachment Request" : "Add New Attachment Request";
            deleteText = "Delete Attachment";
        }

        return (signerShowModal || attachmentShowModal) ?
             (
                <div className="-jotblock-setting-modal-container">
                    <div style={{zIndex: 1000}}>
                        <div className="-jotblock-setting-header">
                            {headerText}
                        </div>
                        {
                            signerShowModal ?
                            <div className="-jotblock-setting-body">
                                <TextInput
                                    change={this._handleFormChange}
                                    label="Signer Label"
                                    name="signerLabel"
                                    value={signerLabel ? signerLabel : signers[selectedSignerIndex] && signerIsEditing ? signers[selectedSignerIndex].label : signerLabel }
                                    required={true}
                                    autoFocus={true}
                                    onSubmit={this._handleSignerSubmit}
                                />
                            </div>
                            : attachmentShowModal ?
                            <div className="-jotblock-setting-body">
                                <div className="-text-field">
                                    <TextInput
                                        change={this._handleFormChange}
                                        label="Enter a label for signer attachment"
                                        name="attachment.label"
                                        value={attachment.label}
                                        required={true}
                                        autoFocus={true}
                                    />
                                </div>
                                <div className="-text-field">
                                    <TextInput
                                        change={this._handleFormChange}
                                        label="Enter some brief instructions for the signer"
                                        name="attachment.instructions"
                                        value={attachment.instructions}
                                        required={true}
                                    />
                                </div>
                                <div className="-jb-setting-three-switch" style={{ marginTop: "1em" }}>
                                    <div>
                                        <ToggleSwitchInput
                                            label=""
                                            change={this._handleFormChange}
                                            name="attachment.required"
                                            rounded={true}
                                            value={attachment.required}
                                        />
                                        <label>Require an attachment</label>
                                    </div>
                                    <div>
                                        <ToggleSwitchInput
                                            label=""
                                            change={this._handleFormChange}
                                            name="attachment.allowMultipleUploads"
                                            rounded={true}
                                            value={attachment.allowMultipleUploads}
                                        />
                                        <label>Allow more than one attachment</label>
                                    </div>
                                </div>
                            </div>
                            : null
                        }
                        
                        <div className="-jotblock-setting-footer">
                            {
                                isEditing ? <button className="-jotblock-link-button -left" onClick={_handleDeleteFromModal}>{deleteText}</button> : null
                            }
                            <button className="yt-btn small link info" onClick={_handleClose}>Cancel</button>
                            <button className="yt-btn small info" disabled={submitDisabled} 
                                onClick={signerShowModal ? this._handleSignerSubmit : this._handleAttachmentSubmit}>SAVE </button>
                        </div>
                    </div>
                </div>
            )
            :   null;
    }
}