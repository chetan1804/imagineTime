// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

const StaffContactor = ({
  staff 
}) => {
  return (
    <div className="-staff-contactor">
      {staff.scheduleLink ? 
        <a className="-schedule" target="_blank" href={staff.scheduleLink}>
          Schedule a call with {staff.firstname}
        </a> 
        :
        null 
      }
    </div>
  )
}

StaffContactor.propTypes = {
  staff: PropTypes.object.isRequired 
}

StaffContactor.defaultProps = {
}

export default withRouter(StaffContactor);
