import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PitchDetector from './components/PitchDetector'

function App() {

  return (
    <>
      <h1>Tabify</h1>
      <div className="card">
        <p>
          Start writing some tab
        </p>
        <PitchDetector />
      </div>
    </>
  )
}

export default App
