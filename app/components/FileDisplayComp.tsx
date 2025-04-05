import { useState } from "react";

interface FileDisplayCompProps {
    record: string;
    onClick: () => void;
}

export default function FileDisplayComp ({record, onClick}: FileDisplayCompProps) {
    const [addFile, setAddFile] = useState<number>(0);

    function getExtension(file: string) {
        const tmp = file.split(".");
        return "."+tmp[tmp.length-1]
    }
    
    return(
        <div className={`flex p-2 border rounded-md inset-shadow-sm shadow-md justify-between items-center px-4 ${addFile==1 ? "bg-gray-300" : "bg-white"}`}>
            <div className="flex justify-start items-center gap-4">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-chart-pie-icon lucide-file-chart-pie size-5 text-orange-500">
                        <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                        <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3.5"/>
                        <path d="M4.017 11.512a6 6 0 1 0 8.466 8.475"/>
                        <path d="M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z"/>
                    </svg>
                </div>
                <div className="flex flex-col justify-start">
                    <div className="w-[15rem] truncate text-gray-600">{record}</div>
                    <div className="text-sm text-gray-400">{getExtension(record)} file</div>
                </div>
            </div>
            <div
                onClick={() => {
                    onClick();
                    setAddFile(addFile == 1 ? 0 : 1);
                }}
                className={`cursor-pointer p-1 rounded-full border-[3px] ${addFile == 0 ? 'border-red-500' : 'border-green-600'}`}
            >
                { addFile==0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x size-4 text-red-800">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus size-4 text-green-600">
                        <path d="M5 12h14"/>
                        <path d="M12 5v14"/>
                    </svg>
                )}
            </div>
        </div>
    )
}