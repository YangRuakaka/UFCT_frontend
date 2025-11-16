import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/globals.css'

// 抑制 ResizeObserver 循环完成警告
const originalError = console.error;
console.error = function(...args) {
  if (
    args[0]?.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
    args[0]?.toString?.().includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return;
  }
  originalError.apply(console, args);
};

// 增强 console.error 来更好地显示 API 错误信息
window.logApiResponse = function(response) {
  console.log('📡 API Response Structure:', {
    status: response.status,
    hasData: !!response.data,
    dataType: typeof response.data,
    dataKeys: response.data ? Object.keys(response.data) : 'N/A',
    fullResponse: response
  });
};

createApp(App)
  .use(router)
  .mount('#app')

