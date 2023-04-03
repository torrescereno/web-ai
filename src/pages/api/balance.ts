import type {NextApiRequest, NextApiResponse} from 'next';
import {OpenAIChat} from "langchain/llms";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {HNSWLib} from "langchain/vectorstores";
import {OpenAIEmbeddings} from "langchain/embeddings";
import {LLMChain, ChatVectorDBQAChain, loadQAChain} from "langchain/chains";
import {PromptTemplate} from 'langchain/prompts';

import * as dotenv from "dotenv";

dotenv.config()

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

    const {prompt, apiKey, text, temperature} = JSON.parse(req.body)

    // --

    const sanitizedQuestion = prompt.trim().replaceAll('\n', ' ');

    const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
    const docs = await textSplitter.createDocuments([text]);
    const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());

    // --

    const CONDENSE_PROMPT =
        PromptTemplate.fromTemplate(`Eres un contador auditor experto`);

    const QA_PROMPT = PromptTemplate.fromTemplate(
        `Eres una asistente que analizará el texto como un contador auditor experto, no inventes montos ni datos, solo responde a las preguntas en base al texto y al contexto, sigue la conversación y si no sabes la respuesta
        indícalo diciendo "No tengo suficiente información al respecto"
                Pregunta: {question}
                =========
                {context}
                =========
                Response en Texto:`,
    );

    const questionGenerator = new LLMChain({
        llm: new OpenAIChat({temperature: temperature}),
        prompt: CONDENSE_PROMPT,
    });

    const docChain = loadQAChain(
        new OpenAIChat({
            openAIApiKey: apiKey,
            temperature: temperature,
            modelName: 'gpt-3.5-turbo',
            streaming: false
        }),
        {prompt: QA_PROMPT},
    );

    const chain = new ChatVectorDBQAChain({
        vectorstore: vectorStore,
        combineDocumentsChain: docChain,
        questionGeneratorChain: questionGenerator,
        returnSourceDocuments: true,
        k: 1
    });

    const response = await chain.call({
        question: sanitizedQuestion,
        chat_history: [],
    });

    res.status(200).json({response: response.text})
    // console.log(response)

    // const chatHistory = sanitizedQuestion + response.text;
    // const followUpRes = await chain.call({
    //     question: "De que se trata el texto",
    //     chat_history: chatHistory,
    // });

    // res.status(200).json({response: followUpRes.text})
}

// "\"El monto con la cuenta de balance mayor es de 2,535,978.342 M$ al 31.12.2022 en la cuenta de Clientes Nacionales."