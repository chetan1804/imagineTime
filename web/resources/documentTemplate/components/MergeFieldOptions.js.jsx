import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _, { isNull } from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

class MergeFieldOptions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    const {
        isOpen
        , mergeFieldListItems
        , handleInsertMergeField
    } = this.props;

    return (
      <span className="single-file-options"style={{position: "absolute"}}>
        <TransitionGroup >
          { isOpen ?
            <CSSTransition
              classNames="dropdown-anim"
              timeout={250}
            >
                <ul className="dropMenu -options-menu">
                    {   mergeFieldListItems.map((item, i) => <li key={i}><a onClick={() => handleInsertMergeField(item._id)}>{item.name}</a></li>)  }
                </ul>
            </CSSTransition>
            :
            null
          }
        </TransitionGroup>      
      </span>
    )
  }
}

MergeFieldOptions.propTypes = {
  isOpen: PropTypes.bool.isRequired
}

MergeFieldOptions.defaultProps = {
 
}

export default withRouter(MergeFieldOptions);