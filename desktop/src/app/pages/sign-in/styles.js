import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative'
  },
  paper: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    width: '40%',
  },
  form: {
    marginTop: theme.spacing(1),
    width: '100%' // Fix IE 11 issue.
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  },
}));

export default useStyles;