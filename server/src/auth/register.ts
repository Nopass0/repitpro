import io from "../socket";
import db from "../db";
import bcrypt from "bcrypt";

export const register = async (data) => {
  //   console.log("login", data);

  const hash = bcrypt.hashSync(data.password, 3);

  const user = await db.user.findUnique({
    where: {
      name: data.login,
    },
  });

  if (user) {
    return io.emit("register", {
      error: "Пользователь с таким именем уже существует",
    });
  }

  //Логин должен состоять только из букв латинского алфавита и\или цифр. Длина должна быть не менее 5 символов
  let reg_login = /^[a-zA-Z0-9]+$/;
  if (!reg_login.test(data.login) || data.login.length < 5) {
    return io.emit("register", {
      error:
        "Логин должен состоять только из букв латинского алфавита и цифр. Длина должна быть не менее 5 символов",
    });
  }

  //Пароль должен состоять из 8-ми или более символов, включая строчные и заглавные буквы, цифры и специальные символы
  let reg =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  //Пример пароля: 1q2w3e4r5t6y7u8i9o0p
  //Пример не может быть использован для регистрации
  let example = "1q2w3e4r5t6y7u8i9o0p";
  if (!reg.test(data.password)) {
    return io.emit("register", {
      error:
        "Пароль должен состоять из 8-ми или более символов, включая строчные и заглавные буквы, цифры и специальные символы. Например: 1q2w3e4r5t6y7u8i9o0p",
    });
  }

  if (data.password === example) {
    return io.emit("register", {
      error: "Пример пароля не может быть использован для регистрации",
    });
  }

  const userCreated = await db.user.create({
    data: {
      name: data.login,
      password: hash,
    },
  });

  //create new token
  const token = await db.token.create({
    data: {
      userId: userCreated.id,
      token:
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2),
    },
  });

  return io.emit("register", {
    token: token.token,
    message: "Пользователь создан",
  });
};
