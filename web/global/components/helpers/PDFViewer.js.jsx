/**
 * Helper component to display PDFs.
 * Utilizes react-pdf github: https://github.com/wojtekmaj/react-pdf/blob/v3.x/README.md
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import third party libraries
import classNames from 'classnames';
import { Document, Page } from 'react-pdf/dist/entry.noworker';
// import Scrollchor from 'react-scrollchor';

// import global components
import Binder from '../Binder.js.jsx';

class PDFViewer extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      numPages: null
      , pageNumber: 1
      , error: 'Failed to load PDF File'
    }
    this._bind(
      '_done'
      , '_nextPage'
      , '_onDocumentLoad'
      , '_previousPage'
      , '_onDocumentLoadError'
    )
  }

  _onDocumentLoadError = (error) => {

    if(error.message == 'No password given') {
      this.setState({error: `Can't display a preview for protected PDF`});
    }
  }

  _onDocumentLoad = ({ numPages }) => {
      this.setState({
      numPages: numPages
    });
    // if(this.props.tracking) {
    //   this.props.dispatch(userEventActions.sendCreateUserEvent({
    //     ...this.props.tracking // should contain any relevant keys to save
    //     , eventType: "pdf"
    //     , eventAction: "play"
    //   }));
    // }
  }

  _nextPage() {
    // Make sure there is another page before setting pageNumber.
    if(this.state.pageNumber + 1 <= this.state.numPages) {
      this.setState({
        pageNumber: this.state.pageNumber + 1
      });
    }
  }

  _previousPage() {
    // Don't allow pageNumber to be less than 1.
    if(this.state.pageNumber > 1) {
      this.setState({
        pageNumber: this.state.pageNumber - 1
      });
    }
  }

  _done() {
    this.setState({
      pageNumber: 1
    })
    if(this.props.onDone) {
      this.props.onDone()
    }

    // if(this.props.tracking) {
    //   this.props.dispatch(userEventActions.sendCreateUserEvent({
    //     ...this.props.tracking // should contain any relevant keys to save
    //     , eventType: "pdf"
    //     , eventAction: "finish"
    //   }));
    // }
  }

  render() {
    const { numPages, pageNumber } = this.state;
    const {
      autoScroll
      , controls
      , filePath
      , hidden
      , pdfClasses
    } = this.props;
    const pdfWrapperClass = classNames(
      'pdf-wrapper'
      , {
        '-hidden': hidden
      }
    )

    const isEmpty = (
      numPages === null
    )

    return (
      <div className={pdfWrapperClass + " " + pdfClasses} id={autoScroll ? 'pdf-top': null}>
        <Document
          className="-pdf-document"
          file={filePath}
          onLoadSuccess={this._onDocumentLoad}
          onLoadError={this._onDocumentLoadError}
          error={this.state.error}
        >
        <Page
            className="-pdf-page"
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={2}
          />
        </Document>
        {controls ? 
          <div className='yt-row center-horiz'>
          { autoScroll && !isEmpty ? // Include Scrollchor
            <div className='-pdf-nav-controls'>
              <Scrollchor to="#pdf-top">
                <span className={`-nav-button ${pageNumber <= 1 ? '-disabled' : ''}`} onClick={this._previousPage}>
                  <i className="fas fa-angle-double-left"/>
                  prev
                </span>
              </Scrollchor>
              { pageNumber } of { numPages }
              { pageNumber < numPages ? 
              <Scrollchor to="#pdf-top">
                <span className={`-nav-button ${pageNumber >= numPages ? '-disabled' : ''}`} onClick={this._nextPage}>
                  next
                  <i className="fas fa-angle-double-right"/>
                </span>
              </Scrollchor>
              :
              <Scrollchor to="#pdf-top">
                <span className={`-nav-button`} onClick={this._done}>
                  done
                  <i className="fas fa-angle-double-right"/>
                </span>
              </Scrollchor>
              }
            </div>
            : // Don't include Scrollchor
            !isEmpty ?
            <div className='-pdf-nav-controls'>
              <span className={`-nav-button ${pageNumber <= 1 ? '-disabled' : ''}`} onClick={this._previousPage}>
                <i className="fas fa-angle-double-left"/>
                prev
              </span>
              { pageNumber } of { numPages }
              { pageNumber < numPages ? 
              <span className={`-nav-button ${pageNumber >= numPages ? '-disabled' : ''}`} onClick={this._nextPage}>
                next
                <i className="fas fa-angle-double-right"/>
              </span>
              :
              <span className={`-nav-button`} onClick={this._done}>
                done
                <i className="fas fa-angle-double-right"/>
              </span>
              }
            </div>
            :
            null
          }
          </div>
          :
          null
        }
      </div>
    )
  }
}

PDFViewer.propTypes = {
  autoScroll: PropTypes.bool
  , controls: PropTypes.bool
  , dispatch: PropTypes.func
  , filePath: PropTypes.string.isRequired
  , pdfClasses: PropTypes.string
  , hidden: PropTypes.bool
}

PDFViewer.defaultProps = {
  autoScroll: false
  , controls: true
  , file: ''
  , styles: ''
  , hidden: false
}

export default connect()(PDFViewer);
