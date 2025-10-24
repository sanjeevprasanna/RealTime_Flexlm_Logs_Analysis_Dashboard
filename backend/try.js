// const delay = (a) => {
//   return new Promise((res, rej) =>
//     setTimeout(() => {
//       res();
//     }, a),
//   );
// };
//
// const v = delay(3000)
//   .then(() => console.log("1st"))
//   .then(() => delay(1000).then(() => console.log("2nd")));

const { clear } = require("node:console");
const { isWhiteSpaceLike } = require("typescript");

// const ps = new Promise((resolve, reject) => {
//   resolve({
//     data: "hi",
//     age: 23,
//   });
// });
// ps.then((d) => {
//   setTimeout(() => {
//     console.log(d.data);
//   }, 2000);
//   return d;
// }).then((d) => {
//   setTimeout(() => console.log(d.age), 1000);
// });

// async function delay() {
//   await setTimeout(() => console.log("1st"), 3000);
// }
//
// delay().then(() => {
//   setTimeout(() => console.log("2nd"), 1000);
// });

// let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
//
// console.log(arr);
//
// // arr = arr*10
// arr = arr.map((a) => {
//   a = a * 10;
//   return a;
// });
// arr = arr.filter((a) => a > 50);
//
// console.log(arr);
//
// useState() NOTE: create usestate for arr,
// -> update with the newarr
// ->
//
// NOTE:setinterval that prints each second

let i = 0;
const id = setInterval(() => {
  console.log(i);
  i += 1;
  // clearInterval(5); NOTE: it wont work as id refers to the setinterval and not a number
}, 1000);

setTimeout(() => {
  clearInterval(id);
}, 3000);
