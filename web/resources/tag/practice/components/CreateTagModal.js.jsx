/**
 * rendered at /firm/:firmId/settings/tags
 * Modal for staffOwner to create custom firm tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as tagActions from '../../tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';

// import resource components
import TagForm from '../../components/TagForm.js.jsx';

class CreateTagModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      tag: _.cloneDeep(this.props.defaultTag.obj)
      , submitting: false
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(tagActions.fetchDefaultTag());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      tag: _.cloneDeep(nextProps.defaultTag.obj)
    })
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    const { firmId, dispatch } = this.props;
    this.setState({submitting: true});
    let newTag = _.cloneDeep(this.state.tag);
    newTag._firm = firmId;

    if(e) { e.preventDefault(); }
    dispatch(tagActions.sendCreateTag(newTag)).then(tagRes => {
      if(tagRes.success) {
        if(this.props.handleNewTag) {
          this.props.handleNewTag(tagRes.item)
        }
        this.setState({submitting: false});
        this.props.close()
      } else {
        alert("ERROR - Check logs");
        this.props.close();
      }
    });
  }

  render() {
    const {
      close
      , isOpen
    } = this.props;
    const { tag, submitting } = this.state;
    const isEmpty = !tag;

    return (
      isEmpty ?
      null
      :
      <Modal
        closeAction={close}
        isOpen={isOpen}
        modalHeader="New custom tag"
        showButtons={false}
      >
        <TagForm
          cancelLink={close}
          submitting={submitting}
          formType="create"
          handleFormChange={this._handleFormChange}
          handleFormSubmit={this._handleFormSubmit}
          tag={tag}
        />
      </Modal>
    )
  }
}

CreateTagModal.propTypes = {
  dispatch: PropTypes.func.isRequired
  , firmId: PropTypes.number.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultTag: store.tag.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateTagModal)
);
