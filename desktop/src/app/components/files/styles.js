import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  files: {
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