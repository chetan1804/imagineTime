chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // chrome.tabs.executeScript(null,{"code": "window.history.back()"});
        chrome.tabs.executeScript(tabs[0].id, { file: './script.js' });
        chrome.tabs.insertCSS(null, {file: './styles.css'});
    });
});