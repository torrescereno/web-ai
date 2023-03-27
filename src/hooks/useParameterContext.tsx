import {useContext} from "react";
import {ParametersContext} from "@/context/parametersConext";

export const useParameterContext = () => useContext(ParametersContext)