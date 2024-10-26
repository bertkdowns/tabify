import { useMeasure } from "@uidotdev/usehooks";
import { Note, TabNote } from "./useTab";
import { useRef } from "react";




export default function TabViewer({tab,tuning}:{tab:TabNote[],tuning:Note[]}) {
    const [ref, { width }] = useMeasure();
    const notesPerLine =  Math.floor((width || 600)/20);
    const numLines = useRef(0);
    const bottom = useRef<HTMLDivElement>(null);

    const lines = tab.reduce((lines,note,index) => {
        if (index % notesPerLine === 0) {
            lines.push([]);
        }
        lines[lines.length - 1].push(note);
        return lines;
    },[] as TabNote[][]);

    // Auto scroll to bottom
    if(numLines.current !== lines.length){
        numLines.current = lines.length;
        bottom.current?.scrollIntoView({behavior:'smooth'});
    }

    return <div ref={ref} className="font-mono">
        {lines.map((line,index) => <TabRow key={index} notes={line} tuning={tuning}/>)}
        <div style={{height:100}} ref={bottom}></div>
    </div>
}

export function TabRow({notes,tuning}:{notes:TabNote[],tuning:Note[]}) {
    return <div className="mt-8">
        {tuning.map((note,index) => <p key={index}>
            {note.note}{" "}
            {
                notes.map((tabNote) => {
                    if (tabNote.string === index) {
                        if(tabNote.fret <= 9){
                            return "-" +tabNote.fret;
                        }
                        return tabNote.fret;
                    }
                    return '--';
                })
            }
        </p>)
        }
    </div>
}