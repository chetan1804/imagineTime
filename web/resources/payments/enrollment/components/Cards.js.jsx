import React from "react";

const Cards = (props) => {
  return (
    <div>
      <div className="row">
        <div class="flex-container">
          <div class="flex-child">
            <div class="card">
              <div class="card-header">
                <strong>Credit Cards</strong>
                <img src="/img/cards.png" />
              </div>
              <div class="card-body">
                <p>* Start accepting Credit Cards. Get Paid Faster!</p>
                <p>* Flat rate of 2.89% and .29 per transaction..</p>
                <p>* Settles to your bank in 24-48 hours.</p>
                <p>* Accept payments in the Client Portal!</p>
              </div>
            </div>
          </div>

          <div class="flex-child">
            <div class="card">
              <div class="card-header">
                <strong>ACH Processing</strong>
                <i
                  class="fal fa-university pull-right ic-size-40 user-box"
                  aria-hidden="true"
                  style={{ color: "#F5684D" }}
                ></i>
              </div>
              <div class="card-body">
                <p>* Flat rate of $2.00 per transaction.</p>
                <p>* Settles to your bank in 3-5 Days.</p>
                <p>* Accept ACH transactions in the Client Portal!</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div class="p-col-12 p-pb-2 ic-size-17 p-text-center p-mt-6 ng-star-inserted">
        <span class="p-text-bold p-text-center ">Never leave this site. </span>
        Fill out your information and submit. Approval takes within 24-48 hours!{" "}
      </div>
      <div class="p-col-12 p-pb-2 ic-size-17 p-text-center p-mt-3 ng-star-inserted">
        <span class="p-text-center ">No contract. Cancel anytime..</span>
      </div>
    </div>
  );
};

Cards.propTypes = {};

export default Cards;
