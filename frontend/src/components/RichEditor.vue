<template>
  <div class="rich-editor">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import tinymce from 'tinymce/tinymce'
import 'tinymce/icons/default'
import 'tinymce/themes/silver'
import 'tinymce/models/dom'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/table'
import 'tinymce/plugins/code'
import 'tinymce/plugins/wordcount'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/media'
import 'tinymce/plugins/emoticons'
import 'tinymce/plugins/emoticons/js/emojis'

// 定义组件属性
interface Props {
  modelValue?: string
  placeholder?: string
  height?: number | string
  menubar?: boolean
  toolbar?: string | false
  plugins?: string
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
}

// 定义组件事件
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'focus', event: Event): void
  (e: 'blur', event: Event): void
}

// 定义组件属性默认值
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  height: 400,
  menubar: false,
  toolbar: 'undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | removeformat | code | fullscreen',
  plugins: 'lists link image table code wordcount preview fullscreen media emoticons',
  disabled: false,
  readonly: false
})

// 定义组件事件
const emit = defineEmits<Emits>()

// 引用
const editorContainer = ref<HTMLElement>()
let editor: any = null

// 监听值变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getContent()) {
    editor.setContent(newValue)
  }
})

// 监听禁用状态变化
watch(() => props.disabled, (newValue) => {
  if (editor) {
    editor.setMode(newValue ? 'readonly' : 'design')
  }
})

// 监听只读状态变化
watch(() => props.readonly, (newValue) => {
  if (editor) {
    editor.setMode(newValue ? 'readonly' : 'design')
  }
})

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value) return

  tinymce.init({
    target: editorContainer.value,
    height: props.height,
    menubar: props.menubar,
    toolbar: props.toolbar,
    plugins: props.plugins,
    placeholder: props.placeholder,
    branding: false,
    promotion: false,
    statusbar: true,
    resize: true,
    language: 'zh_CN',
    language_url: '/tinymce/langs/zh_CN.js',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; font-size: 14px }',
    setup: (editor: any) => {
      editor.on('init', () => {
        editor.setContent(props.modelValue)
        
        if (props.disabled || props.readonly) {
          editor.setMode('readonly')
        }
      })
      
      editor.on('change', () => {
        const content = editor.getContent()
        emit('update:modelValue', content)
        emit('change', content)
      })
      
      editor.on('focus', (event: Event) => {
        emit('focus', event)
      })
      
      editor.on('blur', (event: Event) => {
        emit('blur', event)
      })
      
      // 添加字数限制
      if (props.maxLength) {
        editor.on('SetContent', (e: any) => {
          const content = e.content
          const text = editor.getContent({ format: 'text' })
          
          if (text.length > props.maxLength) {
            // 截断超出部分
            const truncatedText = text.substring(0, props.maxLength)
            editor.setContent(truncatedText)
            
            // 显示提示
            editor.notificationManager.open({
              text: `内容长度不能超过 ${props.maxLength} 个字符`,
              type: 'warning',
              timeout: 3000
            })
          }
        })
        
        editor.on('input', (e: any) => {
          const text = editor.getContent({ format: 'text' })
          
          if (text.length > props.maxLength) {
            // 阻止输入
            e.preventDefault()
            
            // 显示提示
            editor.notificationManager.open({
              text: `内容长度不能超过 ${props.maxLength} 个字符`,
              type: 'warning',
              timeout: 3000
            })
          }
        })
      }
    }
  }).then((editors: any[]) => {
    editor = editors[0]
  }).catch((error: any) => {
    console.error('Failed to initialize editor:', error)
  })
}

// 销毁编辑器
const destroyEditor = () => {
  if (editor) {
    tinymce.remove(editor)
    editor = null
  }
}

// 获取编辑器内容
const getContent = () => {
  return editor ? editor.getContent() : ''
}

// 设置编辑器内容
const setContent = (content: string) => {
  if (editor) {
    editor.setContent(content)
  }
}

// 获取纯文本内容
const getText = () => {
  return editor ? editor.getContent({ format: 'text' }) : ''
}

// 聚焦编辑器
const focus = () => {
  if (editor) {
    editor.focus()
  }
}

// 失焦编辑器
const blur = () => {
  if (editor) {
    editor.blur()
  }
}

// 启用编辑器
const enable = () => {
  if (editor) {
    editor.setMode('design')
    editor.setMode('design')
  }
}

// 禁用编辑器
const disable = () => {
  if (editor) {
    editor.setMode('readonly')
  }
}

// 暴露方法
defineExpose({
  getContent,
  setContent,
  getText,
  focus,
  blur,
  enable,
  disable
})

// 组件挂载时初始化编辑器
onMounted(() => {
  initEditor()
})

// 组件卸载前销毁编辑器
onBeforeUnmount(() => {
  destroyEditor()
})
</script>

<style scoped lang="scss">
.rich-editor {
  .editor-container {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    
    &:focus-within {
      border-color: #409eff;
    }
  }
}

// 全局样式，用于调整TinyMCE编辑器样式
:global(.tox-tinymce) {
  border-radius: 4px;
}

:global(.tox .tox-toolbar__primary) {
  background-color: #f5f7fa;
}

:global(.tox .tox-toolbar__overflow) {
  background-color: #f5f7fa;
}

:global(.tox .tox-statusbar) {
  background-color: #f5f7fa;
}
</style>