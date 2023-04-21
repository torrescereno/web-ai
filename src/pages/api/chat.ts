import type {NextApiRequest, NextApiResponse} from 'next';
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {HNSWLib} from "langchain/vectorstores";
import {OpenAIEmbeddings} from "langchain/embeddings";
import {makeChain} from "../../../utils/makechain";

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

    const {apiKey, question, textFile, temperature, model, history} = req.body


    if (req.method !== 'POST') {
        res.status(405).json({error: 'Metodo no permitido'});
        return;
    }

    if (!question) {
        return res.status(400).json({message: 'No realizó ninguna pregunta'});
    }

    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');
    const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
    const docs = await textSplitter.createDocuments([textFile]);
    const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings({openAIApiKey: apiKey}));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendData = (data: string) => {
        res.write(`data: ${data}\n\n`);
    };

    sendData(JSON.stringify({data: ""}));

    const chain = makeChain(vectorStore, temperature, apiKey, model, (token: string) => {
        sendData(JSON.stringify({data: token}));
    });

    try {
        const response = await chain.call({
            question: sanitizedQuestion,
            chat_history: history || [],
        });

        // console.log('response', response);
        // res.status(200).json(response);
    } catch (error: any) {
        console.log('error', error);
        // res.status(500).json({error: error.message || 'Algo salió mal'});
    } finally {
        sendData("[DONE]");
        res.end();
    }


}
