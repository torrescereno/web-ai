import {createContext, useState, ReactNode, SetStateAction, Dispatch} from "react";


export type ParametersContent = {
    apiKey: string
    setApiKey: Dispatch<SetStateAction<string>>
    temperature: string
    setTemperature: Dispatch<SetStateAction<string>>
    model: string
    setModel: Dispatch<SetStateAction<string>>
}

interface ParametersProviderProps {
    children: ReactNode
}


export const ParametersContext = createContext<ParametersContent>({
    apiKey: "",
    setApiKey: () => {
    },
    temperature: "",
    setTemperature: () => {
    },
    model: "",
    setModel: () => {
    }
})


export const ParametersProvider = ({children}: ParametersProviderProps) => {

    const [apiKey, setApiKey] = useState("")
    const [temperature, setTemperature] = useState("0")
    const [model, setModel] = useState("")


    return (
        <ParametersContext.Provider value={{apiKey, setApiKey, temperature, setTemperature, model, setModel}}>
            {children}
        </ParametersContext.Provider>
    )

}