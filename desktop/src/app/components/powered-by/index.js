import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import useStyles from './styles';
import logo from '../../assets/images/imaginetime.png';

const PoweredBy = (props) => {
  const { position } = props;
  const classes = useStyles();

  return (
    <Box className={position ? classes.logoRelative : classes.logo}>
      <Typography>
        {`powered by`}
        <>&nbsp;</>
        <img src={logo} alt={'imaginetime'}/>
      </Typography>
    </Box>
  );
}

export default PoweredBy;