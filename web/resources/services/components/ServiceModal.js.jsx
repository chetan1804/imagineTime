import React from "react";
import NumberFormat from "react-number-format";
// import Swal from "sweetalert2";

import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";
import { TextInput, TextAreaInput } from "../../../global/components/forms";

// let Toast = Swal.mixin({
//   toast: true,
//   position: "top-end",
//   showConfirmButton: false,
//   timer: 3900,
//   timerProgressBar: true,
//   didOpen: (toast) => {
//     toast.addEventListener("mouseenter", Swal.stopTimer);
//     toast.addEventListener("mouseleave", Swal.resumeTimer);
//   },
// });

class ServiceModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      service: "",
      price: "",
      decription: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(props) {
    if (!props.isUpdated) {
      this.setState({
        service: "",
        price: "",
        description: "",
        isError: false,
      });
    } else {
      this.setState({
        service: props.selectedData ? props.selectedData.service : "",
        price: props.selectedData ? props.selectedData.price : "",
        description: props.selectedData ? props.selectedData.description : "",
      });
    }
  }

  handleChange(e) {
    const { serviceStore, selectedData, isUpdated } = this.props;
    let dupService = serviceStore.filter((item) => {
      return item && item.service == e.target.value.trim();
    });
    this.setState({
      [e.target.name]: e.target.value,
    });

    if (e.target.name == "service") {
      if (
        !isUpdated ||
        (selectedData && selectedData.service != e.target.value.trim())
      ) {
        this.setState({
          isError: dupService.length == 0 ? false : true,
        });
      } else {
        this.setState({
          isError: false,
        });
      }
    }
  }

  handleSubmit() {
    const { service, description, price } = this.state;
    const {
      dispatch,
      createService,
      updateService,
      isUpdated,
      selectedData,
      handleServiceModal,
    } = this.props;
    //let msg = "Created ";
    if (!isUpdated) {
      const data = {
        service: service,
        description: description,
        price: price,
      };
      dispatch(createService(data));
      handleServiceModal();
    } else {
      const data = {
        _id: selectedData && selectedData._id,
        service: service.trim(),
        description: description.trim(),
        price: price,
      };
      //msg = "Updated ";
      dispatch(updateService(data));
      handleServiceModal();
    }
    // setTimeout(() => {
    //   Toast.fire({
    //     icon: "info",
    //     title: `Please wait..`,
    //   });
    // }, 1200);
  }

  render() {
    const { handleServiceModal, serviceIsClicked, isUpdated } = this.props;
    const { service, price, description, isError } = this.state;

    const isEnabled = service && description && price > 0 && isError == false;
    const MAX_VAL = 5000;
    const withValueLimit = ({ floatValue }) => floatValue <= MAX_VAL;
    return (
      <div>
        <Modal
          isOpen={serviceIsClicked}
          closeAction={() => handleServiceModal()}
          cardSize="standard"
          showButtons={true}
          showClose={false}
          modalHeader={isUpdated ? "Edit Service" : "Add Service"}
          confirmAction={this.handleSubmit}
          confirmText={isUpdated ? "Save" : "Add"}
          disableConfirm={!isEnabled ? true : false}
        >
          <div className="-share-link-configuration">
            <div className="-body">
              <div className="-setting yt-row space-between">
                <div className="-inputs yt-col">
                  <div className="top-add">
                    {isError && (
                      <span className="ic-red">Service Already exists</span>
                    )}
                  </div>
                  <b className="required-field">Service</b>
                  <TextInput
                    change={this.handleChange}
                    name="service"
                    value={service}
                  />
                  <b className="required-field">Description</b>
                  <TextAreaInput
                    change={this.handleChange}
                    name="description"
                    value={description}
                  />
                  <b className="required-field">Price</b>
                  <div>
                    <NumberFormat
                      onValueChange={(values) => {
                        const { value } = values;
                        this.setState({ price: value });
                      }}
                      className="custom-input"
                      thousandsGroupStyle="thousand"
                      value={price}
                      isAllowed={withValueLimit}
                      prefix="$"
                      decimalSeparator="."
                      displayType="input"
                      type="text"
                      thousandSeparator={true}
                      // allowNegative={true}
                      decimalScale={2}
                      fixedDecimalScale={true}
                      // allowEmptyFormatting={true}
                      allowLeadingZeros={true}
                      inputmode="numeric"
                      placeholder="$0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

ServiceModal.propTypes = {};

export default ServiceModal;
