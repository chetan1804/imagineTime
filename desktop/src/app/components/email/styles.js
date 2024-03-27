import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',

    '& .MuiButton-label': {
      color: `${theme.palette.primary.main} !important`,
    },
  },
  row: {
    flexDirection: 'row',
    display: 'flex',
  },
  dropdown: {
    width: '100%'
  },
  hide: {
    visibility: 'hidden'
  },
  textField: {
    marginTop: 0
  },
  message: {
    marginTop: theme.spacing(1)
  },
  linkButton: {
    '& .MuiButton-label': {
      color: `${theme.palette.primary.main} !important`,
    },
  },
}));

export default useStyles;