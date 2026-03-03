# 广交会项目 - 运营后台 信息架构（IA）

> 版本：V0.1  
> 日期：2026-02-28

## 1. 站点地图

```mermaid
flowchart TD
    A["运营后台 Admin"] --> B["配送管理"]
    A --> C["配送统计"]
    A --> D["移动端预览(小程序看板)"]
    B --> B1["点位-商家配置"]
    B --> B2["配送员管理"]
    B --> B3["主责批量配置"]
    B --> B4["主责查询"]
    C --> C1["实时总览"]
    C --> C2["历史筛选统计"]
    C --> C3["状态分布与趋势"]
    C --> C4["异常单明细"]
    D --> D1["四大战区批次瀑布流"]
    D --> D2["堵点下钻明细"]
    D --> D3["空闲运力明细"]
```

## 2. 页面层级

| 层级 | 页面ID | 路由 | 说明 |
|---|---|---|---|
| L1 | admin-shell | `/admin` | 运营后台容器 |
| L2 | delivery-management | `/admin/delivery-management` | 配送管理模块 |
| L2 | delivery-stats | `/admin/delivery-stats` | 配送统计模块 |
| L2 | mp-preview-dashboard | `/admin/mp-preview/dashboard` | 配送小程序_管理看板模块 |
| L3 | mp-preview-warning | `/admin/mp-preview/warning-detail` | 堵点下钻明细页 |
| L3 | mp-preview-idle | `/admin/mp-preview/idle-staff` | 空闲运力明细页 |

## 3. 导航结构

1. 左侧导航：模块切换（配送管理、配送统计）
2. 顶部栏：项目标题、当前时间、角色标签
3. 内容区：PC端图表及配送管理模块主体
4. 移动端/小窗预览区：为管理者随时切入现场看板提供移动端视角的独立路由页（`/mp-preview/*`）
5. 右下角：全局开发文档查看悬浮入口

## 4. 关键任务流

### 4.1 配置任务流

1. 进入配送管理
2. 配置点位商家
3. 新增配送员
4. 配置主责范围
5. 查询验证结果

### 4.2 监控任务流

1. 进入配送统计
2. 设置筛选条件
3. 查看实时指标与状态分布
4. 定位异常单并导出

## 5. 信息对象

1. `LocationTree`
2. `Merchant`
3. `DeliveryStaff`
4. `StaffScope`
5. `DeliveryOrderStat`
6. `DeliveryExceptionItem`

## 6. IA 冻结标准

1. 所有子模块页面清单与入口已固定。
2. PC 端及小程序的各核心流转任务可串联形成闭环。
3. 公共筛选器、角色权限与字典体系均以 Admin 环境为同一标准基调输出。
