import React, { useEffect, useRef, useState } from 'react';
import FFTChart from './FFTChart';
import Pitchfinder from 'pitchfinder';

const PitchDetector = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [note, setNote] = useState(null);
    const pitchDetectorRef = useRef(null);
    const audioStreamRef = useRef(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [fftData,setfftData] = useState<Float32Array | null>(null);

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
        const timeArray = new Float32Array(bufferLength);
        const frequencyArray = new Float32Array(bufferLength);
        let previousAmplitude = 0;
        const amplitudeThreshold = 0.05; // Adjust this threshold as needed
    
        const detectPitch = () => {
            analyserRef.current.getFloatTimeDomainData(timeArray);
            analyserRef.current.getFloatFrequencyData(frequencyArray);
            setfftData(frequencyArray);
    
            // Calculate the current amplitude
            const currentAmplitude = timeArray.reduce((sum, value) => sum + Math.abs(value), 0) / bufferLength;
    
            // Check for note onset
            if (currentAmplitude > amplitudeThreshold && currentAmplitude > previousAmplitude) {
                console.log('Note onset detected');
            }
    
            // Update previous amplitude
            previousAmplitude = currentAmplitude;
    
            const frequency = pitchDetectorRef.current(timeArray);
    
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
    const startDetection = async () => {
        if (!mediaStream) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMediaStream(stream);
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 1024;

                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                startPitchDetection();
            } catch (err) {
                console.error('Error accessing media devices.', err);
            }
        } else {
            startPitchDetection();
        }
    };

    const stopDetection = () => {
        // Cleanup audio streams
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    }

    return (
        <div>
            <h1>Pitch Detector</h1>
            <p>Detected Note: {note || "N/A"}</p>
            <button onClick={startDetection}>Start Pitch Detection</button>
            {fftData &&
                <FFTChart fftData={fftData} />
            }
        </div>
    );
};

export default PitchDetector;
