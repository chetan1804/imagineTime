// import primary libraries
import React from 'react';

const FirmDomainForwarder = ({firm, path}) => {
  // console.log("HEY")
  if(firm && firm.domain) {
    // console.log("DEBUG 0 - using firm url")
    window.location = `https://${firm.domain}${path}`
  } else {
    // console.log("DEBUG 1 - using appUrl")

    if(window.appUrl.includes('localhost')) {
      window.location = `http://${window.appUrl}${path}`
    } else {
      window.location = `https://${window.appUrl}${path}`
    }
    
  }
  return (<span/>)
}

export default FirmDomainForwarder;
