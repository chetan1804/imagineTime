chrome.action.onClicked.addListener(function(tab) {
    console.log('tabtest', tab)
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // chrome.tabs.executeScript(null,{"code": "window.history.back()"});
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id }
            , files: ['./script.js']
        });
        chrome.scripting.insertCSS({
            target: { tabId: tabs[0].id }
            , files: ['./styles.css']
        })
    });
});