import { useEffect, useRef, useState } from 'react';
import Pitchfinder from 'pitchfinder';
import { SCALE } from './scale';
import { Note } from './useTab';


const useAudio= (onNoteDetected: (note:Note)=>any )=>{
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [note, setNote] = useState<Note>(null);
    const pitchDetectorRef = useRef(null);
    const audioStreamRef = useRef(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [fftData,setfftData] = useState<Float32Array | null>(null);


    const startPitchDetection = () => {
        const bufferLength = analyserRef.current.fftSize;
        const timeArray = new Float32Array(bufferLength);
        const frequencyArray = new Float32Array(bufferLength);
        let previousAmplitude = 0;
        let previousNote = "";
        let timeSinceDetection = 0;
        const amplitudeThreshold = 0.03; // Adjust this threshold as needed
        let ampPass = 100;
    
        const detectPitch = () => {
            analyserRef.current.getFloatTimeDomainData(timeArray);
            analyserRef.current.getFloatFrequencyData(frequencyArray);
            setfftData(frequencyArray);


            const frequency = pitchDetectorRef.current(timeArray);
    
            if (frequency) {
                const detectedNote = getNoteFromFrequency(frequency);
                setNote(detectedNote);

                // Calculate the current amplitude
                const currentAmplitude = timeArray.reduce((sum, value) => sum + Math.abs(value), 0) / bufferLength;


        
                // Check for note onset
                if (currentAmplitude > amplitudeThreshold && currentAmplitude > ampPass) {
                    if(timeSinceDetection > 5 || previousNote !== detectedNote.note){ 
                        onNoteDetected(detectedNote);
                        timeSinceDetection = 0;
                        previousNote = detectedNote.note;
                    }
                } else {
                    timeSinceDetection++;
                }
                // Update previous amplitude
                previousAmplitude = currentAmplitude;
                ampPass = ampPass * 0.7 + currentAmplitude * 0.3;

            }

            requestAnimationFrame(detectPitch);
        };
    
        detectPitch();
    };

    const getNoteFromFrequency = (frequency:number): Note => {
        const A4 = 440;
        const semitoneRatio = Math.pow(2, 1 / 12);
        const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69; // MIDI note number
        
        const octave = Math.floor(noteNumber / 12) - 1;
        const noteName = SCALE[noteNumber % 12];
        return { note:noteName,
            octave: octave,
        }
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

                // Initialize pitch detector
                pitchDetectorRef.current = Pitchfinder.AMDF({ sampleRate: audioContextRef.current.sampleRate });

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


    return {
        fftData,
        note,
        startDetection,
        stopDetection
    }
}

export default useAudio;