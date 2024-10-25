import React, { useEffect, useRef, useState } from 'react';
import Pitchfinder from 'pitchfinder';

const PitchDetector = () => {
    const [note, setNote] = useState(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const pitchDetectorRef = useRef(null);
    const audioStreamRef = useRef(null);

    useEffect(() => {
        // Initialize audio context, analyser, and pitch detector
        const initAudio = async () => {
            // Set up audio stream and analyser
            audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;

            const source = audioContextRef.current.createMediaStreamSource(audioStreamRef.current);
            source.connect(analyserRef.current);

            // Initialize pitch detector
            pitchDetectorRef.current = Pitchfinder.AMDF({ sampleRate: audioContextRef.current.sampleRate });
            
            startPitchDetection();
        };

        initAudio();

        return () => {
            // Cleanup on component unmount
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const startPitchDetection = () => {
        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Float32Array(bufferLength);
        let previousAmplitude = 0;
        const amplitudeThreshold = 0.05; // Adjust this threshold as needed
    
        const detectPitch = () => {
            analyserRef.current.getFloatTimeDomainData(dataArray);
    
            // Calculate the current amplitude
            const currentAmplitude = dataArray.reduce((sum, value) => sum + Math.abs(value), 0) / bufferLength;
    
            // Check for note onset
            if (currentAmplitude > amplitudeThreshold && currentAmplitude > previousAmplitude) {
                console.log('Note onset detected');
            }
    
            // Update previous amplitude
            previousAmplitude = currentAmplitude;
    
            const frequency = pitchDetectorRef.current(dataArray);
    
            if (frequency) {
                const detectedNote = getNoteFromFrequency(frequency);
                setNote(detectedNote);
            }
    
            requestAnimationFrame(detectPitch);
        };
    
        detectPitch();
    };

    const getNoteFromFrequency = (frequency) => {
        const A4 = 440;
        const semitoneRatio = Math.pow(2, 1 / 12);
        const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69; // MIDI note number
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const octave = Math.floor(noteNumber / 12) - 1;
        const noteName = noteNames[noteNumber % 12];
        return `${noteName}${octave}`;
    };

    return (
        <div>
            <h1>Pitch Detector</h1>
            <p>Detected Note: {note || "N/A"}</p>
        </div>
    );
};

export default PitchDetector;
