import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Box, Container, Divider, Typography } from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import useStyles from './styles';
import { cancelRequest, request } from '../../service/requests';
import { GET, PLUGIN_FIRMS_API } from '../../utility/constants';
import Preloader from '../../components/preloader';

const Accounts = () => {
  const classes = useStyles();
  const history = useHistory();
  const [firms, setFirms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {    
    getFirms();

    return () => {
      cancelRequest();
    }
  }, []);

  const getFirms = () => {
    setIsLoading(true);
    request({
      url : PLUGIN_FIRMS_API,
      method: GET
    }).then(response => {
      console.log('getFirms response : ', response.data);

      setFirms(response.data.data);
    }).catch(error => {
      console.log('getFirms error : ', error.response);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  const selectFirm = (firm) => {
    localStorage.setItem('firmId', JSON.stringify(firm._id));
    history.push('upload');
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Typography component="h1" variant="h5">
          Select Accounts
        </Typography>
        <Divider light={true}/>
        <Preloader isVisible={isLoading}/>
        <Box hidden={isLoading}>
          {
            firms.map((firm, index) => {
              return (
                <Box
                  type="submit"
                  className={classes.box}
                  key={firm._id}
                  onClick={() => selectFirm(firm)}
                >
                  <Box>
                    {
                      firm.name
                    }
                  </Box>
                  <ChevronRightIcon/>
                </Box>
              )
            })
          }
        </Box>
      </Box>
    </Container>
  );
}

export default Accounts;