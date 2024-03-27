'use strict';

console.log("scripts")
var existImagine = document.querySelector("#-imagine-modal");

if (!existImagine) {
    // screen width
    var html = document.querySelector("html").offsetWidth;
    document.querySelector("html").style.width = `${html-320}px`;
    // document.querySelector("html").style.width =  "cal(100% - 320px)";

    // modal
    const imagineModal = document.createElement("div");
    imagineModal.id = "-imagine-modal";
    document.querySelector("body").appendChild(imagineModal);

    // closing element / header
    const imagineHeader = document.createElement("div");
    imagineHeader.id = "-imagine-header";
    document.querySelector("body #-imagine-modal").appendChild(imagineHeader);

    // imagine icon
    const imagineIconHeader = document.createElement("img");
    imagineIconHeader.id = "-imagine-icon-header";
    imagineIconHeader.src = "https://app.lexshare.io/img/lexshare-icon-64.png";
    document.querySelector("#-imagine-header").appendChild(imagineIconHeader);

    // header title 
    const imagineTitleHeader = document.createElement("div");
    imagineTitleHeader.id = "-imagine-title-header";
    imagineTitleHeader.innerText = "ImagineShare";
    document.querySelector("#-imagine-header").appendChild(imagineTitleHeader);

    // header button closing
    const imagineCloseHeader = document.createElement("button");
    imagineCloseHeader.id = "-imagine-close-header";
    imagineCloseHeader.innerText = "🗴";
    document.querySelector("#-imagine-header").appendChild(imagineCloseHeader);

    // iframe
    const imagineIframe = document.createElement("iframe");
    imagineIframe.id = "-imagine-iframe";
    imagineIframe.referrerPolicy = "origin-when-cross-origin";
    imagineIframe.src = "https://app.lexshare.io/outlook";
    
    document.querySelector("body #-imagine-modal").appendChild(imagineIframe);

    // inside of iframe
    // const imagineTime = document.querySelector("#desktop-main-yote");
    // document.querySelector("#desktop-main-yote").appendChild(imagineHeader);

    imagineCloseHeader.onclick = function(element) {
        // screen width
        html = document.querySelector("html").offsetWidth;
        document.querySelector("html").style.width = "auto";
        // document.querySelector("html").style.width =  "cal(100%)";  // `${html+320}px`;
        document.querySelector("#-imagine-modal").remove();
    };
    window.addEventListener('resize', function() {
        console.log("extens resize!");
        if (document.querySelector("#-imagine-modal")) {
            document.querySelector("html").style.width =  `${window.innerWidth - 320}px`
        }
    }, false);
}