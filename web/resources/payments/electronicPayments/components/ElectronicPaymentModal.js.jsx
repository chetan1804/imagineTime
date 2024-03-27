import React from "react";

import Modal from "../../../../global/components/modals/Modal.js.jsx";

const ElectronicPaymentModal = ({ isClicked, handleRejectModal, regData, firm }) => {
  const reasons =
    regData &&
    regData.underwriting_substatuses &&
    regData.underwriting_substatuses.map((reason) => {
      return (
        <li>
          <span style={{color: 'red'}}>{reason.message}</span>
          <br />
        </li>
      );
    });

    const notes =
    regData &&
    regData.underwriting_substatuses &&
    regData.underwriting_note;

  const handleFixError = () => {
    let url = `https://signup.fattmerchant.com/#/sso?jwt=${firm && firm.stax_token}`;
    var newWindow = window.open(decodeURI(url));
    newWindow.location = url;
  };

  return (
    <div>
      <Modal
        isOpen={isClicked}
        closeAction={() => handleRejectModal()}
        showButtons={true}
        cardSize="small"
        confirmAction={() => handleFixError()}
        confirmText={true ? `Click Here to Update Enrollment Application` : ""}
        showClose={false}       
      >
        <div className="ic-blue p-text-bold">
          Why?
        </div>
        <div className="-share-link-configuration">
          <div className="-body">
            <ul>{reasons}</ul>
          </div>
        </div>
        <div className="ic-blue p-text-bold">
            Underwriting Notes
        </div>
        <div>
            {notes || '-'}
        </div>
      </Modal>
    </div>
  );
};

ElectronicPaymentModal.propTypes = {};

export default ElectronicPaymentModal;
