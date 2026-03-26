export enum Roles {
  USER = 5,
  SALES = 10,
  CONTROL = 20,
  ADMIN = 30,
  MANAGEMENT = 40,
}

export const getRoleName = (roleId: number) => {
  switch (roleId) {
    case Roles.ADMIN:
      return "Администратор";
    case Roles.MANAGEMENT:
      return "Руководство";
    case Roles.CONTROL:
      return "Отдел контроля";
    case Roles.SALES:
      return "Отдел продаж";
    case Roles.USER:
      return "Пользователь";
    default:
      return "Неизвестная роль";
  }
};
