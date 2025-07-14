export function useNavigationMenu () {
  const navigationMenu = () => {
    return [
      {
        label: 'Checkify.so',
        items: [
          {
            label: 'My Todo Lists',
            to: '/my-todo-lists',
            icon: 'CheckSquare'
          }
        ]
      },
      {
        label: 'Documentation',
        items: [
          {
            label: 'Connect Notion',
            icon: 'Key',
            to: '/docs/connect-notion'
          },
          {
            label: 'Create a Todo List',
            icon: 'Book',
            to: '/docs/create-todo-list'
          }
        ]
      },
      {
        label: 'Login',
        items: [
          {
            label: 'Login',
            icon: 'LogIn',
            to: '/login'
          },
          {
            label: 'Logout',
            icon: 'LogOut',
            to: '/logout'
          }
        ]
      }
    ];
  };

  return { navigationMenu };
}
