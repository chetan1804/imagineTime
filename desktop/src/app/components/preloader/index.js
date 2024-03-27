import React from 'react';
import Box from '@material-ui/core/Box';
import useStyles from './styles';
import { CircularProgress } from '@material-ui/core';

const Preloader = (props) => {
  const { isVisible } = props;
  const classes = useStyles();

  return (
    <>
      {
        isVisible ?
          <Box className={classes.preloader}>
            <CircularProgress/>
          </Box>  
        :  
          <></>
      }
    </>
  )
}

export default Preloader;