import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3),
    position: 'relative',
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',

    '& .MuiIconButton-root': {
      padding : 0
    },

    '& .MuiDivider-root': {
      marginBottom: theme.spacing(4)
    }
  },
  visibility: {
    marginTop: theme.spacing(2),

    '& .MuiFormControlLabel-root': {
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    }
  },
  button: {
    padding: theme.spacing(2, 2, 2, 2),
    display: 'flex',
    alignItems: 'center',
    width: '100%',

    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.common.white,
      cursor: 'pointer',
      padding: theme.spacing(2, 1, 2, 2),
    },

    '& .MuiTypography-root': {
      marginLeft: theme.spacing(2)
    }
  },
  disabledButton: {
    padding: theme.spacing(2, 2, 2, 2),
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    cursor: 'no-drop',
    color : theme.palette.grey[500],

    '& .MuiTypography-root': {
      marginLeft: theme.spacing(2)
    }
  }
}));

export default useStyles;