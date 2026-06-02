const Razorpay = require("razorpay");
// console.log(
//   "RAZORPAY CONFIG:",
//   process.env.RAZORPAY_KEY_ID
// );
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


module.exports = razorpay;

// const Razorpay = require("razorpay");

// console.log("KEY_ID =", process.env.RAZORPAY_KEY_ID);
// console.log(
//   "KEY_SECRET_EXISTS =",
//   !!process.env.RAZORPAY_KEY_SECRET
// );

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// module.exports = razorpay;
