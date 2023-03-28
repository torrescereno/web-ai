import {useState} from "react";
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import {Configuration, OpenAIApi} from "openai";
import {useParameterContext} from "@/hooks/useParameterContext";
import {ChatCompletionRequestMessage} from "openai/dist/api";


export const FromProcess = () => {

    const {apiKey} = useParameterContext()
    const [file, setFile] = useState<File>()
    const [completions, setCompletions] = useState("")
    const [promptResume, setPromptResume] = useState("")
    const [loading, setLoading] = useState(false)

    const handleFileUpload = (e: any) => {
        setFile(e.currentTarget.files[0])
    };

    const handleFirstBalanceProcess = async (e: any) => {
        e.preventDefault()

        setCompletions("")
        setPromptResume("Se analiza cada cuenta del balance y se indican las normativas internacionales de contabilidad que le podrían aplicar a cada cuenta contable, también se indica expresamente aquellos casos que la información de las cuentas no sea suficiente para indicar la normativa aplicable")

        if (!file) {
            alert("Por favor cargue un archivo");
            return;
        }

        try {
            if (file.type.includes("text/csv")) {
                setLoading(true)
                await handleCompletion([
                    {
                        "role": "user",
                        "content": "Analiza cada cuenta del balance e indícanos como si fueras un experto contador auditor las normativas internacionales de contabilidad que le podrían aplicar a cada cuenta contable, en aquellos casos que la información de las cuentas no sea suficiente para indicar la normativa aplicable también indicarlo expresamente"
                    },
                    {"role": "user", "content": await file.text() as string},
                ])
            } else {
                alert("Formato no soportado")
            }

        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSecondBalanceProcess = async (e: any) => {
        e.preventDefault()

        setCompletions("")
        setPromptResume("Analiza el balance y genera un interpretación global, estado de la situación financiera de la empresa, se menciona los principales índices financieros que puedas calcular con la información del balance y también cualquier anomalía que se puedan observar en las cifras o aspectos que se deberían revisar")

        if (!file) {
            alert("Por favor cargue un archivo");
            return;
        }

        try {
            if (file.type.includes("text/csv")) {
                setLoading(true)
                await handleCompletion([
                    {
                        "role": "user",
                        "content": "Analiza el balance como un experto contador auditor y dame una interpretación global del balance estilo resumen ejecutivo, estado de la situación financiera de la empresa, menciona los principales índices financieros que puedas calcular con la información del balance y menciona cualquier anomalía que puedas observar en las cifras o aspectos que se deberían revisar"
                    },
                    {"role": "user", "content": await file.text() as string},
                ])
            } else {
                alert("Formato no soportado")
            }

        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const handleAudioProcess = async (e: any) => {
        e.preventDefault()

        setCompletions("")
        setPromptResume("Genera un correo con la minuta y resumen de la reunión")

        if (!file) {
            alert("Por favor cargue un archivo");
            return;
        }

        try {
            setLoading(true)


            if (file.type.includes('video/mp4')) {
                await handleAudio()
                const transcriptionStorage = localStorage.getItem('transcription')
                await handleCompletion([
                    {role: "user", content: "Hacer una minuta y un resumen de la siguiente transcripción de una reunión"},
                    {role: "user", content: transcriptionStorage?.substring(0, 3000) || ""},
                    {role: "user", content: "Redacta un correo con esta información para enviar al cliente"}
                ])
            } else {
                alert("Formato no soportado")
            }

        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    };

    const handleAudio = async () => {

        // Transcripción del audio
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
        }
    }

    const handleCompletion = async (prompt: Array<ChatCompletionRequestMessage>) => {

        const configuration = new Configuration({
            apiKey: apiKey,
        });
        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: prompt
        });

        setCompletions(completion.data.choices[0].message?.content || "")
    }

    return (
        < form className="space-y-6 w-3/5">
            <div>
                <label
                    className="block mb-2 text-sm font-medium text-white"
                    htmlFor="file_input">Cargar archivo</label
                >
                <input
                    className="block w-full text-sm border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400"
                    accept="video/*,text/csv"
                    id="file_input"
                    disabled={loading}
                    type="file"
                    onChange={handleFileUpload}
                />
            </div>
            {
                file?.type.includes('video/mp4') && (
                    <div>
                        <button
                            type="submit"
                            onClick={handleAudioProcess}
                            disabled={loading}
                            className="text-white w-full focus:outline-none focus:ring-blue-300 focus:ring-blue-800 font-medium rounded-lg text-sm py-2 text-center bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? "Cargando..." : "Generar resumen de la reunión"} </button
                        >
                    </div>
                )
            }

            {
                file?.type.includes('text/csv') && (
                    <div className="flex justify-between gap-2">
                        <button
                            type="submit"
                            onClick={handleFirstBalanceProcess}
                            disabled={loading}
                            className="text-white w-full focus:outline-none focus:ring-blue-300 focus:ring-blue-800 font-medium rounded-lg text-sm py-2 text-center bg-blue-600 hover:bg-blue-700"
                        >
                            Primer análisis
                        </button
                        >
                        <button
                            type="submit"
                            onClick={handleSecondBalanceProcess}
                            disabled={loading}
                            className="text-white w-full focus:outline-none focus:ring-blue-300 focus:ring-blue-800 font-medium rounded-lg text-sm py-2 text-center bg-blue-600 hover:bg-blue-700"
                        >
                            Segundo análisis
                        </button
                        >
                    </div>
                )
            }

            <div>
                <p>
                    Prompt: {promptResume}
                </p>
            </div>

            {
                loading ? (
                        <div className="flex justify-center mt-2" role="status">
                            <svg aria-hidden="true"
                                 className="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                 viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="currentColor"/>
                                <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="currentFill"/>
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                    )
                    : (<>
                        <div
                            className="block w-full p-6 border rounded-lg shadow bg-gray-800 border-gray-700"
                        >
                            {completions}
                        </div>
                    </>)
            }

        </form>
    )
}