
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const PracticeTagTableListItem = ({
  tag
  , user
}) => {

  const isEmpty = (
    !tag
    || !tag._id
  )
  const createdBy = user && user.firstname ? user.firstname + ' ' + user.lastname : 'n/a'

  return (
    isEmpty ?
    <tr>
      <td colSpan="4">
        <i className="far fa-spinner fa-spin"/>  Loading...
      </td>
    </tr>
    :
    <tr className="-tag-item">
      <td>{tag.name}</td>
      <td>{tag.type}</td>
      <td>{createdBy}</td>
      { tag._firm ?
        <td className="right"><Link to={`/firm/${tag._firm}/settings/tags/${tag._id}/update`}><i className="fal fa-cog"/></Link></td>
        :
        <td className="right">
          <i className="fas fa-lock"/>
        </td>
      }
    </tr>
  )
}

PracticeTagTableListItem.propTypes = {
  tag: PropTypes.object.isRequired
  , user: PropTypes.object.isRequired
}

PracticeTagTableListItem.defaultProps = {
  tag: {}
  , user: {}
}

export default PracticeTagTableListItem
