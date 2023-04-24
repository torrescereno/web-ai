import {ChatVectorDBQAChain, ConversationalRetrievalQAChain, LLMChain, loadQAChain} from "langchain/chains";
import {OpenAI, OpenAIChat} from "langchain/llms";
import {HNSWLib} from "langchain/vectorstores";
import {CallbackManager} from "langchain/callbacks";
import {PromptTemplate} from "langchain";


export const makeChain = (
    vectorstore: HNSWLib,
    temperature: number,
    apiKey: string,
    model: string,
    onTokenStream?: (token: string) => void
) => {

    const CONDENSE_PROMPT =
        PromptTemplate.fromTemplate(`Dada la siguiente conversación y una pregunta de seguimiento, reformule la pregunta de seguimiento para que sea una pregunta independiente.
                                    Chat History: {chat_history}
                                    Follow Up Input: {question}
                                    Standalone question: `)

    const QA_PROMPT = PromptTemplate.fromTemplate(`Eres un asistente virtual que analizara y responderá a cada pregunta como un contador auditor experto y tomaras en consideración el contexto de la conversación para proporcionar una respuesta precisa.
                    Pregunta: {question}
                    =========
                    {context}
                    =========
                    Response en Texto:`)

    const questionGenerator = new LLMChain({
        llm: new OpenAIChat({temperature: temperature, modelName: model, openAIApiKey: apiKey}),
        prompt: CONDENSE_PROMPT,
    });
    const docChain = loadQAChain(
        new OpenAIChat({
            temperature: temperature,
            modelName: model,
            openAIApiKey: apiKey,
            streaming: Boolean(onTokenStream),
            callbackManager: onTokenStream
                ? CallbackManager.fromHandlers({
                    async handleLLMNewToken(token) {
                        onTokenStream(token);
                        console.log(token);
                    },
                })
                : undefined,
        }),
        {prompt: QA_PROMPT},
    );

    return new ChatVectorDBQAChain({
        vectorstore,
        combineDocumentsChain: docChain,
        questionGeneratorChain: questionGenerator,
        returnSourceDocuments: false
    });

}
