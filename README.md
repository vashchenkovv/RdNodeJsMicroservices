# Запуск сервисов

``` npm run start:payments ```

``` npm run start:orders ```

## Тест с помощью Postman

Путь к конфигу postam

    \postman\collections\New Collection.postman_collection.json

+ Pay Order - Запрос для оплата ордера
+ Get payment status - Запрос чтобы получить статус ордера
+ Simulate Unavailable Once - Запрос который эмулирует недоступность сервиса

## Роуты и параметры для тестирования с помощью других инструментов

### Pay Order

Rout

``` POST: http://localhost:3021/orders/8d71ab32-e416-4589-b809-366563b0dc5c/pay ```

Payload

```
{
    "userId": "2dd3624a-e593-4d3b-a3f7-b6ede358e6e9",
    "amount": 100,
    "currency": "USD",
    "idempotencyKey": "1111"
}
```

### Get payment status

``` GET:http://localhost:3021/orders/payments/{{payment_id}}/status ```

    *payment_id взять с ответа от предыдущего запроса

### Simulate Unavailable Once

``` POST: http://localhost:3021/orders/a38c22a8-1173-4493-9025-d8b435a3ce55/pay ```

Payload

```
{
    "userId": "2dd3624a-e593-4d3b-a3f7-b6ede358e6e9",
    "amount": 200,
    "currency": "USD",
    "idempotencyKey": "222",
    "simulateUnavailableOnce": true
}
```

## proto 

Файл proto лежит в папке

    proto\payments.proto

Для orders service proto файл подключится в модуле OrdersModule в разделе imports (src\orders-service\orders.module.ts)

Для payments service proto файл подключается в разделе bootstrap при инициализации приложения (src\payments-service\main.ts)
