import React from 'react';
import { useHistory } from 'react-router';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import useStyles from './styles';
import { Divider } from '@material-ui/core';
import PoweredBy from '../../components/powered-by';

const Welcome = () => {
  const classes = useStyles();
  const history = useHistory();

  const goToSignIn = () => {
    history.push('sign-in');
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Typography component="h1" variant="h5">
          Welcome!
        </Typography>
        <br/>
        <Typography align="center">
          Use Secure Print to upload documents securely to the ImagineTime Client Workspace.
        </Typography>
        <br/>
        <Typography align="center">
          To get started, please sign in.
        </Typography>
        <Box className={classes.form}>
          <Divider light={true}/>
          <Button
            type="submit"
            className={classes.submit}
            onClick={goToSignIn}
          >
            Sign In
          </Button>
        </Box>
      </Box>
      <PoweredBy/>
    </Container>
  );
}

export default Welcome;