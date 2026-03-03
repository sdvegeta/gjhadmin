import { createRouter, createWebHashHistory } from 'vue-router'
import AdminHomeView from '@/modules/home/AdminHomeView.vue'
import DeliveryManagementView from '@/modules/delivery-management/DeliveryManagementView.vue'
import DeliveryStatsView from '@/modules/delivery-stats/DeliveryStatsView.vue'

const routes = [
  {
    path: '/',
    name: 'admin-home',
    component: AdminHomeView,
    meta: {
      title: '原型导航'
    }
  },
  {
    path: '/delivery-management',
    name: 'delivery-management',
    component: DeliveryManagementView,
    meta: {
      title: '配送管理'
    }
  },
  {
    path: '/delivery-stats',
    name: 'delivery-stats',
    component: DeliveryStatsView,
    meta: {
      title: '配送统计'
    }
  },
  {
    path: '/mp-preview/dashboard',
    name: 'mp-dashboard-preview',
    component: () => import('@/views/mp-preview/DeliveryDashboard.vue'),
    meta: { title: '配送管理看板(小程序)' }
  },
  {
    path: '/mp-preview/warning-detail',
    name: 'mp-warning-detail-preview',
    component: () => import('@/views/mp-preview/WarningDetail.vue'),
    meta: { title: '堵点下钻明细' }
  },
  {
    path: '/mp-preview/idle-staff',
    name: 'mp-idle-staff',
    component: () => import('@/views/mp-preview/IdleStaffList.vue'),
    meta: { title: '空闲运力明细' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
