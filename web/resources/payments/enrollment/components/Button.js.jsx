import React from "react";
import brandingName from '../../../../global/enum/brandingName.js.jsx';

const Button = (props) => {
  const { handleModal, merchData, handleConfirmAction } = props;
  return (
    <div class="p-col-12 p-pt-3 ic-size-17 p-text-center">
      <button
        class="p-button p-ripple p-component"
        icon={merchData && merchData.stax_merchant_id == null ? "fal fa-credit-card" : "fal fa-exclamation-circle"}
        pbutton=""
        pripple=""
        type="button"
        onClick={merchData && merchData.stax_merchant_id == null ? () => handleModal() : () => handleConfirmAction()}
      >
        <span
          class="p-button-icon p-button-icon-left fal fa-credit-card"
          aria-hidden="true"
        ></span>
        {merchData && merchData.stax_merchant_id == null ? (
          <span class="p-button-label"> Start {brandingName.title} Enrollment</span>
        ): (<span class="p-button-label"> Attention Required &gt;&gt; Click Here to Update Enrollment Application</span>)}
        
        <span
          class="p-ink"
          style={{ height: 256, width: 256, top: -109.5, left: -110.906 }}
        ></span>
      </button>
    </div>
  );
};

Button.propTypes = {};

export default Button;
