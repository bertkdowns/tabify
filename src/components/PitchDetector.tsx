import React, { useEffect, useRef, useState } from 'react';
import FFTChart from './FFTChart';
import Pitchfinder from 'pitchfinder';
import { SCALE } from './scale';
import useAudio from './useAudio';
import useTab, { Note, TUNING } from './useTab';
import TabViewer from './TabViewer';

const PitchDetector = () => {
    const {tab,addNote} = useTab();
    const handleNoteDetected = (note:Note) => {
        addNote(note);
    }
    const {fftData, startDetection, note} = useAudio(handleNoteDetected);
    return (
        <div className="w-[80vw]">
            <p>Detected Note: {note == null ? "N/A" : `${note.note}${note.octave}`}</p>
            <button onClick={startDetection}>Start Pitch Detection</button>
            {fftData &&
                <div>
                    <FFTChart  fftData={fftData} />
                </div>
            }
            <TabViewer tab={tab} tuning={TUNING}/>
        </div>
    );
};

export default PitchDetector;
