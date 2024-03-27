import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  logo: {
    bottom: theme.spacing(4),
    display: 'flex',
    position: 'absolute',
    right: theme.spacing(3),

    '& .MuiTypography-root': {
      alignItems: 'center',
      display: 'flex',
      fontStyle: 'italic'
    },

    '& img': {
      width: theme.spacing(20),
    },
  },
  logoRelative: {
    marginBottom: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    marginTop: theme.spacing(5),
    display: 'flex',
    alignSelf: 'flex-end',

    '& .MuiTypography-root': {
      alignItems: 'center',
      display: 'flex',
      fontStyle: 'italic'
    },

    '& img': {
      width: theme.spacing(20),
    },
  },

  
}));

export default useStyles;