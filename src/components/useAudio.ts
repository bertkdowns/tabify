import { useRef, useState } from 'react';
import { SCALE } from './scale';
import { Note } from './useTab';
import { PitchDetector } from 'pitchy'


const useAudio= (onNoteDetected: (note:Note)=>any )=>{
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [note, setNote] = useState<Note | null>(null);
    const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [fftData,setfftData] = useState<Float32Array | null>(null);


    const startPitchDetection = () => {
        const bufferLength = analyserRef.current!.fftSize;
        const timeArray = new Float32Array(bufferLength);
        const frequencyArray = new Float32Array(bufferLength);
        let previousNote = "";
        let timeSinceDetection = 0;
        const amplitudeThreshold = 0.03; // Adjust this threshold as needed
        let ampPass = 100;
    
        const detectPitch = () => {
            if(!analyserRef.current) {
                console.error('Analyser node not initialized');
                return;
            }
            if(!pitchDetectorRef.current) {
                console.error('Pitch detector not initialized');
                return;
            }
            if(!audioContextRef.current) {
                console.error('Audio context not initialized');
                return;
            }
            analyserRef.current!.getFloatTimeDomainData(timeArray);
            analyserRef.current!.getFloatFrequencyData(frequencyArray);
            setfftData(frequencyArray);


            const [frequency,certainty] = pitchDetectorRef.current.findPitch(timeArray,audioContextRef.current!.sampleRate);
            if (frequency && certainty > 0.95) {

                const detectedNote = getNoteFromFrequency(frequency);
                setNote(detectedNote);

                // Calculate the current amplitude
                const currentAmplitude = timeArray.reduce((sum, value) => sum + Math.abs(value), 0) / bufferLength;


        
                // Check for note onset
                if (currentAmplitude > amplitudeThreshold && currentAmplitude > ampPass) {
                    if(timeSinceDetection > 8 || previousNote !== detectedNote.note){ 
                        onNoteDetected(detectedNote);
                        timeSinceDetection = 0;
                        previousNote = detectedNote.note;
                    }
                } else {
                    timeSinceDetection++;
                }
                // Update previous amplitude
                ampPass = ampPass * 0.9 + currentAmplitude * 0.1;

            }

            requestAnimationFrame(detectPitch);
        };
    
        detectPitch();
    };

    const getNoteFromFrequency = (frequency:number): Note => {
        const A4 = 440;
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
                audioContextRef.current = new window.AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 1024;

                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                // Initialize pitch detector
                pitchDetectorRef.current = PitchDetector.forFloat32Array(1024)

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