import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Welcome from './pages/Welcome.vue';
import Workflows from './pages/Workflows.vue';
import WorkflowHost from './pages/workflows/Host.vue';
import WorkflowDetails from './pages/workflows/[id].vue';
import Collections from './pages/Collections.vue';
import CollectionsDetails from './pages/collections/[id].vue';
import Logs from './pages/Logs.vue';
import LogsDetails from './pages/logs/[id].vue';
import Settings from './pages/Settings.vue';
import SettingsIndex from './pages/settings/index.vue';
import SettingsAbout from './pages/settings/About.vue';
import SettingsShortcuts from './pages/settings/Shortcuts.vue';
import SettingsBackup from './pages/settings/Backup.vue';

const routes = [
  {
    name: 'home',
    path: '/',
    component: Home,
  },
  {
    name: 'welcome',
    path: '/welcome',
    component: Welcome,
  },
  {
    name: 'workflows',
    path: '/workflows',
    component: Workflows,
  },
  {
    name: 'workflows-details',
    path: '/workflows/:id',
    component: WorkflowDetails,
  },
  {
    name: 'workflow-host',
    path: '/workflows/:id/host',
    component: WorkflowHost,
  },
  {
    name: 'collections',
    path: '/collections',
    component: Collections,
  },
  {
    name: 'collections-details',
    path: '/collections/:id',
    component: CollectionsDetails,
  },
  {
    name: 'logs',
    path: '/logs',
    component: Logs,
  },
  {
    name: 'logs-details',
    path: '/logs/:id',
    component: LogsDetails,
  },
  {
    path: '/settings',
    component: Settings,
    children: [
      { path: '', component: SettingsIndex },
      { path: '/about', component: SettingsAbout },
      { path: '/backup', component: SettingsBackup },
      { path: '/shortcuts', component: SettingsShortcuts },
    ],
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
