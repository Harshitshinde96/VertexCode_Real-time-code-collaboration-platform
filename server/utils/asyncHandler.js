//asyncHandler is a higher order function, a function which can access function as a parameter and can also return them (treats function as variable)

//Using Promise
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next).catch((err) => next(err)));
  };
};
export { asyncHandler };




//Using Try - catch
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// };

// export { asyncHandler };

