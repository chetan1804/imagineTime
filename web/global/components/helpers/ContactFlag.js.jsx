import React from 'react';
import PropTypes from 'prop-types'
import classNames from 'classnames';


const ContactFlag = ({ user, clientUser }) => {

    const accessType = clientUser && clientUser.accessType ? clientUser.accessType : null;
    const firstTimeLogin = user && user.firstLogin;
    console.log("accessType", user, accessType)
    return (
            !firstTimeLogin ?
            <small style={{ color: "#008000" }}>
                <i className="fas fa-check-circle" /> Portal accessed
            </small>
            :
            accessType === "noinvitesent" ?
            <small style={{ color: "#000000" }}>
                <i className="far fa-circle" /> No invite sent
            </small>
            : 
            accessType === "invitesent" ?
            <small style={{ color: "#008000" }}>
                <i className="far fa-check-circle" /> Invite sent
            </small>
            :
            <small style={{ color: "#000000" }}>
                <i className="far fa-circle" /> No invite sent
            </small>
    )
}

ContactFlag.propTypes = {}

export default ContactFlag;
