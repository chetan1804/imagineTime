/**
 * Reusable stateless form component for ClientTask
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { 
  SelectFromArray 
  , TextInput
  , TextAreaInput 
} from '../../../../global/components/forms';

const  AdminClientTaskForm = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , task
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create ClientTask" : "Update ClientTask";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr/></div> : <div/>;

  return (
    <div className="yt-container">
      <div className="yt-row center-horiz">
        <div className="form-container -slim">
          <form name="taskForm" className="task-form" onSubmit={handleFormSubmit}>
            {header}
            <TextInput
              change={handleFormChange}
              label="Title"
              name="clientTask.title"
              placeholder="Title"
              required={true}
              value={clientTask.title || ''}
            />
            <TextAreaInput
              change={handleFormChange}
              label="Description"
              name="clientTask.description"
              placeholder="Description"
              value={clientTask.description || ''}
            />
            <SelectFromArray
              change={handleFormChange}
              label="Type of task"
              name="clientTask.type"
              selected={clientTask.type}
              items={formHelpers.types}
            />
            <SelectFromArray
              change={handleFormChange}
              label="Client Status"
              name="clientTask.clientStatus"
              selected={clientTask.clientStatus}
              items={formHelpers.clientStatuses}
            />
            <SelectFromArray
              change={handleFormChange}
              label="Firm Status"
              name="clientTask.firmStatus"
              selected={clientTask.firmStatus}
              items={formHelpers.firmStatuses}
            />
            
            <div className="input-group">
              <div className="yt-row space-between">
                <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                <button className="yt-btn " type="submit" > {buttonText} </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AdminClientTaskForm.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , clientTask: PropTypes.object.isRequired
}

AdminClientTaskForm.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default AdminClientTaskForm;
