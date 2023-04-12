import type {NextApiRequest, NextApiResponse} from 'next';
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {HNSWLib} from "langchain/vectorstores";
import {OpenAIEmbeddings} from "langchain/embeddings";
import {makeChain} from "../../../utils/makechain";

// export const config = {
//     runtime: "edge",
// };

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

    const {apiKey, question, textFile, temperature, model} = req.body

    if (!question) {
        return res.status(400).json({message: 'No realizó ninguna pregunta'});
    }

    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

    const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
    const docs = await textSplitter.createDocuments([textFile]);
    const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings({openAIApiKey: apiKey}));


    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    });

    const sendData = (data: string) => {
        res.write(`data: ${data}\n\n`);
    };

    sendData(JSON.stringify({data: ''}));

    // Creación de la cadena
    const chain = makeChain(vectorStore, temperature, apiKey, model, (token: string) => {
        sendData(JSON.stringify({data: token}));
    });

    try {
        // Realizar una consulta
        const response = await chain.call({
            question: sanitizedQuestion,
            chat_history: [],
        });

        console.log('response', response);
        // console.log(vectorStore.docstore)
        sendData(JSON.stringify({sourceDocs: vectorStore.docstore}));
    } catch (error) {
        console.log('error', error);
    } finally {
        sendData('[DONE]');
        res.end();
    }


}
