import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import useStyles from './styles';
import { useHistory } from 'react-router';
import useSocket from 'use-socket.io-client';
import { Box, Button, CircularProgress, Container, Divider, FormControlLabel, IconButton, Radio, RadioGroup, Typography } from '@material-ui/core';
import PoweredBy from '../../components/powered-by';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen, faPaperPlane, faCloudUploadAlt, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import { cancelRequest, request } from '../../service/requests';
import { BASE_URL, FILES_API, GET, PLUGIN_CLIENTS_API, POST } from '../../utility/constants';
import Preloader from '../../components/preloader';
import Dropdown from '../../components/dropdown';
import FileUploader from './file-uploader';

const Upload = () => {
  const classes = useStyles();
  const history = useHistory();
  const [socket] = useSocket(BASE_URL)
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [firm, setFirm] = useState();
  const [staff, setStaff] = useState();
  const [files, setFiles] = useState([]);
  const [fileIds, setFileIds] = useState([]);
  const [client, setClient] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [visibility, setVisibility] = useState('hidden');
  const user = localStorage.getItem('user') && JSON.parse(localStorage.getItem('user'));

  socket.connect();

  useEffect(() => {

    socket.on("connect", () => {
      console.log('WEB SOCKET CONNECTED');
      console.log('id : ', socket.id);
      console.log('connected : ', socket.connected);

      if (user && user._id) {
        console.log('user : ', user);
        socket.emit('subscribe', user._id);
      }
    });
    
    socket.on("disconnect", () => {
      console.log('WEB SOCKET DISCONNECTED');
      console.log('id : ', socket.id);
      console.log('connected : ', socket.connected);
    });

    if(socket && socket.disconnected) {
      socket.open();
    } else if(socket && socket.connected && user && user._id) {
      socket.emit('subscribe', user._id);
    }

    socket.on('upload_progress', (progress, index) => {
      console.log('UPLOAD PROGRESS');
      console.log('progress', progress);
    })

     // Used to display an error on a single file upload.
    socket.on('upload_progress_error', (error, index) => {
      console.log('UPLOAD PROGRESS EROR');
      console.log('error', error);
    })

    socket.on('upload_finished', (files) => {
      console.log('UPLOAD FINISHED');
      console.log('files : ', files);

      setFileIds(files.map(file => file._id));
    })

    getClients();

    return () => {
      cancelRequest();
    }
  }, []);

  const getClients = () => {
    const firmId = localStorage.getItem('firmId') && JSON.parse(localStorage.getItem('firmId'));
    console.log('firmId : ', firmId);

    if (!firmId) return;    

    setIsLoading(true);
    request({
      url     : `${PLUGIN_CLIENTS_API}/${firmId}`,
      method  : GET,
    }).then(response => {
      console.log('getClients response : ', response.data);

      setClients(response.data.data.clients);
      setFirm(response.data.data.firm);
      setStaff(response.data.data.selectedStaff);
    }).catch(error => {
      console.log('getClients error : ', error.response);
    }).finally(() => {
      setIsLoading(false)
    });
  }

  const goToSettings = () => {
    history.push('settings');
  }

  const onFileChange = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    
    file && setFiles([...files, file])
  }

  const removeFile = (idx) => {
    setFiles(files.filter((item, index) => index !== idx));
  }

  const handleChange = (event) => {
    setClient(event.target.value);
  };

  const handleRadioChange = (event) => {
    setVisibility(event.target.value);
  };

  const uploadFile = () => {
    if (files.length === 0 || firm === undefined) return;

    const formData = new FormData();
    formData.append('_firm', firm._id);
    formData.append('status', 'visible');
    if (client === 'personal') {
      formData.append('_personal', staff._id);
    } else if (client !== 0 && client !== 'personal') {
      formData.append('status', visibility);
      formData.append('_client', client);
      formData.append('viewingAs', 'workspace');
      formData.append('mangoCompanyID', clients.find(item => item._id === client).mangoCompanyID);
      formData.append('mangoClientID', clients.find(item => item._id === client).mangoClientID);
    }
    files.map((file, index) => {
      formData.append([index], file); 
    });

    // Display the key/value pairs
    console.log('FormData');
    for (var pair of formData.entries()) {
      console.log(pair[0]+ ' : ' + pair[1]); 
    }

    setIsUploading(true); 
    request({
      url     : FILES_API,
      method  : POST,
      data    : formData,
      headers : { 
                  'Content-Type'  : 'multipart/form-data' 
                },
    }).then(response => {
      console.log('uploadFile response : ', response);

      setIsUploaded(true);
    }).catch(error => {
      console.log('uploadFile error : ', error);
    }).finally(() => {
      setIsUploading(false);
    });
  }

  const viewFile = () => {
    const newWindow = window.open(`${BASE_URL}/firm/${firm._id}/files`, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

  const uploadMoreFile = () => {
    setIsUploaded(false);
    setFiles([]);
  }
  
  const shareFile = () => {
    history.push('share', {
      clientId  : client,
      client    : clients.find(item => item._id === client),
      staffId   : staff._id,
      files     : files,
      fileIds   : fileIds,
      firm      : firm
    });
  }
  
  const requestSignature = () => {
    history.push('signature', {
      clientId  : client,
      clients   : clients,
      staffId   : staff._id,
      files     : files,
      fileIds   : fileIds,
      firm      : firm
    });
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography component="h1">
            Hello, Chad
          </Typography>
          <IconButton color="primary" aria-label="upload picture" onClick={goToSettings}>
            <SettingsOutlinedIcon color="primary"/>
          </IconButton>
        </Box>
        <br/>
        <Typography component="h1" variant="h5">
          Secure Print
        </Typography>
        <Divider light={true}/>
        <Preloader isVisible={isLoading}/>
        <Box hidden={isLoading || isUploaded}>
          <FileUploader
            onFileChange={onFileChange}
            onFileRemove={removeFile}
            files={files}
          />
          <br/>
          <Dropdown
            title="Select Workspace"
            onChange={handleChange}
            value={client}
            values={[
              {
                _id    : 0,
                name  : 'Upload to general files'
              },
              {
                _id : 'personal',
                name : 'Personal Files'
              },
              ...clients
            ]}
          />
          <Box hidden={client === 0 || client === 'personal'} className={classes.visibility}>
            <Typography variant="body2" className={clsx('bold')}>Should this file be visible to the client or hidden?</Typography>
            <RadioGroup row aria-label="position" name="position" defaultValue="top" value={visibility} onChange={handleRadioChange}>
              <FormControlLabel value="visible" control={<Radio color="primary" size="small"/>} label="Visible to client" />
              <FormControlLabel value="hidden" control={<Radio color="primary" size="small"/>} label="Hidden from client" />
            </RadioGroup>
          </Box>
          <Button
            type="submit"
            className={classes.submit}
            onClick={uploadFile}
            disabled={files.length === 0}
          >
            {
              isUploading ? 
                <CircularProgress size={24}/>
              :
                `Upload`
            }
          </Button>   
        </Box>
        <Box hidden={!isUploaded}>
          <Box className={classes.button} onClick={viewFile}>
            <FontAwesomeIcon icon={faFolderOpen} size="lg" />
            <Typography variant="body1">
              View in portal
            </Typography>
          </Box>
          <Box className={classes.button} onClick={uploadMoreFile}>
            <FontAwesomeIcon icon={faCloudUploadAlt} size="lg" />
            <Typography variant="body1">
              Upload more files
            </Typography>
          </Box>
          <Box className={classes.button} onClick={shareFile}>
            <FontAwesomeIcon icon={faPaperPlane} size="lg" />
            <Typography variant="body1">
              Share files
            </Typography>
          </Box>
          <Box 
            className={staff && staff.eSigAccess && files.some(item => item.type.includes('pdf'))? classes.button : classes.disabledButton} 
            onClick={(staff && staff.eSigAccess && files.some(item => item.type.includes('pdf'))) ? requestSignature : null}
          >
            <FontAwesomeIcon icon={faFileSignature} size="lg" />
            <Typography variant="body1">
              Request Signature
            </Typography>
          </Box>
        </Box>
      </Box>
      <PoweredBy/>
    </Container>
  );
}

export default Upload;