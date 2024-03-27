/**
 * this will be a big component.
 * goal is a general purpose "new file" modal
 * reuseable wherever we need to upload new files, including user profile, section docs, and squad banners
 * to make it as reusable as possible, it will handle all of the state/dispatch stuff
 * , and return a full File object to the parent.
 * parent specifies the initial object, as well as what things we can select
 * - for example, the user profile picture has different metadata than the section pdf
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global components
import { TextInput, FileInput } from '../../../global/components/forms';
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";

// import actions
import * as fileActions from '../fileActions';



class NewFileModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      item: JSON.parse(JSON.stringify(this.props.initialItem)) //copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleModalSave'
      , '_handleFileChange'
    );
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      item: JSON.parse(JSON.stringify(nextProps.initialItem))
    });
    if(nextProps.status === "error") {
      alert(nextProps.error.message);
    }
  }

  _handleFormChange(e) {
    var newFileState = this.state.item;
    newFileState[e.target.name] = e.target.value;
    this.setState(newFileState);
  }

  _handleFileChange(e, targetName, value) {
    // console.log("handle file change");
    // console.log(e.target.files[0]);
    var nextState = this.state;
    nextState.item.fileObject = e.target.files[0];
    var contentType = e.target.files[0].type;
    var filename = e.target.files[0].name;
    var category;
    if(contentType.indexOf('image/') > -1) {
      category = 'image';
    } else if(contentType.indexOf('video/') > -1) {
      category = 'video';
    } else {
      category = 'document';
    }
    nextState.item.contentType = contentType;
    nextState.item.category = category;
    nextState.item.filename = filename;

    this.setState(nextState);
  }

  _handleModalSave(e) {
    e.preventDefault();
    // convert all this to a FormData objet to allow submitting file
    const { item } = this.state;
    if(!item.fileObject) {
      alert("No file present");
    } else {
      // console.log(item);
      //build formdata to upload file
      var fileForm = new FormData();
      // console.log(fileForm);
      fileForm.append('file', item.fileObject);
      fileForm.append('filename', item.filename);
      fileForm.append('description', item.description);
      fileForm.append('contentType', item.contentType);
      fileForm.append('category', item.category);
      this.props.dispatch(fileActions.sendCreateFile(fileForm)).then((result) => {
        // console.log("done with upload");
        // console.log(result);
        if(result.success) {
          //return to parent
          this.props.finishedUpload(result.item);
        } else {
          alert(result.error);
        }
      });
    }
  }

  render() {
    const { item } = this.state;
    const header = this.props.formTitle ? <div className="formHeader"><h1> {this.props.formTitle} </h1><hr/></div> : <div/>;
    // console.log(item);
    //what file types can we upload by category?
    var accept = "";
    if(item.category == "video") {
      accept = ".mp4,.mpg,.mpeg,.mov"; //we should restrict when and if people ever upload videos
    } else if(item.category == "image") {
      accept = ".jpg,.jpeg,.gif,.png,.svg";
    } else if(item.category == "document") {
      accept = ".pdf,.csv,.pages,.txt,.doc,.docx,.xls,.xlsx,.zip";
    } else {
      //"any"
      accept = ".jpg,.jpeg,.mp4,.mpg,.mpeg,.mov,.gif,.png,.svg,.pdf,.csv,.pages,.txt,.doc,.docx,.xls,.xlsx,.zip"
    }

    return  (
      <Modal
        closeAction={this.props.closeModal}
        isOpen={this.props.isModalOpen}
      >
        <div className="yt-container">
          {header}
          <div className="yt-row center-horiz">
            <div className="form-container">
              <form name="fileForm" className="card file-form" onSubmit={this._handleModalSave}>
                { item.adminType !== "userProfile" ? //user's can't add metadata to their profile pic
                    <div>
                      <TextInput
                        change={this._handleFormChange}
                        label="Filename"
                        name="filename"
                        placeholder="File (required)"
                        required={true}
                        value={item.filename}
                      />
                      <TextInput
                        change={this._handleFormChange}
                        label="Display Name"
                        name="description"
                        required={false}
                        placeholder="For display purposes only"
                        value={item.description}
                      />
                    </div>
                  :
                    <div/>
                }
                <FileInput
                  accept={accept}
                  change={this._handleFileChange}
                  className=""
                  name="fileObject"
                  placeholder="Please choose file"
                  required={true}
                />
                <div className="input-group">
                  <div className="yt-row space-between">
                    <button type="button" className="yt-btn link" onClick={this.props.closeModal}>Cancel</button>
                    <button className="yt-btn" type="submit" > Save and Upload </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

NewFileModal.propTypes = {
  dispatch: PropTypes.func.isRequired
  , initialItem: PropTypes.object.isRequired //defines things like adminType and category which we need
  , isModalOpen: PropTypes.bool.isRequired
  , closeModal: PropTypes.func.isRequired
  , finishedUpload: PropTypes.func.isRequired
  , formTitle: PropTypes.string.isRequired
}

const mapStoreToProps = (store) => {
  return {
    files: store.file
  }
}

export default connect(
  mapStoreToProps
)(NewFileModal);
