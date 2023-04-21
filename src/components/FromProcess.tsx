import {useEffect, useMemo, useRef, useState} from "react";
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import {useParameterContext} from "@/hooks/useParameterContext";
import {Message} from "../../type/chat";
import JSZip from 'jszip';
import {fetchEventSource} from '@microsoft/fetch-event-source';

export const FromProcess = () => {

    const {apiKey, temperature, model} = useParameterContext()
    const [file, setFile] = useState<File>();
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState<string>('');
    const [messageState, setMessageState] = useState<{
        messages: Message[];
        pending?: string;
        history: string;
    }>({
        messages: [
            {
                message: 'Hola, ¿qué le gustaría saber sobre la información?',
                type: 'apiMessage',
            },
        ],
        history: "",
    });


    const {messages, pending, history} = messageState;

    const messageListRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textAreaRef.current?.focus();
    }, []);


    const handleFileUpload = (e: any) => {
        // console.log(e.currentTarget.files)
        setFile(e.currentTarget.files)

        setMessageState({
            messages: [
                {
                    message: 'Hola, ¿qué le gustaría saber sobre la información?',
                    type: 'apiMessage',
                },
            ],
            history: ""
        })
    };

    const handleAudio = async () => {

        const transcriptionStorage = localStorage.getItem('transcription')

        if (!transcriptionStorage) {

            const ffmpeg = createFFmpeg({log: true});
            await ffmpeg.load();

            // @ts-ignore
            ffmpeg.FS('writeFile', file?.name as string, await fetchFile(file));
            await ffmpeg.run('-i', file?.name as string, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '96k', 'output.mp3');
            const data = await ffmpeg.FS('readFile', 'output.mp3');

            const blob = new Blob([data.buffer], {type: 'audio/mp3'});
            const fileAudio = new File([blob], 'output.mp3', {lastModified: Date.now(), type: blob.type});

            if (fileAudio.size > 25 * 1024 * 1024) {
                console.log(`Audio superio a 25MB valor: ${fileAudio.size}`);
                setLoading(false)
                return;
            }

            const fromDataTranscriptions = new FormData();
            fromDataTranscriptions.append("file", fileAudio);
            fromDataTranscriptions.append("model", "whisper-1");


            const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    AccessControlAllowOrigin: "*"
                },
                method: "POST",
                body: fromDataTranscriptions,
            });

            const resultTranscription = await res.json()
            localStorage.setItem('transcription', resultTranscription.text)

            return resultTranscription.text
        }

        return transcriptionStorage
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        setLoading(true);

        let textFile: string = ""

        // @ts-ignore
        for (let i = 0; i < file?.length; i++) {
            let fileText = ""

            // @ts-ignore
            if (file[i]?.type.includes('video/mp4')) {
                fileText = await handleAudio()

                // @ts-ignore
            } else if (file[i]?.type.includes('text/csv')) {

                // @ts-ignore
                fileText += await file[i]?.text() as string
            } else {

                // @ts-ignore
                const zip = await JSZip.loadAsync(file[i])
                const files = Object.keys(zip.files)

                for (let i = 0; i < files.length; i++) {
                    const file = zip.files[files[i]]
                    const contentXml = await file.async("string")
                    const text = contentXml.replace(/(<([^>]+)>)/gi, '');
                    fileText += text
                }

            }

            // @ts-ignore
            textFile += "Nombre del documento " + file[i].name + " Formato del documento: " + file[i].type + " Contenido del documento: " + fileText + " "

        }

        setError(null);

        if (!query) {
            alert('Por escriba una pregunta');
            return;
        }

        const question = query.trim();

        setMessageState((state) => ({
            ...state,
            messages: [
                ...state.messages,
                {
                    type: 'userMessage',
                    message: question,
                },
            ],
            pending: undefined,
        }));

        setLoading(true);
        setQuery('');
        setMessageState((state) => ({...state, pending: ''}));

        const ctrl = new AbortController();

        try {
            await fetchEventSource('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey,
                    question,
                    textFile,
                    temperature: +temperature,
                    model,
                    history,
                }),
                signal: ctrl.signal,
                onmessage: (event) => {
                    if (event.data === '[DONE]') {
                        setMessageState((state) => ({
                            history: state.history + question + state.pending ?? '',
                            messages: [
                                ...state.messages,
                                {
                                    type: 'apiMessage',
                                    message: state.pending ?? '',
                                },
                            ],
                            pending: undefined,
                        }));
                        setLoading(false);
                        ctrl.abort();
                    } else {
                        const data = JSON.parse(event.data);
                        if (data.sourceDocs) {
                            setMessageState((state) => ({
                                ...state,
                                pendingSourceDocs: data.sourceDocs,
                            }));
                        } else {
                            setMessageState((state) => ({
                                ...state,
                                pending: (state.pending ?? '') + data.data,
                            }));
                        }
                    }
                },
            });
        } catch (error) {
            setLoading(false);
            console.log('error', error);
        }
    }

    const handleEnter = async (e: any) => {
        if (e.key === 'Enter' && query) {
            await handleSubmit(e);
        } else if (e.key == 'Enter') {
            e.preventDefault();
        }
    };

    const chatMessages = useMemo(() => {
        return [...messages, ...(pending ? [{type: "apiMessage", message: pending}] : [])];
    }, [messages, pending]);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [chatMessages]);

    return (
        <section className="col-span-2 p-2">
            <div className="flex flex-col justify-center items-center">
                <form className="space-y-6 w-3/5">
                    {error && (
                        <div className="border border-red-400 rounded-md p-4">
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}

                    <div>
                        <label
                            className="block mb-2 text-sm font-medium text-white"
                            htmlFor="file_input">Cargar archivo</label
                        >
                        <input
                            className="block w-full text-sm border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400"
                            accept="video/*,text/csv,.doc,.docx"
                            id="file_input"
                            disabled={loading}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                        />
                    </div>

                    {
                        file && (
                            <div
                                className="block w-full p-6 border rounded-lg shadow bg-gray-800 border-gray-700">
                                <div ref={messageListRef} className="max-h-96 overflow-auto">
                                    {chatMessages.map((message, index) => {
                                        if (message.type === 'userMessage') {
                                            return (
                                                <div key={`chatMessage-${index}`}>
                                                    <div className="p-2">
                                                        <div className="flex items-end justify-end">
                                                            <div className="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-1 items-end">
                                                                <div><span
                                                                    className="px-4 py-2 rounded-lg inline-block rounded-br-none bg-blue-600 text-white ">{message.message}</span>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        } else {
                                            return (
                                                <div key={`chatMessage-${index}`}>
                                                    <div className="p-2">
                                                        <div className="flex items-end">
                                                            <div className="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-2 items-start">
                                                                <div><span
                                                                    className="px-4 py-2 rounded-lg inline-block rounded-bl-none bg-gray-300 text-gray-600">{message.message}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    })}
                                </div>
                            </div>
                        )
                    }


                </form>

                {
                    file && (
                        <form className="space-y-6 w-3/5" onSubmit={handleSubmit}>
                            <label htmlFor="chat" className="sr-only">Envía un mensaje</label>
                            <div className="flex items-center px-3 py-2 rounded-lg bg-gray-700">
                            <textarea disabled={loading}
                                      onKeyDown={handleEnter}
                                      ref={textAreaRef}
                                      autoFocus={false}
                                      className="block mx-4 p-2.5 w-full text-sm rounded-lg border border-gray-600 bg-gray-800 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Envía un mensaje" value={query}
                                      onChange={(e) => setQuery(e.target.value)}></textarea>
                                <button type="submit"
                                        disabled={loading}
                                        className="inline-flex justify-center p-2 rounded-full cursor-pointer text-blue-500 hover:bg-gray-600">
                                    <svg aria-hidden="true" className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                    </svg>
                                    <span className="sr-only">Enviar mensaje</span>
                                </button>
                            </div>
                        </form>
                    )
                }

            </div>
        </section>

    )
}