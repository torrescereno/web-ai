import {ChangeEvent, MouseEvent, useEffect, useState} from "react"
import {useParameterContext} from "@/pages/hooks/useParameterContext";
import {getStorageData} from "@/utils/utils";

export const FormConfiguration = () => {

    const {apiKey, setApiKey, setModel, temperature, setTemperature} = useParameterContext()
    const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

    useEffect(() => {
        setApiKey(getStorageData("apiKey", "") || "")
        setModel(getStorageData("model", "") || "")
        setTemperature(getStorageData("temperature", "0") || "")
    }, [setApiKey, setModel, setTemperature])


    const handleTemperatura = (e: ChangeEvent<HTMLInputElement>) => {
        setTemperature(String(parseFloat(e.target.value)))
        localStorage.setItem("temperature", String(parseFloat(e.target.value)))
    }

    const handleApiKey = (e: ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value)
        localStorage.setItem("apiKey", e.target.value)
    }


    function togglePasswordVisibility(e: MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        setIsApiKeyVisible((prevState: boolean) => !prevState);
    }

    return (
        <form className="space-y-6">
            <div className="mb-6">
                <label
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="api-key">Api key
                </label>
                <div className="relative">
                    <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        type={isApiKeyVisible ? "text" : "password"}
                        onChange={handleApiKey}
                        value={apiKey}
                        id="api-key"
                    />
                    <button
                        className="absolute inset-y-0 right-0 p-1.5 flex items-center text-gray-600"
                        onClick={togglePasswordVisibility}
                    >
                        {isApiKeyVisible ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <label
                        htmlFor="temperatura"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Temperatura
                    </label>
                    <span>{temperature}</span>
                </div>
                <input
                    id="temperatura"
                    type="range"
                    value={temperature}
                    min={0} max={2}
                    step={0.1}
                    onChange={handleTemperatura}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>
            <div className="mb-6">
                <label
                    htmlFor="countries"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Modelo</label>
                <select
                    id="countries"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="text-davinci-003">text-davinci-003</option>
                    <option value="text-davinci-002">text-davinci-002</option>
                    <option value="text-curie-001">text-curie-001</option>
                    <option value="text-babbage-001">text-babbage-001</option>
                    <option value="text-ada-001">text-ada-001</option>
                    <option value="davinci">davinci</option>
                    <option value="curie">curie</option>
                    <option value="babbage">babbage</option>
                    <option value="ada">ada</option>
                </select>
            </div>
        </form>
    )
}