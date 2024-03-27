/**
 * Helper component to generate breadcrumbs in the admin layout
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';

const Breadcrumbs = ({ classes, links, connector, otherLinks }) => {

  const breadClass = classNames('breadcrumbs', classes);
  connector = connector === "slash" ? " / " : " :: "
  return (
    <div className={breadClass} style={otherLinks && otherLinks.length ? { width: "100%" } : {}}>
      { links.map((link, i) =>
        <span key={link.path + i}>
          { i < links.length -1 ?
              <span className={link.archived ? "-archived" : ""}> <Link to={link.path}>{link.display}</Link>{connector}</span>
            :
              <span> {link.display} </span>
          }
        </span>
      )}
      {
        otherLinks && otherLinks.length ?
        otherLinks.map((link, i) =>
          <span key={link.path + i}>
            <span style={{float:"right"}}> <Link to={link.path}>{link.display}</Link></span>
          </span>
        )
        : null
      }
    </div>
  )
}

Breadcrumbs.propTypes = {
  classes: PropTypes.string 
  , links: PropTypes.array.isRequired
}



export default withRouter(Breadcrumbs);
