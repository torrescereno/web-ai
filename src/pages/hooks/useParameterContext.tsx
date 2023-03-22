import {useContext} from "react";
import {ParametersContext} from "@/pages/context/parametersConext";

export const useParameterContext = () => useContext(ParametersContext)