const ORIGEM =
    "https://divaamake10-creator.github.io";


export default async function handler(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        ORIGEM
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }


    if (req.method !== "GET") {

        return res.status(405).json({
            error:
                "Método não permitido"
        });

    }


    try {

        const url =
            process.env.SUPABASE_URL;

        const chave =
            process.env.SUPABASE_SERVICE_ROLE_KEY;


        if (!url || !chave) {

            throw new Error(
                "Configuração do Supabase ausente"
            );

        }


        const resposta =
            await fetch(
                `${url}/rest/v1/produtos` +
                `?select=id,nome,preco,imagem,categoria,subcategoria` +
                `&ativo=eq.true` +
                `&order=id.desc`,
                {

                    method: "GET",

                    headers: {

                        "apikey":
                            chave,

                        "Authorization":
                            `Bearer ${chave}`

                    }

                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            console.error(
                "Supabase:",
                dados
            );

            return res.status(
                resposta.status
            ).json({

                error:
                    "Erro ao buscar produtos",

                detalhes:
                    dados

            });

        }


        return res.status(200).json(
            dados
        );


    } catch (erro) {

        console.error(
            "ERRO PRODUTOS:",
            erro
        );


        return res.status(500).json({

            error:
                "Erro interno ao buscar produtos"

        });

    }

}
