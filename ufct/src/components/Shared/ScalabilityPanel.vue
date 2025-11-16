/**
 * Scalability Solutions Description Panel Component
 * Detailed optimization strategies for both frontend rendering and backend data fetching
 */

<template>
  <div class="scalability-panel">
    <div class="panel-header">
      <h3>⚙️ Scalability Solutions</h3>
      <div class="header-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab" 
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- Frontend Optimization -->
      <div v-if="activeTab === 'Frontend'" class="tab-content">
        <div class="section-title">🎨 Frontend Rendering Optimization</div>
        
        <div class="solution-item">
          <h4>🌐 WebGL + D3.js Large-Scale Rendering ⭐ Core Solution</h4>
          <p>
            Utilizes <strong>WebGL</strong> hardware-accelerated rendering combined with <strong>D3.js</strong> force-directed layout to handle massive network graphs. This approach replaces traditional SVG/Canvas rendering, enabling smooth visualization of thousands of nodes without freezing the UI.
          </p>
          <div class="performance-highlight">
            <strong>Why not SVG/Canvas?</strong> SVG is DOM-based and creates one element per node (extremely slow for 1000+ nodes). Canvas requires manual interaction handling. WebGL offloads rendering to GPU, achieving 30-60 FPS even with 2000+ nodes.
          </div>
        </div>

        <div class="solution-item">
          <h4>📊 Intelligent Data Clustering and Filtering</h4>
          <p>
            Clustering algorithm filters nodes by configurable thresholds (minimum degree, citation count). Display only high-impact nodes and relationships. Users can dynamically adjust node display limit (50-2000) using sliders for flexible switching between detailed and macro views.
          </p>
          <div class="example-box">
            <strong>Example:</strong> 10,000 paper network → filtered to 500 key papers (5% compression) while preserving 95% of citation relationships
          </div>
        </div>

        <div class="solution-item">
          <h4>🔍 Web Worker Parallel Processing</h4>
          <p>
            Complex computations (Force Simulation, Community Detection, Layout Calculations) run in background Web Worker threads. Main thread stays responsive for user interactions (zoom, pan, drag). Graph continues updating while user explores.
          </p>
        </div>

        <div class="solution-item">
          <h4>💾 Progressive Loading & Caching</h4>
          <p>
            <strong>Frontend Cache:</strong> IndexedDB stores medium-scale networks (&lt; 500 nodes) for instant retrieval on repeated queries.
            <br/>
            <strong>Progressive Loading:</strong> Large networks load clustered communities incrementally, allowing users to explore while data streams in.
          </p>
        </div>

        <div class="metrics">
          <div class="metric-row">
            <span>✓ Supported Node Count:</span>
            <strong>50 - 2000+</strong>
          </div>
          <div class="metric-row">
            <span>✓ Initial Load Time:</span>
            <strong>&lt; 2 seconds</strong>
          </div>
          <div class="metric-row">
            <span>✓ Interaction Frame Rate:</span>
            <strong>30-60 FPS (GPU accelerated)</strong>
          </div>
          <div class="metric-row">
            <span>✓ Memory Usage:</span>
            <strong>&lt; 200MB</strong>
          </div>
        </div>
      </div>

      <!-- Backend Optimization -->
      <div v-if="activeTab === 'Backend'" class="tab-content">
        <div class="section-title">⚡ Backend Data Fetching Optimization (OpenAlex API)</div>
        
        <div class="solution-item">
          <h4>1️⃣ OR Syntax Batch Requests ⭐ Core Breakthrough</h4>
          <p>
            <strong>Method:</strong> Use OpenAlex API's OR filter to query 50-100 values in a single request instead of individual queries.
            <br/>
            <strong>Example:</strong> <code>authors.id:(A OR B OR C OR ... OR Z)</code>
          </p>
          <div class="performance-box">
            <div class="metric-row">
              <span>10,000+ papers:</span>
              <strong class="improvement">~24x faster</strong> (120 min → 5 min)
            </div>
            <div class="metric-row">
              <span>425,503 author pairs:</span>
              <strong class="improvement">~95x faster</strong> (95,000s → 1,000s)
            </div>
            <div class="metric-row">
              <span>147 authors:</span>
              <strong class="improvement">~6x faster</strong> (36 requests → 6 requests)
            </div>
          </div>
          <div class="constraint-box">
            <strong>⚠️ API Constraints:</strong> Max 100 values per OR filter (recommend 50 for safety)
          </div>
        </div>

        <div class="solution-item">
          <h4>2️⃣ Token Bucket Rate Limiter 🎯 Precise Control</h4>
          <p>
            Implements token bucket algorithm to enforce OpenAlex official limit: <strong>10 requests/second</strong>.
          </p>
          <ul class="feature-list">
            <li>✓ Prevents race conditions in multi-threaded environments</li>
            <li>✓ Avoids 429 (Too Many Requests) errors</li>
            <li>✓ Ensures smooth request distribution</li>
          </ul>
        </div>

        <div class="solution-item">
          <h4>3️⃣ Polite Pool Registration 📚 Stable Responses</h4>
          <p>
            Register with OpenAlex Polite Pool to obtain:
          </p>
          <ul class="feature-list">
            <li>✓ More consistent response times</li>
            <li>✓ Priority treatment from API</li>
            <li>✓ Higher reliability</li>
          </ul>
        </div>

        <div class="solution-item">
          <h4>4️⃣ Adaptive Batch Processing 📊 Dynamic Optimization</h4>
          <p>
            Dynamically adjust batch size based on data characteristics:
            <br/>
            <code>batch_size = min(50, max(10, total_items / 20))</code>
          </p>
          <div class="example-box">
            Balances number of requests vs. per-request processing time. Prevents single requests from timing out.
          </div>
        </div>

        <div class="solution-item">
          <h4>5️⃣ Exponential Backoff Retry 🔄 Fault Tolerance</h4>
          <p>
            On 429 rate limit error:
          </p>
          <div class="code-box">
            Retry 1: wait 2s<br/>
            Retry 2: wait 4s<br/>
            Retry 3: wait 8s<br/>
            ... (exponential growth)
          </div>
        </div>

        <div class="solution-item">
          <h4>6️⃣ Increased Pagination Size 📄 Fewer Requests</h4>
          <p>
            Fetch more results per request: <code>per_page=200</code> instead of default 25.
            <br/>
            <strong>Result:</strong> Reduces request count by 8x for large result sets.
          </p>
        </div>

        <div class="solution-item">
          <h4>7️⃣ Generator Pattern for Big Data 💾 Memory Efficient</h4>
          <p>
            Process citation networks using Python generators. Stream data without loading entire dataset into memory. Critical for handling 100k+ citation relationships.
          </p>
        </div>

        <div class="solution-item">
          <h4>8️⃣ Session Reuse 🔌 Connection Pooling</h4>
          <p>
            Reuse HTTP session across multiple requests to leverage connection pooling and avoid handshake overhead.
          </p>
        </div>

        <div class="solution-item">
          <h4>9️⃣ Two-Level Batch Query 🎲 Cross-Batch Optimization</h4>
          <p>
            Query author collaborations using OR syntax across batches:
            <br/>
            <strong>425,503 author pairs → ~100-200 requests</strong> (vs. 425,503 individual requests)
          </p>
          <div class="example-box">
            <strong>Logic:</strong> Batch authors by publication count, query collaborations within batches using OR syntax
          </div>
        </div>

        <div class="solution-item">
          <h4>🔟 Result Caching 🔐 Avoid Redundant Queries</h4>
          <p>
            Cache API responses with same query parameters. Checks cache before making API call. Significantly speeds up repeated analyses.
          </p>
        </div>

        <div class="metrics">
          <div class="metric-row">
            <span>✓ Request Rate:</span>
            <strong>10 req/s (API compliant)</strong>
          </div>
          <div class="metric-row">
            <span>✓ Typical Query Speed:</span>
            <strong>5-10 minutes (10k+ items)</strong>
          </div>
          <div class="metric-row">
            <span>✓ Cache Hit Rate:</span>
            <strong>~60-80%</strong>
          </div>
          <div class="metric-row">
            <span>✓ Memory Efficiency:</span>
            <strong>Generator-based streaming</strong>
          </div>
        </div>
      </div>

      <!-- Performance Comparison -->
      <div v-if="activeTab === 'Comparison'" class="tab-content">
        <div class="section-title">📊 Performance Comparison: Optimized vs. Naive Approach</div>
        
        <div class="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Naive Approach</th>
                <th>Optimized</th>
                <th>Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>10,000+ Papers</strong></td>
                <td>120 min</td>
                <td>5 min</td>
                <td class="improvement">24x</td>
              </tr>
              <tr>
                <td><strong>425,503 Author Pairs</strong></td>
                <td>~95,000s (26h)</td>
                <td>~1,000s (16m)</td>
                <td class="improvement">95x</td>
              </tr>
              <tr>
                <td><strong>147 Authors</strong></td>
                <td>36 requests</td>
                <td>6 requests</td>
                <td class="improvement">6x</td>
              </tr>
              <tr>
                <td><strong>5,000 Node Graph Render</strong></td>
                <td>Freezes (SVG DOM)</td>
                <td>2 sec (WebGL)</td>
                <td class="improvement">✓ Responsive</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="usage-tips">
          <strong>💡 Usage Recommendations:</strong>
          <ul>
            <li><strong>Small networks (50-300 nodes):</strong> No optimization needed; standard force-directed layout</li>
            <li><strong>Medium networks (300-1000 nodes):</strong> Enable node filtering; use OR batch queries (batch size 50)</li>
            <li><strong>Large networks (1000-2000 nodes):</strong> Enable clustering + focus mode; use two-level batch queries</li>
            <li><strong>Massive networks (2000+ nodes):</strong> Enable progressive loading + caching; max batch size 30; generator-based streaming</li>
            <li><strong>Quick preview:</strong> Reduce node limit to 100-200 for instant response (&lt; 5 sec)</li>
          </ul>
        </div>
      </div>

      <!-- Architecture Diagram -->
      <div v-if="activeTab === 'Architecture'" class="tab-content">
        <div class="section-title">🏗️ System Architecture</div>
        
        <div class="architecture-box">
          <div class="architecture-layer">
            <div class="layer-title">Frontend Layer (Vue.js + WebGL)</div>
            <div class="layer-content">
              <div class="component">D3.js Force Layout</div>
              <div class="component">WebGL Renderer</div>
              <div class="component">IndexedDB Cache</div>
              <div class="component">Web Workers</div>
            </div>
          </div>

          <div class="arrow-down">↓</div>

          <div class="architecture-layer">
            <div class="layer-title">API Layer (HTTP Requests)</div>
            <div class="layer-content">
              <div class="component">Token Bucket Limiter</div>
              <div class="component">Request Batcher (OR Syntax)</div>
              <div class="component">Response Cache</div>
              <div class="component">Exponential Backoff</div>
            </div>
          </div>

          <div class="arrow-down">↓</div>

          <div class="architecture-layer">
            <div class="layer-title">Backend (OpenAlex API)</div>
            <div class="layer-content">
              <div class="component">Polite Pool</div>
              <div class="component">10 req/s Rate Limit</div>
              <div class="component">Per-page: 200 results</div>
              <div class="component">OR Filter Batching</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScalabilityPanel',
  data() {
    return {
      activeTab: 'Frontend',
      tabs: ['Frontend', 'Backend', 'Comparison', 'Architecture']
    };
  }
};
</script>

<style scoped>
.scalability-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  user-select: none;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.header-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  color: #666;
}

.tab-btn:hover {
  background: #f0f0f0;
  border-color: #999;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.tab-content {
  animation: fadeIn 200ms ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.solution-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-left: 3px solid #667eea;
  border-radius: 4px;
}

.solution-item h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

.solution-item p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.solution-item ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.solution-item li {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

.example-box,
.constraint-box,
.performance-box,
.code-box {
  margin-top: 8px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #ff9800;
  font-size: 12px;
  color: #555;
}

.constraint-box {
  border-left-color: #f44336;
  background: #ffebee;
}

.performance-box {
  border-left-color: #4caf50;
  background: #f1f8e9;
}

.code-box {
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  border-left-color: #2196f3;
  line-height: 1.8;
}

.feature-list {
  margin: 8px 0;
  padding-left: 20px;
  font-size: 12px;
  color: #666;
}

.feature-list li {
  margin: 4px 0;
}

.metrics {
  margin-top: 16px;
  padding: 12px;
  background: #f0f5ff;
  border-radius: 4px;
  border: 1px solid #e0e8ff;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #e0e8ff;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-row strong {
  color: #667eea;
  font-weight: 600;
}

.metric-row .improvement {
  color: #4caf50;
  font-weight: 600;
}

/* Comparison Table */
.comparison-table {
  margin-top: 12px;
  overflow-x: auto;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.comparison-table th {
  background: #667eea;
  color: white;
  padding: 10px;
  text-align: left;
  font-weight: 600;
}

.comparison-table td {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
}

.comparison-table tr:last-child td {
  border-bottom: none;
}

.comparison-table .improvement {
  color: #4caf50;
  font-weight: 600;
}

.usage-tips {
  margin-top: 16px;
  padding: 12px;
  background: #fff9e6;
  border-radius: 4px;
  border-left: 3px solid #ff9800;
  font-size: 12px;
  color: #666;
}

.usage-tips strong {
  color: #ff9800;
  display: block;
  margin-bottom: 8px;
}

.usage-tips ul {
  margin: 0;
  padding-left: 20px;
}

.usage-tips li {
  margin: 6px 0;
}

/* Architecture Diagram */
.architecture-box {
  margin-top: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.architecture-layer {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.layer-title {
  background: #667eea;
  color: white;
  padding: 10px;
  font-weight: 600;
  font-size: 12px;
}

.layer-content {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.component {
  background: #f0f5ff;
  border: 1px solid #e0e8ff;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  color: #667eea;
  text-align: center;
  font-weight: 500;
}

.arrow-down {
  text-align: center;
  color: #667eea;
  font-size: 20px;
  margin: 8px 0;
}

@media (max-width: 768px) {
  .panel-content {
    max-height: 500px;
  }

  .header-tabs {
    gap: 4px;
  }

  .tab-btn {
    padding: 4px 8px;
    font-size: 11px;
  }

  .solution-item {
    margin-bottom: 12px;
    padding: 8px;
  }

  .solution-item h4 {
    font-size: 11px;
  }

  .solution-item p {
    font-size: 11px;
  }

  .comparison-table {
    font-size: 11px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 6px;
  }

  .layer-content {
    grid-template-columns: 1fr;
  }
}
</style>
