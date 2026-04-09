# 配送管理 - 配送员主责配置 Spec

> 版本：V0.1  
> 日期：2026-04-09

## 1. 数据对象

1. `delivery_staff`
2. `staff_scope`
3. `merchant`

## 2. 接口

1. `GET /api/admin/delivery/staff-scopes`
2. `POST /api/admin/delivery/staff-scopes/batch-upsert`

## 3. 前端行为

1. 批量配置前必须先勾选人员。
2. 展厅点位与责任商家提交均为全量覆盖。
3. 配置后列表立即回显最新结果。
