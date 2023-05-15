import Mock from "mockjs";
interface UserListItem {
  id: string;
  name: string;
  gender: "male" | "female";
  email: string;
  disabled: boolean;
}

const userList = (current: number, pageSize: number) =>
  Mock.mock({
    total: 55,
    [`list|${pageSize}`]: [
      {
        id: "@guid",
        name: "@name",
        "gender|1": ["male", "female"],
        email: "@email",
        disabled: false
      }
    ]
  });

export async function getUserList(params: {
  current: number;
  pageSize: number;
}): Promise<{ total: number; list: UserListItem[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(userList(params.current, params.pageSize));
    }, 300);
  });
}
