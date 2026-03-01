<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const warningType = route.query.type as string

const listData = ref<any[]>([])
const isLoading = ref(true)

// 系统已有配置抽取出来的真实中国姓名种子
const seedNames = ['李海', '王青', '陈涛', '赵斌', '刘鹏', '周凯', '马骁', '孙宁', '高远', '胡峰']

// 顶部标题的智能映射
const pageTitle = computed(() => {
  if (warningType === 'KITCHEN_DELAY') return '出单超时'
  if (warningType === 'NO_RIDER_ACCEPT') return '待接单超时'
  if (warningType === 'HUB_STAY') return '在集散地滞留超时'
  if (warningType === 'DELIVERY_TIMEOUT') return '送展位超时'
  return '履约异常堵点'
})

// 模拟不同预警类型的下钻数据 (针对性字段)
const fetchDetail = () => {
  isLoading.value = true
  setTimeout(() => {
    if (warningType === 'KITCHEN_DELAY') {
      listData.value = [
         { merchantName: '点都德(A区店)', pendingCount: 35, maxDelayMins: 45 },
         { merchantName: '肯德基', pendingCount: 15, maxDelayMins: 38 }
      ]
    } else if (warningType === 'NO_RIDER_ACCEPT') {
      listData.value = [
        { merchantName: '真功夫(A区店)', pendingCount: 15, lastAcceptMinsAgo: 45 },
        { merchantName: '麦当劳', pendingCount: 8, lastAcceptMinsAgo: 30 }
      ]
    } else if (warningType === 'HUB_STAY') {
      listData.value = [
         { hallName: 'A区 1.1馆', pendingCount: 25, maxDelayMins: 45 },
         { hallName: 'B区 9.0馆', pendingCount: 12, maxDelayMins: 38 }
      ]
    } else {
      listData.value = [
         { 
           courierName: seedNames[2], courierPhone: '13800138000', hallName: 'C区 14.1馆', 
           units: [
             { booth: '14.1 D18-19', bags: 5, portions: 20, delayMins: 25 },
             { booth: '14.1 D22', bags: 2, portions: 8, delayMins: 21 }
           ]
         },
         { 
           courierName: seedNames[5], courierPhone: '13912345678', hallName: 'A区 8.0馆', 
           units: [
             { booth: '8.0 A05', bags: 12, portions: 45, delayMins: 38 }
           ]
         }
      ]
    }
    isLoading.value = false
  }, 500)
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col pb-safe">
    <!-- 顶部导航 -->
    <div class="h-12 bg-white flex items-center px-4 relative border-b border-gray-100 shrink-0">
      <button @click="router.back()" class="p-2 -ml-2 text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 class="font-bold text-[16px] text-gray-800 absolute left-1/2 -translate-x-1/2">堵点详情明细</h1>
    </div>

    <!-- 预警类型头 -->
    <div class="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center justify-between shadow-sm shrink-0">
      <div class="flex items-center">
        <svg class="w-4 h-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span class="text-sm font-bold text-red-600">{{ pageTitle }}</span>
      </div>
    </div>

    <!-- 主体列表 -->
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div v-if="isLoading" class="text-center py-10 text-gray-400 text-sm flex flex-col items-center">
         <div class="w-6 h-6 rounded-full border-[2.5px] border-gray-300 border-t-gray-400 animate-spin mb-3"></div>
         数据排查中...
      </div>
      
      <div v-else class="space-y-3 pb-8">
         <!-- P1: 出单超时 -->
         <template v-if="warningType === 'KITCHEN_DELAY'">
           <div v-for="(item, idx) in listData" :key="idx" class="bg-white p-4 rounded-xl shadow-sm border border-red-50 relative">
              <div class="flex justify-between items-center mb-3">
                 <span class="font-bold text-gray-800 text-[15px]">{{ item.merchantName }}</span>
                 <span class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-medium">出单严重卡顿</span>
              </div>
              <div class="flex justify-between mt-2">
                 <div class="flex flex-col">
                    <span class="text-[11px] text-gray-500 mb-0.5">未出单量</span>
                    <span class="font-bold text-gray-800 text-[18px]">{{ item.pendingCount }}<span class="text-[10px] font-normal ml-0.5 text-gray-500">单</span></span>
                 </div>
                 <div class="flex flex-col text-right">
                    <span class="text-[11px] text-gray-500 mb-0.5">最高卡单时间</span>
                    <span class="font-bold text-red-500 text-[18px]">{{ item.maxDelayMins }}<span class="text-[10px] font-normal ml-0.5 text-red-400">分钟</span></span>
                 </div>
              </div>
           </div>
         </template>

         <!-- P2: 待接单超时 -->
         <template v-else-if="warningType === 'NO_RIDER_ACCEPT'">
           <div v-for="(item, idx) in listData" :key="idx" class="bg-white p-4 rounded-xl shadow-sm border border-orange-50 relative">
              <div class="flex justify-between items-center mb-3">
                 <span class="font-bold text-gray-800 text-[15px]">{{ item.merchantName }}</span>
                 <span class="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 font-medium">运力池断层</span>
              </div>
              <div class="flex justify-between mt-2">
                 <div class="flex flex-col">
                    <span class="text-[11px] text-gray-500 mb-0.5">积压待接单</span>
                    <span class="font-bold text-gray-800 text-[18px]">{{ item.pendingCount }}<span class="text-[10px] font-normal ml-0.5 text-gray-500">单</span></span>
                 </div>
                 <div class="flex flex-col text-right">
                    <span class="text-[11px] text-gray-500 mb-0.5">距末次接单已</span>
                    <span class="font-bold text-orange-500 text-[18px]">{{ item.lastAcceptMinsAgo }}<span class="text-[10px] font-normal ml-0.5 text-orange-400">分钟</span></span>
                 </div>
              </div>
           </div>
         </template>

         <!-- P3: 在集散地滞留超时 -->
         <template v-else-if="warningType === 'HUB_STAY'">
           <div v-for="(item, idx) in listData" :key="idx" class="bg-white p-4 rounded-xl shadow-sm border border-purple-50 relative">
              <div class="flex justify-between items-center mb-3">
                 <div class="flex items-center gap-2">
                    <span class="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 font-medium">发往</span>
                    <span class="font-bold text-gray-800 text-[15px] truncate max-w-[150px]">{{ item.hallName }}</span>
                 </div>
                 <span class="text-[10px] text-purple-500 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-medium shrink-0">分拣瓶颈</span>
              </div>
              <div class="flex justify-between mt-2">
                 <div class="flex flex-col">
                    <span class="text-[11px] text-gray-500 mb-0.5">场地滞留总计</span>
                    <span class="font-bold text-gray-800 text-[18px]">{{ item.pendingCount }}<span class="text-[10px] font-normal ml-0.5 text-gray-500">单</span></span>
                 </div>
                 <div class="flex flex-col text-right">
                    <span class="text-[11px] text-gray-500 mb-0.5">最长滞留时间</span>
                    <span class="font-bold text-purple-500 text-[18px]">{{ item.maxDelayMins }}<span class="text-[10px] font-normal ml-0.5 text-purple-400">分钟</span></span>
                 </div>
              </div>
           </div>
         </template>

         <!-- P4: 送展位超时 -->
         <template v-else>
           <div v-for="(item, idx) in listData" :key="idx" class="bg-white p-4 rounded-xl shadow-sm border border-rose-50 relative space-y-3">
              <!-- 头部人物及定位信息 -->
              <div class="flex justify-between items-center">
                 <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-800 text-[15px]">{{ item.courierName }}</span>
                    <span class="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">往 {{ item.hallName }}</span>
                 </div>
                 <div class="flex items-center text-right">
                    <a :href="`tel:${item.courierPhone}`" class="flex items-center bg-rose-50 hover:bg-rose-100 rounded-full px-2.5 py-1.5 transition-colors border border-rose-100 text-rose-600">
                      <svg class="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                      <span class="text-[13px] font-bold">{{ item.courierPhone }}</span>
                    </a>
                 </div>
              </div>

              <!-- 配送单元细节列表 -->
              <div class="bg-gray-50 rounded-lg p-2.5 space-y-2">
                 <div v-for="(unit, uIdx) in item.units" :key="uIdx" class="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100">
                    <div class="flex items-center gap-2">
                       <span class="font-bold text-gray-700 text-[13px]">{{ unit.booth }}</span>
                       <span class="text-[11px] text-gray-500 font-medium">{{ unit.bags }}袋 | {{ unit.portions }}份</span>
                    </div>
                    <span class="text-[12px] text-rose-500 font-medium">已滞留{{ unit.delayMins }}分钟</span>
                 </div>
              </div>
           </div>
         </template>
      </div>
    </div>
  </div>
</template>
