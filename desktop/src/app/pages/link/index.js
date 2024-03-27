import React, { useState } from 'react';
import useStyles from './styles';
import { useHistory } from 'react-router';
import { Box, Button, Container, Divider, Snackbar, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import PoweredBy from '../../components/powered-by';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-regular-svg-icons';

const Link = (props) => {
  const { shareLink } = props.location.state;
  const classes = useStyles();
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const goToUpload = () => {
    history.push('upload');
  }

  const handleVisibility = () => {
    setIsVisible(!isVisible);

    if (!isVisible) {
      navigator.clipboard.writeText(shareLink.url);
      setIsOpen(true);
    }
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsOpen(false);
  };

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Typography component="h1" variant="h5">
          Share Files
        </Typography>
        <Divider light={true}/>
        <Typography className={'bold'}>
          Share link created
        </Typography>
        <Box className={classes.link}>
          <Box className={classes.content}>
            <FontAwesomeIcon icon={faEye} />
            <Box className={classes.text}>
              {
                isVisible ? 
                  <Typography variant="caption">
                    {shareLink.url}
                  </Typography>
                :
                  <>
                    <Typography className={'bold'} variant="caption">
                      Can view
                    </Typography>
                    <Typography variant="caption">
                      Anyone with this link can view the files
                    </Typography>
                  </>
              }
            </Box>
          </Box>
          <Button
            type="submit"
            variant="text"
            onClick={handleVisibility}
            fullWidth={false}
          >
            {`${isVisible ? 'Hide Link' : 'Copy Link'}`}
          </Button>
        </Box>
        <Box className={classes.actions}>
          <Button
            type="submit"
            variant="outlined"
            onClick={goToUpload}
            fullWidth={false}
          >
            Back
          </Button>
        </Box>
      </Box>
      <PoweredBy/>
      <Snackbar open={isOpen} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity="success" sx={{ width: '100%' }} variant="filled" onClose={handleClose}>
        Copied to clipboard
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Link;