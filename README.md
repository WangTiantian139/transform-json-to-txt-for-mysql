> 使用`node.js`从一个已有的`json`数据格式的文件生成一个`MySQL`可以导入的`txt`文件.  

有时我们为了简便, 使用`json`格式文件保存了一些数据. 但是随着数据量增加, 使用`json`文件存储的数据不仅查询起来不方便, 在增删时更是充满风险. 现在我们希望把这些数据转移到`MySQL`数据库中, 以便访问和管理. 

`MySQL`提供了一种简单的命令从具有特定格式的`txt`文件中导入数据. 在这个文件里, 不同的列使用`\t`分隔, 用`\N`表示缺失的值(`NULL`). [^1]

我们使用`node.js`工具将`json`格式文件转换为`MySQL`格式可导入的`txt`文件. 


## 前期的准备工作

在`todo.json`中有这样一段数据: 

```json
[
  {
    "todo":"早上7:00起","startDate":"2021-01-03T17:53:38.565354",
    "id":1,
    "isArchived":true
  }, {
    "todo":"第一个跑到学院楼","startDate":"2021-01-03T20:12:06.787177",
    "id":2,
    "isArchived":true
  }, {
    "todo":"单手杵地平板支撑","startDate":"2021-01-03T20:20:02.103439",
    "id":3,
    "isArchived":false
  }
]
```

可以看到, 共有3条数据, 每一条数据中包含4项: `todo`, `startDate`, `id`, `isArchived`. 其中, `todo`描述一项工作, 使用字符串表示; `startDate`表示添加该工作的时间, 精确到μs, 格式是`YYYY-MM-DD hh-mm-ss.uuuuuu`; `id`是一个唯一标识, 用整数表示; 而`isArchived`表示是否已完成该工作, 用`bool`值表示.  

`MySQL`要求预先创建数据类型已知的数据表. 因此, 我们先建立一个这样的表. 

首先, 进入`MySQL`的命令行程序. 

```shell
mysql -u root -p
```

在mysql中, 创建一个新的数据库`test`, 然后, 应用该数据库.

```sql
create database test;
use test;
```

然后, 依据我们的`json`数据, 创建一个新的表`todo`, 并将`id`设置为自增的主键. 

```sql
create table todo (
  id int not null auto_increment, 
  todo varchar(128) not null, 
  isArchived tinyint default 0, 
  startDate datetime, 
  primary key(id)
);
```

使用`describe todo;`命令可以查看创建的表的类型. 

```
mysql> describe todo;
+------------+--------------+------+-----+---------+----------------+
| Field      | Type         | Null | Key | Default | Extra          |
+------------+--------------+------+-----+---------+----------------+
| id         | int(11)      | NO   | PRI | NULL    | auto_increment |
| todo       | varchar(128) | NO   |     | NULL    |                |
| isArchived | tinyint(4)   | YES  |     | 0       |                |
| startDate  | datetime     | YES  |     | NULL    |                |
+------------+--------------+------+-----+---------+----------------+
4 rows in set (0.03 sec)
```

**这里需要注意**: 1. `MySQL`中的`datetime`类型格式默认为`YYYY-MM-DD hh-mm-ss`, 秒后没有小数部分; 2. `MySQL`中没有`bool`类型, 一般用`0`表示`false`, 用`1`表示`true`. 

这样, 准备工作就基本上完成了. 

## 使用`node.js`处理数据

文件转换使用`node.js`来完成, 主要包括一下工作: 

1. 读入数据;
2. 针对特殊数据类型(`bool`, `datetime`)处理数据;
3. 转换数据的格式;
3. 保存数据;

接下来依次完成这些工作. 

### 读入数据

`node.js`自带了`fs`模块读写文件. 

```js
// transform-json-to-txt-for-mysql.js
const fs = require("fs");
fs.readFile("todo.json", (err, data) => {
  let todotxt = convertJSON2TXT(data); // 处理数据
  saveTXT(todotxt); // 保存数据
});

function convertJSON2TXT(data) {
  let todotxt = "";
  // TODO 针对特殊数据类型处理数据

  // TODO 转换数据格式

  return todotxt;
}

function saveTXT(todotxt) {
  // 保存数据
}
```

我们在`convertJSON2TXT`函数中处理数据, 然后使用`saveTXT`保存数据. 

### 针对特殊数据类型处理数据

在这一部分, 我们将原`json`文件中`startDate`这一项的数据(例如`"2021-01-03T17:53:38.565354"`)处理为`MySQL`中的`datetime`类型默认格式, 即`"YYYY-MM-DD hh-mm-ss"`. 首先将原数据中的`"T"`变为空格`" "`, 然后删除最后7位(`".565354"`). 

接下来, 对于`isArchived`这一项, 用`0`表示`false`, 用`1`表示`true`. 

```js
function convertJSON2TXT(data) {
  let todotxt = '';
  // 针对特殊数据类型处理数据
  let todo = JSON.parse(data.toString());
  todo.forEach((val) => {
    val.isArchived = val.isArchived ? 1 : 0;
    val.startDate = val.startDate.replace("T", " ").substr(0, 19);
  });
  // TODO 转换数据格式

  return todotxt;
}
```

在`todo`中保存了已被处理的数据.

### 转换数据格式

这里, 我们使用`\t`分隔不同的列. 同时要注意列的顺序与`MySQL`的表`todo`中列的顺序相同, 行结尾用`\r\n`分割. 

```js
function convertJSON2TXT(data) {
  let todotxt = '';
  // 针对特殊数据类型处理数据
  let todo = JSON.parse(data.toString());
  todo.forEach((val) => {
    val.isArchived = val.isArchived ? 1 : 0;
    val.startDate = val.startDate.replace("T", " ").substr(0, 19);
  });
  // TODO 转换数据格式
  todo.forEach((val) => {
    todotxt += `${val.id}\t${val.todo}\t${val.isArchived}\t${val.startDate}\r\n`;
  })

  return todotxt.substr(0, todotxt.length - 2); // 去掉多余的行
}
```

### 保存数据

这里, 保存数据同样使用`fs`模块实现. 

```js
function saveTXT(todotxt) {
  // 保存数据
  fs.writeFile("todo.txt", todotxt, (err) => {
    if (err) {
      console.log("error occurs");
    } else {
      console.log("write to todo.txt:");
      console.log(todotxt);
    }
  });
}
```

最终文件可以在[我的github主页]()中查看

运行文件, 即可生成文件`todo.txt`. 

```shell
$ node transform-json-to-txt-for-mysql.js
write to todo.txt:
1	早上7:00起	1	2021-01-03 17:53:38
2	第一个跑到学院楼	1	2021-01-03 20:12:06
3	单手杵地平板支撑	0	2021-01-03 20:20:02
```

## 导入文件

在`MySQL`命令行中, 导入`todo.txt`到表`todo`. 

```sql
load data local infile './todo.txt' into table todo;
```

注意应从`todo.txt`文件同级目录下进入`mysql`命令行程序, 或者指定`todo.txt`文件的绝对路径.

```sql
load data local infile '/path/to/todo.txt' into table todo;
```

检查一下已经录入的数据. 

```
mysql> select * from todo;
+----+--------------------------+------------+---------------------+
| id | todo                     | isArchived | startDate           |
+----+--------------------------+------------+---------------------+
|  1 | 早上7:00起               |          1 | 2021-01-03 17:53:38 |
|  2 | 第一个跑到学院楼         |          1 | 2021-01-03 20:12:06 |
|  3 | 单手杵地平板支撑         |          0 | 2021-01-03 20:20:02 |
+----+--------------------------+------------+---------------------+
3 rows in set (0.00 sec)
```








[^1]: [https://dev.mysql.com/doc/refman/8.0/en/loading-tables.html](https://dev.mysql.com/doc/refman/8.0/en/loading-tables.html) 