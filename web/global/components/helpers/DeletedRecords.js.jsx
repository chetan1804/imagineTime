import React from 'react';
import PropTypes from 'prop-types'
import classNames from 'classnames';
import brandingName from '../../enum/brandingName.js.jsx';

const DeletedRecords = ({ textErrorDisplay }) => {
    textErrorDisplay = textErrorDisplay || "Hmm.  Something's wrong here.";
    return (
        <div className="hero three-quarter ">
            <div className="yt-container slim">
                <h2>{textErrorDisplay}</h2>
                <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
            </div>
        </div>
    );
}

DeletedRecords.propTypes = {}

export default DeletedRecords;
