<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(true)

// Mock Data
const staffList = ref<any>({
  couriers: [],
  signers: []
})

const fetchIdleStaff = () => {
  isLoading.value = true
  setTimeout(() => {
    staffList.value = {
       couriers: [
         { name: '王师傅', phone: '13812345678', lastTime: '10:45' },
         { name: '刘小弟', phone: '13987654321', lastTime: '10:30' },
         { name: '张大哥', phone: '13611112222', lastTime: '10:15' }
       ],
       signers: [
         { name: '陈阿姨', phone: '13700000000', lastTime: '09:15' },
         { name: '李大姐', phone: '13599998888', lastTime: '08:50' }
       ]
    }
    isLoading.value = false
  }, 400)
}

onMounted(() => {
  fetchIdleStaff()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col pb-safe">
    <!-- 顶部导航 -->
    <div class="h-12 bg-white flex items-center px-4 relative border-b border-gray-100 shrink-0">
      <button @click="router.back()" class="p-2 -ml-2 text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 class="font-bold text-[16px] text-gray-800 absolute left-1/2 -translate-x-1/2">空闲运力明细</h1>
    </div>

    <!-- 主体列表 -->
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4 styled-scroll">
      <div v-if="isLoading" class="text-center py-10 text-gray-400 text-sm flex flex-col items-center">
         <div class="w-6 h-6 rounded-full border-[2.5px] border-gray-300 border-t-[#FF6600] animate-spin mb-3"></div>
         数据排查中...
      </div>
      
      <div v-else class="space-y-6 pb-8">
        <!-- 配送员分组 -->
        <div v-if="staffList.couriers.length > 0">
          <h2 class="text-[13px] font-bold text-gray-500 mb-3 ml-1">配送员 ({{ staffList.couriers.length }}人)</h2>
          <div class="space-y-3">
             <div v-for="(item, idx) in staffList.couriers" :key="'c'+idx" class="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div class="flex flex-col">
                   <div class="flex items-center gap-2 mb-1">
                     <span class="font-bold text-gray-800 text-[15px]">{{ item.name }}</span>
                     <span class="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">配送员</span>
                   </div>
                   <span class="text-[11px] text-gray-500">最后活动: {{ item.lastTime }}</span>
                </div>
                <a :href="`tel:${item.phone}`" class="flex items-center bg-gray-50 hover:bg-gray-100 rounded-full px-2.5 py-1.5 transition-colors border border-gray-200 text-gray-700">
                  <svg class="w-3.5 h-3.5 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                  <span class="text-[13px] font-bold font-mono">{{ item.phone }}</span>
                </a>
             </div>
          </div>
        </div>

        <!-- 分拣签收员分组 -->
        <div v-if="staffList.signers.length > 0">
          <h2 class="text-[13px] font-bold text-gray-500 mb-3 ml-1">分拣签收员 ({{ staffList.signers.length }}人)</h2>
          <div class="space-y-3">
             <div v-for="(item, idx) in staffList.signers" :key="'s'+idx" class="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div class="flex flex-col">
                   <div class="flex items-center gap-2 mb-1">
                     <span class="font-bold text-gray-800 text-[15px]">{{ item.name }}</span>
                     <span class="text-[10px] bg-[#FF6600]/10 text-[#FF6600] px-1.5 py-0.5 rounded border border-[#FF6600]/20">分拣员</span>
                   </div>
                   <span class="text-[11px] text-gray-500">最后活动: {{ item.lastTime }}</span>
                </div>
                <a :href="`tel:${item.phone}`" class="flex items-center bg-gray-50 hover:bg-gray-100 rounded-full px-2.5 py-1.5 transition-colors border border-gray-200 text-gray-700">
                  <svg class="w-3.5 h-3.5 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                  <span class="text-[13px] font-bold font-mono">{{ item.phone }}</span>
                </a>
             </div>
          </div>
        </div>
        
        <div v-if="staffList.couriers.length === 0 && staffList.signers.length === 0" class="text-center py-10 text-gray-400 text-sm bg-white rounded-xl shadow-sm border border-gray-100">
           当前无任何空闲运力
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.styled-scroll::-webkit-scrollbar {
  width: 4px;
}
.styled-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.styled-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
</style>
