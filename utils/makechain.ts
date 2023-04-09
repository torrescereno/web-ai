import {PromptTemplate} from "langchain/prompts";
import {ChatVectorDBQAChain, LLMChain, loadQAChain} from "langchain/chains";
import {OpenAIChat} from "langchain/llms";
import {CallbackManager} from "langchain/callbacks";
import {HNSWLib} from "langchain/vectorstores";

export const makeChain = (
    vectorstore: HNSWLib,
    temperature: number,
    apiKey: string,
    onTokenStream?: (token: string) => void,
) => {
    const CONDENSE_PROMPT =
        PromptTemplate.fromTemplate(`  Dada la siguiente conversación y una pregunta de seguimiento, reformule la pregunta de seguimiento para que sea una pregunta independiente.
                                                Historial del chat:
                                                {chat_history}
                                                Seguimiento: {question}
                                                Pregunta independiente:`);

    const QA_PROMPT = PromptTemplate.fromTemplate(
        `Eres un contador auditor experto que analizará el texto y proporcionara una respuesta relacionada con el texto, no inventes montos ni datos ni tampoco des consejos.
                  Si la pregunta no está relacionada con el contexto, responde amablemente que estás preparado para responder sólo a preguntas relacionadas con el contexto.
                  
                  Pregunta: {question}
                  =========
                  {context}
                  =========
                  Response en Texto:`,
    );

    const questionGenerator = new LLMChain({
        llm: new OpenAIChat({temperature: temperature, openAIApiKey: apiKey}),
        prompt: CONDENSE_PROMPT,
    });

    const docChain = loadQAChain(
        new OpenAIChat({
            openAIApiKey: apiKey,
            temperature: temperature,
            modelName: 'gpt-3.5-turbo',
            streaming: Boolean(onTokenStream),
            callbackManager: onTokenStream
                ? CallbackManager.fromHandlers({
                    async handleLLMNewToken(token) {
                        onTokenStream(token);
                        // console.log(token);
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
        returnSourceDocuments: true,
        // k: 10,
    });

}