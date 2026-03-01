<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import 'github-markdown-css/github-markdown.css'

const props = defineProps({
  title: {
    type: String,
    default: '页面文档'
  },
  docs: {
    type: Object,
    required: true
  }
})

const drawerVisible = ref(false)
const activeTab = ref('prd')
const htmlContent = ref('')
const contentRef = ref(null)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose'
})

const tabs = computed(() => [
  { key: 'prd', label: 'PRD', raw: props.docs.prd || '' },
  { key: 'spec', label: 'Spec', raw: props.docs.spec || '' },
  { key: 'ia', label: 'IA', raw: props.docs.ia || '' }
].filter((item) => item.raw))

const renderMermaid = async () => {
  if (!contentRef.value) return
  const blocks = contentRef.value.querySelectorAll('code.language-mermaid, code.mermaid, pre.language-mermaid code')

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    if (block.dataset.processed) continue

    const definition = block.textContent
    const container = block.parentElement?.tagName?.toLowerCase() === 'pre' ? block.parentElement : block

    try {
      const id = `doc-mermaid-${Date.now()}-${i}`
      const { svg } = await mermaid.render(id, definition)
      const wrapper = document.createElement('div')
      wrapper.className = 'mermaid-wrapper'
      wrapper.innerHTML = svg
      container.replaceWith(wrapper)
      block.dataset.processed = '1'
    } catch (error) {
      container.innerHTML = `<pre style="color:#dc2626;">Mermaid 渲染失败\n${definition}</pre>`
    }
  }
}

const renderCurrentDoc = async () => {
  const current = tabs.value.find((item) => item.key === activeTab.value)
  htmlContent.value = md.render(current?.raw || '')
  await nextTick()
  await renderMermaid()
}

const openViewer = async () => {
  drawerVisible.value = true
  await renderCurrentDoc()
}

watch(activeTab, async () => {
  if (!drawerVisible.value) return
  await renderCurrentDoc()
})

watch(drawerVisible, async (visible) => {
  if (!visible) return
  if (!tabs.value.find((item) => item.key === activeTab.value)) {
    activeTab.value = tabs.value[0]?.key || 'prd'
  }
  await renderCurrentDoc()
})
</script>

<template>
  <div>
    <div
      class="fixed bottom-6 right-6 z-[2000] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[var(--admin-primary)] text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110"
      title="查看本页PRD/Spec/IA"
      @click="openViewer"
    >
      <el-icon class="text-xl"><Document /></el-icon>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="`${title} · 文档中心`"
      direction="rtl"
      size="78%"
      class="doc-drawer"
    >
      <el-tabs v-model="activeTab" class="mb-4">
        <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key" />
      </el-tabs>

      <div ref="contentRef" class="markdown-body rounded-xl border border-slate-200 bg-white p-6" v-html="htmlContent" />
    </el-drawer>
  </div>
</template>

<style>
.doc-drawer .el-drawer__body {
  background: #f5f7fb;
}

.markdown-body .mermaid-wrapper {
  margin: 16px 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  overflow: auto;
}
</style>
