import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactModal from 'react-modal'
import App from 'app/App'

const rootElement = document.getElementById('root')

if (rootElement != null) {
  ReactModal.setAppElement(rootElement)
  ReactDOM.createRoot(rootElement).render(<App />)
}
