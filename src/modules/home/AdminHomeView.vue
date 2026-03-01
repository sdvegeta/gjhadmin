<script setup>
import { Grid, DataAnalysis, Cellphone } from '@element-plus/icons-vue'

const navCards = [
  {
    key: 'delivery-management',
    title: '配送管理页',
    desc: '配置点位商家、配送员账号和主责范围',
    icon: Grid,
    path: '/delivery-management'
  },
  {
    key: 'delivery-stats',
    title: '配送统计页',
    desc: '查看实时履约进度、状态分布和异常单',
    icon: DataAnalysis,
    path: '/delivery-stats'
  },
  {
    key: 'mp-dashboard',
    title: '小程序管理看板',
    desc: '前端移动端界面，快速查看区域实时卡点 (橙色主题)',
    icon: Cellphone,
    path: '/mp-preview/dashboard'
  }
]

const handleGo = (path) => {
  const href = `${window.location.origin}${window.location.pathname}#${path}`
  window.open(href, '_blank', 'noopener')
}
</script>

<template>
  <div class="min-h-screen px-4 py-8 md:px-8 lg:px-12">
    <div class="mx-auto max-w-6xl space-y-6">
      <div class="panel-shell rounded-3xl px-6 py-8 md:px-10 md:py-10">
        <div class="inline-flex rounded-full bg-[var(--admin-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--admin-primary)]">
          Prototype Portal
        </div>
        <h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">运营后台原型导航</h1>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          当前提供三个独立页面入口：后台配送管理页、后台配送统计页、小程序管理看板。点击入口后将新开浏览器标签页。
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <el-card
          v-for="item in navCards"
          :key="item.key"
          shadow="never"
          class="group !overflow-hidden !rounded-2xl !border !border-slate-200/80"
        >
          <div class="h-full bg-white p-6 transition duration-200 group-hover:bg-slate-50">
            <div class="flex items-start justify-between">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]">
                <el-icon class="text-2xl"><component :is="item.icon" /></el-icon>
              </div>
              <el-button
                type="primary"
                class="!rounded-lg !px-4"
                @click="handleGo(item.path)"
              >
                进入页面
              </el-button>
            </div>
            <h2 class="mt-8 text-2xl font-semibold text-slate-900">{{ item.title }}</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.desc }}</p>
            <div class="mt-8 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-500">
              点击后进入独立全屏原型页
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>
