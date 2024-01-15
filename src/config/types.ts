export interface SubscriptionUpdateRequest {
    SubscriptionId: string; // Уникальный идентификатор подписки
    out_summ: string; // Сумма платежа (устаревший формат)
    OutSum: string; // Сумма платежа
    inv_id: string; // Номер счета/инвойса (устаревший формат)
    InvId: string; // Номер счета/инвойса
    crc: string; // Контрольная сумма платежа (хеш, устаревший формат)
    SignatureValue: string; // Контрольная сумма платежа (хеш)
    PaymentMethod: string; // Способ оплаты
    IncSum: string; // Сумма платежа, полученная платежной системой
    IncCurrLabel: string; // Метка валюты платежа
    IsTest: string; // Флаг тестового режима ('0' для реального, '1' для тестового)
    EMail: string; // Электронная почта пользователя
    Fee: string; // Комиссия за транзакцию
  }
  