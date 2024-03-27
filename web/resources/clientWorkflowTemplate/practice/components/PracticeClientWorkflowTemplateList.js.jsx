// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect, withRouter, NavLink } from 'react-router-dom';

const PracticeClientWorkflowTemplateList = ({
  clientWorkflowTemplateList
  , match
}) => {
  return (
    <ul>
    { clientWorkflowTemplateList.map((template, i) =>
      <li key={template._id + '_' + i}>
        <NavLink to={`${match.url}/${template._id}`} activeClassName="active">
          <span className="-text">
          { template.title }
          </span>
        </NavLink>
      </li>
    )}
    </ul>
  )
}

PracticeClientWorkflowTemplateList.propTypes = {
  clientWorkflowTemplateList: PropTypes.array.isRequired
}

export default withRouter(PracticeClientWorkflowTemplateList);
