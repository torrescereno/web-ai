import Head from 'next/head'
import {FromProcess} from '@/components/FromProcess'
import {FormConfiguration} from "@/components/FormConfiguration";
import {ParametersProvider} from "@/context/parametersConext";

export default function Home() {

    return (
        <>
            <Head>
                <title>DEMO WEB AI</title>
                <meta name="description" content="Aplicación de prueba para usar open ai api"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <ParametersProvider>
                <main
                    className="flex justify-center p-4 min-h-screen bg-gray-800 text-white">
                    <div className="container">
                        <div className="grid grid-cols-1 gap-4">

                            <header className="flex justify-between p-2">
                                <span>Web AI</span>
                                <nav></nav>
                            </header>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <FromProcess/>
                                <FormConfiguration/>
                            </div>
                        </div>
                    </div>
                </main>
            </ParametersProvider>
        </>
    )
}
