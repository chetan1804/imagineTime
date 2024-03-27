// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import { CheckboxInput } from '../../../global/components/forms';
import Binder from '../../../global/components/Binder.js.jsx';

import SingleFileOptions from '../practice/components/SingleFileOptions.js.jsx';

// actions
import * as fileActions from '../fileActions';
import brandingName from '../../../global/enum/brandingName.js.jsx';

class RecycleBinTableListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            fileOptionsOpen: false
        }
        this._bind(
            '_handleCloseFileOptions'
            , '_setStatus'
        )
    }

    _handleCloseFileOptions(e) {
        e.stopPropagation();
        this.setState({ fileOptionsOpen: false });        
    }

    _setStatus(status) {
        const { dispatch, file } = this.props;
        const newFile = _.cloneDeep(file);
        newFile.status = status;
        newFile.contentType = "";
        newFile._folder = null;
        console.log("dispatch", dispatch)
        dispatch(fileActions.sendUpdateFile(newFile)).then(json => {
            if (json.success && json.item) {
                // do nothing
            }
            this.setState({ fileOptionsOpen: false });
        });
    }

    render() {
        const {
            file
            , userMap
            , match
            , handleSelectFile
            , originalLocation
            , checked
        } = this.props;

        const {
            fileOptionsOpen
        } = this.state;

        const isEmpty = (
            !file
            || !file._id
        )

        return isEmpty ?
            (<div>
                <div className="table-cell"><i className="far fa-spinner fa-spin"/>  Loading...</div>
            </div>)
            :
            (<div className="table-row -file-item">
                <div className="table-cell" style={{ width: "35px" }}>
                    <CheckboxInput
                        name="template"
                        value={checked}
                        change={() => handleSelectFile(file._id)}
                        checked={checked}
                    />
                </div>
                <div className="table-cell" style={{ width: "14px" }}>
                    <div className="-options" onClick={() => this.setState({ fileOptionsOpen: true})} style={{ cursor:"pointer" }}>
                        <div style={{position: "relative", height: "100%", width: "100%"}}>
                            <CloseWrapper
                                isOpen={fileOptionsOpen}
                                closeAction={this._handleCloseFileOptions}
                            />
                            <i className="far fa-ellipsis-v"></i>
                            <SingleFileOptions
                                isOpen={fileOptionsOpen}
                                viewingAs="recyclebin"
                                setStatus={this._setStatus}
                            />
                        </div> 
                    </div>
                </div>
                <div className="table-cell -folder-title -without-description -folder-template">
                    <div className="yt-row center-vert">
                        <span className="-icon">
                            <img src={brandingName.image['folder-template']} />
                        </span>
                        <div className="-file-info">
                            {file.filename}
                        </div>
                    </div>
                </div>
                <div className="table-cell" style={{ color: "#5c768d" }}>
                    <div><small>{originalLocation}</small></div>
                </div>
                <div className="table-cell -date">
                    {DateTime.fromISO(file.updated_at).toLocaleString(DateTime.DATE_SHORT)}
                </div>
            </div>)
    }

}

RecycleBinTableListItem.propTypes = {
    file: PropTypes.object.isRequired
    , user: PropTypes.object.isRequired
    , _files: PropTypes.array
    , _folders: PropTypes.array
}

RecycleBinTableListItem.defaultProps = {
    file: {}
    , user: {}
    , _files: []
    , _folders: []
}

export default RecycleBinTableListItem