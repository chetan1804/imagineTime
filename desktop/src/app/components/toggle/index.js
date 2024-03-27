import React from 'react';
import { Box, Divider, Typography, Switch} from '@material-ui/core';
import useStyles from './styles';

const Toggle = (props) => {
  const { title, description, checked, onChange } = props;
  const classes = useStyles();

  return (
    <>
      <Divider light/>
      <Box className={classes.toggle}>
        <Box>
          <Typography variant="body2" className={classes.bold}>{title}</Typography>
          <Typography variant="caption" className={classes.noMargin}>{description}</Typography>
        </Box>
        <Switch
          className={classes.switch}
          checked={checked}
          color="primary"
          onChange={onChange}
          size="medium"
        />
      </Box>
    </>
  );
}

export default Toggle;