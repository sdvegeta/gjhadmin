<script setup lang="ts">
const props = defineProps<{
  batch: any
}>()
</script>

<template>
  <div class="bg-gray-50 rounded-[12px] p-4 border border-gray-100 relative overflow-hidden flex items-center justify-between opacity-80">
    <!-- 头部信息 -->
    <div class="flex items-center">
      <span class="w-1.5 h-4 bg-gray-300 rounded-sm mr-2"></span>
      <h2 class="text-[15px] font-bold text-gray-400">{{ batch.batchName }}</h2>
      <span class="ml-2 text-[10px] text-gray-400 border border-gray-200 px-1 py-0.5 rounded">未开始</span>
    </div>

    <!-- 简易数字预览 -->
    <div class="text-right flex items-center pr-2">
      <div class="flex flex-col text-right">
        <span class="text-[11px] text-gray-400 mb-0.5">已下单量</span>
        <span class="text-[16px] font-bold text-gray-500">{{ batch.totalCount }}<span class="text-[10px] font-normal ml-0.5">单</span></span>
      </div>
    </div>
  </div>
</template>
