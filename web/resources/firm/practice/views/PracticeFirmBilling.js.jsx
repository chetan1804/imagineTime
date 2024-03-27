/**
 * View component for /firms/:firmId
 *
 * Displays a single firm from the 'byId' map in the firm reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// import actions
import * as firmActions from '../../firmActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

// import resource components
import PracticeFirmLayout from '../components/PracticeFirmLayout.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';


class PracticeFirmBiling extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
  }

  render() {
    const { firmStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */
    const selectedFirm = firmStore.selected.getItem();

    const isEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      firmStore.selected.isFetching
    )

    return (
      <PracticeFirmLayout>
        <Helmet><title>Billing Info</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero three-quarter ">
              <div className="yt-container slim">
                <h2>Hmm.  Something's wrong here. </h2>
                <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h3>Billing </h3>
            <p> <em>Other characteristics about the Firm would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Firm </Link>
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeFirmBiling.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeFirmBiling)
);
