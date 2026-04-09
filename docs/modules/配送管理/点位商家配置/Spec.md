# 配送管理 - 点位商家配置 Spec

> 版本：V0.1  
> 日期：2026-04-09

## 1. 数据对象

1. `point_merchant_map`
2. `merchant`
3. `location_tree`

## 2. 接口

1. `GET /api/admin/delivery/point-merchant-maps`
2. `POST /api/admin/delivery/point-merchant-maps/batch-upsert`

## 3. 前端行为

1. 商家池支持关键词搜索。
2. 保存前做重复映射拦截。
3. 保存成功后列表即时更新。
