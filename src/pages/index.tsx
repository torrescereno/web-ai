import Head from 'next/head'
import {FromProcess} from '@/pages/components/FromProcess'
import {FormConfiguration} from "@/pages/components/FormConfiguration";
import {ParametersProvider} from "@/pages/context/parametersConext";

export default function Home() {

    return (
        <>
            <Head>
                <title>WEB AI</title>
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
                                <section className="col-span-2 p-2">
                                    <div className="flex justify-center">
                                        <FromProcess/>
                                    </div>
                                </section>

                                <article
                                    className="p-6 bg-white border h-fit rounded-lg shadow bg-gray-800 border-gray-700"
                                >
                                    <div>
                                        <p className="mb-6 text-center text-xl">Configuración</p>

                                        <div className="mb-6">
                                            <span>Parámetros generales de la API </span>
                                        </div>
                                        <FormConfiguration/>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </div>

                    <div>

                    </div>

                </main>
            </ParametersProvider>

        </>
    )
}
