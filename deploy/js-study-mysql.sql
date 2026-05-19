CREATE DATABASE IF NOT EXISTS js_study
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE js_study;

DROP TABLE IF EXISTS js_study_sections;

CREATE TABLE js_study_sections (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  code TEXT NOT NULL,
  task VARCHAR(500),
  tags JSON,
  sort_order INT NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO js_study_sections (id, title, body, code, task, tags, sort_order) VALUES
('variables', '变量、字符串、数字', '从变量开始入门，理解 let / const、字符串拼接、数字运算和布尔值。', 'let name = "Ymir";\nlet age = 18;\nlet isStudent = true;\n\nconsole.log(name);\nconsole.log(age);\nconsole.log(isStudent);', '创建 01-variable.js，声明姓名、年龄、是否在学习 JS，并输出结果。', JSON_ARRAY('let', 'const', 'string', 'number'), 1),
('condition', 'if 判断与逻辑运算', '条件语句让程序可以根据不同情况执行不同代码，登录校验和权限判断都会用到它。', 'let username = "admin";\nlet password = "123456";\n\nif (username === "admin" && password === "123456") {\n  console.log("登录成功");\n} else {\n  console.log("用户名或密码错误");\n}', '写一个登录判断，改错密码后观察输出变化。', JSON_ARRAY('if', 'else', '&&', '||'), 2),
('array-loop', '数组与循环', '数组保存一组数据，循环负责批量处理数据。列表渲染、任务遍历都离不开它们。', 'let games = ["Minecraft", "GTA V", "Valorant", "CS2"];\n\ngames.push("Apex Legends");\n\nfor (let game of games) {\n  console.log(game);\n}', '创建一个 games 数组，追加新项目，再用循环逐条输出。', JSON_ARRAY('array', 'for', 'push'), 3),
('function-object', '函数与对象', '函数用来复用逻辑，对象用来组织数据。前端和后端项目里都会大量使用。', 'function add(a, b) {\n  return a + b;\n}\n\nlet user = {\n  name: "Ymir",\n  skill: "JavaScript"\n};\n\nconsole.log(add(10, 20));\nconsole.log(user.name);', '写一个 add 函数，再创建一个 user 对象并输出属性。', JSON_ARRAY('function', 'return', 'object'), 4),
('dom-event', 'DOM 与事件', 'DOM 是浏览器里的页面结构，JS 可以直接修改页面内容，也能监听按钮点击。', 'let title = document.getElementById("title");\nlet btn = document.getElementById("btn");\n\nbtn.addEventListener("click", function () {\n  title.textContent = "你点击了按钮";\n});', '写一个 HTML 页面，点击按钮后修改标题文字。', JSON_ARRAY('DOM', 'button', 'click'), 5),
('async-api', '异步与 API', '异步用于处理需要等待的任务，例如网络请求、文件读取和定时器。', 'async function getUser() {\n  try {\n    let response = await fetch("/api/user");\n    let data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.log("请求失败", error);\n  }\n}', '理解 async / await 的结构，然后尝试请求一个 API。', JSON_ARRAY('async', 'await', 'fetch', 'API'), 6);
