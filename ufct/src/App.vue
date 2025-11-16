<template>
  <div id="app" class="app-container">
    <nav class="app-navbar">
      <div class="navbar-brand">
        <h1 class="brand-title">📊 Academic Network Visualization</h1>
      </div>
      <ul class="navbar-nav">
        <li class="nav-item">
          <router-link 
            to="/citation-network" 
            class="nav-link"
            :class="{ active: $route.name === 'CitationNetwork' }"
          >
            Citation Network
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/author-collaboration" 
            class="nav-link"
            :class="{ active: $route.name === 'AuthorCollaboration' }"
          >
            Author Collaboration
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/paper-statistics" 
            class="nav-link"
            :class="{ active: $route.name === 'PaperStatistics' }"
          >
            Paper Statistics
          </router-link>
        </li>
      </ul>
      <div class="navbar-actions">
        <button 
          class="btn btn-scalability" 
          @click="showScalabilityModal = true"
          title="Scalability solution configuration"
        >
          ⚙️ Scalability Settings
        </button>
        <button 
          class="btn btn-clear-cache" 
          @click="clearCache"
          title="Clear browser cache"
        >
          🗑️ Clear Cache
        </button>
      </div>

      <!-- Scalability Configuration Modal -->
      <div v-if="showScalabilityModal" class="modal-overlay" @click.self="showScalabilityModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Scalability Solution Configuration</h3>
            <button class="close-btn" @click="showScalabilityModal = false">✕</button>
          </div>
          <div class="modal-body">
            <ScalabilityPanel />
          </div>
        </div>
      </div>
    </nav>

    <div class="app-main">
      <router-view />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import ScalabilityPanel from './components/Shared/ScalabilityPanel.vue';

export default {
  name: 'App',
  components: {
    ScalabilityPanel
  },
  setup() {
    const showScalabilityModal = ref(false);

    return {
      showScalabilityModal
    };
  },
  methods: {
    clearCache() {
      // Clear all localStorage
      localStorage.clear();
      // Clear sessionStorage
      sessionStorage.clear();
      // Clear IndexedDB
      if (window.indexedDB) {
        const dbs = ['graphData', 'networkCache'];
        dbs.forEach(dbName => {
          const deleteRequest = indexedDB.deleteDatabase(dbName);
          deleteRequest.onsuccess = () => {
            console.log(`Database ${dbName} cleared`);
          };
          deleteRequest.onerror = () => {
            console.log(`Failed to clear database ${dbName}`);
          };
        });
      }
      alert('Cache cleared! Page will refresh.');
      // Refresh page
      window.location.reload();
    }
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: white;
}

.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.brand-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.navbar-nav {
  display: flex;
  list-style: none;
  gap: 32px;
  margin: 0;
  padding: 0;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-scalability {
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 300ms ease;
}

.btn-scalability:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn-scalability:active {
  transform: translateY(0);
}

.btn-clear-cache {
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 300ms ease;
}

.btn-clear-cache:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn-clear-cache:active {
  transform: translateY(0);
}

.nav-item {
  position: relative;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 300ms ease;
  padding: 8px 0;
}

.nav-link:hover {
  color: white;
}

.nav-link.active {
  color: white;
  border-bottom: 3px solid white;
  padding-bottom: 5px;
}

.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 模态对话框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: sticky;
  top: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: transform 200ms ease;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px;
}

@media (max-width: 768px) {
  .app-navbar {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
  }

  .brand-title {
    font-size: 18px;
  }

  .navbar-nav {
    width: 100%;
    gap: 16px;
  }
}
</style>
