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

    '& .MuiTypography-root': {
      marginBottom: theme.spacing(1)
    },
    
    '& .MuiDivider-root': {
      marginBottom: theme.spacing(1)
    },
    '& > .MuiDivider-root:nth-of-type(1)': {
      marginBottom: theme.spacing(4)
    },
  },
  link: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: theme.spacing(2),
    
    '& .MuiTypography-root': {
      marginBottom: 0
    },
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between'
  }
}));

export default useStyles;