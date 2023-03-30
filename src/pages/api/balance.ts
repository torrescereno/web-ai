import {OpenAI} from "langchain/llms";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {HNSWLib} from "langchain/vectorstores";
import {OpenAIEmbeddings} from "langchain/embeddings";
import {RetrievalQAChain} from "langchain/chains";

export default async function handler(req: any, res: any) {

    const {prompt, apiKey, text} = JSON.parse(req.body)
    const model = new OpenAI({openAIApiKey: apiKey});

    const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
    const docs = await textSplitter.createDocuments([text]);
    const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    const chain = RetrievalQAChain.fromLLM(
        model, vectorStore.asRetriever());
    const response = await chain.call({
        input_documents: docs,
        query: prompt
    });

    res.status(200).json({response: response.text})
}
