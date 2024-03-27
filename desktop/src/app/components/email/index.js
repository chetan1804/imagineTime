import React from 'react';
import { Box, Button, IconButton, TextField } from '@material-ui/core';
import useStyles from './styles';
import Dropdown from '../dropdown';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import Toggle from '../toggle';

const Email = (props) => {
  const { users, isEmailEnabled, setIsEmailEnabled, isSelectRecipient, setIsSelectRecipient, dropdowns, setDropdowns, textFields, setTextFields, emailMessage, setEmailMessage } = props;
  const classes = useStyles();

  const handleDropdownChange = (index, event) => {
    const updatedDropdowns = [...dropdowns];

    updatedDropdowns[index][event.target.name] = event.target.value;
    setDropdowns(updatedDropdowns);
  }

  const removeDropdowns = (i) => {
    const updatedDropdowns = [...dropdowns];

    updatedDropdowns.splice(i, 1);
    setDropdowns(updatedDropdowns)
  }

  const addDropdowns = () => {
    setDropdowns([
      ...dropdowns, 
      {
        name : ''
      }
    ]);
  }
  
  const handleTextFields = (index, event) => {
    const updatedTextFields = [...textFields];

    updatedTextFields[index][event.target.name] = event.target.value;
    setTextFields(updatedTextFields);
  }

  const removeFormFields = (index) => {
    const updatedTextFields = [...textFields];

    updatedTextFields.splice(index, 1);
    setTextFields(updatedTextFields)
  }

  const addTextFields = () => {
    setTextFields([
      ...textFields, 
      {
        emailAddress : ''
      }
    ]);
  }

  return (
    <>
      <Toggle
        title="Send emails"
        description="Auto send emails when you create this link"
        checked={isEmailEnabled}
        onChange={() => setIsEmailEnabled(!isEmailEnabled)}
      />
      <Box hidden={!isEmailEnabled}>
        <Box hidden={!isSelectRecipient}>
          {
            dropdowns.map((element, index) => {

              return (
                <Box className={classes.row} key={index}>
                  <Box className={classes.dropdown}>
                    <Dropdown
                      onChange={(event) => handleDropdownChange(index, event)}
                      name="name"
                      value={element.name || ''}
                      values={users}
                    />
                  </Box>
                  <Box className={index || classes.hide}>
                    <IconButton color="primary" onClick={() => removeDropdowns(index)}>
                      <CloseOutlinedIcon color="error"/>
                    </IconButton>
                  </Box>
                </Box>
              )
            })
          }
        </Box>
        <Box hidden={isSelectRecipient}>
          {
            textFields.map((element, index) => (
              <Box className={classes.row} key={index}>
                <Box className={classes.dropdown}>
                  <TextField
                    id="emailAddress"
                    label="Email"
                    name="emailAddress"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => handleTextFields(index, event)}
                    value={element.emailAddress || ''}
                  />
                </Box>
                <Box className={index || classes.hide}>
                  <IconButton color="primary" onClick={() => removeFormFields(index)}>
                    <CloseOutlinedIcon color="error"/>
                  </IconButton>
                </Box>
              </Box>
            ))
          }
        </Box>
        <Box>
          <Button
            fullWidth={false}
            onClick={isSelectRecipient ? addDropdowns : addTextFields}
            size="small" 
            variant="outlined"
          >
            + Add Recipient
          </Button>
          <Button 
            fullWidth={false}
            className={classes.linkButton}
            onClick={() => setIsSelectRecipient(!isSelectRecipient)}
            size="small" 
            variant="text" 
          >
            {
              isSelectRecipient ? 
                'Or enter an email address'
              :
                'Or choose from existing users'
            }
          </Button>
        </Box>
        <TextField
          id="emailMessage"
          name="emailMessage"
          size="small"
          label="Email Message"
          className={classes.message}
          multiline
          minRows={4}
          maxRows={4}
          value={emailMessage}
          onChange={(event) => setEmailMessage(event.target.value)}
        />
      </Box>
    </>
  );
}

export default Email;