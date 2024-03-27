/**
 * A list item to display files added to a clientTask or clientTaskResponse.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

const RequestListDeliveryListItem = ({
    request
    , userStore
}) => {

    const user = request && request._createdBy && userStore && userStore.byId && userStore.byId[request._createdBy]
    return (
        <div className="file-delivery-list-item">
            <div className="-title -icon">
                <i className="fas fa-list-alt"></i>
            </div>
            { request ? 
                <div className="-info">
                    <div className="-title">
                        {request.name}
                    </div>
                    <div>
                        <span>tasks: {request.tasks}</span>
                        <br/>
                        { user && user._id ? <span>created by: {user.firstname} {user.lastname}</span> : null }
                    </div>
                </div>
                    :
                <div className="-info">
                    <i className="far fa-spinner fa-spin"/>
                </div>
            }
        </div>
    )
}

RequestListDeliveryListItem.propTypes = {
    request: PropTypes.object.isRequired
    // , removeFile: PropTypes.func.isRequired
}

RequestListDeliveryListItem.defaultProps = {
    request: null 
}

export default RequestListDeliveryListItem;
