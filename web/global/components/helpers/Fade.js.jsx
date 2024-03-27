// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';


const Fade = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={{
     enter: 300,
     exit: 500,
    }}
    classNames="fade"
  >
    {children}
  </CSSTransition>
);


export default Fade;