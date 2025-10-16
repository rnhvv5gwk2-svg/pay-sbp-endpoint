import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET;

app.get("/api/pay-sbp", async (req, res) => {
  const { amount, order } = req.query;

  if (!amount || !order) {
    return res.status(400).send("Нужно указать параметры ?amount= и ?order=");
  }

  try {
    const idempotenceKey = uuidv4();

    const response = await axios.post(
      "https://api.yookassa.ru/v3/payments",
      {
        amount: {
          value: amount,
          currency: "RUB"
        },
        confirmation: {
          type: "redirect",
          locale: "ru_RU",
          return_url: `https://koskalinin.ru/spasibo?order=${order}`
        },
        capture: true,
        description: `Оплата заказа №${order} через СБП`
      },
      {
        auth: {
          username: SHOP_ID,
          password: SECRET_KEY
        },
        headers: {
          "Idempotence-Key": idempotenceKey
        }
      }
    );

    const payment = response.data;
    res.redirect(payment.confirmation.confirmation_url);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: "Ошибка создания платежа" });
  }
});

app.listen(PORT, () => console.log(`✅ Сервер запущен на порту ${PORT}`));
