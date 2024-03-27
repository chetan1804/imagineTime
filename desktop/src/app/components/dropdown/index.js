import React from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@material-ui/core';
import useStyles from './styles';

const Dropdown = (props) => {
  const { onChange, defaultValue, value, values, title, description, caption, note, id, component, name } = props;
  const classes = useStyles();
  
  return (
    <>
      <Typography variant="body2" className={classes.bold}>{title}</Typography>
      <Typography variant="caption" hidden={!description}>{description}</Typography>
      <Box display="flex" flexDirection="column" className={classes.dropdown}>
        <FormControl variant="outlined" className={classes.formControl} size="small">
          <Select value={value} onChange={onChange} name={name} displayEmpty>
            <MenuItem value="" disabled>
              Select from the following
            </MenuItem>
            {
              defaultValue &&
                <MenuItem value={defaultValue.id}>{defaultValue.name}</MenuItem>
            }
            {
              values.map((item, index) => {
                return (
                  <MenuItem key={id ? `${index}-${item[id]}` : `${index}-${item._id}`} value={id ? item[id] :  item._id}>{item.name}</MenuItem>
                )
              })
            }
          </Select>
        </FormControl>
        {
          component
        }
        <Typography hidden={!caption} variant="caption" className={classes.italic}>{caption}</Typography>
        <Typography hidden={!note} variant="caption" display={note && "block"} className={classes.note}><span>Note:</span> {note}</Typography>
      </Box>
    </>
  )
}

export default Dropdown;