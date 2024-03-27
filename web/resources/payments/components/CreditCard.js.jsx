import React from "react";
import Binder from "../../../global/components/Binder.js.jsx";
import Form from "./CreditCardForm.js.jsx";

class CreditCard extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isAdding: false,
    };
    this.handleAdd = this.handleAdd.bind(this);
  }

  handleAdd() {
    this.setState({
      isAdding: true,
    });
  }

  render() {
    const { isAdding } = this.state;
    const { selectedInvoice, selectedFirm, clientStore } = this.props;
    return (
      <div>
        {!isAdding ? (
          <div>
            <div className="grid-container">
              <div className="main1">
                <p>Amount to charge: </p>
                <p>Name: </p>
                <p>Last 4 digits: </p>
              </div>
              <div className="main2">
                <p>$0.00</p>
                <p></p>
                <p></p>
              </div>
            </div>
            <div style={{ float: "right", marginTop: 50 }}>
              <a href="#">
                <button
                  className="yt-btn x-small"
                  type="button"
                  style={{
                    marginBottom: 5,
                    height: 25,
                    paddingTop: "revert",
                    marginTop: 5,
                    marginRight: 5,
                  }}
                  onClick={() => this.props.close()}
                >
                  Cancel
                </button>
              </a>
              <a href="#">
                <button
                  className="yt-btn x-small"
                  type="button"
                  style={{
                    marginBottom: 5,
                    height: 25,
                    paddingTop: "revert",
                    marginTop: 5,
                  }}
                >
                  Process Payment
                </button>
              </a>
              <a href="#">
                <button
                  className="yt-btn x-small"
                  type="button"
                  style={{
                    marginBottom: 5,
                    height: 25,
                    paddingTop: "revert",
                    marginTop: 5,
                    marginLeft: 5,
                  }}
                  onClick={this.handleAdd}
                >
                  Add New Card
                </button>
              </a>
            </div>
          </div>
        ) : (
          <Form
            close={this.props.close}
            selectedInvoice={selectedInvoice}
            selectedFirm={selectedFirm}
            clientStore={clientStore}
          />
        )}
      </div>
    );
  }
}

CreditCard.propTypes = {};

export default CreditCard;
