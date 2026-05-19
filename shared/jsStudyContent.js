export const STATIC_SECTIONS = [
  {
    id: 'variables',
    title: '变量、字符串、数字',
    tags: ['let', 'const', 'string', 'number'],
    body: '从变量开始入门，理解 let / const、字符串拼接、数字运算和布尔值。',
    code: 'let name = "Ymir";\nlet age = 18;\nlet isStudent = true;\n\nconsole.log(name);\nconsole.log(age);\nconsole.log(isStudent);',
    task: '创建 01-variable.js，声明姓名、年龄、是否在学习 JS，并输出结果。',
  },
  {
    id: 'condition',
    title: 'if 判断与逻辑运算',
    tags: ['if', 'else', '&&', '||'],
    body: '条件语句让程序可以根据不同情况执行不同代码，登录校验和权限判断都会用到它。',
    code: 'let username = "admin";\nlet password = "123456";\n\nif (username === "admin" && password === "123456") {\n  console.log("登录成功");\n} else {\n  console.log("用户名或密码错误");\n}',
    task: '写一个登录判断，改错密码后观察输出变化。',
  },
  {
    id: 'array-loop',
    title: '数组与循环',
    tags: ['array', 'for', 'for...of', 'push'],
    body: '数组保存一组数据，循环负责批量处理数据。列表渲染、任务遍历都离不开它们。',
    code: 'let games = ["Minecraft", "GTA V", "Valorant", "CS2"];\n\ngames.push("Apex Legends");\n\nfor (let game of games) {\n  console.log(game);\n}',
    task: '创建一个 games 数组，追加新项目，再用循环逐条输出。',
  },
  {
    id: 'function-object',
    title: '函数与对象',
    tags: ['function', 'return', 'object'],
    body: '函数用来复用逻辑，对象用来组织数据。前端和后端项目里都会大量使用。',
    code: 'function add(a, b) {\n  return a + b;\n}\n\nlet user = {\n  name: "Ymir",\n  skill: "JavaScript"\n};\n\nconsole.log(add(10, 20));\nconsole.log(user.name);',
    task: '写一个 add 函数，再创建一个 user 对象并输出属性。',
  },
  {
    id: 'dom-event',
    title: 'DOM 与事件',
    tags: ['DOM', 'button', 'click'],
    body: 'DOM 是浏览器里的页面结构，JS 可以直接修改页面内容，也能监听按钮点击。',
    code: 'let title = document.getElementById("title");\nlet btn = document.getElementById("btn");\n\nbtn.addEventListener("click", function () {\n  title.textContent = "你点击了按钮";\n});',
    task: '写一个 HTML 页面，点击按钮后修改标题文字。',
  },
  {
    id: 'async-api',
    title: '异步与 API',
    tags: ['async', 'await', 'fetch', 'API'],
    body: '异步用于处理需要等待的任务，例如网络请求、文件读取和定时器。',
    code: 'async function getUser() {\n  try {\n    let response = await fetch("/api/user");\n    let data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.log("请求失败", error);\n  }\n}',
    task: '理解 async / await 的结构，然后尝试请求一个 API。',
  },
];

export const ROADMAP = [
  { week: '第 1 周', text: '变量、字符串、数字、console.log' },
  { week: '第 2 周', text: 'if 判断、比较运算、逻辑运算' },
  { week: '第 3 周', text: '数组、循环、遍历' },
  { week: '第 4 周', text: '函数、对象、返回值' },
  { week: '第 5 周', text: 'DOM、事件、表单交互' },
  { week: '第 6 周', text: 'Todo List、组件化思路' },
  { week: '第 7 周', text: '异步、fetch、API 请求' },
  { week: '第 8 周', text: 'Node.js、Express、数据库入门' },
];

export const DEPLOY_NOTES = [
  {
    title: '静态版',
    text: '直接部署前端即可，完全可以离线运行。',
  },
  {
    title: 'MySQL 版',
    text: '启动后端并配置数据库后，页面会优先读取数据库章节。',
  },
];
