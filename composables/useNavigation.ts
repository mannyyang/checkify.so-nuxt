import { PrimeIcons } from 'primevue/api';

export function useNavigationMenu() {
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
            to: '/docs/component'
          }
        ]
      }
      // {
      //   label: 'Pages',
      //   items: [
      //     { label: 'Stores', icon: 'pi pi-fw pi-database', to: '/stores' },
      //     { label: 'Server', icon: 'pi pi-fw pi-database', to: '/server' },
      //     { label: 'I18n', icon: 'pi pi-fw pi-database', to: '/i18n' }
      //   ]
      // },
      // {
      //   label: 'Templates',
      //   items: [
      //     { label: 'Blueprint', icon: 'pi pi-fw pi-user-edit', to: '/templates/blueprint' }
      //   ]
      // },
      // {
      //   label: 'Menu Hierarchy',
      //   icon: 'pi pi-fw pi-search',
      //   items: [
      //     {
      //       label: 'Submenu 1',
      //       icon: 'pi pi-fw pi-bookmark',
      //       items: [
      //         {
      //           label: 'Submenu 1.1',
      //           icon: 'pi pi-fw pi-bookmark',
      //           items: [
      //             { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
      //             { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
      //             { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
      //           ]
      //         },
      //         {
      //           label: 'Submenu 1.2',
      //           icon: 'pi pi-fw pi-bookmark',
      //           items: [
      //             { label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' },
      //             { label: 'Submenu 1.2.2', icon: 'pi pi-fw pi-bookmark' }
      //           ]
      //         }
      //       ]
      //     },
      //     {
      //       label: 'Submenu 2',
      //       icon: 'pi pi-fw pi-bookmark',
      //       items: [
      //         {
      //           label: 'Submenu 2.1',
      //           icon: 'pi pi-fw pi-bookmark',
      //           items: [
      //             { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
      //             { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' },
      //             { label: 'Submenu 2.1.3', icon: 'pi pi-fw pi-bookmark' }
      //           ]
      //         },
      //         {
      //           label: 'Submenu 2.2',
      //           icon: 'pi pi-fw pi-bookmark',
      //           items: [
      //             { label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' },
      //             { label: 'Submenu 2.2.2', icon: 'pi pi-fw pi-bookmark' }
      //           ]
      //         }
      //       ]
      //     }
      //   ]
      // }
    ];
  };

  return { navigationMenu };
}
