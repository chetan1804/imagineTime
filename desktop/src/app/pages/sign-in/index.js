import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import useStyles from './styles';
import { request } from '../../service/requests';
import { CircularProgress } from '@material-ui/core';
import PoweredBy from '../../components/powered-by';
import { AuthContext } from '../../App';
import { LOGIN_API, POST } from '../../utility/constants';

const SignIn = () => {
  const { dispatch } = useContext(AuthContext);
  const classes = useStyles();
  const history = useHistory();
  const [username] = useState('cthomas@imaginetime.net');
  const [password] = useState('Password123');

  const handleSignIn = (values, {setSubmitting, setErrors}) => {
    console.clear();
    console.log('values : ', values);
    
    request({
      url     : LOGIN_API,
      method  : POST,
      data    : values
    }).then(response => {
      console.log('login response : ', response);
      const { success, user } = response.data;
      
      if (success) {
        dispatch({ 
          type    : 'LOGIN', 
          payload : user 
        });
        history.push('accounts');
      } else {
        setErrors({
          username  : ' ',
          password  : 'Invalid email or password.'
        })
      }
    }).catch(error => {
      console.log('login error : ', error.response);
    }).finally(() => {
      setSubmitting(false);
    });
  }

  return (
    <Container component="main" maxWidth="md" className={classes.container}>
      <Box className={classes.paper}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Formik
          initialValues={{
            username  : username,
            password  : password
          }}
          validationSchema={
            Yup.object({
              username  : Yup.string()
                            .email('Email is invalid')
                            .required('Email is required'),
              password  : Yup.string()
                            .min(6, 'Password must be at least 6 charaters')
                            .required('Password is required')
            })
          }
          onSubmit={(values, { setSubmitting, setErrors }) => handleSignIn(values, { setSubmitting, setErrors })}
        >
          {
            formik => (
              <Form className={classes.form}>
                <TextField
                  required
                  id="username"
                  label="Email Address"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  onChange={formik.handleChange}
                  value={formik.values.username}
                  error={formik.touched.username && Boolean(formik.errors.username)}
                  helperText={formik.touched.username && formik.errors.username}
                />
                <TextField
                  required
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  onChange={formik.handleChange}
                  value={formik.values.password}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
                <Button
                  type="submit"
                  className={classes.submit}
                >
                  {
                    formik.isSubmitting ? 
                      <CircularProgress color="inherit" size={24}/>
                    :
                      `Sign In`
                  }
                </Button>
              </Form>
            )
          }
        </Formik>
      </Box>
      <PoweredBy/>
    </Container>
  );
}

export default SignIn;