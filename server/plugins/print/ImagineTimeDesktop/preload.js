// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron')

ipcRenderer.on('print-file-status', (event, data) => {
  const newEvent = new CustomEvent('print-file-status', {
    detail: {
      ...data,
    },
  })
  window.dispatchEvent(newEvent)
})

window.addEventListener('print-file-ready', (event) => {
  const data = event.detail
  ipcRenderer.send('print-file-ready', data)
})

window.addEventListener('print-file-upload', (event) => {
  const data = event.detail
  ipcRenderer.send('print-file-upload', data)
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
