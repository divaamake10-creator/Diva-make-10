import crypto from "crypto";

export default async function handler(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "https://divaamake10-creator.github.io"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método não permitido"
        });
    }

    try {

        const { senha } = req.body || {};

        if (!senha) {
            return res.status(400).json({
                error: "Senha não informada"
            });
        }

        const senhaCorreta =
            process.env.ADMIN_PASSWORD;

        if (!senhaCorreta) {
            console.error(
                "ADMIN_PASSWORD não configurada"
            );

            return res.status(500).json({
                error: "Configuração do administrador ausente"
            });
        }

        if (senha !== senhaCorreta) {

            return res.status(401).json({
                error: "Senha incorreta"
            });

        }

        const tempo = Date.now().toString();

        const assinatura = crypto
            .createHmac(
                "sha256",
                senhaCorreta
            )
            .update(tempo)
            .digest("hex");

        const token = `${tempo}.${assinatura}`;

        return res.status(200).json({
            sucesso: true,
            token: token
        });

    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            error: "Erro interno"
        });
    }
}
