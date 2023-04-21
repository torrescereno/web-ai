import {ConversationalRetrievalQAChain} from "langchain/chains";
import {OpenAI} from "langchain/llms";
import {HNSWLib} from "langchain/vectorstores";
import {CallbackManager} from "langchain/callbacks";


const CONDENSE_PROMPT = `Dada la siguiente conversación y una pregunta de seguimiento, reformule la pregunta de seguimiento para que sea una pregunta independiente.
Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_PROMPT = `Eres un asistente virtual que analizara y responderá a cada pregunta como un contador auditor experto y tomaras en consideración el contexto del historial de la conversación para proporcionar una respuesta precisa.
Si se despiden, despídete cordialmente. Debes mantener siempre presente el historial de conversación y recordaras las preguntas anteriores.
Contexto: {context}
Pregunta: {question}
Responde en texto:`;

export const makeChain = (
    vectorstore: HNSWLib,
    temperature: number,
    apiKey: string,
    model: string,
    onTokenStream?: (token: string) => void
) => {
    const openModel = new OpenAI({
        temperature: temperature,
        modelName: model,
        openAIApiKey: apiKey,
        verbose: true,
        streaming: Boolean(onTokenStream),
        callbackManager: onTokenStream ?
            CallbackManager.fromHandlers({
                async handleLLMNewToken(token) {
                    onTokenStream(token);
                    // console.log(token);
                },
            }) : undefined,
    });

    return ConversationalRetrievalQAChain.fromLLM(
        openModel,
        vectorstore.asRetriever(),
        {
            qaTemplate: QA_PROMPT,
            questionGeneratorTemplate: CONDENSE_PROMPT,
            returnSourceDocuments: false,
        },
    );

}
