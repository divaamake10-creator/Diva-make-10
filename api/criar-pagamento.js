export default async function handler(req, res) {

    const origemPermitida = "https://divaamake10-creator.github.io";

    res.setHeader("Access-Control-Allow-Origin", origemPermitida);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const { carrinho, cliente } = req.body;

        if (!Array.isArray(carrinho) || carrinho.length === 0) {
            return res.status(400).json({
                erro: "Carrinho vazio"
            });
        }

        const total = carrinho.reduce((soma, produto) => {

            const quantidade = Number(produto.quantidade);

            if (
                !produto.nome ||
                !Number.isInteger(quantidade) ||
                quantidade < 1
            ) {
                throw new Error("Produto inválido");
            }

            return soma + (10 * quantidade);

        }, 0);

        const itens = carrinho.map(produto => ({
            title: produto.nome,
            quantity: Number(produto.quantidade),
            unit_price: "10.00"
        }));

        const idempotencyKey = crypto.randomUUID();

        const resposta = await fetch(
            "https://api.mercadopago.com/v1/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                    "X-Idempotency-Key": idempotencyKey
                },

                body: JSON.stringify({

                    type: "online",

                    total_amount: total.toFixed(2),

                    external_reference: `DIVA-${Date.now()}`,

                    processing_mode: "manual",

                    capture_mode: "automatic_async",

                    payer: {
                        email: cliente?.email || "cliente@testuser.com",
                        first_name: cliente?.nome || "Cliente"
                    },

                    config: {
                        online: {

                            success_url:
                                "https://divaamake10-creator.github.io/Diva-make-10/pagamento-aprovado.html",

                            failure_url:
                                "https://divaamake10-creator.github.io/Diva-make-10/pagamento-recusado.html",

                            pending_url:
                                "https://divaamake10-creator.github.io/Diva-make-10/pagamento-pendente.html",

                            auto_return: "approved"
                        }
                    },

                    items: itens,

                    description: "Pedido Diva Make 10"
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {

            console.error("Mercado Pago:", dados);

            return res.status(resposta.status).json({
                erro: "Não foi possível criar o pagamento.",
                detalhes: dados
            });
        }

        return res.status(200).json({
            checkout_url: dados.checkout_url,
            order_id: dados.id
        });

    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno ao criar pagamento."
        });
    }
}
