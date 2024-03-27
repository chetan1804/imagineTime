/**
 * View component for /phone-numbers
 *
 * Generic phoneNumber list view. Defaults to 'all' with:
 * this.props.dispatch(phoneNumberActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as phoneNumberActions from '../phoneNumberActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import PhoneNumberLayout from '../components/PhoneNumberLayout.js.jsx';
import PhoneNumberListItem from '../components/PhoneNumberListItem.js.jsx';

class PhoneNumberList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(phoneNumberActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { phoneNumberStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the phoneNumberList meta info here so we can reference 'isFetching'
    const phoneNumberList = phoneNumberStore.lists ? phoneNumberStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual phoneNumber objetcs
     */
    const phoneNumberListItems = phoneNumberStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !phoneNumberListItems
      || !phoneNumberList
    );

    const isFetching = (
      !phoneNumberListItems
      || !phoneNumberList
      || phoneNumberList.isFetching
    )

    return (
      <PhoneNumberLayout>
        <h1> Phone Number List </h1>
        <hr/>
        <Link to={'/phone-numbers/new'}> New Phone Number </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {phoneNumberListItems.map((phoneNumber, i) =>
                <PhoneNumberListItem key={phoneNumber._id + i} phoneNumber={phoneNumber} />
              )}
            </ul>
          </div>
        }
      </PhoneNumberLayout>
    )
  }
}

PhoneNumberList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    phoneNumberStore: store.phoneNumber
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PhoneNumberList)
);
