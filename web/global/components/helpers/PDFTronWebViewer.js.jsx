import React, {useEffect, useRef, useState} from 'react';
import WebViewer from '@pdftron/webviewer';

import apiUtils from '../../utils/api';
import * as documentTemplateActions from '../../../resources/documentTemplate/documentTemplateActions';

const PDFTronWebViewer = (props) => {
  // const { filePath, firmId, clientId, selectedFile, handleEditPdf, socket } = props;

  const {
    filePath
    , dispatch
    , close
  } = props;
  const viewer = useRef(null);

  // "PDF_WebViewer_KEY": "Mango Billing, Inc. (mangobilling.com):OEM:Mango Billing - Document Management Module::B+:AMS(20230804):79B5BE020427760AF360B13AC982537860614F3EB748F592DD8FB49A142CA9D65AC2BEF5C7",

  useEffect(() => {
    WebViewer({
      licenseKey: "Mango Billing, Inc. (mangobilling.com):OEM:Mango Billing - Document Management Module::B+:AMS(20230804):79B5BE020427760AF360B13AC982537860614F3EB748F592DD8FB49A142CA9D65AC2BEF5C7",
      initialDoc: filePath,
      fullAPI: true, 
      path: '/webviewer'
    }, viewer.current).then((instance) => {
        const { docViewer, annotManager } = instance;
        // you can now call WebViewer APIs here...
        instance.setHeaderItems(header => {
          const items = header.getItems().slice(9, -3);
          header.update(items);
          header.push({
            type: 'actionButton',
            img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
            onClick: async () => {
              const filename = localStorage.getItem('docGenNewFileName');

              console.log("docGenNewFileName", localStorage.getItem('docGenNewFileName'));

              const doc = docViewer.getDocument();
              const xfdfString = await annotManager.exportAnnotations();
              const data = await doc.getFileData({ xfdfString });
              const arr = new Uint8Array(data);
              const blob = new Blob([arr], { type: doc.type });
              const file = new File([blob], doc.filename, { type: doc.type })

              let formData = new FormData();
              formData.append('_firm', 110);
              formData.append(0, new Blob([file], { type: file.type }), filename || 'file');
              dispatch(documentTemplateActions.sendPDFUploadTemplates(formData)).then(json => {
                // console.log("json", json)
                // this.setState({
                //   submitted: false
                // });
                // if(json.success) {
                //   this.props.handleUploaded(json.item)
                //   this._handleClose();
                // } else {
                //   alert("ERROR: " + json.error);
                // }
                dispatch(documentTemplateActions.sendUploadTemplates(formData)).then(json => {
                  close();

                  // console.log("json", json)
                  // // this.setState({
                  // //   submitted: false
                  // // });
                  // // if(json.success) {
                  // //   this.props.handleUploaded(json.item)
                  // //   this._handleClose();
                  // // } else {
                  // //   alert("ERROR: " + json.error);
                  // // }
                });
              });

              // const arrFile = [file];

              // const params = {
              //   status: 'visible' 
              //   , _folder: selectedFile._folder
              //   , _personal: selectedFile._personal
              //   , viewingAs: 'workspace'
              //   , _client: clientId
              //   , _firm: firmId
              // }
              
              // apiUtils.upload(props, arrFile, folders, params, result => {
              //   if (result.success) {
              //     socket.on("upload_finished", files => {
              //       const editedFile = files[0];
              //       const { location } = window;
              //       let  updatedUrl = location.href;
              //       updatedUrl = updatedUrl.replace(/\/[^\/]*$/, `/${editedFile._id}`);
              //       const nextUrl = `${updatedUrl}`;
              //       window.history.pushState({}, '', nextUrl);
              //       handleEditPdf(false);  
              //     })
              //   }
              // })
            }
            // onClick: async () => {
            //   setName(name);
            //   console.log("hello world", name, newName);
            //   // const doc = docViewer.getDocument();
            //   // const xfdfString = await annotManager.exportAnnotations();
            //   // const data = await doc.getFileData({ xfdfString });
            //   // const arr = new Uint8Array(data);
            //   // const blob = new Blob([arr], { type: doc.type });
            //   // const file = new File([blob], doc.filename, { type: doc.type })
            //   // const arrFile = [file];

            //   // const params = {
            //   //   status: 'visible' 
            //   //   , _folder: selectedFile._folder
            //   //   , _personal: selectedFile._personal
            //   //   , viewingAs: 'workspace'
            //   //   , _client: clientId
            //   //   , _firm: firmId
            //   // }
              
            //   // apiUtils.upload(props, arrFile, folders, params, result => {
            //   //   if (result.success) {
            //   //     socket.on("upload_finished", files => {
            //   //       const editedFile = files[0];
            //   //       const { location } = window;
            //   //       let  updatedUrl = location.href;
            //   //       updatedUrl = updatedUrl.replace(/\/[^\/]*$/, `/${editedFile._id}`);
            //   //       const nextUrl = `${updatedUrl}`;
            //   //       window.history.pushState({}, '', nextUrl);
            //   //       handleEditPdf(false);  
            //   //     })
            //   //   }
            //   // })
            // }
          })
        })
      });
  }, []);

  return (
    <div className="webviewer" ref={viewer} style={{height: "100vh", width: "125vh"}}></div>
  );
};

PDFTronWebViewer.propTypes = {}
export default PDFTronWebViewer;