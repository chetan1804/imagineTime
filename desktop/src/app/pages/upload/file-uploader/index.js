import React, { useRef } from 'react';
import { Box, Chip, Typography } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faFileWord, faFilePowerpoint, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import useStyles from './styles';

const FileUploader = (props) => {
  const { onFileChange, onFileRemove, files } = props;
  const classes = useStyles();
  const inputFile = useRef(null);  

  const selectFile = () => {
    inputFile.current.click();
  }

  return (
    <>
      <Box className={classes.fileUploader} onClick={selectFile}>
        <Typography variant="body2">Drop files or click to upload</Typography>
        <input type='file' id='file' ref={inputFile} multiple style={{display: 'none'}} onChange={onFileChange}/>
      </Box>
      <Box className={classes.files} hidden={files.length === 0} justifyContent="space-between" alignContent="space-between" alignItems="space-between">
        {
          files.map((item, index) => {
            let icon = <FontAwesomeIcon icon={faFile} />;

            if (item.type.includes('pdf')) {
              icon = <FontAwesomeIcon icon={faFilePdf} />;
            } else if (item.type.includes('word')) {
              icon = <FontAwesomeIcon icon={faFileWord} />;
            } else if (item.type.includes('powerpoint') || item.name.includes('pptx')) {
              icon = <FontAwesomeIcon icon={faFilePowerpoint} />;
            } else if (item.type.includes('excel')) {
              icon = <FontAwesomeIcon icon={faFileExcel} />;
            }
            return (
              <Chip key={index} icon={icon} label={item.name} onDelete={() => onFileRemove(index)}/>
            )
          })
        }
      </Box>
    </>
  )
}

export default FileUploader;