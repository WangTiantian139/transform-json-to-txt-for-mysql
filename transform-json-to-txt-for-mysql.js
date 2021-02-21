// const fs = require("fs");
// var bets = "";
// var betstxt = "";
// fs.readFile("bets.json", (err, data) => {
//   bets = JSON.parse(data.toString()).forEach((val) => {
//     let isArchived = val.isArchived ? 1 : 0;
//     let startDate = val.startDate.replace("T", " ").substr(0, 19);
//     betstxt += `${val.id}\t${val.title}\t${val.betA}\t${val.betB}\t${isArchived}\t${val.loser}\t${startDate}\r\n`;
//   });
//   console.log(bets);

//   fs.writeFile("bets.txt", betstxt, (err) => {
//     if (err) {
//       console.log("error occurs");
//     } else {
//       console.log("write to bets.txt:");
//       console.log(betstxt);
//     }
//   });
// });

const fs = require("fs");
fs.readFile("todo.json", (err, data) => {
  let todotxt = convertJSON2TXT(data); // 处理数据
  saveTXT(todotxt); // 保存数据
});

function convertJSON2TXT(data) {
  let todotxt = "";
  // 针对特殊数据类型处理数据
  let todo = JSON.parse(data.toString());
  todo.forEach((val) => {
    val.isArchived = val.isArchived ? 1 : 0;
    val.startDate = val.startDate.replace("T", " ").substr(0, 19);
  });
  // TODO 转换数据格式
  todo.forEach((val) => {
    todotxt += `${val.id}\t${val.todo}\t${val.isArchived}\t${val.startDate}\r\n`;
  });

  return todotxt.substr(0, todotxt.length - 2);
}

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
