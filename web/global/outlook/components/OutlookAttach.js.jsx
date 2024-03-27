/* global Office:false */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Binder from '../../components/Binder.js.jsx';

import brandingName from '../../enum/brandingName.js.jsx';

const Checkbox = ({
  name
  , checked = false
  , onChange 
}) => (
  <input type="checkbox" name={name} checked={checked} onChange={onChange} />
);

Checkbox.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}

/** TODO: convert ^this to just using checkbox inputs  */

class OutlookAttach extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      attachments: [],
      checkedAttachments: [],
      errorMessage: null,
    };

    this._bind(
      '_handleClose',
      '_goToPath',
      '_handleInputChange',
      '_handleRefreshSubmit'
    );
  }

  componentDidMount() {
    if (Office.context.requirements.isSetSupported("Mailbox", "1.8")) {
      console.log('mailbox', Office.context.mailbox);
      this.getAttachments()
    }
    else {
      this.setState({
        errorMessage: 'Error code 515 - Attachments are not supported for this version of Outlook.',
      });
    }
  }

  _handleClose() {
    const { history } = this.props;

    history.replace('/actions');
  }

  _goToPath(path) {
    const { history } = this.props;
    const { attachments, checkedAttachments } = this.state;

    const filteredAttachments = attachments
      .filter(attachment => checkedAttachments.indexOf(attachment.id) > -1)
      .map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        contentType: attachment.contentType,
      }))

    history.replace({
      pathname: path,
      state: {
        attachments: filteredAttachments
      }
    });
  }

  _handleRefreshSubmit() {
    this.getAttachments()
  }

  _handleInputChange(e) {
    e.persist();

    const { name, checked } = e.target;
    // console.log(name)
    // console.log(checked)
    let checkedAttachments = [...this.state.checkedAttachments]
    if(checked) {
      checkedAttachments.push(name);
    } else {
      checkedAttachments.splice(checkedAttachments.indexOf(name), 1);
    }
    this.setState({checkedAttachments})
  }

  getAttachments() {
    Office.context.mailbox.item.getAttachmentsAsync((result) => {
      if (result.status == Office.AsyncResultStatus.Failed) {
        this.setState({
          errorMessage: 'Error code 510 - Unable to read attachments. Please try again.',
        });
      } else {
        console.log('attachment result', result);
        this.setState({
          attachments: result.value.filter(item => item.attachmentType === 'file'),
          checkedAttachments: [],
        });
      }
    });
  }

  render() {
    const { attachments, checkedAttachments, errorMessage } = this.state;
    const { selectedFirm, selectedStaff } = this.props;
    // console.log(checkedAttachments);
    return (
      <div>
        <div className="yt-row center-vert space-between">
          <h4>Select attachments</h4>
          <a className="btn" onClick={this._handleRefreshSubmit}>
            <i className="fal fa-sync" />
          </a>
        </div>
        <hr />
        <br />
        {errorMessage && (
          <div className="input-group">
            <div className="-error-message">{errorMessage}</div>
          </div>
        )}
        <div className="alert-message warning -left -small" style={{marginBottom: "16px"}}>
          <p><small><strong>Note: </strong>Selected attachments will be removed from the message and added to {brandingName.title == 'ImagineTime' ? 'ImagineShare': 'LexShare'} uploads.</small></p>
        </div>
        { attachments.map((attachment, i) =>
          <div key={attachment.id}>
            <Checkbox 
              name={attachment.id} 
              checked={checkedAttachments.indexOf(attachment.id) > -1} 
              onChange={this._handleInputChange} 
            />
            &nbsp;<small>{attachment.name} </small>
          </div>
        )}
        <hr/>
        <div className="-outlook-action-btns">
          { checkedAttachments.length > 0 ? 
            <a onClick={() => this._goToPath('/upload/share')} className="-btn">
              <div className="-icon">
                <i className="fad fa-paper-plane " />
              </div>
              <div className="-text">
                Send files
              </div>
            </a>
            : 
            <div className="-btn -disabled">
              <div className="-icon">
                <i className="fad fa-paper-plane " />
              </div>
              <div className="-text">
                Send files
              </div>
            </div>
          }
        
          { !selectedFirm || !selectedFirm.eSigAccess || !selectedStaff || !selectedStaff.eSigAccess ? 
            <div className="-btn -disabled">
              <div className="-icon">
                <i className="fad fa-file-signature" />
              </div>
              <div className="-text">
                Request Signature | <i className="fas fa-lock"/>
              </div>
            </div>
            : checkedAttachments.length === 1 ? 
            <a onClick={() => this._goToPath('/upload/signature')} className="-btn">
              <div className="-icon">
                <i className="fad fa-file-signature" />
              </div>
              <div className="-text">
                Request Signature
              </div>
            </a>
            :
            <div className="-btn -disabled">
              <div className="-icon">
                <i className="fad fa-file-signature" />
              </div>
              <div className="-text">
                Request Signature
              </div>
            </div>
          }
        </div>
        <hr/>
        <div className="yt-container">
          <div className="yt-row space-between">
            <button
              type="button"
              className="yt-btn info small link"
              onClick={this._handleClose}
            >
              cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
}

OutlookAttach.propTypes = {
  history: PropTypes.object.isRequired
  , selectedStaffId: PropTypes.number.isRequired
};

const mapStoreToProps = (store, props) => {
  const { selectedStaffId } = props;
  const staffStore = store.staff;
  const firmStore = store.firm;
  const selectedStaff = staffStore.byId[selectedStaffId]
  const selectedFirm = selectedStaff && firmStore.byId[selectedStaff._firm];

  return {
    selectedFirm
    , selectedStaff
  }
};

export default withRouter(connect(mapStoreToProps)(OutlookAttach));

