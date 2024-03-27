/**
 * Helper component for rendering and handling image gallery inputs
 *
 * NOTE: This uses the npm package 'react-files' wrapped in the default Yote
 * input container for styling.  react-files handles much of its own default
 * props.
 *
 * NOTE: This is for CREATE only.
 *
 * NOTE: The distinction between this and FileInput is that this is restricted
 * images only (i.e. does NOT have an 'accepts' props) and the preview is styled
 * in a grid vs a list with metadata.
 */

import React from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import Files from 'react-files';

// import components
import Binder from "../Binder.js.jsx";

class ImageInput extends Binder {
  constructor (props) {
    super(props)
    this.state = {
      files: []
    }
    this._bind(
      '_filesRemoveAll'
      , '_onFilesChange'
      , '_onFilesError'
    )
  }

  _onFilesChange = (files) => {
    this.props.change(files);
    this.setState({files});
  }

  _onFilesError = (error, file) => {
    alert('error code ' + error.code + ': ' + error.message)
  }

  _filesRemoveAll = () => {
    this.refs.files.removeFiles()
  }

  render () {
    const {
      change
      , clickable
      , handleSave
      , helpText
      , label
      , multiple
      , maxFiles
      , maxFileSize
      , minFileSize
      , name
      , saving
      , saveText
    } = this.props;
    const { files } = this.state;
    return (
      <div className="input-group">
        <label>{label}</label>
        <Files
          accepts={['image/*']}
          className='files-dropzone-gallery'
          clickable={clickable}
          maxFiles={maxFiles}
          maxFileSize={maxFileSize}
          minFileSize={minFileSize}
          multiple={multiple}
          onChange={this._onFilesChange}
          onError={this._onFilesError}
          ref='files'
        >
          { files.length > 0 && !multiple ?
            <div className="files-gallery">
              {this.state.files.map((file) =>
                <img className='single-image' src={file.preview.url} key={file.id} />
              )}
            </div>
            : files.length > 0 ?
            <div className='files-gallery'>
              {this.state.files.map((file) =>
                <img className='files-gallery-item' src={file.preview.url} key={file.id} />
              )}
            </div>
            :
            <div className="-drop-zone-instructions">Drop image{multiple ? 's': null } here {clickable ? 'or click to upload' : null }</div>
          }
        </Files>
        { files.length > 0 ?
          <div className="yt-row right">
            <button type="button" className="yt-btn small link danger" onClick={this._filesRemoveAll}>Clear</button>
            { handleSave ?
              <button
                type="button"
                className="yt-btn small info"
                onClick={handleSave}
                disabled={saving}
              >
                { saving ?
                  <span><i className="fas fa-spinner fa-spin"/> Saving... </span>
                  : saveText
                }
              </button>
              :
              null
            }
          </div>
          :
          null
        }
        { helpText ?
          <div>
            {helpText}
          </div>
          :
          null
        }
      </div>
    )
  }
}


ImageInput.propTypes = {
  change: PropTypes.func.isRequired
  , clickable: PropTypes.bool
  , handleSave: PropTypes.func
  , helpText: PropTypes.any // i.e. 'Images should be 300 X 300px'
  , label: PropTypes.string
  , maxFiles: PropTypes.number
  , maxFileSize: PropTypes.number
  , minFileSize: PropTypes.number
  , multiple: PropTypes.bool
  , saving: PropTypes.bool
  , saveText: PropTypes.string
}

// react-files handles its own default props
ImageInput.defaultProps = {
  clickable: false
  , handleSave: null
  , helpText: null
  , label: ""
  , multiple: true
  , saving: false
  , saveText: 'Save'
}

export default ImageInput;
