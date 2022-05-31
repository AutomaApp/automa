import { onMounted, shallowReactive } from 'vue';
import browser from 'webextension-polyfill';

export function useHasPermissions(permissions) {
  const hasPermissions = shallowReactive({});

  function handlePermission(name, status) {
    hasPermissions[name] = status;
  }
  function request() {
    const reqPermissions = permissions.filter(
      (permission) => !hasPermissions[permission]
    );

    browser.permissions
      .request({ permissions: reqPermissions })
      .then((status) => {
        if (!status) return;

        reqPermissions.forEach((permission) => {
          handlePermission(permission, true);
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  onMounted(() => {
    permissions.forEach((permission) => {
      browser.permissions
        .contains({ permissions: [permission] })
        .then((status) => {
          handlePermission(permission, status);
        });
    });
  });

  return {
    request,
    has: hasPermissions,
  };
}
