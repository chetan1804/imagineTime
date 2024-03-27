import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3),
    position: 'relative',

    '& .MuiButton-root:nth-of-type(1) > .MuiButton-label': {
      color: theme.palette.primary.main
    }
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    
    '& .MuiDivider-root': {
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(1)
    },
    '& > .MuiDivider-root:nth-of-type(1)': {
      marginBottom: theme.spacing(4)
    },
  },
  card: {
    marginBottom: theme.spacing(2),

    '& .MuiCardHeader-root' : {
      backgroundColor: '#F0F0F0'
    },

    '& .MuiCardHeader-subheader': {
      marginBottom: 0
    },
  },
  box: {
    marginTop: theme.spacing(2),
  },
  cancelButton: {
    marginTop: theme.spacing(1),

    '& .MuiButton-label': {
      color: `${theme.palette.error.main} !important`,
    },

    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    }
  },
  hidden: {
    display : 'none'
  },
  textField: {
    marginTop: theme.spacing(1),
    marginBottom: 0
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between'
  },
}));

export default useStyles;