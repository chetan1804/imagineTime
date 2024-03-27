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
  marginTop: {
    marginTop: theme.spacing(1)
  },
  textField: {
    marginTop: theme.spacing(1)
  },
  bold: {
    fontWeight: 'bold'
  },
  note: {
    background: '#F0F0F0',
    padding: theme.spacing(1),
    borderRadius: 4,

    '& > span': {
      fontWeight: 'bold'
    }
  },
  noMargin: {
    marginBottom: '0 !important'
  }, 
  actions: {
    display: 'flex',
    justifyContent: 'space-between'
  }
}));

export default useStyles;