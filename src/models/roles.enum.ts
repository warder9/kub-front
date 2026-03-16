export enum Roles {
  ADMIN = 1,
  MANAGER = 2,
  USER = 3,
}

export const getRoleName = (roleId: number) => {
  switch (roleId) {
    case Roles.ADMIN:
      return "Администратор";
    case Roles.MANAGER:
      return "Менеджер";
    case Roles.USER:
      return "Пользователь";
    default:
      return "Неизвестная роль";
  }
};
