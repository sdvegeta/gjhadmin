# 配送管理 - 订单实时监控 Spec

> 版本：V0.1  
> 日期：2026-04-09  
> 技术基座：Vue3 + Element Plus + Tailwind CSS

## 1. 数据字段

| 字段 | 类型 | 说明 |
|---|---|---|
| areaCode | string | 展区编码 |
| merchantId | string | 商家 ID |
| merchantName | string | 商家名称 |
| cutoffSlot | enum | `CUTOFF_0900/CUTOFF_1000/CUTOFF_1030/CUTOFF_1100/INSTANT` |
| orderCount | number | 订单数 |
| portionCount | number | 餐品份数 |
| refreshedAt | datetime | 最新刷新时间 |

## 2. 接口

`GET /api/admin/delivery/order-monitor?date=today`

业务口径：
1. 本页面统计的是用户下单后形成的购物车订单。
2. 用户在同一商家中，购物车提交并支付成功一次，记为 1 个购物车订单。
3. 每个购物车订单按所属截单时段归入对应餐段统计。
4. 已取消订单不计入。

## 3. 前端规则

1. 当前高亮列由“当前开放餐段”决定，不直接按自然时间顺推。
2. 未开放餐段统一展示为 0。
3. 已切走餐段仅保留沉淀量。
4. 与上次刷新相比变化的数字标红。
5. 自动刷新间隔固定 60 秒。

## 4. 原型态规则

1. 可提供演示时间切换，用于模拟 `08:50 / 09:20 / 10:05 / 10:40 / 11:10`。
2. 演示时间控件仅用于原型验证，不作为正式业务功能。
