
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import actions
import * as fileActions from '../fileActions';

// import resource components
import FileJotBlocks from './FileJotBlocks.js.jsx';

class CustomTemplate extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            file: null
        }
        this._bind(
            '_handleCustomTemplate'
        );
    }

    componentDidMount() {
        let tmpThis = this;
        const displayMessage = (evt) => {
            if (evt.origin === window.appUrl || evt.target.appUrl === window.appUrl) {
                tmpThis.setState({ file: evt.data });
            }
        }
        
        let eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        let eventer = window[eventMethod];
        let messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
        eventer(messageEvent, displayMessage, false);
    }   

    _handleCustomTemplate(signers, customeTemplate) {
        if (signers && signers.length && customeTemplate && customeTemplate.signers && customeTemplate.signers.length && customeTemplate.elements && customeTemplate.elements.length) {
            if (this.state.kbaEnabled) {
                signers = signers.map(signer => {
                    if (e.target.checked) {
                        signer.kba = {
                            address: signer && signer.kba && signer.kba.address ? signer.kba.address : "",
                            city: signer && signer.kba && signer.kba.city ? signer.kba.city : "",
                            state: signer && signer.kba && signer.kba.state ? signer.kba.state : "",
                            zip: signer && signer.kba && signer.kba.zip ? signer.kba.zip : ""
                        }
                    } else {
                        delete signer.kba
                    }
                    return signer;
                });
            }
            
            parent.postMessage({ success: true, signers, customeTemplate }, "*");
        } else {
            parent.postMessage({ success: false }, "*");
        }
    }

    render() {
        const {

        } = this.props;
        
        const {
            file
        } = this.state;

        const isEmpty = !file;
        const isFetching = !file;
        let isInvalid = true;

        if (file) {
            if (file.fileExtension && file.contentType.indexOf('pdf') > -1) {
                isInvalid = false;
            } else if (file.fileExtension && file.fileExtension.toLowerCase().indexOf('pdf') > -1) {
                isInvalid = false;
            } else if (file.fileExtension && file.fileExtension.toLowerCase().indexOf('doc') > -1) {
                isInvalid = false;
            }
        }

        console.log("file", file)
        return <div>
            { isEmpty || isInvalid ?
                (isFetching && isInvalid ? 
                    <div className="-loading-hero hero">
                        <div className="u-centerText">
                            <div className="loading"></div>
                        </div>
                    </div>  
                    : 
                    <div className="flex column">
                        <section className="section white-bg the-404">
                            <div className="hero flex three-quarter ">
                            <div className="yt-container slim">
                                <h1> Whoops! <span className="light-weight">Something wrong here</span></h1>
                                <hr/>
                                <h4>Either this link no longer exists, or your credentials are invalid.</h4>
                            </div>
                            </div>
                        </section>
                    </div>
                )
                :
                <div style={{ opacity: isFetching ? 0.5 : 1 }}>
                    <FileJotBlocks selectedFile={file} handleCustomTemplate={this._handleCustomTemplate} />
                </div>
            }
        </div>
    }
}

CustomTemplate.propTypes = {
}

CustomTemplate.defaultProps = {
}

const mapStoreToProps = (store, props) => {
    return {}
}

export default withRouter(
    connect(
    mapStoreToProps
  )(CustomTemplate)
);