import React, {useEffect, useRef, useState} from 'react';
import WebViewer from '@pdftron/webviewer';

import apiUtils from '../../utils/api';

import { PDF_WebViewer_KEY } from '../../../config/licenseKeys';

const Pdftron = (props) => {
  const { filePath, firmId, clientId, selectedFile, handleEditPdf, socket } = props;
  const [folders, setFolders] = useState([]);
  const viewer = useRef(null);

  useEffect(() => {
    WebViewer(
      {
        licenseKey: PDF_WebViewer_KEY,
        path: '/webviewer',
        initialDoc: filePath,
      },
      viewer.current,
    ).then((instance) => {
        const { docViewer, annotManager } = instance;
        // you can now call WebViewer APIs here...
        instance.setHeaderItems(header => {
          const items = header.getItems().slice(9, -3);
          header.update(items);
          header.push({
            type: 'actionButton',
            img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
            onClick: async () => {
              const doc = docViewer.getDocument();
              const xfdfString = await annotManager.exportAnnotations();
              const data = await doc.getFileData({ xfdfString });
              const arr = new Uint8Array(data);
              const blob = new Blob([arr], { type: doc.type });
              const file = new File([blob], doc.filename, { type: doc.type })
              const arrFile = [file];

              const params = {
                status: 'visible' 
                , _folder: selectedFile._folder
                , _personal: selectedFile._personal
                , viewingAs: 'workspace'
                , _client: clientId
                , _firm: firmId
              }
              
              apiUtils.upload(props, arrFile, folders, params, result => {
                if (result.success) {
                  socket.on("upload_finished", files => {
                    const editedFile = files[0];
                    const { location } = window;
                    let  updatedUrl = location.href;
                    updatedUrl = updatedUrl.replace(/\/[^\/]*$/, `/${editedFile._id}`);
                    const nextUrl = `${updatedUrl}`;
                    window.history.pushState({}, '', nextUrl);
                    handleEditPdf(false);  
                  })
                }
              })
            }
          })
        })
      });
  }, []);

  return (
    <div className="webviewer" ref={viewer} style={{height: "100vh", width: "125vh"}}></div>
  );
};

Pdftron.propTypes = {}
export default Pdftron;