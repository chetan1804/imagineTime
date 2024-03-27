import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Container, Divider, TextField, Typography } from '@material-ui/core';
import moment from 'moment';
import useStyles from './styles';
import PoweredBy from '../../components/powered-by';
import Dropdown from '../../components/dropdown';
import Files from '../../components/files';
import { covnertJsonToArray } from '../../utility//helper';
import { request } from '../../service/requests';
import { PLUGIN_SHARE_FILES_API, POST, USER_BY_CLIENT_ID_API, USER_BY_FIRM_ID_API } from '../../utility/constants';
import Email from '../../components/email';
import Toggle from '../../components/toggle';

const Share = (props) => {
  const { clientId, client, staffId, files, fileIds, firm } = props.location.state;
  const defaultAuthorizedUsers = [];
  if (client?.sharedSecretPrompt) {
    defaultAuthorizedUsers.push({
      _id : 3,
      name: `${client.name} - Secret Question`
    });
  }

  const questions = covnertJsonToArray(firm.secretQuestions);
  const classes = useStyles();
  const history = useHistory();
  const [authorizedUser, setAuthorizedUser] = useState(1);
  const [authorizedUsers, setAuthorizedUsers] = useState(defaultAuthorizedUsers);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [specificQuestions, setSpecificQuestions] = useState([]);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expiration, setExpiration] = useState(moment().format('YYYY-MM-DD'));
  const [hasViewedNotification, setHasViewedNotification] = useState(false);
  const [hasDownloadedNotification, setHasDownloadedNotification] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [users, setUsers] = useState([]);
  const [firmUsers, setFirmUsers] = useState([]);
  const [isEmailEnabled, setIsEmailEnabled] = useState(false);
  const [isSelectRecipient, setIsSelectRecipient] = useState(true);
  const [dropdowns, setDropdowns] = useState([{ name : '' }]);
  const [textFields, setTextFields] = useState([{ emailAddress : ''}]);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (authorizedUser === 2) {
      setQuestion('');  
      setAnswer('');  
    } else if (authorizedUser === 4) {
      setSpecificQuestion('');
    }
  }, [authorizedUser]);

  useEffect(() => {
     if (clientId !== 0 && clientId !== 'personal') {
      if (client.sharedSecretPrompt) {
        setAuthorizedUsers([...authorizedUsers, {
          _id : 3,
          name: `${client.name} - Secret Question`
        }]);
      }

      getUsers();
     }
    getFirmUsers();
  });

  const goToUpload = () => {
    history.push('upload');
  }

  const getFormValidity = () => {
    // Accessibility
    if (authorizedUser === 2 && (question === '' || answer === '')) {
      console.log('No Question Selected or Empty Answer');
      return true;
    }

    if (authorizedUser === 4 && specificQuestion === '') {
      console.log(`No Selected Specific Contact's Secret Question`);
      return true
    }
  }

  const formatUsers = (users) => {
    return users.map(item => {
      return {
        name : `${item.firstname} ${item.lastname}`,
        ...item
      }
    });
  }

  const getUsers = () => {

    if (!firm) return;    

    // setIsLoading(true);
    request({
      url     : `${USER_BY_CLIENT_ID_API}/${firm._id}`
    }).then(response => {
      console.log('getUsers response : ', response.data);

      const newSpecificQuestions = response.data.users.map(user => {
        return {
          _id   : user._id,
          name  : `${user.firstname} ${user.lastname} - Secret Question`
        }
      });

      if (newSpecificQuestions.length > 0) {

        setAuthorizedUsers([...authorizedUsers, {
          _id : 4,
          name: `Specific Contact's Secret Question` 
        }])
        setSpecificQuestions(newSpecificQuestions);
      }
      
      setUsers(response.data.users);
    }).catch(error => {
      console.log('error : ', error.response);
    }).finally(() => {
      // setIsLoading(false)
    });
  }

  const getFirmUsers = () => {

    if (!firm) return;    

    // setIsLoading(true);
    request({
      url     : `${USER_BY_FIRM_ID_API}/${firm._id}`
    }).then(response => {
      console.log('getFirmUsers response : ', response.data);

      const formattedUsers = formatUsers(response.data.users);
      setFirmUsers(formattedUsers);
    }).catch(error => {
      console.log('error : ', error.response);
    }).finally(() => {
      // setIsLoading(false)
    });
  }

  const createLink = () => {

    const data = {
      _firm         : firm._id, 
      _files        : fileIds, 
      authType      : authorizedUser === 1 ? 'none' : 'secret-question',
      expireDate    : hasExpiration ? expiration : null,
    };

    if (authorizedUser === 1) {
      data.authType = 'none';
      data.password = '';
      data.prompt   = '';
    } else if (authorizedUser === 2) {
      data.authType = 'secret-question';
      data.password = answer;
      data.prompt   = question;
    } else if (authorizedUser === 3) {
      data.authType = 'shared-client-secret';
      data.password = client?.sharedSecretAnswer;
      data.prompt   = client?.sharedSecretPrompt;
    } else if (authorizedUser === 4) {
      const selectedUser = users.find(item => item._id === specificQuestion);

      data.authType = 'shared-contact-secret';
      data.password = selectedUser.sharedSecretAnswer;
      data.prompt   = selectedUser.sharedSecretPrompt;
    }

    if (isEmailEnabled) {
      data.emailMessage = emailMessage;

      if (isSelectRecipient) {
        const ids     = dropdowns.map(item => item.name);
        const emails  = firmUsers.filter(item => ids.includes(item._id)).map(item => {
          return {
            email : item.username
          }
        });

        data.sentTo = emails;
      } else {
        data.sentTo = textFields;
      }
    }

    if (clientId === 0) {
      data.sN_downloaded  = hasDownloadedNotification;
      data.sN_viewed      = hasViewedNotification;
    } else if (clientId === 'personal') {
      data._personal = staffId;
    } else if (clientId !== 0 && clientId !== 'personal') {
      data._client = clientId;
    }

    console.log('data : ', data);

    setIsSharing(true);
    request({
      url     : PLUGIN_SHARE_FILES_API,
      method  : POST,
      data    : data
    }).then(response => {
      console.log('shareFiles response : ', response);

      const { shareLink } = response.data;

      history.push('link', {
        shareLink
      });
    }).catch(error => {
      console.log('shareFiles error : ', error);
    }).finally(() => {
      setIsSharing(false);
    });
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Typography component="h1" variant="h5">
          Share Files
        </Typography>
        <Divider light={true}/>
        <Card className={classes.card} variant="outlined">
          <CardHeader subheader="Files to include"/>
          <Files files={files}/>
        </Card>
        <Card className={classes.card} variant="outlined">
          <CardHeader
            subheader="Link Settings"
          />
          <CardContent>
            <Dropdown
              title="Who has access"
              description="Control who can view the file with this link"
              caption="Make sure the answer is something you both know"
              note="Anyone with this link can access theses files."
              onChange={(event) => setAuthorizedUser(event.target.value)}
              value={authorizedUser}
              values={[
                {
                 _id : 1,
                 name: 'Direct Link' 
                },
                {
                 _id : 2,
                 name: 'Question/Answer' 
                },
                ...authorizedUsers
              ]}
              component={
                <>
                  {
                    authorizedUser === 2 &&
                      <>
                        <Box className={classes.marginTop}></Box>
                        <Dropdown
                          onChange={(event) => setQuestion(event.target.value)}
                          value={question}
                          values={questions}
                          component={
                            <TextField
                              id="sharedAnswer"
                              label="Shared Answer"
                              name="sharedAnswer"
                              size="small"
                              className={classes.textField}
                              onChange={(event) => setAnswer(event.target.value)}
                              value={answer}
                            />
                          }
                        />
                      </>
                  }
                                    {
                    authorizedUser === 4 &&
                      <>
                        <Box className={classes.marginTop}></Box>
                        <Dropdown
                          onChange={(event) => setSpecificQuestion(event.target.value)}
                          value={specificQuestion}
                          values={specificQuestions}
                        />
                      </>
                  }
                </>
              }
            />
            <Box hidden={clientId !== 0}>
              <Toggle
                title="Notify When Viewed"
                checked={hasViewedNotification}
                onChange={() => setHasViewedNotification(!hasViewedNotification)}
              />
              <Toggle
                title="Notify When Downloaded"
                checked={hasDownloadedNotification}
                onChange={() => setHasDownloadedNotification(!hasDownloadedNotification)}
              />
            </Box>
            <Toggle
              title="Expiration"
              description="Disable this link on a specific date"
              checked={hasExpiration}
              onChange={() => setHasExpiration(!hasExpiration)}
            />
            <Box hidden={!hasExpiration}>
              <TextField
                id="date"
                type="date"
                size="small"
                defaultValue={moment().format("YYYY-MM-DD")}
                value={expiration}
                onChange={(event) => setExpiration(event.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: moment().format("YYYY-MM-DD"),
                }}
              />
              <Typography variant="caption" display="block" className={classes.note}><span>Note:</span> You can manually disable this link anytime by visiting the link page while logged into the account.</Typography>
            </Box>
            <Email
              users={firmUsers}
              isEmailEnabled={isEmailEnabled}
              setIsEmailEnabled={setIsEmailEnabled}
              isSelectRecipient={isSelectRecipient}
              setIsSelectRecipient={setIsSelectRecipient}
              dropdowns={dropdowns}
              setDropdowns={setDropdowns}
              textFields={textFields}
              setTextFields={setTextFields}
              emailMessage={emailMessage}
              setEmailMessage={setEmailMessage}
            />
          </CardContent>
        </Card>
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
            onClick={createLink}
            fullWidth={false}
            disabled={getFormValidity()}
          >
            {
              isSharing ? 
                <CircularProgress size={24}/>
              :
                `Create Link`
            }
          </Button>
        </Box>
      </Box>
      <PoweredBy position="relative"/>
    </Container>
  );
}

export default Share;