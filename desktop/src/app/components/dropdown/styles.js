import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  bold: {
    fontWeight: 'bold'
  },
  dropdown: {
    marginBottom: theme.spacing(1),
  },
  italic: {
    fontStyle: 'italic'
  },
  note: {
    marginTop: theme.spacing(1),
    background: '#F0F0F0',
    padding: theme.spacing(1),
    borderRadius: 4,

    '& > span': {
      fontWeight: 'bold'
    }
  },
}));

export default useStyles;