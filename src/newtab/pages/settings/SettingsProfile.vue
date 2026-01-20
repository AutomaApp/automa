<template>
  <div class="max-w-xl">
    <div v-if="!userStore.retrieved" class="loading-state">
      <ui-spinner color="text-accent" size="32" />
      <p>{{ t('settings.profile.loading') }}</p>
    </div>

    <ui-card v-else-if="!userStore.user" class="not-signed-in">
      <div class="text-center">
        <h3 class="mb-2 text-xl font-semibold">
          {{ t('settings.profile.notSignedIn') }}
        </h3>
        <p class="mb-6 text-gray-600 dark:text-gray-300">
          {{ t('settings.profile.signInDesc') }}
        </p>
        <ui-button tag="button" variant="accent" class="w-64">
          <a href="https://extension.automa.site/auth">
            {{ t('settings.profile.signIn') }}
          </a>
        </ui-button>
      </div>
    </ui-card>

    <ui-card v-else class="profile-card">
      <div class="profile-header">
        <div class="avatar">
          <img
            v-if="userAvatar"
            :src="userAvatar"
            :alt="`${displayName}'s avatar`"
            @error="avatarError = true"
          />
          <div v-else class="default-avatar">
            {{ userInitials }}
          </div>
        </div>

        <div class="user-info">
          <h3 class="username">{{ displayName }}</h3>
          <p v-if="userEmail" class="email">{{ userEmail }}</p>

          <div v-if="userTeams.length > 0" class="teams-badge">
            <v-remixicon name="riTeamLine" size="16" class="mr-1" />
            <span>{{
              t('settings.profile.teamsCount', { count: userTeams.length })
            }}</span>
          </div>
        </div>
      </div>

      <div class="warning-message">
        <v-remixicon
          name="riAlertLine"
          size="20"
          class="mr-2 text-yellow-500"
        />
        <p>{{ t('settings.profile.warningMessage') }}</p>
      </div>

      <div class="actions">
        <ui-button
          variant="danger"
          class="w-full sign-out-button"
          :loading="state.loading"
          :disabled="state.loading"
          @click="handleSignOut"
        >
          <v-remixicon
            :name="state.loading ? 'riLoader4Line' : 'riLogoutCircleRLine'"
            class="mr-2"
            :class="{ 'animate-spin': state.loading }"
          />
          {{
            state.loading
              ? t('settings.profile.signingOut')
              : t('settings.profile.signOut')
          }}
        </ui-button>

        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          {{ t('settings.profile.signOutNote') }}
        </p>
      </div>
    </ui-card>
  </div>
</template>

<script setup>
import { useDialog } from '@/composable/dialog';
import { useUserStore } from '@/stores/user';
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';

const { t } = useI18n();
const userStore = useUserStore();
const dialog = useDialog();
const toast = useToast();

const state = reactive({
  loading: false,
  avatarError: false,
  isSigningOut: false,
});

const displayName = computed(() => {
  return userStore.user?.username || 'User';
});

const userEmail = computed(() => {
  return userStore.user?.email || '';
});

const userAvatar = computed(() => {
  if (state.avatarError) return null;

  const metadataAvatar = userStore.user?.user_metadata?.avatar_url;
  if (metadataAvatar) return metadataAvatar;

  const picture = userStore.user?.user_metadata?.picture;
  if (picture) return picture;

  if (userEmail.value) {
    const emailHash = btoa(userEmail.value.toLowerCase().trim()).replace(
      /=/g,
      ''
    );
    return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=200`;
  }

  return null;
});

const userInitials = computed(() => {
  if (!userStore.user) return 'U';

  const username = userStore.user?.username || 'User';
  return username.charAt(0).toUpperCase();
});

const userTeams = computed(() => {
  return userStore.user?.teams || [];
});

async function handleSignOut() {
  if (state.loading || state.isSigningOut) {
    return;
  }

  const confirmed = await dialog.confirm({
    title: t('settings.profile.signOutConfirmTitle'),
    body: t('settings.profile.signOutConfirmMessage'),
    okVariant: 'danger',
    okText: t('common.yes'),
    cancelText: t('common.no'),
  });

  if (!confirmed) {
    return;
  }

  try {
    state.loading = true;
    state.isSigningOut = true;

    await userStore.signOut();

    sessionStorage.removeItem('user-profile');
    sessionStorage.removeItem('shared-workflows');
    sessionStorage.removeItem('user-workflows');
    sessionStorage.removeItem('backup-workflows');

    toast.success(t('settings.profile.signedOut'));
  } catch (error) {
    console.error('Sign out error:', error);
    toast.error(t('message.somethingWrong'));
  } finally {
    state.loading = false;
    state.isSigningOut = false;
  }
}
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

.not-signed-in {
  padding: 3rem;
  text-align: center;
}

.profile-card {
  padding: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 600;
}

.user-info {
  margin-left: 1.5rem;
  flex: 1;
}

.username {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.email {
  color: rgb(107 114 128);
  font-size: 0.875rem;
}

.teams-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 0.75rem;
  padding: 0.375rem 0.75rem;
  background-color: rgb(243 244 246);
  border-radius: 9999px;
  font-size: 0.75rem;
  color: rgb(75 85 99);
}

.dark .teams-badge {
  background-color: rgb(55 65 81);
  color: rgb(156 163 175);
}

.warning-message {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: rgb(254 252 231);
  border: 1px solid rgb(253 230 138);
  border-radius: 0.5rem;
  color: rgb(120 113 108);
}

.dark .warning-message {
  background-color: rgb(113 63 18);
  border-color: rgb(161 98 7);
  color: rgb(253 230 138);
}

.actions {
  border-top: 1px solid rgb(229 231 235);
  padding-top: 1.5rem;
}

.dark .actions {
  border-top-color: rgb(55 65 81);
}

.sign-out-button {
  min-height: 48px;
  font-weight: 600;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
