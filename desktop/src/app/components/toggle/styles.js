import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  toggle: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  bold: {
    fontWeight: 'bold'
  },
  noMargin: {
    marginBottom: '0 !important'
  }, 
}));

export default useStyles;