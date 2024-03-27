import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
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
      marginBottom: theme.spacing(3)
    },

    '& .MuiDivider-root:nth-of-type(1)': {
      marginBottom: theme.spacing(4)
    }
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between'
  }
}));

export default useStyles;