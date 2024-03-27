import React, { memo } from 'react';
import { CardContent, Chip } from '@material-ui/core';
import useStyles from './styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faFileWord, faFilePowerpoint, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';

const Files = (props) => {
  const { files } = props;
  const classes = useStyles();

  return (
    <CardContent className={classes.files}>
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
            <Chip key={index} icon={icon} label={item.name} />
          )
        })
      }
    </CardContent>
  );
}

export default memo(Files);