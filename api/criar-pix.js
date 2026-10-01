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

    const { total, cliente } = req.body;

    if (!total || Number(total) <= 0) {
      return res.status(400).json({
        error: "Valor inválido"
      });
    }

    const idempotencyKey = crypto.randomUUID();

    const resposta = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          "X-Idempotency-Key": idempotencyKey
        },

        body: JSON.stringify({

          transaction_amount: Number(total),

          description: "Pedido Diva Make 10",

          payment_method_id: "pix",

          payer: {
            email: cliente?.email || "cliente@divamake10.com",
            first_name: cliente?.nome || "Cliente"
          }

        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {

      console.error("Mercado Pago:", dados);

      return res.status(resposta.status).json({
        error: "Não foi possível criar o Pix",
        detalhes: dados
      });

    }

    return res.status(200).json({

      payment_id: dados.id,

      status: dados.status,

      qr_code:
        dados.point_of_interaction
          ?.transaction_data
          ?.qr_code,

      qr_code_base64:
        dados.point_of_interaction
          ?.transaction_data
          ?.qr_code_base64

    });

  } catch (erro) {

    console.error(erro);

    return res.status(500).json({
      error: "Erro interno ao criar Pix"
    });

  }

}
