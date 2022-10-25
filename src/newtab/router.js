import { createRouter, createWebHashHistory } from 'vue-router';
import Welcome from './pages/Welcome.vue';
import Packages from './pages/Packages.vue';
import Workflows from './pages/Workflows.vue';
import WorkflowHost from './pages/workflows/Host.vue';
import WorkflowDetails from './pages/workflows/[id].vue';
import WorkflowShared from './pages/workflows/Shared.vue';
import ScheduledWorkflow from './pages/ScheduledWorkflow.vue';
import Storage from './pages/Storage.vue';
import StorageTables from './pages/storage/Tables.vue';
import Logs from './pages/Logs.vue';
import LogsDetails from './pages/logs/[id].vue';
import LogsRunning from './pages/logs/Running.vue';
import Recording from './pages/Recording.vue';
import Settings from './pages/Settings.vue';
import SettingsIndex from './pages/settings/SettingsIndex.vue';
import SettingsAbout from './pages/settings/SettingsAbout.vue';
import SettingsShortcuts from './pages/settings/SettingsShortcuts.vue';
import SettingsBackup from './pages/settings/SettingsBackup.vue';
import SettingsEditor from './pages/settings/SettingsEditor.vue';

const routes = [
  {
    name: 'home',
    path: '/',
    redirect: '/workflows',
    component: Workflows,
  },
  {
    name: 'welcome',
    path: '/welcome',
    component: Welcome,
  },
  {
    name: 'packages',
    path: '/packages',
    component: Packages,
  },
  {
    name: 'recording',
    path: '/recording',
    component: Recording,
  },
  {
    name: 'packages-details',
    path: '/packages/:id',
    component: WorkflowDetails,
  },
  {
    name: 'workflows',
    path: '/workflows',
    component: Workflows,
  },
  {
    name: 'schedule',
    path: '/schedule',
    component: ScheduledWorkflow,
  },
  {
    name: 'team-workflows',
    path: '/teams/:teamId/workflows/:id',
    component: WorkflowDetails,
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
    name: 'workflow-shared',
    path: '/workflows/:id/shared',
    component: WorkflowShared,
  },
  {
    name: 'storage',
    path: '/storage',
    component: Storage,
  },
  {
    name: 'storage-tables',
    path: '/storage/tables/:id',
    component: StorageTables,
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
    name: 'logs-running',
    path: '/logs/:id/running',
    component: LogsRunning,
  },
  {
    path: '/settings',
    component: Settings,
    children: [
      { path: '', component: SettingsIndex },
      { path: '/about', component: SettingsAbout },
      { path: '/backup', component: SettingsBackup },
      { path: '/editor', component: SettingsEditor },
      { path: '/shortcuts', component: SettingsShortcuts },
    ],
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
