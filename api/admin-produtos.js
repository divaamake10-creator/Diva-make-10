import crypto from "crypto";

const ORIGEM =
    "https://divaamake10-creator.github.io";

function configurarCORS(res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        ORIGEM
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );

   res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
);
}

function verificarToken(token) {

    if (!token) {
        return false;
    }

    const partes = token.split(".");

    if (partes.length !== 2) {
        return false;
    }

    const [tempo, assinatura] = partes;

    const tempoNumero = Number(tempo);

    if (!Number.isFinite(tempoNumero)) {
        return false;
    }

    if (
        Date.now() - tempoNumero > 8 * 60 * 60 * 1000 ||
        tempoNumero > Date.now()
    ) {
        return false;
    }

    const senha =
        process.env.ADMIN_PASSWORD;

    if (!senha) {
        return false;
    }

    const assinaturaEsperada =
        crypto
            .createHmac("sha256", senha)
            .update(tempo)
            .digest("hex");

    return assinatura === assinaturaEsperada;
}

async function supabaseRequest(
    caminho,
    opcoes = {}
) {

    const url =
        process.env.SUPABASE_URL;

    const chave =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !chave) {
        throw new Error(
            "Configuração do Supabase ausente"
        );
    }

    return fetch(
        `${url}/rest/v1/${caminho}`,
        {
            ...opcoes,

            headers: {
                "Content-Type":
                    "application/json",

                "apikey":
                    chave,

                "Authorization":
                    `Bearer ${chave}`,

                "Prefer":
                    "return=representation",

                ...(opcoes.headers || {})
            }
        }
    );
}

export default async function handler(req, res) {

    configurarCORS(res);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {

        const token =
            req.headers.authorization
                ?.replace("Bearer ", "");

        if (!verificarToken(token)) {

            return res.status(401).json({
                error:
                    "Acesso não autorizado"
            });
        }

        /*
         * LISTAR PRODUTOS
         */

        if (req.method === "GET") {

            const resposta =
                await supabaseRequest(
                    "produtos?select=*&order=id.desc"
                );

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                return res.status(
                    resposta.status
                ).json({
                    error:
                        "Erro ao buscar produtos",
                    detalhes: dados
                });
            }

            return res.status(200).json(
                dados
            );
        }

        /*
         * ADICIONAR PRODUTO
         */

        if (req.method === "POST") {

            const {
                nome,
                preco,
                imagem,
                categoria,
                subcategoria,
                ativo
            } = req.body || {};

            if (
                !nome ||
                preco === undefined ||
                !categoria
            ) {

                return res.status(400).json({
                    error:
                        "Nome, preço e categoria são obrigatórios"
                });
            }

            const resposta =
                await supabaseRequest(
                    "produtos",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            nome,
                            preco: Number(preco),
                            imagem:
                                imagem || null,
                            categoria,
                            subcategoria:
                                subcategoria || null,
                            ativo:
                                ativo !== false
                        })
                    }
                );

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                return res.status(
                    resposta.status
                ).json({
                    error:
                        "Erro ao adicionar produto",
                    detalhes: dados
                });
            }

            return res.status(201).json(
                dados[0]
            );
        }

        /*
         * EDITAR PRODUTO
         */

        if (req.method === "PUT") {

            const {
                id,
                nome,
                preco,
                imagem,
                categoria,
                subcategoria,
                ativo
            } = req.body || {};

            if (!id) {

                return res.status(400).json({
                    error:
                        "ID do produto não informado"
                });
            }

            const atualizacao = {};

            if (nome !== undefined)
                atualizacao.nome = nome;

            if (preco !== undefined)
                atualizacao.preco = Number(preco);

            if (imagem !== undefined)
                atualizacao.imagem = imagem;

            if (categoria !== undefined)
                atualizacao.categoria =
                    categoria;

            if (subcategoria !== undefined)
                atualizacao.subcategoria =
                    subcategoria;

            if (ativo !== undefined)
                atualizacao.ativo = Boolean(ativo);

            atualizacao.atualizado_em =
                new Date().toISOString();

            const resposta =
                await supabaseRequest(
                    `produtos?id=eq.${encodeURIComponent(id)}`,
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify(
                                atualizacao
                            )
                    }
                );

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                return res.status(
                    resposta.status
                ).json({
                    error:
                        "Erro ao editar produto",
                    detalhes: dados
                });
            }

            return res.status(200).json(
                dados[0] || {}
            );
        }

        /*
         * EXCLUIR PRODUTO
         */

        if (req.method === "DELETE") {

            const id =
                req.body?.id;

            if (!id) {

                return res.status(400).json({
                    error:
                        "ID do produto não informado"
                });
            }

            const resposta =
                await supabaseRequest(
                    `produtos?id=eq.${encodeURIComponent(id)}`,
                    {
                        method: "DELETE"
                    }
                );

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                return res.status(
                    resposta.status
                ).json({
                    error:
                        "Erro ao excluir produto",
                    detalhes: dados
                });
            }

            return res.status(200).json({
                sucesso: true,
                produto: dados[0] || null
            });
        }

        return res.status(405).json({
            error:
                "Método não permitido"
        });

    } catch (erro) {

        console.error(
            "ERRO ADMIN PRODUTOS:",
            erro
        );

        return res.status(500).json({
            error:
                "Erro interno no servidor"
        });
    }
}
