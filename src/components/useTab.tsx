import { useState } from "react";
import { SCALE } from "./scale";

export type Note = {
    note: string;
    octave: number;
}
export const TUNING: Note[] = [
    { note: 'E', octave: 2 },
    { note: 'A', octave: 2 },
    { note: 'D', octave: 3 },
    { note: 'G', octave: 3 },
    { note: 'B', octave: 3 },
    { note: 'E', octave: 4 },
]

export type TabNote = {
    string: number;
    fret: number;
}

function distanceBetween(n1: Note, n2: Note): number {
    const n1Index = SCALE.indexOf(n1.note);
    const n2Index = SCALE.indexOf(n2.note);

    const n1Midi = n1.octave * 12 + n1Index;
    const n2Midi = n2.octave * 12 + n2Index;

    return n2Midi - n1Midi;
}

function noteToTab(note: Note, tuning: Note[],prevFret?: number,prevBeforeFret?:number): TabNote | null {
    // There are multiple locations the note can be played.
    // We will choose the one that is closest to the previous note
    // or if there is no previous note, the one closest to the middle of the fretboard
    if (prevFret == undefined) {
        prevFret = 0;
    }
    if (prevBeforeFret == undefined) {
        prevBeforeFret = prevFret;
    }

    const noteLocations = tuning.map((tuningNote,index) => ({
        fret:distanceBetween(tuningNote, note),
        string:index
    })).filter(noteLocation => noteLocation.fret >= 0)
    .filter(noteLocation => noteLocation.fret <= 15)

    if (noteLocations.length === 0) {
        return null;
    }

    
    const closestNote = noteLocations.reduce((closest, current) => {
        const closestDistance = Math.abs(closest.fret - prevFret!) + Math.abs(closest.fret - prevBeforeFret!);
        const currentDistance = Math.abs(current.fret - prevFret!) + Math.abs(current.fret - prevBeforeFret!);
        return(
         // prefer open strings if possible:
        current.fret === 0 ? current :
        closest.fret === 0 ? closest :
            // prefer the closest note: 
            currentDistance < closestDistance ? current : closest
            )
    });
    return closestNote;

}

const useTab = () => {
    const [tab,setTab] = useState<TabNote[]>([]);

    function addNote(note: Note) {
        
        setTab(tab=>{
            const prevNote = tab.length == 0 ? {fret:0,string:0} : tab[tab.length - 1];
            const prevBeforeNote = tab.length <= 1 ? prevNote : tab[tab.length - 2];
            const newNote = noteToTab(note, TUNING, prevNote.fret, prevBeforeNote.fret);
            if (newNote == null) {
                return tab;
            } else {
                return [...tab,newNote];
            }
        });
    }

    return {
        addNote,
        tab
    }
}


export default useTab;