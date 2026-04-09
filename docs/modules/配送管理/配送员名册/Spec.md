# 配送管理 - 配送员名册 Spec

> 版本：V0.1  
> 日期：2026-04-09

## 1. 数据对象

1. `delivery_staff`

## 2. 接口

1. `GET /api/admin/delivery/staff`
2. `POST /api/admin/delivery/staff`
3. `PATCH /api/admin/delivery/staff/{staffId}/roles`
4. `PATCH /api/admin/delivery/staff/{staffId}/status`

## 3. 前端行为

1. 手机号格式前端即时校验。
2. 重复手机号阻断，已停用账号可弹窗唤醒复用。
3. 角色配置至少保留一个角色。
