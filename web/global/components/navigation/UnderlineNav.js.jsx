/**
 * Basic UnderlineNav menu to be used with default global TopNav
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import CloseWrapper from '../helpers/CloseWrapper.js.jsx';


// import components
import Binder from '../Binder.js.jsx';

class UnderlineNav extends Binder {
  constructor(props) {
    super(props);
    this.state = {
        isOpen: false
    }
    this._bind(
        '_handleClose'
    );
  }

  _handleClose(e) {
    e.stopPropagation();
    this.setState({
        isOpen: false
    })
}

  render() {
    const { 
        classes 
        , links
        , match
    } = this.props;

    const {
        isOpen
    } = this.state;

    const fileListActive = match && match.url && match.url.includes("files") ? "active" : null;
    const requestListActive = match && match.url && match.url.includes("request-list") ? "active" : null;
    const documentListActive = match && match.url && match.url.includes("documents") ? "active" : null;

    return(
        <div>
            <ul className={`-underline navigation ${classes}`}>
                <li onClick={() => this.setState({ isOpen: !isOpen })}><i className="far fa-ellipsis-h"></i></li>
                {
                    links.map((link, i) => 
                        <li key={i}>
                            <NavLink className={
                                link && link.path && link.path.includes("files") ? fileListActive 
                                : link && link.path && link.path.includes("request-list") ? requestListActive
                                : link && link.path && link.path.includes("documents") ? documentListActive : null
                                } exact to={link.path}>{link.display}</NavLink>
                        </li>
                    )
                }
            </ul>
            <div className={`-dropdown navigation ${classes}`}>
                <CloseWrapper
                    isOpen={isOpen}
                    closeAction={this._handleClose}
                />
                <span className="single-file-options"style={{position: "absolute"}}>
                    <TransitionGroup >
                    { isOpen ?
                        <CSSTransition
                            classNames="dropdown-anim"
                            timeout={250}
                        >
                            <ul className="dropMenu -options-menu">
                            {
                                links.map((link, i) => 
                                    <li  className="-option" key={i}>
                                        <NavLink exact to={link.path}>{link.display}</NavLink>
                                    </li>
                                )
                            }
                            </ul>
                        </CSSTransition>
                        :
                        null
                    }
                    </TransitionGroup>
                </span>
            </div>
        </div>
    )
  }
}

  
UnderlineNav.propTypes = {
    classes: PropTypes.string 
    , links: PropTypes.array.isRequired
}

const mapStoreToProps = (store) => {
  return {
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UnderlineNav)
);
