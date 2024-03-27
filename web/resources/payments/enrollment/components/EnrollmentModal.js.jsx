import React from "react";
//import toast from "react-hot-toast";

import Binder from "../../../../global/components/Binder.js.jsx";
import Modal from "../../../../global/components/modals/Modal.js.jsx";
import { TextInput } from "../../../../global/components/forms";
import AlertModal from "../../../../global/components/modals/AlertModal.js.jsx";
import { validationUtils } from "../../../../global/utils";
import brandingName from '../../../../global/enum/brandingName.js.jsx';

class EnrollmentModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      company_name: "",
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      isSaved: false,
      showAlertModal: false,
      emailError: "",
      passwordError: "",
      emailIsValid: false,
      passwordIsValid: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleEmail = this.handleEmail.bind(this);
    this.handlePassword = this.handlePassword.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAlertModal = this.handleAlertModal.bind(this);
  }

  handleEmail(e) {
    this.setState({
      email: e.target.value,
    });
    if (validationUtils.checkIfEmailIsValid(e.target.value)) {
      this.setState({
        emailIsValid: true,
      });
    } else {
      this.setState({
        emailError: "Your email is invalid.",
        emailIsValid: false,
      });
    }
  }

  handlePassword(e) {
    this.setState({
      password: e.target.value,
    });

    if (validationUtils.checkIfPasswordIsValid(e.target.value)) {
      this.setState({
        passwordIsValid: true,
      });
    } else {
      this.setState({
        passwordError:
          "Your password is invalid. Must be atleast 8-15 characters which contain at least one numeric digit and a special character.",
        passwordIsValid: false,
      });
    }
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  handleAlertModal() {
    this.setState({ showAlertModal: true });
    if (this.state.showAlertModal) {
      this.setState({ showAlertModal: false });
    }
  }

  handleConfirmAction() {
    setTimeout(() => {
      const { match } = this.props;
      window.location.href = `/firm/${match.params.firmId}/workspace`;
      location.reload();
    }, 50);
    const { merchant } = this.props;
    let url = `https://signup.fattmerchant.com/#/sso?jwt=${
      merchant && merchant.stax_token
    }`;
    var newWindow = window.open(decodeURI(url));
    newWindow.location = url;
  }

  handleSubmit() {
    // toast.loading("Please wait...", {
    //   duration: 4500,
    // });
    const { dispatch, createMerchant, match, handleModal } = this.props;
    const { company_name, name, email, password, password_confirmation } =
      this.state;

    const data = {
      company_name: company_name,
      name: name,
      email: email,
      password: password,
      password_confirmation: password_confirmation,
      firm_id: match.params.firmId,
    };

    dispatch(createMerchant(data));

    setTimeout(() => {
      this.setState({
        isSaved: true,
      });
      handleModal();
    }, 3000);

    setTimeout(() => {
      this.setState({
        showAlertModal: true,
      });
    }, 3500);
  }

  render() {
    const { isClicked, handleModal } = this.props;
    const {
      company_name,
      name,
      email,
      password,
      password_confirmation,
      isSaved,
      emailError,
      passwordError,
      emailIsValid,
      passwordIsValid,
    } = this.state;

    const isEnabled =
      company_name &&
      company_name.length > 0 &&
      name &&
      name.length > 0 &&
      email &&
      email.length > 0 &&
      password &&
      password.length > 7 &&
      password_confirmation &&
      password_confirmation.length > 7 &&
      password === password_confirmation;
    return (
      <div>
        <AlertModal
          alertMessage={
            `You will be redirected to complete the enrollment application.  Upon successfully completing, please close the browser tab and return to ${brandingName.title}.`
          }
          closeAction={this.handleAlertModal}
          confirmAction={() => this.handleConfirmAction()}
          alertTitle={"Success"}
          confirmText={"Okay"}
          isOpen={this.state.showAlertModal}
          type={"success"}
        ></AlertModal>
        <Modal
          isOpen={isClicked}
          closeAction={() => handleModal()}
          cardSize="standard"
          showButtons={true}
          modalHeader="Merchant Enrollment"
          confirmAction={this.handleSubmit}
          confirmText={!isSaved ? `Save & Continue Enrollment` : "Saved"}
          disableConfirm={!isEnabled ? true : false}
          closeText="Cancel"
        >
          <div className="-share-link-configuration">
            <div className="-body">
              <div className="-setting yt-row space-between">
                <div className="-inputs yt-col">
                  <b className="required-field">Company Name</b>
                  <TextInput
                    change={this.handleChange}
                    name="company_name"
                    value={company_name}
                    autoComplete="nope"
                    required
                  />
                  <b className="required-field">Name</b>
                  <TextInput
                    change={this.handleChange}
                    name="name"
                    value={name}
                    autoComplete="nope"
                    required
                  />
                  <b className="required-field">Email</b>
                  <TextInput
                    change={this.handleEmail}
                    name="email"
                    value={email}
                    autoComplete="nope"
                    required
                  />
                  {!emailIsValid && (
                    <div class="error-message">{emailError}</div>
                  )}
                  <b className="required-field">Password</b>
                  <TextInput
                    change={this.handlePassword}
                    name="password"
                    value={password}
                    type="password"
                    autoComplete="nope"
                    required
                  />
                  {!passwordIsValid && (
                    <div class="error-message">{passwordError}</div>
                  )}
                  <b className="required-field">Password Confirmation</b>
                  <TextInput
                    change={this.handleChange}
                    name="password_confirmation"
                    value={password_confirmation}
                    type="password"
                    autoComplete="nope"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

EnrollmentModal.propTypes = {};

export default EnrollmentModal;
