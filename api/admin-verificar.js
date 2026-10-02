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

        const { token } = req.body || {};

        if (!token) {
            return res.status(401).json({
                autorizado: false
            });
        }

        const partes = token.split(".");

        if (partes.length !== 2) {
            return res.status(401).json({
                autorizado: false
            });
        }

        const [tempo, assinatura] = partes;

        const tempoNumero = Number(tempo);

        if (
            !Number.isFinite(tempoNumero) ||
            Date.now() - tempoNumero > 8 * 60 * 60 * 1000
        ) {
            return res.status(401).json({
                autorizado: false
            });
        }

        const senha =
            process.env.ADMIN_PASSWORD;

        if (!senha) {
            return res.status(500).json({
                error: "Configuração ausente"
            });
        }

        const assinaturaEsperada =
            crypto
                .createHmac("sha256", senha)
                .update(tempo)
                .digest("hex");

        if (assinatura !== assinaturaEsperada) {
            return res.status(401).json({
                autorizado: false
            });
        }

        return res.status(200).json({
            autorizado: true
        });

    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            error: "Erro interno"
        });
    }
}
