import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  fileUploader: {
    alignItems: 'center',
    backgroundColor: theme.palette.grey[300],
    display: 'flex',
    height: theme.spacing(10),
    justifyContent: 'center',
    width: '100%',

    '&:hover': {
      backgroundColor: theme.palette.grey[400],
      cursor: 'pointer'
    }
  },
  fileInput: {
    display: 'none'
  },
  files: {
    marginTop: theme.spacing(1),

    '& > *': {
      margin: theme.spacing(0.5),
    },
    
    '& .MuiChip-root': {
      borderRadius: theme.spacing(1),
      padding: theme.spacing(0, 1, 0, 1),

      '& .MuiChip-deleteIcon': {
        margin: 0
      },
    }
  }
}));

export default useStyles;