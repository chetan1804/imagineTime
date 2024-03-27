import React, { useContext } from 'react';
import clsx from 'clsx';
import useStyles from './styles';
import { useHistory } from 'react-router';
import { Box, Button, Container, Divider, Typography } from '@material-ui/core';
import PoweredBy from '../../components/powered-by';
import packageJson from '../../../../package.json';
import { AuthContext } from '../../App';

const Settings = () => {
  const { dispatch } = useContext(AuthContext);
  const classes = useStyles();
  const history = useHistory();
  const user = localStorage.getItem('user') && JSON.parse(localStorage.getItem('user'));

  const goToUpload = () => {
    history.push('upload');
  }

  const signOut = () => {
    dispatch({ 
      type    : 'LOGOUT'
    });
    history.push('sign-in');
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography component="h1">
            {`Hello, ${user.firstname}`}
          </Typography>
        </Box>
        <br/>
        <Typography component="h1" variant="h5">
          Settings
        </Typography>
        <Divider light={true}/>
        <Box>
          <Typography variant="caption" color="textSecondary" className={clsx('italic bold')}>Email</Typography>
          <Typography variant="body2" color="textSecondary" className={clsx('italic')}>{user.username}</Typography>
        </Box>
        <br/>
        <Box className={classes.actions}>
          <Button
            type="submit"
            variant="outlined"
            onClick={goToUpload}
            fullWidth={false}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={signOut}
            fullWidth={false}
          >
            Logout
          </Button>
        </Box>
        <br/>
        <Divider light={true}/>
        <Typography component="h1">
          Imagine Time Desktop Version {`${packageJson.version}`}
        </Typography>
      </Box>
      <PoweredBy/>
    </Container>
  );
}

export default Settings;