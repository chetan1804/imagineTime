import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3),
    position: 'relative'
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',

    '& .MuiTypography-root': {
      marginBottom: theme.spacing(1)
    },
    
    '& .MuiDivider-root': {
      marginBottom: theme.spacing(4)
    }
  },
  box: {
    padding: theme.spacing(2, 2, 2, 2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',

    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.common.white,
      cursor: 'pointer',
      padding: theme.spacing(2, 1, 2, 2),
    }
  },
}));

export default useStyles;