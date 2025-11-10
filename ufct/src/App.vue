<template>
  <div id="app" class="app-container">
    <nav class="app-navbar">
      <div class="navbar-brand">
        <h1 class="brand-title">📊 学术网络可视化</h1>
      </div>
      <ul class="navbar-nav">
        <li class="nav-item">
          <router-link 
            to="/citation-network" 
            class="nav-link"
            :class="{ active: $route.name === 'CitationNetwork' }"
          >
            论文引用网络
          </router-link>
        </li>
        <li class="nav-item">
          <router-link 
            to="/author-collaboration" 
            class="nav-link"
            :class="{ active: $route.name === 'AuthorCollaboration' }"
          >
            作者协作网络
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="app-main">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
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
