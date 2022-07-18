import { onMounted, shallowReactive } from 'vue';
import browser from 'webextension-polyfill';

export function useHasPermissions(permissions) {
  const hasPermissions = shallowReactive({});

  function handlePermission(name, status) {
    hasPermissions[name] = status;
  }
  function request(needReload = false) {
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

        if (needReload) {
          alert('Automa needs to reload to make this feature work');
          browser.runtime.getBackgroundPage().then((background) => {
            background.location.reload();
          });
        }
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
