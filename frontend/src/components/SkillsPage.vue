<template>
  <div class="skills-page">
    <header class="header">
      <h1>纳米机器人技能列表</h1>
      <nav class="navigation">
        <router-link to="/chat" class="nav-link" active-class="active">聊天</router-link>
        <router-link to="/skills" class="nav-link" active-class="active">技能列表</router-link>
      </nav>
    </header>
    
    <div class="full-page-container">
      <div class="skills-header">
        <h2>可用技能</h2>
        <button @click="loadSkills" :disabled="loadingSkills" class="refresh-btn">
          {{ loadingSkills ? '刷新中...' : '刷新技能' }}
        </button>
      </div>
      
      <div v-if="loadingSkills" class="loading">正在加载技能...</div>
      <div v-else-if="errorSkills" class="error">{{ errorSkills }}</div>
      <div v-else class="skills-grid">
        <div 
          v-for="skill in skills" 
          :key="skill.name" 
          class="skill-item"
          :class="{ available: skill.available, unavailable: !skill.available }"
        >
          <h3>{{ skill.name }}</h3>
          <p class="description">{{ skill.description }}</p>
          <div class="skill-meta">
            <span class="availability" :class="{ available: skill.available, unavailable: !skill.available }">
              {{ skill.available ? '可用' : '不可用' }}
            </span>
            <span class="source">{{ skill.source }}</span>
          </div>
          <div v-if="!skill.available && skill.requires" class="requirements">
            缺少: {{ skill.requires }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkillsPage',
  data() {
    return {
      skills: [],
      loadingSkills: false,
      errorSkills: null
    }
  },
  mounted() {
    this.loadSkills();
  },
  methods: {
    async loadSkills() {
      this.loadingSkills = true;
      this.errorSkills = null;
      
      try {
        // 调用纳米机器人HTTP API获取技能列表
        const response = await fetch('http://localhost:8000/api/skills');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        this.skills = data.skills.map(skill => ({
          name: skill.name,
          description: skill.description,
          available: skill.available,
          source: skill.source,
          requires: this.formatRequirements(skill.requires)
        }));
      } catch (error) {
        console.error('加载技能时出错:', error);
        this.errorSkills = '加载技能失败。请确保纳米机器人服务正在运行。';
      } finally {
        this.loadingSkills = false;
      }
    },
    
    formatRequirements(requires) {
      // 格式化技能要求为用户友好的字符串
      if (!requires || Object.keys(requires).length === 0) {
        return '';
      }
      
      const parts = [];
      
      if (requires.bins && requires.bins.length > 0) {
        parts.push(`命令行: ${requires.bins.join(', ')}`);
      }
      
      if (requires.env && requires.env.length > 0) {
        parts.push(`环境变量: ${requires.env.join(', ')}`);
      }
      
      return parts.join('; ');
    }
  }
}
</script>

<style scoped>
.skills-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  z-index: 10;
}

.navigation {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: #bdc3c7;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link.router-link-active,
.nav-link.active {
  background-color: #3498db;
  color: white;
}

.nav-link:hover {
  background-color: #3d566e;
  color: white;
}

.full-page-container {
  flex: 1;
  padding: 0;
  margin: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100% - 60px); /* 减去头部高度 */
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.skills-header h2 {
  margin: 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.refresh-btn {
  background-color: #9b59b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #8e44ad;
}

.refresh-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  background-color: #f9f9f9;
  width: 100%;
}

.skill-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  transition: all 0.2s ease;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.skill-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.skill-item.available {
  border-left: 4px solid #2ecc71;
}

.skill-item.unavailable {
  border-left: 4px solid #e74c3c;
  opacity: 0.7;
}

.skill-item h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.description {
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.skill-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #777;
}

.availability.available {
  color: #27ae60;
  font-weight: bold;
}

.availability.unavailable {
  color: #e74c3c;
  font-weight: bold;
}

.requirements {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-size: 1.1rem;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error {
  text-align: center;
  padding: 1rem;
  color: #e74c3c;
  background-color: #fdeded;
  border-radius: 4px;
  margin: 1rem;
  flex: 0 0 auto;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .skills-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .refresh-btn {
    align-self: flex-start;
  }
  
  .skills-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
</style>