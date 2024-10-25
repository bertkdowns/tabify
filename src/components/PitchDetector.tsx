import * as React from 'react';
import { useRef, useState } from 'react';
import FFTChart from './FFTChart';





// Utility function to map frequency to musical note
const getNoteFromFrequency = (frequency: number) => {
    // Implement your logic to map frequency to musical note
    // This is a placeholder implementation
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = Math.round(12 * (Math.log(frequency / 440) / Math.log(2))) + 69;
    return noteNames[noteIndex % 12];
};

// Example React component using the pitch detection
const PitchDetector = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [notes, setNotes] = useState<string[]>([]);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [fftData,setfftData] = useState<Float32Array | null>(null);

    const startPitchDetection = () => {
        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Float32Array(bufferLength);

    
        const detectPitch = () => {
            analyserRef.current.getFloatFrequencyData(dataArray);
            setfftData(dataArray);
    
            // Find peaks in the frequency spectrum
            const peaks = findPeaks(dataArray);
    
            // Map peaks to notes
            const detectedNotes = peaks.map(peak => getNoteFromFrequency(peak.frequency));
    
            setNotes(detectedNotes);
    
            requestAnimationFrame(detectPitch);
        };
    
        detectPitch();
    };

    // Utility function to find peaks in the frequency spectrum
    const findPeaks = (dataArray: Float32Array) => {
        const peaks = [];
        const data = dataArray.subarray(0,25)

        // find the average value of the data, and the min and max values
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
            min = Math.min(min, data[i]);
            max = Math.max(max, data[i]);
        }

        for (let i = 1; i < data.length - 1; i++) {
            // store locations that are a peak, and also in the top 10% of magnitudes
            if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > min + 0.9 * (max - min) && data[i] > -50) {
                console.log(data[i])
                peaks.push({ frequency: i * (audioContextRef.current.sampleRate / 2) / dataArray.length, magnitude: data[i] });
            }
        }
        return peaks;
    };

    const startDetection = async () => {
        if (!mediaStream) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMediaStream(stream);
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 2048;

                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                startPitchDetection(analyserRef, setNotes);
            } catch (err) {
                console.error('Error accessing media devices.', err);
            }
        } else {
            startPitchDetection(analyserRef, setNotes);
        }
    };

    return (
        <div>
            <button onClick={startDetection}>Start Pitch Detection</button>
            {fftData &&
                <FFTChart fftData={fftData} />
            }
            <div>Detected Notes: {notes.join(', ')}</div>
        </div>
    );
};

export default PitchDetector;