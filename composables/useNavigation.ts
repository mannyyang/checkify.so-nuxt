import { PrimeIcons } from 'primevue/api';

export function useNavigationMenu () {
  const navigationMenu = () => {
    return [
      {
        label: 'Checkify.so',
        items: [
          {
            label: 'My Todo Lists',
            to: '/my-todo-lists',
            icon: 'pi pi-fw pi-check-square'
          }
        ]
      },
      {
        label: 'Documentation',
        items: [
          {
            label: 'Connect Notion',
            icon: 'pi pi-fw pi-key',
            to: '/docs/connect-notion'
          },
          {
            label: 'Create a Todo List',
            icon: 'pi pi-fw pi-book',
            to: '/docs/create-todo-list'
          }
        ]
      },
      {
        label: 'Login',
        items: [
          {
            label: 'Login',
            icon: 'pi pi-fw pi-sign-in',
            to: '/login'
          },
          {
            label: 'Logout',
            icon: 'pi pi-fw pi-sign-out',
            to: '/logout'
          }
        ]
      }
    ];
  };

  return { navigationMenu };
}
