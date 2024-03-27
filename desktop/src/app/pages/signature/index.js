import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, Container, Divider, Grid, TextField, Typography } from '@material-ui/core';
import useStyles from './styles';
import { cancelRequest, request } from '../../service/requests';
import PoweredBy from '../../components/powered-by';
import Dropdown from '../../components/dropdown';
import Files from '../../components/files';
import { FIRMS_API, PLUGIN_REQUEST_FILES_API, POST, QUICK_TASKS_API, USER_BY_CLIENT_ID_API, USER_BY_FIRM_ID_API } from '../../utility/constants';
import { covnertJsonToArray } from '../../utility//helper';
import Email from '../../components/email';

const Signature = (props) => {
  const { clientId, staffId, files, fileIds, firm, clients } = props.location.state;
  const questions = covnertJsonToArray(firm.secretQuestions);
  const classes = useStyles();
  const history = useHistory();
  const [authorizedUser, setAuthorizedUser] = useState(1);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [template, setTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [client, setClient] = useState('');
  const [firstName1, setFirstName1] = useState('');
  const [lastName1, setLastName1] = useState('');
  const [email1, setEmail1] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [socialSecurityNumber, setSocialSecurityNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [firstName2, setFirstName2] = useState('');
  const [lastName2, setLastName2] = useState('');
  const [email2, setEmail2] = useState('');
  const [instructions, setInstructions] = useState('');
  const [users, setUsers] = useState([]);
  const [userId1, setUserId1] = useState('');
  const [userId2, setUserId2] = useState('');
  const [isAddNewSigner1, setIsAddNewSigner1] = useState(false);
  const [isAddNewSigner2, setIsAddNewSigner2] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isRequestiing, setIsRequesting] = useState(false);

  const [firmUsers, setFirmUsers] = useState([]);
  const [isEmailEnabled, setIsEmailEnabled] = useState(false);
  const [isSelectRecipient, setIsSelectRecipient] = useState(true);
  const [dropdowns, setDropdowns] = useState([{ name : '' }]);
  const [textFields, setTextFields] = useState([{ emailAddress : ''}]);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    getTemplates();
    getFirmUsers();
    
    if (clientId !== 0 && clientId !== 'personal') {
      getUsers();
    }

    return () => {
      cancelRequest();
    }
  });

  useEffect(() => {
    if (templateId) {
      getTemplate();
    } 

    return () => {
      cancelRequest();
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) {
      setFirstName1('');
      setLastName1('');
      setEmail1('');
      setStreet('');
      setCity('');
      setState('');
      setZipCode('');
      setSocialSecurityNumber('');
      setDateOfBirth('');
      setFirstName2('');
      setLastName2('');
      setEmail2('');
      setUserId1('');
      setUserId2('');
    }
  }, [templateId, isAddNewSigner1, isAddNewSigner2]);

  useEffect(() => {
    if (authorizedUser !== 1) {
      setQuestion('');  
      setAnswer('');  
    }
  }, [authorizedUser]);

  const getTemplates = () => {
    console.log('firm : ', firm);

    if (!firm) return;

    request({
      url: `${FIRMS_API}/${firm._id}/signature-templates`,
    }).then(response => {
      console.log('getTemplates response : ', response);

      setTemplates(response.data.templates);
    }).catch(error => {
      console.log('getTemplates error : ', error.response);
    });
  }

  const getTemplate = () => {
    console.log('firm : ', firm);

    if (!firm) return;

    setIsLoadingTemplate(true);
    request({
      url: `${QUICK_TASKS_API}/${firm._id}/${templateId}`,
    }).then(response => {
      console.log('getTemplate response : ', response);

      setTemplate(response.data.template);
    }).catch(error => {
      console.log('getTemplate error : ', error.response);
    }).finally(() => {
      setIsLoadingTemplate(false);
    });
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

      const formattedUsers = formatUsers(response.data.users);
      setUsers(formattedUsers);
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

  const goToUpload = () => {
    history.push('upload');
  }

  const getFormValidity = () => {
    // Accessibility
    if (authorizedUser === 2 && (question === '' || answer === '')) {
      console.log('No Question Selected or Empty Answer');
      return true;
    }

    // Template
    if (templateId === '' || isLoadingTemplate) {
      console.log('No Template Selected');
      return true;
    }

    // Client
    if ((clientId === 0 || clientId ==='personal') && client === '') {
      console.log('No Client Selected');
      return true;
    }

    // Signer 1
    if (template && template.content.signers.length > 0) {
      // Personal (Single), General Files (Single), Client Files (Single - Add New Signer), and Client Files (KBA Single)
      if (clientId === 0 || clientId ==='personal' || (template && template.name.includes('KBA')) || isAddNewSigner1) {
        if (firstName1 === '' || lastName1 === '' || email1 === '') {
          console.log('Empty Signer 1 Field/s')
          return true;
        } 

        if (template && template.name.includes('KBA')) {
          if (street === '' || city === '' || state === '' || zipCode === '') {
            console.log('Empty KBA Fields')
            return true;
          }
        }
      } else {
        // Client Files (Single - Select Signer)
        if (userId1 === '') {
          console.log('No Selected User1')
          return true;
        }   
      }
    }

    // Signer 2
    if (template && template.content.signers.length > 1) {
      // Personal Files (Joint), General Files (Joint), and Client Files (Joint - Add New)
      if ((clientId === 0 || clientId === 'personal') || (isAddNewSigner2)) {
        if (firstName2 === '' || lastName2 === '' || email2 === '') {
          console.log('Empty Signer 2 Field/s')
          return true;
        } 
      } else {
        // Client Files (Joint - Select Signer)
        if (userId2 === '') {
          console.log('No Selected User2')
          return true;
        }   
      }
    }
  }

  const createLink = () => {
    const data =  {
      _firm           : firm._id,
      type            : 'signature-request', 
      authType        : authorizedUser === 1 ? 'none' : 'secret-question',  // none | secret-question | shared-client-secret
      password        : authorizedUser === 1 ? '' : answer,                 // '' | secret-question's answer | shared-client-secret's answer
      prompt          : authorizedUser === 1 ? '' : question,               // '' | secret-question | shared-client-secret
      signers         : [],
      templateId      : templateId, 
      _unsignedFiles  : fileIds, 
      typeq           : 'signature', 
      prompq          : instructions
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

    if (clientId === 0 || clientId === 'personal' || (template && template.name.includes('KBA'))) {
      console.log('General, Personal Files, and Client Files (KBA - Single)');
      if (template && template.content.signers.length > 0) {
        console.log('SIGNER 1');
        const signer = {
          firstname : firstName1, 
          lastname  : lastName1, 
          username  : email1
        };
        
        if (template && template.name.includes('KBA')) {
          console.log('SIGNER 1 KBA')
          signer.kba = {
            city      : city,
            zip       : zipCode,
            state     : state,
            address   : street
          };
          signer.enableKba = false;
        }

        data.signers.push(signer);
      } 
      if (template && template.content.signers.length > 1) {
        console.log('SIGNER 2');

        const signer = {
          firstname : firstName2, 
          lastname  : lastName2, 
          username  : email2
        };

        data.signers.push(signer);  
      } 
    } else {
      console.log('Client Files (Single & Joint)');
      if (template && template.content.signers.length > 0) {
        console.log('SIGNER 1');

        let signer;

        if (isAddNewSigner1) {
          console.log('Add New Signer');
          signer = {
            firstname : firstName1, 
            lastname  : lastName1, 
            username  : email1
          };
        } else {
          console.log('Select Signer');
          const user1 = users.find(item => item._id === userId1);
          signer = {
            _id       : user1._id,
            firstname : user1.firstname, 
            lastname  : user1.lastname, 
            username  : user1.username
          };
        }

        data.signers.push(signer);        
      }
      if (template && template.content.signers.length > 1) {
        console.log('SIGNER 2');

        let signer;

        if (isAddNewSigner2) {
          console.log('Add New Signer');
          signer = {
            firstname : firstName2, 
            lastname  : lastName2, 
            username  : email2
          };
        } else {
          console.log('Select Signer');
          const user2 = users.find(item => item._id === userId2);
          signer = {
            _id       : user2._id,
            firstname : user2.firstname, 
            lastname  : user2.lastname, 
            username  : user2.username
          };
        }

        data.signers.push(signer);      
      }
    }

    if (client === 'personal') {
      data._personal = staffId;
    } else {
      data._client = client;
    }

    console.log('data : ', data);

    setIsRequesting(true);
    request({
      url     : PLUGIN_REQUEST_FILES_API,
      method  : POST,
      data    : data
    }).then(response => {
      console.log('requestFiles response : ', response);

      const { shareLink } = response.data;

      history.push('link', {
        shareLink
      });
    }).catch(error => {
      console.log('requestFiles error : ', error);
    }).finally(() => {
      setIsRequesting(false);
    });
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Typography component="h1" variant="h5">
          Request Signatures
        </Typography>
        <Divider light={true}/>
        <Card className={classes.card} variant="outlined">
          <CardHeader subheader="Files to sign"/>
          <Files files={files}/>
        </Card>
        <Card className={classes.card} variant="outlined">
          <CardHeader
            subheader="Signature request details"
          />
          <CardContent>
            <Dropdown
              title="Who has access"
              description="Control who can view the file with this link"
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
                }
              ]}
              component={
                <>
                  {
                    authorizedUser === 2 &&
                      <>
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
                </>
              }
            />
            <Divider light/>
            <Dropdown
              title="Template"
              caption="Choose template to match your file"
              onChange={(event) => setTemplateId(event.target.value)}
              id={'templateID'}
              value={templateId}
              values={templates}
            />
            <Divider light={true}/>
            {
              clientId === 0 || clientId === 'personal' ?
                <Dropdown
                  title="Client"
                  onChange={(event) => setClient(event.target.value)}
                  value={client}
                  values={[
                    {
                      _id : 'personal',
                      name : 'Personal Files'
                    },
                    ...clients
                  ]}
                />
              :
                <Box>
                  <Typography variant="body2" className={'bold no-margin'}>Client</Typography>
                  <Typography variant="body2">{clients.find(item => item._id = clientId).name}</Typography>
                </Box>
            }
            <Grid container justifyContent="center">
              <Box hidden={!isLoadingTemplate} paddingTop={4}>
                <CircularProgress color="primary"/>
              </Box>
            </Grid>
            <Box hidden={!(template && template.content.signers.length > 0) || isLoadingTemplate}>
              <Divider light={true}/>
              <Typography variant="body2" className={'bold no-margin'}>Signer #1</Typography>
              <Box hidden={(clientId === 0 || clientId === 'personal') || (template && template.name.includes('KBA')) || (isAddNewSigner1)}>
                <Dropdown
                  onChange={(event) => setUserId1(event.target.value)}
                  id={'_id'}
                  value={userId1}
                  values={users}
                />
                <Button className={classes.addButton} variant="outlined" fullWidth={false} size="small" onClick={() => setIsAddNewSigner1(!isAddNewSigner1)}>+ Add New</Button>
              </Box>
              <Box hidden={!(clientId === 0 || clientId === 'personal') && !(template && template.name.includes('KBA')) && (!isAddNewSigner1)}>
                <TextField
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  size="small"
                  className={classes.textField}
                  onChange={(event) => setFirstName1(event.target.value)}
                  value={firstName1}
                />
                <TextField
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  size="small"
                  className={classes.textField}
                  onChange={(event) => setLastName1(event.target.value)}
                  value={lastName1}
                />
                <TextField
                  id="email"
                  label="Email"
                  name="email"
                  size="small"
                  className={classes.textField}
                  onChange={(event) => setEmail1(event.target.value)}
                  value={email1}
                />
                <Button className={`${((clientId === 0 || clientId === 'personal') || (template && template.name.includes('KBA'))) ? classes.hidden : classes.cancelButton}`} variant="text" fullWidth={false} size="small" onClick={() => setIsAddNewSigner1(!isAddNewSigner1)}>Cancel</Button>
                <Box hidden={!(template && template.name.includes('KBA'))}>
                  <TextField
                    id="street"
                    label="Street Address"
                    name="street"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => setStreet(event.target.value)}
                    value={street}
                  />
                  <TextField
                    id="city"
                    label="City"
                    name="city"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => setCity(event.target.value)}
                    value={city}
                  />
                  <TextField
                    id="state"
                    label="State"
                    name="state"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => setState(event.target.value)}
                    value={state}
                  />
                  <TextField
                    id="zipCode"
                    label="Zip Code"
                    name="zipCode"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => setZipCode(event.target.value)}
                    value={zipCode}
                  />
                  <TextField
                    id="socialSecurityNumber"
                    label="Social Security Number (Optional)"
                    name="socialSecurityNumber"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => setSocialSecurityNumber(event.target.value)}
                    value={socialSecurityNumber}
                  />
                  <TextField
                    id="dateOfBirth"
                    label="Date of Birth (Optional)"
                    name="dateOfBirth"
                    size="small"
                    className={classes.textField}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    value={dateOfBirth}
                  />
                </Box>
              </Box>
            </Box>
            <Box hidden={!(template && template.content.signers.length > 1) || isLoadingTemplate} className={classes.box}>
              <Typography variant="body2" className={'bold no-margin'}>Signer #2</Typography>
              <Box hidden={(clientId === 0 || clientId === 'personal') || (isAddNewSigner2)}>
                <Dropdown
                  onChange={(event) => setUserId2(event.target.value)}
                  id={'_id'}
                  value={userId2}
                  values={users}
                />
                <Button variant="outlined" fullWidth={false} size="small" onClick={() => setIsAddNewSigner2(!isAddNewSigner2)}>+ Add New</Button>
              </Box>
              <Box hidden={!(clientId === 0 || clientId === 'personal') && !(isAddNewSigner2)}>
                <TextField
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  size="small"
                  className={classes.textField}
                  onChange={(event) => setFirstName2(event.target.value)}
                  value={firstName2}
                />
                <TextField
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  size="small"
                  className={classes.textField}
                  onChange={(event) => setLastName2(event.target.value)}
                  value={lastName2}
                />
                <TextField
                  id="email"
                  label="Email"
                  name="email"
                  size="small"
                  className={classes.textField}
                  onChange={(event) => setEmail2(event.target.value)}
                  value={email2}
                />
                <Button className={`${(clientId === 0 || clientId === 'personal') ? classes.hidden : classes.cancelButton}`} variant="text" fullWidth={false} size="small" onClick={() => setIsAddNewSigner2(!isAddNewSigner2)}>Cancel</Button>
              </Box>
            </Box>
            <Divider light={true}/>
            <Box>
              <Typography variant="body2" className={'bold no-margin'}>Instructions</Typography>
              <TextField
                id="instructions"
                name="instructions"
                label="Instructions"
                size="small"
                className={classes.textField}
                multiline
                minRows={4}
                maxRows={4}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
              />
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
              isRequestiing ? 
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

export default Signature;