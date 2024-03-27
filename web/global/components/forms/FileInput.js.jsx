/**
 * Helper component for rendering and handling file inputs
 *
 * NOTE: This uses the npm package 'react-files' wrapped in the default Yote
 * input container for styling.  react-files handles much of its own default
 * props.
 *
 * NOTE: This is for CREATE only.
 */

 import React, { useCallback } from 'react';
 import PropTypes from 'prop-types';
 
 import _ from 'lodash';
 import { useDropzone } from 'react-dropzone';
 
 // import components
 import Binder from "../Binder.js.jsx";
 
 // import utils
 import brandingName from '../../enum/brandingName.js.jsx';
 
 // import actions
 import * as fileActions from '../../../resources/file/fileActions';
 
 class FileInput extends Binder {
   constructor (props) {
     super(props)
     this.state = {
       files: []
       , folders: []
       , fileScan: ''
     }
     this._bind(
       '_filesRemoveAll'
       , '_filesRemoveOne'
       , '_getFileIcon'
       , '_onFilesChange'
       , '_onFilesError'
       , '_saveFiles'
     )
   }
 
   _onFilesChange = (newFiles, newFolders) => {
    const { multiple } = this.props;
     const files = multiple ? _.cloneDeep(this.state.files) : [];
     const folders = multiple ? _.cloneDeep(this.state.folders) : [];
     if (files && newFiles && newFiles.length) {
       files.push(...newFiles);
     }
     if (folders && newFolders && newFolders.length) {
       folders.push(...newFolders);
     }
     this.setState({ files, folders }, () => {
       this.props.change(files, folders);
     });
   }
 
   _onFilesError = (error, file) => {
     alert('error code ' + error.code + ': ' + error.message)
   }
 
   _filesRemoveOne = (file) => {
     const files = _.cloneDeep(this.state.files);
     const folders = _.cloneDeep(this.state.folders);
     const newFiles = files.filter(f => f._id !== file._id && f._root !== file._id);
     const newFolders = folders.filter(f => f._root !== file._id);
     this.setState({ files: newFiles, folders: newFolders }, () => {
       this.props.change(newFiles, newFolders);
     });
   }
 
   _filesRemoveAll = () => {
     this.refs.files.removeFiles()
   }
 
   _getFileIcon = (file) => {
     if (file.type.indexOf('pdf') > -1 || file.name.indexOf('.pdf') > -1) {
       return brandingName.image['pdf-80'];
     } else if (file.type.indexOf('folder') > -1) {
       return brandingName.image['folder-empty'];
     } else if (file.type.indexOf('csv') > -1 || file.type.indexOf('ms-excel') > -1 || file.name.indexOf('.csv') > -1) {
       return brandingName.image['csv-80'];
     } else if (file.type.indexOf('xls') > -1 || file.type.indexOf('spreadsheet') > -1 || file.name.indexOf('.xls') > -1) {
       return brandingName.image['xls-80'];
     } else if (file.type.indexOf('zip') > -1 || file.type.indexOf('compressed') > -1 || file.name.indexOf('.zip') > -1) {
       return brandingName.image['zip-80'];
     } else if (file.type.indexOf('zip') > -1 || file.type.indexOf('compressed') > -1 || file.name.indexOf('.zip') > -1) {
       return brandingName.image['zip-80'];
     } else if (file.type.indexOf('txt') > -1 || file.type.indexOf('plain') > -1 || file.name.indexOf('.txt') > -1) {
       return brandingName.image['file-80'];
     } else if (file.type.indexOf('image') > -1 
       || file.name.indexOf('.jpg') > -1
       || file.name.indexOf('.jpeg') > -1
       || file.name.indexOf('.png') > -1
       || file.name.indexOf('.gif') > -1
       || file.name.indexOf('.bmp') > -1
       || file.name.indexOf('.tif') > -1
       || file.name.indexOf('.tiff') > -1) {
       return brandingName.image['picture-80'];
     } else if (file.type.indexOf('video') > -1
       || file.name.indexOf('.mp4') > -1
       || file.name.indexOf('.mov') > -1
       || file.name.indexOf('.wmv') > -1
       || file.name.indexOf('.avi') > -1) {
       return brandingName.image['video-file-80'];
     } else if (file.type.indexOf('msword') > -1
       || file.type.indexOf('wordprocessing') > -1
       || file.name.indexOf('.doc') > -1) {
       return brandingName.image['word-80'];
     } else if (file.name.indexOf('.pptx') > -1
       || file.name.indexOf('.pptm') > -1
       || file.name.indexOf('.ppt') > -1) {
       return brandingName.image['ppt-80'];
     } else {
       return brandingName.image['file-80'];
     }
   }
 
   _saveFiles = () => {
     this.props.saveFiles();
     this._filesRemoveAll();
   }
   
   render () {
     const {
       accepts
       , change
       , clickable
       , dropZoneSize
       , existingFiles
       , label
       , loading
       , multiple
       , maxFiles
       , maxFileSize
       , minFileSize
       , name
       , computedMatch
       , viewingAs
     } = this.props;
     const { 
       files
       , folders
       , fileScan
     } = this.state;

     const hideDropZone = !multiple && existingFiles.length > 0
 
     const dropZoneStyles = (
       dropZoneSize === 'small' ?
       { height: '46px' }
       :
       { height: '100px'}
     )
 
    //  const dropTextStyles = (
    //  dropZoneSize === 'small' ?
    //  { lineHeight: '24px', marginBottom: 0 }
    //  :
    //  { lineHeight: '78px', marginBottom: 0 }
    //  )

    const dropTextStyles = { marginBottom: 0}
 
     // const Input = ({ accept, onFiles, files, getFilesFromEvent }) => {
     //   console.log('debugging 2')
     //   return (
     //     <label className="-dropzone-label-dialog"
     //       // using custom dropzone we need this label to open a file dialog
     //     >
     //       <div className="files-dropzone-list" style={{ height: "100px", width: "100%", border: "none" }}>
     //         { loading ?
     //           <i className="far fa-spinner fa-spin"/>
     //           :
     //           multiple ?
     //           "Drop files here or click to upload"
     //           :
     //           "Drop file here or click to upload"
     //         }
     //         <input
     //           style={{ display: 'none' }}
     //           type="file"
     //           accept={accept}
     //           multiple={multiple}
     //           // onChange={e => {
     //           //   getFilesFromEvent(e).then(chosenFiles => {
     //           //     onFiles(chosenFiles)
     //           //   })
     //           // }}
     //           // onChange={(e) => e.preventDefault()}
     //         />
     //       </div>
     //     </label>
     //   )
     // }
 
     return (
       <div className="input-group" style={hideDropZone ? {display: 'none'} : null}>
         <DropzoneBox 
           dropZoneStyles={dropZoneStyles}
           dropTextStyles={dropTextStyles}
           multiple={multiple}
           computedMatch={computedMatch}
           onFilesChange={this._onFilesChange}
           viewingAs={viewingAs}
         />
         { files.length > 0 ?
           <div className="yt-row space-between center-vert">
             {/* <button type="button" className="yt-btn xx-small link danger" onClick={this._filesRemoveAll} style={!multiple ? {opacity: '0'} : null} disabled={!multiple}>Remove New Files</button> */}
             { this.props.saveFiles ?
               <button type="button" className="yt-btn xx-small link info" onClick={this._saveFiles}>Save</button>
               :
               null
             }
           </div>
           : 
           null 
         }
         { files.length ?
           <div className='files-list'>
             <ul>
               {files.map((file, i) =>
                 // NOTE: Default styling is commented out below in case we want to use it anywhere.
                 // <li className='files-list-item' key={file.id + i}>
                 //   <div className='files-list-item-preview'>
                 //     {file.preview.type === 'image'
                 //     ? <img className='files-list-item-preview-image' src={file.preview.url} />
                 //     : <div className='files-list-item-preview-extension'>{file.extension}</div>}
                 //   </div>
                 //   <div className='files-list-item-content'>
                 //     <div className='files-list-item-content-item files-list-item-content-item-1'>{file.name}</div>
                 //     <div className='files-list-item-content-item files-list-item-content-item-2'>{file.sizeReadable}</div>
                 //   </div>
                 //   <div
                 //     id={file.id}
                 //     className='files-list-item-remove'
                 //     onClick={this._filesRemoveOne.bind(this, file)}
                 //   />
                 // </li>
                 file && file._folder ? null
                 :
                 <div className="file-micro-list-item" key={i}>
                   <div className="-icon">
                     <img 
                       // src={`/img/icons/${this._getFileIcon(file)}.png`}
                       src={this._getFileIcon(file)}
                     />
                   </div>
                   { file ? 
                     <div className="-info">
                       <div className="-title">
                         <span>{file.name}</span>
                         {
                           // virus detected
                           fileScan === file.id ? <span className="-dN" style={{ color: 'black' }}>File scanning...</span> 
                           : file.virusDetected ? <span className="-dN">Virus detected!</span> 
                           : file.fileNotFound ? <span className="-dN">File not found!</span> : null
                         }
                       </div>
                     </div>
                     :
                     <div className="-info">
                       <i className="far fa-spinner fa-spin"/>
                     </div>
                   }
                   <div className="-times">
                     <button onClick={() => this._filesRemoveOne(file)} className="yt-btn link xx-small u-pullRight">
                       <i className="far fa-times"/>
                     </button>
                   </div>
                 </div>
               )}
             </ul>
           </div>
           :
           null
         }
       </div>
     )
   }
 }
 
 FileInput.propTypes = {
   accepts: PropTypes.arrayOf(PropTypes.string)
   /**
   * NOTE: ^ should be HTML 5 file types.  i.e. 'image/*', 'video/mp4', 'audio/*'
   */
   , change: PropTypes.func.isRequired
   , clickable: PropTypes.bool
   , dropZoneSize: PropTypes.string
   , existingFiles: PropTypes.array
   , label: PropTypes.string
   , multiple: PropTypes.bool
   , maxFiles: PropTypes.number
   , maxFileSize: PropTypes.number
   , minFileSize: PropTypes.number
 }
 
 // react-files handles its own default props
 FileInput.defaultProps = {
   dropZoneSize: 'normal'
   , existingFiles: []
   , clickable: true
   , multiple: true
 }
 
 export default FileInput;
 
 const DropzoneBox = ({ dropZoneStyles, dropTextStyles, multiple, computedMatch, viewingAs, onFilesChange }) => {
   const onDrop = useCallback((acceptedFiles) => {
     const currentTime = new Date().getTime();
     let files = [];
     let folders = [];
     acceptedFiles.forEach((file) => {
       const path = file.path.split("/");
       if (path && path.length > 2 && multiple) {
         const dirId = `1_root${path[1]}_${path[1]}_${currentTime}`;
         if (!folders.some(item => item._id === dirId && item.currentTime != currentTime)) {
           files.push({
             _id: dirId
             , name: path[1]
             , type: "folder"
             , _root: dirId
           });
 
           folders.push({
             _id: dirId
             , name: path[1]
             , type: "folder"
             , _root: dirId
             , _folder: null
           });
         }
         let count = 2;
         while (path.length > count) {
           const folderId = `${count-1}_root${path[1]}_${path[count-1]}_${currentTime}`;
           const subDirId = `${count}_root${path[1]}_${path[count]}_${currentTime}`;
           if (path.length === count+1) {
             file._root = dirId;
             file._folder = folderId;
             file._id = `${count}_file_${file.name}_${currentTime}`;
             files.push(file);
           } else if (!folders.some(item => item._id === subDirId && item._root === dirId && item.currentTime == currentTime)) {
             folders.push({
               _id: subDirId
               , name: path[count]
               , type: "folder"
               , _root: dirId
               , _folder: folderId
               , currentTime
             });  
           }
           count++;
         }
       } else {
         file._id = `file_${file.name}_${currentTime}`;
         if (!multiple) {
           files = [file];
         } else {
           files.push(file);
         }
       }
     });
     if (!multiple && viewingAs === "documentTemplate") {
      const file = files && files.length && files[0];
      if (file && file.type && onFilesChange &&
       (file.type.indexOf('msword') > -1 || file.type.indexOf('wordprocessing') > -1 || file.name.indexOf('.doc') > -1)) {
        onFilesChange(files, folders);
      }
     } else if (!multiple && computedMatch && computedMatch.params && computedMatch.params.forward === "signature") {
       const file = files && files.length && files[0];
       if (file && file.type && onFilesChange && (file.type.indexOf('pdf') > -1 || file.type.indexOf('msword') > -1 || file.type.indexOf('wordprocessing') > -1 || file.name.indexOf('.doc') > -1)) {
         onFilesChange(files, folders);
       }
     } else if (onFilesChange) {
       onFilesChange(files, folders);
     }
   }, []);
 
 const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple });
   return (
     <section className={`container files-dropzone-list ${isDragActive && 'dzu-dropzoneActive' || ""}`} style={dropZoneStyles}>
       <div {...getRootProps({className: 'dropzone'})}>
         <input {...getInputProps()} />
         <p style={dropTextStyles}>Drop files here or click to upload</p>
       </div>
     </section>
   );
 }